
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

  // Basic check: Ensure no transactions use this equipment definition's name.
  // A more robust check might be needed depending on how strictly this is enforced.
  // For now, we check against the 'name' of the equipment definition.
  const transactions = getTransactions();
  const isUsed = transactions.some(tx => tx.equipmentName === definitionToDelete.name);

  if (isUsed) {
    // Optionally, you might want to prevent deletion or handle it differently.
    // For now, we'll allow deletion but you could return false or throw an error.
    // console.warn(`Cannot delete equipment definition "${definitionToDelete.name}" as it is used in transactions.`);
    // return false; 
  }

  definitions = definitions.filter(d => d.id !== definitionId);
  localStorage.setItem(EQUIPMENT_DEFINITIONS_KEY, JSON.stringify(definitions));
  
  // Optionally, remove its low stock threshold setting if it's no longer defined
  // setEquipmentThreshold(definitionToDelete.name, undefined); // This will delete the setting
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
