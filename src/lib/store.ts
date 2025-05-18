// This file should only be imported and used on the client-side.
import type { Transaction, Equipment } from '@/lib/types';

const TRANSACTIONS_KEY = 'equipTrack_transactions_v1'; // Added versioning

export function getTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading transactions from localStorage:", error);
    return [];
  }
}

export function addTransaction(transaction: Transaction): void {
  if (typeof window === 'undefined') return;
  try {
    const transactions = getTransactions();
    // Add to the beginning so new transactions appear first in raw list
    // but sort by date for display if needed
    transactions.unshift(transaction); 
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Error saving transaction to localStorage:", error);
  }
}

export function calculateStock(transactions: Transaction[]): Equipment[] {
  const stockMap = new Map<string, number>();

  // Iterate transactions. Assuming transactions are in reverse chronological order (newest first)
  // For stock calculation, process oldest first.
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const tx of sortedTransactions) {
    const currentQuantity = stockMap.get(tx.equipmentName) || 0;
    if (tx.type === 'receive') {
      stockMap.set(tx.equipmentName, currentQuantity + tx.quantity);
    } else if (tx.type === 'dispatch') {
      stockMap.set(tx.equipmentName, currentQuantity - tx.quantity);
    }
  }
  
  return Array.from(stockMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a,b) => a.name.localeCompare(b.name)); // Sort by name for consistent display
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TRANSACTIONS_KEY);
  } catch (error) {
    console.error("Error clearing data from localStorage:", error);
  }
}
