import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Order } from '../types';

export const createOrder = async (orderData: Partial<Order>) => {
  const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const path = `orders/${orderId}`;
  
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    // Clean up undefined values from orderData to avoid Firestore error
    const cleanedData = Object.fromEntries(
      Object.entries(orderData).filter(([_, v]) => v !== undefined)
    );

    const finalOrder = {
      ...cleanedData,
      id: orderId,
      userId: auth.currentUser?.uid || null,
      status: 'Pending',
      createdAt: Date.now(),
    };
    
    await setDoc(orderRef, finalOrder);
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
