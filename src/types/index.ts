

export type WholesalePrice = {
  unit: string;
  price: number;
  note?: string;
};

export type Product = {
  id: string;
  itemCode: string;
  batchNo: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  mrp?: number;
  retailPrice: number;
  wholesalePrices: WholesalePrice[];
  unit: 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'dozen'; // This is now the base/retail unit
  stock: number;
  dataAiHint?: string;
  imageUpdatedAt: string;
  updatedAt: string;
  isRecommended: boolean;
  createdAt: string;
};

export type UserRole = 
  | 'basic'
  | 'wholesaler'
  | 'developer'
  | 'shop-owner'
  | 'imager';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: UserRole;
};

export type CartItem = {
  productId: string;
  quantity: number;
  note?: string;
  wholesaleUnit?: string; // To specify which wholesale price is being used
};

export type OrderItemStatus = 'Pending' | 'Fulfilled' | 'Cancelled';

export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
  name:string; // Includes unit like "Tomatoes (Dozen)"
  status: OrderItemStatus;
  note?: string;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  date: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: string;
};

export type Coupon = {
    id: string;
    code: string;
    role: 'shop-owner' | 'wholesaler' | 'imager';
    isUsed: boolean;
    usedBy?: string;
    createdAt: string;
    createdBy: string;
};

export type Category = {
    id: string; // The category name
    name: string;
    imageUrl: string;
    createdAt: string;
};

export type Notification = {
  id: string;
  userId: string; // The ID of the user who should see this notification
  message: string;
  link: string; // The URL to navigate to when the notification is clicked
  isRead: boolean;
  createdAt: string;
  orderId: string;
};
