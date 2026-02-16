import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type PickTaskStatus = 'pending' | 'picked'

export interface PickTask {
  id: string
  location: string
  productName: string
  sku: string
  quantity: number
  status: PickTaskStatus
  sequence: number
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
  setActiveOrder: (orderId: string | null) => void
  markTaskPicked: (orderId: string, taskId: string) => void
  completeOrder: (orderId: string) => void
  resetOrders: () => void

  reports: IssueReport[]
  addReport: (report: Omit<IssueReport, 'id' | 'createdAt'>) => void
}

// Mock data
const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'WH-2024-001234',
    customer: 'Distribution Center A',
    totalLines: 8,
    totalItems: 124,
    pickedItems: 0,
    status: 'pending',
    tasks: [
      {
        id: 't1',
        location: 'A-05-03-02',
        productName: 'Industrial Bearing Set',
        sku: 'BRG-5032',
        quantity: 24,
        status: 'pending',
        sequence: 1,
      },
      {
        id: 't2',
        location: 'A-05-04-01',
        productName: 'Steel Mounting Bracket',
        sku: 'MTB-2041',
        quantity: 48,
        status: 'pending',
        sequence: 2,
      },
      {
        id: 't3',
        location: 'B-12-02-05',
        productName: 'Hydraulic Hose Assembly',
        sku: 'HYD-8823',
        quantity: 12,
        status: 'pending',
        sequence: 3,
      },
      {
        id: 't4',
        location: 'B-12-03-01',
        productName: 'Filter Cartridge Premium',
        sku: 'FLT-6701',
        quantity: 16,
        status: 'pending',
        sequence: 4,
      },
      {
        id: 't5',
        location: 'C-08-01-03',
        productName: 'Electrical Connector Kit',
        sku: 'ELC-4402',
        quantity: 8,
        status: 'pending',
        sequence: 5,
      },
      {
        id: 't6',
        location: 'C-08-02-02',
        productName: 'Safety Valve Assembly',
        sku: 'SFV-9156',
        quantity: 6,
        status: 'pending',
        sequence: 6,
      },
      {
        id: 't7',
        location: 'D-15-05-01',
        productName: 'Drive Belt Heavy Duty',
        sku: 'DBT-3388',
        quantity: 4,
        status: 'pending',
        sequence: 7,
      },
      {
        id: 't8',
        location: 'D-15-06-04',
        productName: 'Pneumatic Coupling',
        sku: 'PNC-7721',
        quantity: 6,
        status: 'pending',
        sequence: 8,
      },
    ],
  },
  {
    id: '2',
    orderNumber: 'WH-2024-001235',
    customer: 'Regional Hub B',
    totalLines: 5,
    totalItems: 67,
    pickedItems: 18,
    status: 'in-progress',
    tasks: [
      {
        id: 't9',
        location: 'A-03-01-02',
        productName: 'Steel Fastener Pack',
        sku: 'FST-1205',
        quantity: 18,
        status: 'picked',
        sequence: 1,
      },
      {
        id: 't10',
        location: 'A-03-02-01',
        productName: 'Gasket Assortment',
        sku: 'GSK-8842',
        quantity: 15,
        status: 'pending',
        sequence: 2,
      },
      {
        id: 't11',
        location: 'E-20-04-03',
        productName: 'Industrial Lubricant',
        sku: 'LUB-5599',
        quantity: 12,
        status: 'pending',
        sequence: 3,
      },
      {
        id: 't12',
        location: 'E-20-05-01',
        productName: 'Sealant Compound',
        sku: 'SEL-3366',
        quantity: 10,
        status: 'pending',
        sequence: 4,
      },
      {
        id: 't13',
        location: 'F-22-01-02',
        productName: 'Cable Tie Bundle',
        sku: 'CBL-2234',
        quantity: 12,
        status: 'pending',
        sequence: 5,
      },
    ],
  },
  {
    id: '3',
    orderNumber: 'WH-2024-001236',
    customer: 'Express Logistics',
    totalLines: 3,
    totalItems: 45,
    pickedItems: 0,
    status: 'pending',
    tasks: [
      {
        id: 't14',
        location: 'G-10-02-01',
        productName: 'Motor Assembly Small',
        sku: 'MTR-4401',
        quantity: 15,
        status: 'pending',
        sequence: 1,
      },
      {
        id: 't15',
        location: 'G-10-03-02',
        productName: 'Control Panel Module',
        sku: 'CTL-6678',
        quantity: 20,
        status: 'pending',
        sequence: 2,
      },
      {
        id: 't16',
        location: 'H-18-01-04',
        productName: 'Sensor Array Kit',
        sku: 'SNS-9923',
        quantity: 10,
        status: 'pending',
        sequence: 3,
      },
    ],
  },
]

const noopStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => {},
  removeItem: (_name: string) => {},
}

export const useWarehouseStore = create<WarehouseStore>()(
  persist(
    (set) => ({
      orders: mockOrders,
      activeOrderId: null,
      reports: [],

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
      const totalCount = updatedTasks.reduce((sum, t) => sum + t.quantity, 0)
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

      resetOrders: () => set({ orders: mockOrders, activeOrderId: null }),
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
