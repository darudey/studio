import { Product, User, Order } from "@/types";

export const users: User[] = [
  { id: '1', name: 'Dev Admin', email: 'dev@example.com', phone: '1112223333', role: 'developer' },
  { id: '2', name: 'Alice Wholesaler', email: 'alice@example.com', phone: '4445556666', role: 'wholesaler' },
  { id: '3', name: 'Bob Basic', email: 'bob@example.com', phone: '7778889999', role: 'basic' },
];

export let products: Product[] = [
  {
    id: '1',
    itemCode: 'FR-BAN-001',
    batchNo: 'B20231026',
    name: 'Organic Bananas',
    description: 'A bunch of fresh, organic bananas, rich in potassium and perfect for a healthy snack.',
    images: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png', 'https://placehold.co/600x600.png'],
    category: 'Fruits',
    retailPrice: 1.2,
    wholesalePrice: 0.8,
    unit: 'piece',
    stock: 150,
    dataAiHint: 'organic bananas'
  },
  {
    id: '2',
    itemCode: 'DY-MLK-001',
    batchNo: 'M20231025',
    name: 'Whole Milk',
    description: 'One gallon of fresh whole milk, pasteurized and great for drinking, cooking, or baking.',
    images: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png'],
    category: 'Dairy',
    retailPrice: 3.5,
    wholesalePrice: 2.5,
    unit: 'litre',
    stock: 80,
    dataAiHint: 'milk gallon'
  },
  {
    id: '3',
    itemCode: 'BK-BRD-001',
    batchNo: 'SDB20231024',
    name: 'Artisanal Sourdough Bread',
    description: 'A freshly baked loaf of artisanal sourdough bread with a crispy crust and soft, airy interior.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Bakery',
    retailPrice: 5.0,
    wholesalePrice: 3.75,
    unit: 'piece',
    stock: 50,
    dataAiHint: 'sourdough bread'
  },
  {
    id: '4',
    itemCode: 'DY-EGG-001',
    batchNo: 'E20231023',
    name: 'Free-Range Eggs',
    description: 'A dozen large, brown free-range eggs from happy chickens.',
    images: ['https://placehold.co/600x600.png', 'https://placehold.co/600x600.png'],
    category: 'Dairy',
    retailPrice: 4.0,
    wholesalePrice: 3.0,
    unit: 'dozen',
    stock: 100,
    dataAiHint: 'brown eggs'
  },
  {
    id: '5',
    itemCode: 'FR-AVO-001',
    batchNo: 'A20231022',
    name: 'Ripe Avocados',
    description: 'Creamy and delicious ripe avocados, perfect for toast, salads, or guacamole.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Fruits',
    retailPrice: 2.0,
    wholesalePrice: 1.5,
    unit: 'piece',
    stock: 200,
    dataAiHint: 'ripe avocados'
  },
  {
    id: '6',
    itemCode: 'PN-RIC-001',
    batchNo: 'R20231021',
    name: 'Basmati Rice',
    description: 'Premium quality long-grain Basmati rice, ideal for a variety of Indian dishes.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Pantry',
    retailPrice: 10.0,
    wholesalePrice: 7.5,
    unit: 'kg',
    stock: 120,
    dataAiHint: 'basmati rice'
  },
    {
    id: '7',
    itemCode: 'DY-CHS-001',
    batchNo: 'C20231020',
    name: 'Cheddar Cheese Block',
    description: 'A block of sharp cheddar cheese, perfect for slicing, shredding, or melting.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Dairy',
    retailPrice: 6.5,
    wholesalePrice: 5.0,
    unit: 'g',
    stock: 70,
    dataAiHint: 'cheddar cheese'
  },
  {
    id: '8',
    itemCode: 'VG-TOM-001',
    batchNo: 'T20231019',
    name: 'Fresh Tomatoes',
    description: 'Juicy, red tomatoes on the vine, bursting with flavor. Excellent for salads, sauces, and sandwiches.',
    images: ['https://placehold.co/600x600.png'],
    category: 'Vegetables',
    retailPrice: 2.5,
    wholesalePrice: 1.8,
    unit: 'kg',
    stock: 90,
    dataAiHint: 'fresh tomatoes'
  },
];

export const orders: Order[] = [
    {
        id: 'ORD001',
        userId: '2',
        items: [
            { productId: '1', name: 'Organic Bananas', quantity: 10, price: 0.8 },
            { productId: '2', name: 'Whole Milk', quantity: 5, price: 2.5 },
        ],
        total: (10 * 0.8) + (5 * 2.5),
        date: '2023-10-26T10:00:00Z',
        status: 'Delivered',
    },
    {
        id: 'ORD002',
        userId: '2',
        items: [
            { productId: '3', name: 'Artisanal Sourdough Bread', quantity: 8, price: 3.75 },
        ],
        total: 8 * 3.75,
        date: '2023-10-28T14:30:00Z',
        status: 'Shipped',
    },
    {
        id: 'ORD003',
        userId: '3',
        items: [
            { productId: '5', name: 'Ripe Avocados', quantity: 4, price: 2.0 },
        ],
        total: 4 * 2.0,
        date: '2023-10-29T09:00:00Z',
        status: 'Pending',
    },
];

// Function to add a new product, for developer use
export const addProduct = (product: Product) => {
  products.push(product);
};

// Function to update an existing product
export const updateProduct = (updatedProduct: Product): boolean => {
  const productIndex = products.findIndex(p => p.id === updatedProduct.id);
  if (productIndex !== -1) {
    products[productIndex] = updatedProduct;
    return true;
  }
  return false;
};

// Function to delete a product
export const deleteProduct = (productId: string): boolean => {
  const initialLength = products.length;
  products = products.filter(p => p.id !== productId);
  return products.length < initialLength;
};
