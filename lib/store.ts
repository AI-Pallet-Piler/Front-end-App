import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { fetchOrders, fetchInventoryBySku, type ApiOrder } from './api'

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
  
  setActiveOrder: (orderId: string | null) => void
  markTaskPicked: (orderId: string, taskId: string) => void
  completeOrder: (orderId: string) => void
  resetOrders: () => void
  loadOrders: () => Promise<void>
  addReport: (report: Omit<IssueReport, 'id' | 'createdAt'>) => void
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
      sequence: index + 1,
      orderLineId: line.order_line_id,
    }
  })
  
  const tasks = await Promise.all(tasksPromises)
  
  const totalItems = apiOrder.order_lines.reduce((sum, line) => sum + line.quantity_ordered, 0)
  const pickedItems = apiOrder.order_lines.reduce((sum, line) => sum + line.quantity_picked, 0)
  const pickedTaskCount = tasks.filter(t => t.status === 'picked').length
  
  let status: 'pending' | 'in-progress' | 'completed' = 'pending'
  if (apiOrder.status === 'picking' || pickedTaskCount > 0) {
    status = pickedTaskCount === tasks.length ? 'completed' : 'in-progress'
  } else if (apiOrder.status === 'shipped' || apiOrder.status === 'packing') {
    status = 'completed'
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

      addReport: (report) =>
        set((state) => ({
          reports: [
            {
              ...report,
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.reports,
          ],
        })),

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
      partialize: (state) => ({ reports: state.reports }),
    },
  ),
)
