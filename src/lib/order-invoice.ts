/**
 * Canonical Invoice & Bill Data Builder for KNOOS Ecommerce.
 *
 * ARCHITECTURAL INVARIANT:
 * - Single shared invoice builder for both Admin and Customer bills.
 * - Uses ONLY authoritative historical order snapshot fields from Order, OrderItem, and OrderAddress.
 * - NEVER recalculates prices, discounts, or totals from the live Product or saved Address tables.
 * - Produces deterministic invoice numbers: INV-KNOOS-<ORDER_ID_SHORT>.
 */

export interface InvoiceItem {
  id: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceAddress {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface InvoiceCustomer {
  name: string;
  email: string | null;
  phone: string | null;
}

export interface InvoiceData {
  orderId: string;
  invoiceNumber: string;
  orderDate: string;
  orderTime: string;
  orderDateIso: string;
  customer: InvoiceCustomer;
  deliveryAddress: InvoiceAddress | null;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  deliveryCharge: number;
  deliveryMethod: string;
  total: number;
  paymentMethod: string;
  paymentMethodLabel: string;
  paymentStatus: string;
  paymentStatusLabel: string;
  orderStatus: string;
  orderStatusLabel: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
}

export interface RawOrderSnapshot {
  id: string;
  userId?: string;
  subtotal: number;
  couponCode?: string | null;
  discountAmount?: number;
  deliveryCharge: number;
  deliveryMethod?: string | null;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  createdAt: Date | string;
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  address?: {
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

/**
 * Format integer INR rupees to currency string.
 * Example: 2499 -> "₹2,499"
 *
 * KNOOS order amounts are stored as whole rupees.
 * Do NOT divide by 100.
 */
export function formatInvoiceINR(rupees: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Generates a stable, deterministic display invoice number from existing order ID.
 * Format: INV-KNOOS-<ORDER_ID_SHORT> (e.g. INV-KNOOS-CMUJTA12)
 */
export function buildInvoiceNumber(orderId: string): string {
  const cleanId = orderId.replace(/[^a-zA-Z0-9]/g, "");
  const shortId = (cleanId.length >= 8 ? cleanId.slice(0, 8) : cleanId.padEnd(8, "0")).toUpperCase();
  return `INV-KNOOS-${shortId}`;
}

/**
 * Formats a Date or ISO date string for standard Indian invoice representation.
 */
export function formatInvoiceDate(date: Date | string): {
  dateStr: string;
  timeStr: string;
} {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return { dateStr: "—", timeStr: "—" };
  }
  const dateStr = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
  const timeStr = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  return { dateStr, timeStr };
}

/**
 * Pure builder function creating canonical InvoiceData from an immutable order snapshot.
 */
export function buildInvoiceData(order: RawOrderSnapshot): InvoiceData {
  const { dateStr, timeStr } = formatInvoiceDate(order.createdAt);

  const customerName = order.user?.name?.trim() || order.address?.name?.trim() || "Customer";
  const customerEmail = order.user?.email?.trim() || null;
  // Prefer delivery address phone snapshot, fallback to user phone
  const customerPhone = order.address?.phone?.trim() || order.user?.phone?.trim() || null;

  const deliveryAddress: InvoiceAddress | null = order.address
    ? {
        recipientName: order.address.name,
        phone: order.address.phone,
        address: order.address.address,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
      }
    : null;

  const items: InvoiceItem[] = (order.items || []).map((item) => ({
    id: item.id,
    productName: item.productName,
    size: item.size,
    quantity: item.quantity,
    unitPrice: item.price,
    total: item.total,
  }));

  const paymentMethodLabel =
    order.paymentMethod === "COD"
      ? "Cash on Delivery"
      : order.paymentMethod === "ONLINE"
      ? "Online Payment"
      : order.paymentMethod;

  const paymentStatusUpper = (order.paymentStatus || "").toUpperCase();
  const paymentStatusLabel =
    paymentStatusUpper === "PAID"
      ? "Paid"
      : paymentStatusUpper === "PENDING"
      ? "Pending"
      : paymentStatusUpper === "FAILED"
      ? "Failed"
      : paymentStatusUpper === "REFUNDED"
      ? "Refunded"
      : order.paymentStatus;

  const orderStatusUpper = (order.orderStatus || "").toUpperCase();
  const orderStatusLabel =
    orderStatusUpper === "PENDING"
      ? "Pending"
      : orderStatusUpper === "PAID"
      ? "Paid"
      : orderStatusUpper === "PROCESSING"
      ? "Processing"
      : orderStatusUpper === "PACKED"
      ? "Packed"
      : orderStatusUpper === "SHIPPED"
      ? "Shipped"
      : orderStatusUpper === "DELIVERED"
      ? "Delivered"
      : orderStatusUpper === "CANCELLED"
      ? "Cancelled"
      : order.orderStatus;

  return {
    orderId: order.id,
    invoiceNumber: buildInvoiceNumber(order.id),
    orderDate: dateStr,
    orderTime: timeStr,
    orderDateIso: typeof order.createdAt === "string" ? order.createdAt : order.createdAt.toISOString(),
    customer: {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
    },
    deliveryAddress,
    items,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount || 0,
    couponCode: order.couponCode || null,
    deliveryCharge: order.deliveryCharge || 0,
    deliveryMethod: order.deliveryMethod || "STANDARD",
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentMethodLabel,
    paymentStatus: order.paymentStatus,
    paymentStatusLabel,
    orderStatus: order.orderStatus,
    orderStatusLabel,
    razorpayOrderId: order.razorpayOrderId || null,
    razorpayPaymentId: order.razorpayPaymentId || null,
  };
}

/**
 * Server-side helper to fetch and build invoice for a customer.
 * Enforces ownership check: Order.userId === userId.
 * Returns null if not found or unauthorized.
 */
export async function getCustomerInvoiceData(
  orderId: string,
  userId: string
): Promise<InvoiceData | null> {
  const { prisma } = await import("@/lib/db");
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: userId,
    },
    include: {
      items: { orderBy: { id: "asc" } },
      address: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) return null;
  return buildInvoiceData(order);
}

/**
 * Server-side helper to fetch and build invoice for admin.
 * Admin caller must verify requireAdmin() before invoking.
 */
export async function getAdminInvoiceData(
  orderId: string
): Promise<InvoiceData | null> {
  const { prisma } = await import("@/lib/db");
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: { orderBy: { id: "asc" } },
      address: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) return null;
  return buildInvoiceData(order);
}
