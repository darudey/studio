
import { db } from './firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, documentId, writeBatch, setDoc, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import type { Product, User, Order, OrderItem, Coupon, Notification } from "@/types";

// USER FUNCTIONS
const usersCollection = collection(db, 'users');

export const getUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUsersByIds = async (ids: string[]): Promise<User[]> => {
    if (ids.length === 0) return [];
    // Firestore 'in' queries are limited to 30 items. We need to batch.
    const userPromises: Promise<User[]>[] = [];
    for (let i = 0; i < ids.length; i += 30) {
        const chunk = ids.slice(i, i + 30);
        if (chunk.length > 0) {
            const q = query(usersCollection, where(documentId(), 'in', chunk));
            userPromises.push(getDocs(q).then(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))));
        }
    }
    return (await Promise.all(userPromises)).flat();
};

export const getUserById = async (id: string): Promise<User | null> => {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...doc.data() } as User : null;
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const q = query(usersCollection, where("email", "==", email.toLowerCase()));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
}

export const createUserProfile = async (user: User): Promise<void> => {
    const userRef = doc(db, 'users', user.id);
    // Don't save the id inside the document, it's the document's name
    const { id, ...userData } = user;
    await setDoc(userRef, userData);
};

export const updateUser = async (user: User): Promise<void> => {
    const userRef = doc(db, 'users', user.id);
    const { id, ...userData } = user;
    await updateDoc(userRef, userData);
}


// PRODUCT FUNCTIONS
const productsCollection = collection(db, 'products');

export const getProducts = async (): Promise<Product[]> => {
    const snapshot = await getDocs(query(productsCollection, orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getPaginatedProducts = async ({ search = '', page = 1, limit = 20 }: { search?: string; page?: number; limit?: number; }) => {
    // This is a client-side implementation for demonstration.
    // For production, this logic should be on a server/cloud function with proper indexing.
    const allProducts = await getProducts();

    const lowercasedSearch = search.toLowerCase();
    
    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\s\W\d_]/gi, '');
    const consonantFilter = getConsonants(lowercasedSearch);

    const filtered = lowercasedSearch
        ? allProducts.filter(product => {
            const nameMatch = product.name.toLowerCase().includes(lowercasedSearch);
            const categoryMatch = product.category.toLowerCase().includes(lowercasedSearch);
            const itemCodeMatch = product.itemCode.toLowerCase().includes(lowercasedSearch);

            if (nameMatch || categoryMatch || itemCodeMatch) return true;

            if (consonantFilter.length > 1) {
                if (getConsonants(product.name).includes(consonantFilter)) return true;
            }
            return false;
          })
        : allProducts;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    return {
        products: paginatedProducts,
        more: endIndex < filtered.length,
    };
};

export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
    if (ids.length === 0) return [];
    // Firestore 'in' queries are limited to 30 items. We need to batch.
    const productPromises: Promise<Product[]>[] = [];
    for (let i = 0; i < ids.length; i += 30) {
        const chunk = ids.slice(i, i + 30);
        if (chunk.length > 0) {
            const q = query(productsCollection, where(documentId(), 'in', chunk));
            productPromises.push(getDocs(q).then(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))));
        }
    }
    return (await Promise.all(productPromises)).flat();
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...doc.data() } as Product : null;
}

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const docRef = await addDoc(productsCollection, productData);
    return { id: docRef.id, ...productData };
};

export const addMultipleProducts = async (productsData: Omit<Product, 'id'>[]): Promise<void> => {
    const batch = writeBatch(db);
    const allProducts = await getProducts();
    const existingProductNames = new Set(allProducts.map(p => p.name.toLowerCase()));

    productsData.forEach(product => {
        if (!existingProductNames.has(product.name.toLowerCase())) {
            const docRef = doc(productsCollection);
            batch.set(docRef, product);
            existingProductNames.add(product.name.toLowerCase());
        }
    });
    await batch.commit();
}


export const updateProduct = async (product: Product): Promise<void> => {
    const productRef = doc(db, 'products', product.id);
    const { id, ...productData } = product;
    await updateDoc(productRef, productData);
};

export const updateProductsCategory = async (productIds: string[], newCategory: string): Promise<void> => {
    const batch = writeBatch(db);
    productIds.forEach(id => {
        const productRef = doc(db, 'products', id);
        batch.update(productRef, { category: newCategory });
    });
    await batch.commit();
}

export const deleteProduct = async (productId: string): Promise<void> => {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
};

export const deleteMultipleProducts = async (productIds: string[]): Promise<void> => {
    if (productIds.length === 0) return;
    const batch = writeBatch(db);
    productIds.forEach(id => {
        const productRef = doc(db, 'products', id);
        batch.delete(productRef);
    });
    await batch.commit();
};


// ORDER FUNCTIONS
const ordersCollection = collection(db, 'orders');

