
// This file should only be imported and used on the client-side.
import type { Transaction, Equipment, Party, EquipmentSetting, EquipmentDefinition } from '@/lib/types';

const TRANSACTIONS_KEY = 'equipTrack_transactions_v1';
const PARTIES_KEY = 'equipTrack_parties_v1';
const EQUIPMENT_SETTINGS_KEY = 'equipTrack_equipment_settings_v1'; // Key for equipment settings
const EQUIPMENT_DEFINITIONS_KEY = 'equipTrack_equipment_definitions_v1'; // Key for equipment definitions

// Transactions
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

// Stock Calculation
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

// Parties
export function getParties(): Party[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(PARTIES_KEY);
    return data ? (JSON.parse(data) as Party[]).sort((a, b) => a.name.localeCompare(b.name)) : [];
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
  parties.sort((a, b) => a.name.localeCompare(b.name)); // Keep sorted
  try {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));
  } catch (error) {
    console.error("Error saving party to localStorage:", error);
  }
  return newParty;
}

export function updateParty(partyId: string, newName: string): { success: boolean, message?: string } {
  if (typeof window === 'undefined') return { success: false, message: "لا يمكن تحديث الجهة من الخادم." };
  
  if (!newName.trim()) {
    return { success: false, message: "اسم الجهة لا يمكن أن يكون فارغًا." };
  }

  const parties = getParties();
  const partyIndex = parties.findIndex(p => p.id === partyId);

  if (partyIndex === -1) {
    return { success: false, message: "الجهة غير موجودة." };
  }

  // Check for uniqueness, excluding the current party being edited
  if (parties.some(p => p.id !== partyId && p.name.toLowerCase() === newName.trim().toLowerCase())) {
    return { success: false, message: `اسم الجهة "${newName.trim()}" موجود بالفعل.` };
  }

  const oldName = parties[partyIndex].name;
  parties[partyIndex].name = newName.trim();
  parties.sort((a, b) => a.name.localeCompare(b.name)); // Keep sorted

  try {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(parties));

    // Update party name in transactions
    const transactions = getTransactions();
    let transactionsUpdated = false;
    const updatedTransactions = transactions.map(tx => {
      if (tx.party === oldName) {
        transactionsUpdated = true;
        return { ...tx, party: newName.trim() };
      }
      return tx;
    });

    if (transactionsUpdated) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating party or transactions in localStorage:", error);
    return { success: false, message: "حدث خطأ أثناء تحديث الجهة." };
  }
}

export function deleteParty(partyId: string): { success: boolean, message?: string } {
  if (typeof window === 'undefined') return { success: false, message: "لا يمكن حذف الجهة من الخادم." };

  const parties = getParties();
  const partyToDelete = parties.find(p => p.id === partyId);

  if (!partyToDelete) {
    return { success: false, message: "الجهة غير موجودة." };
  }

  const transactions = getTransactions();
  const isPartyUsed = transactions.some(tx => tx.party === partyToDelete.name);

  if (isPartyUsed) {
    return { success: false, message: `لا يمكن حذف الجهة "${partyToDelete.name}" لأنها مستخدمة في معاملات قائمة.` };
  }

  const updatedParties = parties.filter(p => p.id !== partyId);
  try {
    localStorage.setItem(PARTIES_KEY, JSON.stringify(updatedParties));
    return { success: true };
  } catch (error) {
    console.error("Error deleting party from localStorage:", error);
    return { success: false, message: "حدث خطأ أثناء حذف الجهة." };
  }
}


// Equipment Settings (Low Stock Threshold)
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

export function setEquipmentThreshold(equipmentName: string, threshold?: number): void {
  if (typeof window === 'undefined') return;
  try {
    const settings = getEquipmentSettings();
    if (threshold !== undefined && threshold > 0) {
      settings[equipmentName] = { lowStockThreshold: threshold };
    } else {
      // If threshold is undefined or not positive, remove the setting for this equipment name
      delete settings[equipmentName];
    }
    localStorage.setItem(EQUIPMENT_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving equipment threshold to localStorage:", error);
  }
}

// Equipment Definitions
export function getEquipmentDefinitions(): EquipmentDefinition[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(EQUIPMENT_DEFINITIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading equipment definitions from localStorage:", error);
    return [];
  }
}

export function addEquipmentDefinition(definition: Omit<EquipmentDefinition, 'id'>): EquipmentDefinition {
  if (typeof window === 'undefined') {
    // Fallback for server-side, though this function is primarily client-side
    const newDef = { ...definition, id: crypto.randomUUID() };
    console.warn("addEquipmentDefinition called on server, returning fallback. This may indicate an issue.");
    return newDef;
  }
  const definitions = getEquipmentDefinitions();
  const newDefinitionWithId: EquipmentDefinition = { ...definition, id: crypto.randomUUID() };
  definitions.push(newDefinitionWithId);
  localStorage.setItem(EQUIPMENT_DEFINITIONS_KEY, JSON.stringify(definitions));

  // Also set the default low stock threshold in the separate settings store
  if (newDefinitionWithId.defaultLowStockThreshold !== undefined) {
    setEquipmentThreshold(newDefinitionWithId.name, newDefinitionWithId.defaultLowStockThreshold);
  }
  return newDefinitionWithId;
}

export function updateEquipmentDefinition(updatedDefinition: EquipmentDefinition): boolean {
  if (typeof window === 'undefined') return false;
  const definitions = getEquipmentDefinitions();
  const index = definitions.findIndex(d => d.id === updatedDefinition.id);
  if (index === -1) {
    return false; // Not found
  }
  definitions[index] = updatedDefinition;
  localStorage.setItem(EQUIPMENT_DEFINITIONS_KEY, JSON.stringify(definitions));

  // Also update the default low stock threshold
  setEquipmentThreshold(updatedDefinition.name, updatedDefinition.defaultLowStockThreshold);
  return true;
}

export function deleteEquipmentDefinition(definitionId: string): boolean {
  if (typeof window === 'undefined') return false;
  let definitions = getEquipmentDefinitions();
  const definitionToDelete = definitions.find(d => d.id === definitionId);

  if (!definitionToDelete) return false; // Not found
  
  const transactions = getTransactions();
  const isUsed = transactions.some(tx => tx.equipmentName === definitionToDelete.name);

  if (isUsed) {
     // This case is handled in the UI now, but as a safeguard:
    console.warn(`Attempted to delete equipment definition "${definitionToDelete.name}" which is used in transactions. Store function prevented direct deletion if it were called without UI check.`);
    // For safety, you might return false or throw an error here if this function were to be called directly
    // without the UI pre-check. However, the page now handles this.
  }

  definitions = definitions.filter(d => d.id !== definitionId);
  localStorage.setItem(EQUIPMENT_DEFINITIONS_KEY, JSON.stringify(definitions));
  
  return true;
}


// Clear All Data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TRANSACTIONS_KEY);
    localStorage.removeItem(PARTIES_KEY);
    localStorage.removeItem(EQUIPMENT_SETTINGS_KEY);
    localStorage.removeItem(EQUIPMENT_DEFINITIONS_KEY); // Clear equipment definitions
  } catch (error) {
    console.error("Error clearing data from localStorage:", error);
  }
}
