
// This file should only be imported and used on the client-side.
import type { Transaction, Equipment, Party, EquipmentSetting, EquipmentDefinition, PartyEmployee } from '@/lib/types';
import * as XLSX from 'xlsx'; // Required for actual Excel parsing

const TRANSACTIONS_KEY = 'equipTrack_transactions_v1';
const PARTIES_KEY = 'equipTrack_parties_v1';
const EQUIPMENT_SETTINGS_KEY = 'equipTrack_equipment_settings_v1'; // Key for equipment settings
const EQUIPMENT_DEFINITIONS_KEY = 'equipTrack_equipment_definitions_v1'; // Key for equipment definitions
const PARTY_EMPLOYEES_KEY = 'equipTrack_party_employees_v1'; // Key for party employees

const ALL_APP_DATA_KEYS = [
  TRANSACTIONS_KEY,
  PARTIES_KEY,
  EQUIPMENT_SETTINGS_KEY,
  EQUIPMENT_DEFINITIONS_KEY,
  PARTY_EMPLOYEES_KEY,
];

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
    // Also delete associated party employees
    const allPartyEmployeesData = localStorage.getItem(PARTY_EMPLOYEES_KEY);
    if (allPartyEmployeesData) {
      const allEmployees = JSON.parse(allPartyEmployeesData);
      delete allEmployees[partyId];
      localStorage.setItem(PARTY_EMPLOYEES_KEY, JSON.stringify(allEmployees));
    }
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
    const newDef = { ...definition, id: crypto.randomUUID() };
    console.warn("addEquipmentDefinition called on server, returning fallback. This may indicate an issue.");
    return newDef;
  }
  const definitions = getEquipmentDefinitions();
  const newDefinitionWithId: EquipmentDefinition = { ...definition, id: crypto.randomUUID() };
  definitions.push(newDefinitionWithId);
  localStorage.setItem(EQUIPMENT_DEFINITIONS_KEY, JSON.stringify(definitions));

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
    return false; 
  }
  definitions[index] = updatedDefinition;
  localStorage.setItem(EQUIPMENT_DEFINITIONS_KEY, JSON.stringify(definitions));

  setEquipmentThreshold(updatedDefinition.name, updatedDefinition.defaultLowStockThreshold);
  return true;
}

export function deleteEquipmentDefinition(definitionId: string): boolean {
  if (typeof window === 'undefined') return false;
  let definitions = getEquipmentDefinitions();
  const definitionToDelete = definitions.find(d => d.id === definitionId);

  if (!definitionToDelete) return false; 
  
  const transactions = getTransactions();
  const isUsed = transactions.some(tx => tx.equipmentName === definitionToDelete.name);

  if (isUsed) {
    console.warn(`Attempted to delete equipment definition "${definitionToDelete.name}" which is used in transactions. Store function prevented direct deletion if it were called without UI check.`);
  }

  definitions = definitions.filter(d => d.id !== definitionId);
  localStorage.setItem(EQUIPMENT_DEFINITIONS_KEY, JSON.stringify(definitions));
  
  return true;
}

