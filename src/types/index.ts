export type Product = {
  id: string;
  itemCode: string;
  batchNo: string;
  name: string;
  description: string;
  images: string[];
  category: string;
  retailPrice: number;
  wholesalePrice: number;
  unit: 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'dozen';
  stock: number;
  dataAiHint?: string;
  imageUpdatedAt: string;
};

export type UserRole = 'basic' | 'wholesaler' | 'developer' | 'shop-owner';

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
};

export type OrderItemStatus = 'Pending' | 'Fulfilled' | 'Cancelled';

export type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  status: OrderItemStatus;
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
    role: 'shop-owner' | 'wholesaler';
    isUsed: boolean;
    usedBy?: string;
    createdAt: string;
    createdBy: string;
};
