
// This file should only be imported and used on the client-side.
import type { Transaction, Equipment, Party, EquipmentSetting } from '@/lib/types';

const TRANSACTIONS_KEY = 'equipTrack_transactions_v1';
const PARTIES_KEY = 'equipTrack_parties_v1';
const EQUIPMENT_SETTINGS_KEY = 'equipTrack_equipment_settings_v1'; // Key for equipment settings

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
    transactions.unshift(transaction);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Error saving transaction to localStorage:", error);
  }
}

export function calculateStock(transactions: Transaction[]): Equipment[] {
  const stockMap = new Map<string, number>(); // Key: "equipmentName-category", Value: quantity
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const tx of sortedTransactions) {
    const categoryKey = tx.category || 'N/A'; // Use 'N/A' or similar for items without a category
    const stockKey = `${tx.equipmentName}-${categoryKey}`;
    const currentQuantity = stockMap.get(stockKey) || 0;

    if (tx.type === 'receive') {
      stockMap.set(stockKey, currentQuantity + tx.quantity);
    } else if (tx.type === 'dispatch') {
      stockMap.set(stockKey, currentQuantity - tx.quantity);
    }
  }

  return Array.from(stockMap.entries())
    .map(([key, quantity]) => {
      const parts = key.split('-');
      const category = parts.length > 1 ? parts.pop() : undefined;
      const name = parts.join('-'); // In case equipment name itself had a hyphen
      return { name, category: category === 'N/A' ? undefined : category, quantity };
    })
    .sort((a,b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return (a.category || '').localeCompare(b.category || '');
    });
}

export function getParties(): Party[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PARTIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading parties from localStorage:", error);
    return [];
  }
}

export function addParty(partyName: string): Party {
  if (typeof window === 'undefined') {
    const fallbackParty: Party = { id: crypto.randomUUID(), name: partyName };
    console.warn("addParty called on server, returning fallback. This may indicate an issue.");
    return fallbackParty;
  }

  const parties = getParties();
  const existingParty = parties.find(p => p.name.toLowerCase() === partyName.toLowerCase());

  if (existingParty) {
    return existingParty;
  }

  const newParty: Party = {
    id: crypto.randomUUID(),
    name: partyName,
  };

  parties.push(newParty);
  try {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));
  } catch (error) {
    console.error("Error saving party to localStorage:", error);
  }
  return newParty;
}

export function getEquipmentSettings(): Record<string, EquipmentSetting> {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(EQUIPMENT_SETTINGS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Error reading equipment settings from localStorage:", error);
    return {};
  }
}

export function setEquipmentThreshold(equipmentName: string, threshold: number): void {
  if (typeof window === 'undefined') return;
  try {
    const settings = getEquipmentSettings();
    settings[equipmentName] = { lowStockThreshold: threshold };
    localStorage.setItem(EQUIPMENT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving equipment threshold to localStorage:", error);
  }
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(PARTIES_KEY);
    localStorage.removeItem(EQUIPMENT_SETTINGS_KEY); // Also clear equipment settings
  } catch (error) {
    console.error("Error clearing data from localStorage:", error);
  }
}
