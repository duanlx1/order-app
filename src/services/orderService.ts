import { collection, doc, setDoc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebaseUtils';
import { Order } from '../types';

export const createOrder = async (orderData: Partial<Order>) => {
  const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const path = `orders/${orderId}`;
  
  try {
    const userId = auth.currentUser?.uid;
    // Check if user is blocked
    if (userId) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && userDoc.data()?.isBlocked) {
        throw new Error('Tài khoản của bạn đã bị khóa tính năng đặt hàng.');
      }
    }

    const orderRef = doc(db, 'orders', orderId);
    
    // Clean up undefined values from orderData to avoid Firestore error
    const cleanedData = Object.fromEntries(
      Object.entries(orderData).filter(([_, v]) => v !== undefined)
    );

    const finalOrder: any = {
      ...cleanedData,
      id: orderId,
      userId: userId || null,
      status: 'Pending',
      createdAt: Date.now(),
    };
    
    await setDoc(orderRef, finalOrder);

    // Update user stats
    if (userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        totalOrders: increment(1),
        totalSpent: increment(finalOrder.totalPrice || 0)
      }).catch(e => console.error("Failed to update user stats", e));
    }

    // Update voucher usedCount if a voucher was applied
    if (finalOrder.voucher && finalOrder.voucher.id) {
      const voucherRef = doc(db, 'vouchers', finalOrder.voucher.id);
      await updateDoc(voucherRef, {
        usedCount: increment(1)
      }).catch(e => console.error("Failed to update voucher usedCount", e));
    }

    return orderId;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Tài khoản của bạn đã bị khóa')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};
