
"use client";

import useSWR from 'swr';
import { getOrdersByUserId, getNotificationsForUser, markUserNotificationsAsRead } from '@/lib/data';
import type { Notification } from '@/types';

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
            // When this hook is used, automatically mark notifications as read
            onSuccess: (data: Notification[]) => {
                if (data && data.some(n => !n.isRead)) {
                    markUserNotificationsAsRead(userId!).then(() => {
                        // Optimistically update the local data to reflect the 'read' state
                        // without needing a full re-fetch.
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
