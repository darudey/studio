## Firestore Security Rules

Copy the rules below and paste them into the Rules tab of your Firestore database in the Firebase Console.

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check if a user is an admin
    function isAdmin(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role in ['developer', 'shop-owner', 'imager'];
    }

    // Helper function to check if a user is a developer
    function isDeveloper(userId) {
      return get(/databases/$(database)/documents/users/$(userId)).data.role == 'developer';
    }

    // PRODUCTS: Public can read, admins can write.
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null && isAdmin(request.auth.uid);
    }

    // USERS: Users can read/update their own profile. Admins can read any profile. Developers can create/delete users.
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin(request.auth.uid));
      allow update: if request.auth != null && request.auth.uid == userId;
      allow create, delete: if request.auth != null && isDeveloper(request.auth.uid);
    }

    // CARTS: This collection is not used on the backend. Cart is managed client-side in localStorage.

    // ORDERS: Users can create orders for themselves. Users can read their own orders. Admins can read/update any order.
    match /orders/{orderId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update: if request.auth != null && (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['developer', 'shop-owner'] || request.auth.uid == resource.data.userId);
    }

    // COUPONS: Only developers can create/read coupons. (Redemption is handled via a secure API endpoint).
    match /coupons/{couponId} {
        allow read, create: if request.auth != null && isDeveloper(request.auth.uid);
        // Update is handled by the secure backend endpoint, not directly by clients.
        allow update, delete: if false;
    }
    
    // NOTIFICATIONS: Users can read their own notifications. No one can create/update/delete notifications directly except the backend.
    match /notifications/{notificationId} {
        allow read: if request.auth != null && request.auth.uid == resource.data.userId;
        // Creation is handled by secure backend logic (e.g. cloud functions or app server) when an order is placed.
        allow create, update, delete: if false;
    }
  }
}
```

# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