// Party Employees
export function getPartyEmployees(partyId: string): PartyEmployee[] {
  if (typeof window === 'undefined') return [];
  try {
    const allPartyEmployeesData = localStorage.getItem(PARTY_EMPLOYEES_KEY);
    const allEmployees = allPartyEmployeesData ? JSON.parse(allPartyEmployeesData) : {};
    return (allEmployees[partyId] || []).sort((a: PartyEmployee, b: PartyEmployee) => {
      const lastNameCompare = a.lastName.localeCompare(b.lastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });
  } catch (error) {
    console.error(`Error reading employees for party ${partyId} from localStorage:`, error);
    return [];
  }
}

export function setPartyEmployees(partyId: string, employees: PartyEmployee[]): void {
  if (typeof window === 'undefined') return;
  try {
    const allPartyEmployeesData = localStorage.getItem(PARTY_EMPLOYEES_KEY);
    const allEmployees = allPartyEmployeesData ? JSON.parse(allPartyEmployeesData) : {};
    allEmployees[partyId] = employees;
    localStorage.setItem(PARTY_EMPLOYEES_KEY, JSON.stringify(allEmployees));
  } catch (error) {
    console.error(`Error saving employees for party ${partyId} to localStorage:`, error);
  }
}

export async function importPartyEmployeesFromExcel(partyId: string, file: File): Promise<{ success: boolean; message: string; data?: PartyEmployee[] }> {
  if (typeof window === 'undefined') return { success: false, message: "لا يمكن معالجة الملف من الخادم." };
  if (!file) return { success: false, message: "لم يتم اختيار ملف." };

  return new Promise(async (resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const arrayBuffer = event.target?.result;
          if (!arrayBuffer) {
            resolve({ success: false, message: "فشل في قراءة الملف." });
            return;
          }
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]; 

          if (jsonData.length < 2) { 
            resolve({ success: false, message: "ملف Excel فارغ أو لا يحتوي على بيانات كافية." });
            return;
          }
          
          const header = jsonData[0].map(h => String(h).trim().toLowerCase());
          const expectedHeaders = ["الرتبة", "الاسم", "اللقب", "الرقم"].map(h => h.toLowerCase());
          
          const rankIndex = header.indexOf(expectedHeaders[0]);
          const firstNameIndex = header.indexOf(expectedHeaders[1]);
          const lastNameIndex = header.indexOf(expectedHeaders[2]);
          const employeeNumberIndex = header.indexOf(expectedHeaders[3]);

          if (rankIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1 || employeeNumberIndex === -1) {
            resolve({ success: false, message: `ملف Excel يجب أن يحتوي على الأعمدة التالية: ${expectedHeaders.join(', ')}` });
            return;
          }

          const employees: PartyEmployee[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) continue; 

            const rank = String(row[rankIndex] || '').trim();
            const firstName = String(row[firstNameIndex] || '').trim();
            const lastName = String(row[lastNameIndex] || '').trim();
            const employeeNumber = String(row[employeeNumberIndex] || '').trim();

            if (rank && firstName && lastName && employeeNumber) {
              employees.push({
                id: crypto.randomUUID(),
                rank,
                firstName,
                lastName,
                employeeNumber,
              });
            } else {
              console.warn(`Skipping row ${i+1} due to missing data: Rank=${rank}, FirstName=${firstName}, LastName=${lastName}, Number=${employeeNumber}`);
            }
          }
          
          setPartyEmployees(partyId, employees);
          resolve({ success: true, message: `تم استيراد وتحديث بيانات الموظفين بنجاح. عدد السجلات: ${employees.length}`, data: employees });

        } catch (e) {
          console.error("Error processing Excel file:", e);
          resolve({ success: false, message: "حدث خطأ أثناء معالجة ملف Excel." });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: "فشل في قراءة الملف." });
      };
      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error("Error importing party employees:", error);
      resolve({ success: false, message: "حدث خطأ غير متوقع أثناء عملية الاستيراد." });
    }
  });
}


// Clear All Data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  try {
    ALL_APP_DATA_KEYS.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing data from localStorage:", error);
  }
}

// Export All App Data
export function exportAllData(): void {
  if (typeof window === 'undefined') return;
  const appData: Record<string, any> = {};
  ALL_APP_DATA_KEYS.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        appData[key] = JSON.parse(data);
      } else {
        appData[key] = []; // Or appropriate default empty state
      }
    } catch (error) {
      console.error(`Error reading ${key} from localStorage during export:`, error);
      appData[key] = null; // Indicate error or missing data
    }
  });

  const jsonString = JSON.stringify(appData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  link.download = `app_data_backup_${timestamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import All App Data
export async function importAllData(file: File): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') {
    return { success: false, message: "لا يمكن استيراد البيانات من الخادم." };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonString = event.target?.result as string;
        const importedData = JSON.parse(jsonString);

        // Basic validation: check if all expected keys exist
        let allKeysPresent = true;
        for (const key of ALL_APP_DATA_KEYS) {
          if (!Object.prototype.hasOwnProperty.call(importedData, key)) {
            allKeysPresent = false;
            break;
          }
        }

        if (!allKeysPresent) {
          resolve({ success: false, message: "ملف البيانات غير صالح أو لا يحتوي على جميع الأقسام المطلوبة." });
          return;
        }

        // Clear existing data and import new data
        ALL_APP_DATA_KEYS.forEach(key => {
          localStorage.setItem(key, JSON.stringify(importedData[key] || [])); // Use empty array as fallback
        });

        resolve({ success: true, message: "تم استيراد البيانات بنجاح. سيتم إعادة تحميل الصفحة." });
      } catch (error) {
        console.error("Error processing or importing data file:", error);
        resolve({ success: false, message: "حدث خطأ أثناء قراءة أو معالجة ملف البيانات." });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, message: "فشل في قراءة الملف." });
    };
    reader.readAsText(file);
  });
}
