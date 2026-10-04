/** HookBus delivers these events inside the order's database transaction. */
export type OrderConfirmed = { orderId: string; deliveryDate: string };
export type OrderDeliveryChanged = { orderId: string; deliveryDate: string; addressId: string; deliveryTime: string };
export type OrderCancelled = { orderId: string; deliveryDate: string };
export type OrderHooks = {
  'order.confirmed': OrderConfirmed;
  'order.delivery-changed': OrderDeliveryChanged;
  'order.cancelled': OrderCancelled;
};
