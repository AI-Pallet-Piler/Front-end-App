/**
 * API service for communicating with the server (API-gateway)
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

export interface ApiOrderLine {
  order_line_id: number
  order_id: number
  product_id: number
  quantity_ordered: number
  quantity_picked: number
  product_name: string
  product_sku: string
}

export interface ApiOrder {
  order_id: number
  order_number: string
  customer_name: string
  status: string
  priority: number
  created_at: string
  completed_at: string | null
  promised_ship_date: string
  order_lines: ApiOrderLine[]
}

export interface ApiInventory {
  inventory_id: number
  product_id: number
  location_id: number
  quantity: number
  sku: string
  product_name: string
  product_description: string | null
  location_code: string
}

export type ApiIssueType = 'damage' | 'missing' | 'blocked' | 'other'

export interface ApiReport {
  report_id: number
  order_id: number
  order_number?: string | null
  task_id?: number | null
  task_location?: string | null
  task_sku?: string | null
  issue_type: ApiIssueType
  message: string
  created_at: string
}

export interface ApiReportCreate {
  order_id: number
  order_number?: string
  task_id?: number
  task_location?: string
  task_sku?: string
  issue_type: ApiIssueType
  message: string
}

/**
 * Fetch all orders from the backend
 */
export async function fetchOrders(): Promise<ApiOrder[]> {
  console.log('[API] Fetching orders from:', API_BASE_URL)
  try {
    const response = await fetch(`${API_BASE_URL}/orders`)
    console.log('[API] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`)
    }
    
    const orders = await response.json()
    console.log('[API] Fetched orders:', orders)
    return orders
  } catch (error) {
    console.error('[API] Error fetching orders:', error)
    throw error
  }
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById(orderId: number): Promise<ApiOrder> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.statusText}`)
    }
    
    const order = await response.json()
    return order
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error)
    throw error
  }
}

/**
 * Fetch inventory for a specific product SKU
 */
export async function fetchInventoryBySku(sku: string): Promise<ApiInventory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory?sku=${encodeURIComponent(sku)}`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.statusText}`)
    }
    
    const inventory = await response.json()
    return inventory
  } catch (error) {
    console.error(`Error fetching inventory for SKU ${sku}:`, error)
    throw error
  }
}

/**
 * Fetch all inventory
 */
export async function fetchInventory(): Promise<ApiInventory[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/inventory`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.statusText}`)
    }
    
    const inventory = await response.json()
    return inventory
  } catch (error) {
    console.error('Error fetching inventory:', error)
    throw error
  }
}

/**
 * Fetch all reports from the backend
 */
export async function fetchReports(): Promise<ApiReport[]> {
  console.log('[API] Fetching reports from:', API_BASE_URL)
  try {
    const response = await fetch(`${API_BASE_URL}/reports`)
    console.log('[API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.statusText}`)
    }

    const reports = await response.json()
    console.log('[API] Fetched reports:', reports)
    return reports
  } catch (error) {
    console.error('[API] Error fetching reports:', error)
    throw error
  }
}

/**
 * Create a report
 */
export async function createReport(payload: ApiReportCreate): Promise<ApiReport> {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Failed to create report: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating report:', error)
    throw error
  }
}

/**
 * Update order line picked quantity
 */
export async function updateOrderLinePicked(
  orderLineId: number,
  quantityPicked: number
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/order-lines/${orderLineId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity_picked: quantityPicked,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update order line: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`Error updating order line ${orderLineId}:`, error)
    throw error
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: number,
  status: string
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: status,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to update order status: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`Error updating order ${orderId} status:`, error)
    throw error
  }
}

/**
 * Pallet item interface for 3D visualization
 */
export interface PalletItem {
  id: string
  name: string
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
  weight: number
  tipped: boolean
}

/**
 * Pallet data interface
 */
export interface PalletData {
  pallet_id: number
  items: PalletItem[]
}

/**
 * Fetch pallet instructions for an order
 */
export async function fetchPalletInstructions(orderId: number): Promise<PalletData[]> {
  console.log('[API] Fetching pallet instructions for order:', orderId)
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pallet-instructions`)
    console.log('[API] Pallet instructions response status:', response.status, response.statusText)
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pallet instructions not generated yet. Please run the packing algorithm first.')
      }
      throw new Error(`Failed to fetch pallet instructions: ${response.statusText}`)
    }
    
    const palletData = await response.json()
    console.log('[API] Fetched pallet instructions:', palletData)
    return palletData
  } catch (error) {
    console.error(`[API] Error fetching pallet instructions for order ${orderId}:`, error)
    throw error
  }
}