export const getOrdersByUserId = async (userId: string): Promise<Order[]> => {
    const q = query(ordersCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getAllOrders = async (): Promise<Order[]> => {
    const snapshot = await getDocs(ordersCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};


export const addOrder = async (orderData: Omit<Order, 'id' | 'date'>): Promise<Order> => {
    const newOrderData = {
        ...orderData,
        date: new Date().toISOString(),
    }
    const docRef = await addDoc(ordersCollection, newOrderData);

    // NOTIFICATION LOGIC
    try {
        const customer = await getUserById(orderData.userId);
        const admins = (await getUsers()).filter(u => u.role === 'developer' || u.role === 'shop-owner');
        
        for (const admin of admins) {
            await addNotification({
                userId: admin.id,
                orderId: docRef.id,
                message: `New order #${docRef.id.substring(0,6)} placed by ${customer?.name || 'a customer'}.`,
                link: `/shop-owner/orders/${orderData.userId}`
            });
        }
    } catch (e) {
        console.error("Failed to create new order notification:", e);
    }
    
    return { id: docRef.id, ...newOrderData } as Order;
};

export const updateOrder = async (order: Order): Promise<void> => {
    const orderRef = doc(db, 'orders', order.id);
    
    const existingOrderSnap = await getDoc(orderRef);
    if (!existingOrderSnap.exists()) {
        console.error("Order to update does not exist.");
        return;
    }
    const existingOrder = existingOrderSnap.data() as Order;

    const { id, ...orderData } = order;
    await updateDoc(orderRef, orderData);

    // NOTIFICATION LOGIC
    if (existingOrder.status !== order.status) {
        let message = '';
        if (order.status === 'Shipped') {
            message = `Your order #${id.substring(0,6)} has been packed and is now on its way!`;
        } else if (order.status === 'Delivered') {
            message = `Your order #${id.substring(0,6)} has been delivered. Enjoy!`;
        } else if (order.status === 'Cancelled') {
            message = `Your order #${id.substring(0,6)} has been cancelled.`;
        }
        
        if (message) {
            try {
                await addNotification({
                    userId: order.userId,
                    orderId: id,
                    message: message,
                    link: '/orders'
                });
            } catch(e) {
                 console.error("Failed to create order status notification:", e);
            }
        }
    }
};

// COUPON FUNCTIONS
const couponsCollection = collection(db, 'coupons');

export const getUnusedCoupons = async (): Promise<Coupon[]> => {
    const q = query(couponsCollection, where("isUsed", "==", false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coupon)).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const addCoupon = async (couponData: Omit<Coupon, 'id'>): Promise<Coupon> => {
    const docRef = await addDoc(couponsCollection, couponData);
    return { id: docRef.id, ...couponData };
};

// HOMEPAGE FUNCTIONS
export const getRecommendedProducts = async (): Promise<Product[]> => {
    const q = query(productsCollection, where("isRecommended", "==", true), firestoreLimit(10));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export const getNewestProducts = async (limitCount = 10): Promise<Product[]> => {
    const q = query(productsCollection, orderBy("createdAt", "desc"), firestoreLimit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export const getTrendingProducts = async (limitCount = 10): Promise<Product[]> => {
    try {
        const orders = await getAllOrders();
        if (orders.length === 0) return [];

        const productCounts = new Map<string, number>();
        orders.forEach(order => {
            order.items.forEach(item => {
                productCounts.set(item.productId, (productCounts.get(item.productId) || 0) + item.quantity);
            });
        });

        const sortedProductIds = Array.from(productCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limitCount)
            .map(entry => entry[0]);
        
        if (sortedProductIds.length === 0) return [];

        const trendingProducts = await getProductsByIds(sortedProductIds);

        // Re-sort based on trending order
        return trendingProducts.sort((a, b) => {
            return sortedProductIds.indexOf(a.id) - sortedProductIds.indexOf(b.id);
        });
    } catch(err) {
        console.warn("Could not calculate trending products, likely due to permissions.", err);
        return [];
    }
}

export const getSimilarProducts = async (category: string, excludeId: string): Promise<Product[]> => {
    const q = query(
        productsCollection,
        where("category", "==", category),
        where(documentId(), "!=", excludeId),
        firestoreLimit(6)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}


// CATEGORY MANAGEMENT
export const getCategories = async (): Promise<string[]> => {
    const products = await getProducts();
    const categories = [...new Set(products.map(p => p.category))].sort();
    if (!categories.includes("Uncategorized")) {
        return ["Uncategorized", ...categories];
    }
    return categories;
};

export const renameCategory = async (oldName: string, newName: string): Promise<void> => {
    if (oldName === "Uncategorized") {
        throw new Error("Cannot rename the 'Uncategorized' category.");
    }
    const productsToUpdateQuery = query(productsCollection, where("category", "==", oldName));
    const productSnapshot = await getDocs(productsToUpdateQuery);
    
    const batch = writeBatch(db);
    productSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { category: newName });
    });

    await batch.commit();
}

export const deleteCategory = async (categoryName: string): Promise<void> => {
    if (categoryName === "Uncategorized") {
        throw new Error("Cannot delete the 'Uncategorized' category.");
    }
    const productsToUpdateQuery = query(productsCollection, where("category", "==", categoryName));
    const productSnapshot = await getDocs(productsToUpdateQuery);
    
    const batch = writeBatch(db);
    productSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { category: "Uncategorized" });
    });

    await batch.commit();
}

// NOTIFICATION FUNCTIONS
const notificationsCollection = collection(db, 'notifications');

export const addNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<void> => {
    await addDoc(notificationsCollection, {
        ...notificationData,
        isRead: false,
        createdAt: new Date().toISOString(),
    });
};

export const getNotificationsForUser = async (userId: string): Promise<Notification[]> => {
    const q = query(notificationsCollection, where("userId", "==", userId), orderBy("createdAt", "desc"), firestoreLimit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
};

export const markUserNotificationsAsRead = async (userId: string): Promise<void> => {
    const q = query(notificationsCollection, where("userId", "==", userId), where("isRead", "==", false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
};
