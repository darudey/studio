
"use client";

import useSWR from 'swr';
import { 
    getOrdersByUserId, 
    getNotificationsForUser, 
    markUserNotificationsAsRead,
    getProducts,
    getRecommendedProducts,
    getProductById,
    getSimilarProducts,
    getAllOrders,
    getUsers,
    getUserById,
    getUnusedCoupons
} from '@/lib/data';
import type { Notification, Order, Product, User, Coupon } from '@/types';

interface CustomerWithOrderInfo extends User {
  orderCount: number;
  lastOrderDate: string;
}

// Orders & Notifications
export function useUserOrders(userId?: string) {
    const { data, error, isLoading } = useSWR(
        userId ? ['orders', userId] : null, 
        () => getOrdersByUserId(userId!)
    );

    return {
        userOrders: data,
        isLoading,
        error,
    };
}

export function useNotifications(userId?: string) {
    const { data, error, isLoading, mutate } = useSWR(
        userId ? ['notifications', userId] : null,
        () => getNotificationsForUser(userId!),
        {
            onSuccess: (data: Notification[]) => {
                if (data && data.some(n => !n.isRead)) {
                    markUserNotificationsAsRead(userId!).then(() => {
                        const updatedData = data.map(n => ({...n, isRead: true}));
                        mutate(updatedData, false);
                    });
                }
            }
        }
    );

    return {
        notifications: data,
        isLoading,
        error,
        mutate,
    }
}

// Products
export function useAllProducts() {
    const { data, error, isLoading, mutate } = useSWR('products', getProducts);
    return { products: data, error, isLoading, mutate };
}

export function useRecommendedProducts() {
    const { data, error, isLoading } = useSWR('recommended-products', getRecommendedProducts);
    return { recommendedProducts: data, error, isLoading };
}

export function useProduct(id?: string) {
    const { data, error, isLoading } = useSWR(id ? ['product', id] : null, () => getProductById(id!));
    return { product: data, error, isLoading };
}

export function useSimilarProducts(category?: string, excludeId?: string) {
    const { data, error, isLoading } = useSWR(
        category && excludeId ? ['similar-products', category, excludeId] : null,
        () => getSimilarProducts(category!, excludeId!)
    );
    return { similarProducts: data, error, isLoading };
}

// Admin / Developer
export function useAllUsers() {
    const { data, error, isLoading } = useSWR('users', getUsers);
    return { users: data, error, isLoading };
}

export function useUnusedCoupons() {
    const { data, error, isLoading, mutate } = useSWR('unused-coupons', getUnusedCoupons);
    return { coupons: data, error, isLoading, mutate };
}

export function useCustomerDetails(userId?: string) {
     const { data, error, isLoading, mutate } = useSWR(
        userId ? ['customer-details', userId] : null,
        async () => {
            if (!userId) return { customer: null, orders: [] };
            const [customer, orders] = await Promise.all([
                getUserById(userId),
                getOrdersByUserId(userId)
            ]);
            return { customer, orders };
        }
    );

    return {
        customer: data?.customer,
        orders: data?.orders,
        setOrders: (newOrders: Order[]) => {
            if(data) {
                mutate({ ...data, orders: newOrders }, false)
            }
        },
        isLoading,
        error
    };
}

export function useCustomerOrderInfo() {
    const { data, error, isLoading } = useSWR(
        'customer-order-info',
        async () => {
            const [allOrders, allUsers] = await Promise.all([getAllOrders(), getUsers()]);
        
            const customerOrderInfo = new Map<string, { orderCount: number; lastOrderDate: string; user: User }>();

            for (const order of allOrders) {
                const customer = allUsers.find(u => u.id === order.userId);
                if (!customer) continue;

                const info = customerOrderInfo.get(order.userId) || { orderCount: 0, lastOrderDate: '1970-01-01T00:00:00.000Z', user: customer };
                info.orderCount++;
                if (order.date > info.lastOrderDate) {
                    info.lastOrderDate = order.date;
                }
                customerOrderInfo.set(order.userId, info);
            }

            const customerList: CustomerWithOrderInfo[] = Array.from(customerOrderInfo.values())
                .map(info => ({
                    ...info.user,
                    orderCount: info.orderCount,
                    lastOrderDate: info.lastOrderDate,
                }))
                .sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime());
                
            return customerList;
        }
    );

    return {
        customers: data,
        isLoading,
        error
    };
}
