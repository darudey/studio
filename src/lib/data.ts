
import { db } from './firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, documentId, writeBatch, setDoc, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import type { Product, User, Order, OrderItem, Coupon } from "@/types";

// USER FUNCTIONS
const usersCollection = collection(db, 'users');

export const getUsers = async (): Promise<User[]> => {
    const snapshot = await getDocs(usersCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUserById = async (id: string): Promise<User | null> => {
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as User : null;
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
    const snapshot = await getDocs(productsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getProductsByIds = async (ids: string[]): Promise<Product[]> => {
    if (ids.length === 0) return [];
    const q = query(productsCollection, where(documentId(), 'in', ids));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Product : null;
}

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    const docRef = await addDoc(productsCollection, productData);
    return { id: docRef.id, ...productData };
};

export const addMultipleProducts = async (productsData: Omit<Product, 'id'>[]): Promise<void> => {
    const batch = writeBatch(db);
    productsData.forEach(product => {
        const docRef = doc(productsCollection);
        batch.set(docRef, product);
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


export const addOrder = async (orderData: Omit<Order, 'id' | 'date' | 'items'> & { items: Omit<OrderItem, 'status'>[] }): Promise<Order> => {
    const newOrderData = {
        ...orderData,
        date: new Date().toISOString(),
        items: orderData.items.map(item => ({...item, status: 'Pending'}))
    }
    const docRef = await addDoc(ordersCollection, newOrderData);
    return { id: docRef.id, ...newOrderData } as Order;
};

export const updateOrder = async (order: Order): Promise<void> => {
    const orderRef = doc(db, 'orders', order.id);
    const { id, ...orderData } = order;
    await updateDoc(orderRef, orderData);
}

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

export const findCouponByCode = async (code: string): Promise<Coupon | null> => {
    const q = query(couponsCollection, where("code", "==", code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const couponDoc = snapshot.docs[0];
    const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

    // Explicitly check if the coupon is already used
    if (coupon.isUsed) {
        return null;
    }

    return coupon;
};

export const markCouponAsUsed = async (couponId: string, userId: string): Promise<void> => {
    const couponRef = doc(db, 'coupons', couponId);
    await updateDoc(couponRef, {
        isUsed: true,
        usedBy: userId
    });
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

// PERFORMANCE-OPTIMIZED FUNCTIONS
export const getPaginatedProducts = async ({ search = '', page = 1, limit = 20 }: { search?: string, page?: number, limit?: number }) => {
    // This function simulates server-side search and pagination.
    // For a real-world, large-scale app, a dedicated search service like Algolia or Typesense integrated with Firebase is recommended.
    const allProducts = await getProducts();

    const getConsonants = (str: string) => str.toLowerCase().replace(/[aeiou\\s\\W\\d_]/gi, '');

    const filteredProducts = search.trim() ? allProducts.filter(product => {
        const lowercasedFilter = search.toLowerCase();
        
        if (product.name.toLowerCase().includes(lowercasedFilter) || 
            product.category.toLowerCase().includes(lowercasedFilter) ||
            product.itemCode.toLowerCase().includes(lowercasedFilter)
        ) {
            return true;
        }

        const consonantFilter = getConsonants(lowercasedFilter);
        if (consonantFilter.length > 1) {
            const nameConsonants = getConsonants(product.name);
            if (nameConsonants.includes(consonantFilter)) {
                return true;
            }
        }
        return false;
    }) : allProducts;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    const hasMore = endIndex < filteredProducts.length;

    return {
        products: paginatedProducts,
        more: hasMore
    };
};
