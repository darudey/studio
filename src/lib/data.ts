import { db } from './firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, query, where, documentId, writeBatch, setDoc } from 'firebase/firestore';
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

export const deleteProduct = async (productId: string): Promise<void> => {
    const productRef = doc(db, 'products', productId);
    await deleteDoc(productRef);
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
    const q = query(couponsCollection, where("code", "==", code), where("isUsed", "==", false));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Coupon;
};

export const markCouponAsUsed = async (couponId: string, userId: string): Promise<void> => {
    const couponRef = doc(db, 'coupons', couponId);
    await updateDoc(couponRef, {
        isUsed: true,
        usedBy: userId
    });
};
