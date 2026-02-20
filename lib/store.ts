import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  createReport,
  fetchOrders,
  fetchReports,
  fetchInventoryBySku,
  updateOrderStatus,
  type ApiOrder,
  type ApiReport,
} from './api'

export type PickTaskStatus = 'pending' | 'picked'

export interface PickTask {
  id: string
  location: string
  productName: string
  sku: string
  quantity: number
  status: PickTaskStatus
  sequence: number
  orderLineId: number
}

export interface Order {
  id: string
  orderNumber: string
  customer: string
  totalLines: number
  totalItems: number
  pickedItems: number
  tasks: PickTask[]
  status: 'pending' | 'in-progress' | 'completed'
}

export type IssueType = 'damage' | 'missing' | 'blocked' | 'other'

export interface IssueReport {
  id: string
  createdAt: string
  orderId: string
  orderNumber?: string
  taskId?: string
  taskLocation?: string
  taskSku?: string
  type: IssueType
  message: string
}

interface WarehouseStore {
  orders: Order[]
  activeOrderId: string | null
  isLoading: boolean
  error: string | null
  reports: IssueReport[]
  isLoadingReports: boolean
  
  setActiveOrder: (orderId: string | null) => void
  startOrder: (orderId: string) => Promise<void>
  markTaskPicked: (orderId: string, taskId: string) => void
  completeOrder: (orderId: string) => void
  resetOrders: () => void
  loadOrders: () => Promise<void>
  loadReports: () => Promise<void>
  addReport: (report: Omit<IssueReport, 'id' | 'createdAt'>) => Promise<void>
}

/**
 * Transform API order to application Order format
 */
async function transformApiOrder(apiOrder: ApiOrder): Promise<Order> {
  // Fetch inventory data for each order line to get location codes
  const tasksPromises = apiOrder.order_lines.map(async (line, index) => {
    let location = 'UNKNOWN'
    
    try {
      const inventory = await fetchInventoryBySku(line.product_sku)
      // Get the first available location for this product
      if (inventory.length > 0) {
        location = inventory[0].location_code
      }
    } catch (error) {
      console.error(`Failed to fetch inventory for SKU ${line.product_sku}:`, error)
    }
    
    return {
      id: `t${line.order_line_id}`,
      location,
      productName: line.product_name,
      sku: line.product_sku,
      quantity: line.quantity_ordered,
      status: line.quantity_picked >= line.quantity_ordered ? ('picked' as const) : ('pending' as const),
      sequence: 0, // assigned after sorting
      orderLineId: line.order_line_id,
    }
  })
  
  /**
   * Sort tasks by warehouse location code so picking follows the physical path.
   * Location codes are formatted as "<Aisle>-<Row>-<Level>" (e.g. A-01-01).
   * We sort alphabetically by aisle, then numerically by row, then by level.
   */
  function compareLocations(a: string, b: string): number {
    const partsA = a.split('-')
    const partsB = b.split('-')
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const segA = partsA[i] ?? ''
      const segB = partsB[i] ?? ''
      const numA = parseInt(segA, 10)
      const numB = parseInt(segB, 10)
      const cmp = isNaN(numA) || isNaN(numB)
        ? segA.localeCompare(segB)
        : numA - numB
      if (cmp !== 0) return cmp
    }
    return 0
  }

  const resolvedTasks = await Promise.all(tasksPromises)
  resolvedTasks.sort((a, b) => compareLocations(a.location, b.location))
  const tasks = resolvedTasks.map((task, index) => ({ ...task, sequence: index + 1 }))
  
  const totalItems = apiOrder.order_lines.reduce((sum, line) => sum + line.quantity_ordered, 0)
  const pickedItems = apiOrder.order_lines.reduce((sum, line) => sum + line.quantity_picked, 0)
  const pickedTaskCount = tasks.filter(t => t.status === 'picked').length
  
  let status: 'pending' | 'in-progress' | 'completed' = 'pending'
  if (apiOrder.status === 'picking' || (apiOrder.status === 'packing' && pickedTaskCount > 0)) {
    status = pickedTaskCount === tasks.length ? 'completed' : 'in-progress'
  } else if (apiOrder.status === 'shipped') {
    status = 'completed'
  } else if (apiOrder.status === 'packing') {
    status = 'pending'  // Ready to start picking
  }
  
  return {
    id: apiOrder.order_id.toString(),
    orderNumber: apiOrder.order_number,
    customer: apiOrder.customer_name,
    totalLines: apiOrder.order_lines.length,
    totalItems,
    pickedItems,
    tasks,
    status,
  }
}

const noopStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => {},
  removeItem: (_name: string) => {},
}

export const useWarehouseStore = create<WarehouseStore>()(
  persist(
    (set) => ({
      orders: [],
      activeOrderId: null,
      isLoading: false,
      error: null,
      reports: [],
      isLoadingReports: false,

      loadOrders: async () => {
        console.log('[Store] Loading orders from API...')
        set({ isLoading: true, error: null })
        
        try {
          const apiOrders = await fetchOrders()
          console.log('[Store] Fetched orders from API:', apiOrders.length, 'orders')
          const transformedOrders = await Promise.all(
            apiOrders.map(apiOrder => transformApiOrder(apiOrder))
          )
          console.log('[Store] Transformed orders:', transformedOrders)
          
          set({ orders: transformedOrders, isLoading: false })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load orders'
          console.error('[Store] Error loading orders:', error)
          set({ error: errorMessage, isLoading: false })
        }
      },

      setActiveOrder: (orderId) => set({ activeOrderId: orderId }),

      startOrder: async (orderId) => {
        const order = useWarehouseStore.getState().orders.find(o => o.id === orderId)
        if (!order) return
        
        try {
          // Update backend status to 'picking'
          await updateOrderStatus(parseInt(orderId), 'picking')
          
          // Update local state
          set((state) => ({
            orders: state.orders.map((o) => 
              o.id === orderId ? { ...o, status: 'in-progress' as const } : o
            ),
            activeOrderId: orderId,
          }))
        } catch (error) {
          console.error('Failed to start order:', error)
          throw error
        }
      },

      loadReports: async () => {
        console.log('[Store] Loading reports from API...')
        set({ isLoadingReports: true })
        
        try {
          const apiReports = await fetchReports()
          console.log('[Store] Fetched reports from API:', apiReports.length, 'reports')
          
          const transformedReports: IssueReport[] = apiReports.map((r: ApiReport) => ({
            id: r.report_id.toString(),
            createdAt: r.created_at,
            orderId: r.order_id.toString(),
            orderNumber: r.order_number ?? undefined,
            taskId: r.task_id ? r.task_id.toString() : undefined,
            taskLocation: r.task_location ?? undefined,
            taskSku: r.task_sku ?? undefined,
            type: r.issue_type,
            message: r.message,
          }))
          
          set({ reports: transformedReports, isLoadingReports: false })
        } catch (error) {
          console.error('[Store] Error loading reports:', error)
          set({ isLoadingReports: false })
        }
      },

      addReport: async (report) => {
        const orderIdValue = parseInt(report.orderId, 10)
        if (Number.isNaN(orderIdValue)) {
          throw new Error('Invalid order id')
        }

        const taskIdValue = report.taskId && /^\d+$/.test(report.taskId)
          ? parseInt(report.taskId, 10)
          : undefined

        const created = await createReport({
          order_id: orderIdValue,
          order_number: report.orderNumber,
          task_id: taskIdValue,
          task_location: report.taskLocation,
          task_sku: report.taskSku,
          issue_type: report.type,
          message: report.message,
        })

        set((state) => ({
          reports: [
            {
              id: created.report_id.toString(),
              createdAt: created.created_at,
              orderId: created.order_id.toString(),
              orderNumber: created.order_number ?? undefined,
              taskId: created.task_id ? created.task_id.toString() : undefined,
              taskLocation: created.task_location ?? undefined,
              taskSku: created.task_sku ?? undefined,
              type: created.issue_type,
              message: created.message,
            },
            ...state.reports,
          ],
        }))
      },

      markTaskPicked: (orderId, taskId) =>
        set((state) => ({
          orders: state.orders.map((order) => {
            if (order.id !== orderId) return order
            
            const updatedTasks = order.tasks.map((task) =>
              task.id === taskId ? { ...task, status: 'picked' as const } : task
            )
            
            const pickedCount = updatedTasks.filter((t) => t.status === 'picked').length
            const pickedItemsCount = updatedTasks
              .filter((t) => t.status === 'picked')
              .reduce((sum, t) => sum + t.quantity, 0)
            
            return {
              ...order,
              tasks: updatedTasks,
              pickedItems: pickedItemsCount,
              status: pickedCount === order.totalLines ? ('completed' as const) : ('in-progress' as const),
            }
          }),
        })),

      completeOrder: (orderId) =>
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, status: 'completed' as const } : order,
          ),
          activeOrderId: null,
        })),

      resetOrders: () => set({ orders: [], activeOrderId: null }),
    }),
    {
      name: 'warehouse-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : (noopStorage as any),
      ),
      partialize: (state) => ({}),
    },
  ),
)
