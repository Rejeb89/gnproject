
// This file should only be imported and used on the client-side.
import type { Transaction, Equipment, Party, EquipmentSetting, EquipmentDefinition, PartyEmployee, AppNotification, CalendarEvent, Vehicle, FixedFurnitureItem, Appropriation, Spending } from '@/lib/types';
import * as XLSX from 'xlsx'; // Required for actual Excel parsing

const TRANSACTIONS_KEY = 'equipTrack_transactions_v1';
const PARTIES_KEY = 'equipTrack_parties_v1';
const EQUIPMENT_SETTINGS_KEY = 'equipTrack_equipment_settings_v1'; // Key for equipment settings
const EQUIPMENT_DEFINITIONS_KEY = 'equipTrack_equipment_definitions_v1'; // Key for equipment definitions
const PARTY_EMPLOYEES_KEY = 'equipTrack_party_employees_v1'; // Key for party employees
export const NOTIFICATIONS_KEY = 'equipTrack_notifications_v1'; // Key for notifications
const CALENDAR_EVENTS_KEY = 'equipTrack_calendar_events_v2'; // Updated key for calendar events with reminders
const VEHICLES_KEY = 'equipTrack_vehicles_v1'; // Key for vehicles
const FIXED_FURNITURE_KEY = 'equipTrack_fixed_furniture_v1'; // Key for fixed furniture
const APPROPRIATIONS_KEY = 'equipTrack_appropriations_v1'; // Key for appropriations
const SPENDINGS_KEY = 'equipTrack_spendings_v1'; // Key for spendings
const APP_THEME_KEY = 'equipTrack_selected_app_theme_v1'; // For storing the selected theme name

const ALL_APP_DATA_KEYS = [
  TRANSACTIONS_KEY,
  PARTIES_KEY,
  EQUIPMENT_SETTINGS_KEY,
  EQUIPMENT_DEFINITIONS_KEY,
  PARTY_EMPLOYEES_KEY,
  NOTIFICATIONS_KEY,
  CALENDAR_EVENTS_KEY,
  VEHICLES_KEY,
  FIXED_FURNITURE_KEY,
  APPROPRIATIONS_KEY,
  SPENDINGS_KEY,
  // APP_THEME_KEY is handled separately in export/import as it's a direct string, not JSON
];

// Helper function to get and validate array data from localStorage
function getStoredArray<T>(key: string, validator: (item: any) => item is T): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsedData = JSON.parse(data);
    if (!Array.isArray(parsedData)) {
      console.warn(`Data for key ${key} in localStorage is not an array. Clearing corrupted data.`);
      localStorage.removeItem(key);
      return [];
    }
    return parsedData.filter(validator);
  } catch (error) {
    console.error(`Error reading or parsing ${key} from localStorage:`, error);
    return [];
  }
}

// Type Guards
const isTransaction = (item: any): item is Transaction => typeof item === 'object' && item !== null && 'id' in item && 'type' in item && 'equipmentName' in item;
const isParty = (item: any): item is Party => typeof item === 'object' && item !== null && 'id' in item && 'name' in item;
const isEquipmentDefinition = (item: any): item is EquipmentDefinition => typeof item === 'object' && item !== null && 'id' in item && 'name' in item;
const isAppNotification = (item: any): item is AppNotification => typeof item === 'object' && item !== null && 'id' in item && 'message' in item;
const isCalendarEvent = (item: any): item is CalendarEvent => typeof item === 'object' && item !== null && 'id' in item && 'title' in item && 'date' in item;
const isVehicle = (item: any): item is Vehicle => typeof item === 'object' && item !== null && 'id' in item && 'type' in item && 'registrationNumber' in item;
const isAppropriation = (item: any): item is Appropriation => typeof item === 'object' && item !== null && 'id' in item && 'name' in item && 'allocatedAmount' in item;
const isSpending = (item: any): item is Spending => typeof item === 'object' && item !== null && 'id' in item && 'appropriationId' in item && 'spentAmount' in item && 'spendingDate' in item;


// Transactions
export function getTransactions(): Transaction[] {
  return getStoredArray(TRANSACTIONS_KEY, isTransaction);
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
  return getStoredArray(PARTIES_KEY, isParty).sort((a, b) => a.name.localeCompare(b.name));
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
    // Also delete associated fixed furniture
    const allFixedFurnitureData = localStorage.getItem(FIXED_FURNITURE_KEY);
    if (allFixedFurnitureData) {
      const allFurniture = JSON.parse(allFixedFurnitureData);
      delete allFurniture[partyId];
      localStorage.setItem(FIXED_FURNITURE_KEY, JSON.stringify(allFurniture));
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
    const parsedData = data ? JSON.parse(data) : {};
    // Basic validation to ensure it's an object
    if (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) {
      return parsedData;
    }
    if (data) { // If data exists but is not a valid object
      console.warn(`Data for key ${EQUIPMENT_SETTINGS_KEY} in localStorage is not a valid object. Clearing corrupted data.`);
      localStorage.removeItem(EQUIPMENT_SETTINGS_KEY);
    }
    return {};
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
  return getStoredArray(EQUIPMENT_DEFINITIONS_KEY, isEquipmentDefinition);
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
    const partyData = allEmployees[partyId];
    if (Array.isArray(partyData)) {
      return (partyData as PartyEmployee[]).sort((a: PartyEmployee, b: PartyEmployee) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      });
    }
    return [];
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


// Notifications
export function getNotifications(): AppNotification[] {
  return getStoredArray(NOTIFICATIONS_KEY, isAppNotification).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function addNotification(notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification | null {
  if (typeof window === 'undefined') return null;

  const notifications = getNotifications();
  const existingUnread = notifications.find(
    n => !n.isRead &&
         n.type === notificationData.type &&
         n.message === notificationData.message &&
         n.eventId === notificationData.eventId
  );
  if (existingUnread) {
    return existingUnread;
  }

  const newNotification: AppNotification = {
    ...notificationData,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    isRead: false,
  };
  notifications.unshift(newNotification);
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 50)));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    return newNotification;
  } catch (error) {
    console.error("Error saving notification to localStorage:", error);
    return null;
  }
}

export function markNotificationAsRead(notificationId: string): void {
  if (typeof window === 'undefined') return;
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(n =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  } catch (error) {
    console.error("Error marking notification as read in localStorage:", error);
  }
}

export function markAllNotificationsAsRead(): void {
  if (typeof window === 'undefined') return;
  const notifications = getNotifications();
  const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
  } catch (error) {
    console.error("Error marking all notifications as read in localStorage:", error);
  }
}

export function clearAllNotifications(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify([]));
  } catch (error) {
    console.error("Error clearing notifications from localStorage:", error);
  }
}

// Calendar Events
export function getCalendarEvents(): CalendarEvent[] {
  return getStoredArray(CALENDAR_EVENTS_KEY, isCalendarEvent).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function addCalendarEvent(event: Omit<CalendarEvent, 'id'>): CalendarEvent {
   if (typeof window === 'undefined') {
    const newEvent = { ...event, id: crypto.randomUUID() };
    console.warn("addCalendarEvent called on server, returning fallback.");
    return newEvent;
  }
  const events = getCalendarEvents();
  const newEventWithId: CalendarEvent = { ...event, id: crypto.randomUUID() };
  events.push(newEventWithId);
  localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events));
  return newEventWithId;
}

export function updateCalendarEvent(updatedEvent: CalendarEvent): boolean {
  if (typeof window === 'undefined') return false;
  const events = getCalendarEvents();
  const index = events.findIndex(e => e.id === updatedEvent.id);
  if (index === -1) {
    return false;
  }
  events[index] = updatedEvent;
  localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(events));
  return true;
}

export function deleteCalendarEvent(eventId: string): boolean {
  if (typeof window === 'undefined') return false;
  const events = getCalendarEvents();
  const updatedEvents = events.filter(e => e.id !== eventId);
  localStorage.setItem(CALENDAR_EVENTS_KEY, JSON.stringify(updatedEvents));
  return events.length !== updatedEvents.length;
}

// Vehicles
export function getVehicles(): Vehicle[] {
  return getStoredArray(VEHICLES_KEY, isVehicle);
}

export function addVehicle(vehicle: Omit<Vehicle, 'id' | 'status'>): Vehicle {
  if (typeof window === 'undefined') {
    const newVeh = { ...vehicle, id: crypto.randomUUID(), status: 'available' as const };
    console.warn("addVehicle called on server, returning fallback.");
    return newVeh;
  }
  const vehicles = getVehicles();
  const newVehicleWithId: Vehicle = { ...vehicle, id: crypto.randomUUID(), status: 'available' };
  vehicles.push(newVehicleWithId);
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  return newVehicleWithId;
}

export function updateVehicle(updatedVehicle: Vehicle): boolean {
  if (typeof window === 'undefined') return false;
  const vehicles = getVehicles();
  const index = vehicles.findIndex(v => v.id === updatedVehicle.id);
  if (index === -1) return false;
  vehicles[index] = updatedVehicle;
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
  return true;
}

export function deleteVehicle(vehicleId: string): boolean {
  if (typeof window === 'undefined') return false;
  const vehicles = getVehicles();
  const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
  localStorage.setItem(VEHICLES_KEY, JSON.stringify(updatedVehicles));
  return vehicles.length !== updatedVehicles.length;
}

// Fixed Furniture
export function getFixedFurniture(partyId: string): FixedFurnitureItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const allFixedFurnitureData = localStorage.getItem(FIXED_FURNITURE_KEY);
    const allFurniture = allFixedFurnitureData ? JSON.parse(allFixedFurnitureData) : {};
    const partyData = allFurniture[partyId];
    if (Array.isArray(partyData)) {
        return (partyData as FixedFurnitureItem[]).sort((a: FixedFurnitureItem, b: FixedFurnitureItem) => 
          a.equipmentType.localeCompare(b.equipmentType)
        );
    }
    return [];
  } catch (error) {
    console.error(`Error reading fixed furniture for party ${partyId} from localStorage:`, error);
    return [];
  }
}

export function setFixedFurniture(partyId: string, items: FixedFurnitureItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const allFixedFurnitureData = localStorage.getItem(FIXED_FURNITURE_KEY);
    const allFurniture = allFixedFurnitureData ? JSON.parse(allFixedFurnitureData) : {};
    allFurniture[partyId] = items;
    localStorage.setItem(FIXED_FURNITURE_KEY, JSON.stringify(allFurniture));
  } catch (error) {
    console.error(`Error saving fixed furniture for party ${partyId} to localStorage:`, error);
  }
}

export async function importFixedFurnitureFromExcel(partyId: string, file: File): Promise<{ success: boolean; message: string; data?: FixedFurnitureItem[] }> {
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
            resolve({ success: false, message: "ملف Excel فارغ أو لا يحتوي على بيانات كافية (يجب أن يحتوي على صف ترويسة واحد على الأقل)." });
            return;
          }

          const header = jsonData[0].map(h => String(h).trim().toLowerCase());
          const expectedHeaders = ["نوع التجهيز", "الكمية", "الترقيم الاداري", "الترقيم التسلسلي", "مكان تواجده", "الحالة"].map(h => h.toLowerCase());
          
          const equipmentTypeIndex = header.indexOf(expectedHeaders[0]);
          const quantityIndex = header.indexOf(expectedHeaders[1]);
          const adminNumIndex = header.indexOf(expectedHeaders[2]);
          const serialNumIndex = header.indexOf(expectedHeaders[3]);
          const locationIndex = header.indexOf(expectedHeaders[4]);
          const statusIndex = header.indexOf(expectedHeaders[5]);

          if (equipmentTypeIndex === -1 || quantityIndex === -1) {
            resolve({ success: false, message: `ملف Excel يجب أن يحتوي على الأقل على عمودي "نوع التجهيز" و "الكمية". الأعمدة المتوقعة هي: ${expectedHeaders.join(', ')}` });
            return;
          }

          const furnitureItems: FixedFurnitureItem[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) continue; // Skip empty rows

            const equipmentType = String(row[equipmentTypeIndex] || '').trim();
            const quantityStr = String(row[quantityIndex] || '0').trim();
            const quantity = parseInt(quantityStr, 10);

            if (!equipmentType || isNaN(quantity) || quantity <= 0) {
              console.warn(`Skipping row ${i+1} due to missing or invalid equipment type/quantity: Type='${equipmentType}', Quantity='${quantityStr}'`);
              continue;
            }

            furnitureItems.push({
              id: crypto.randomUUID(),
              equipmentType,
              quantity,
              administrativeNumbering: adminNumIndex !== -1 ? String(row[adminNumIndex] || '').trim() : undefined,
              serialNumber: serialNumIndex !== -1 ? String(row[serialNumIndex] || '').trim() : undefined,
              location: locationIndex !== -1 ? String(row[locationIndex] || '').trim() : undefined,
              status: statusIndex !== -1 ? String(row[statusIndex] || '').trim() : undefined,
            });
          }

          setFixedFurniture(partyId, furnitureItems);
          resolve({ success: true, message: `تم استيراد وتحديث بيانات الأثاث القار بنجاح. عدد السجلات: ${furnitureItems.length}`, data: furnitureItems });

        } catch (e) {
          console.error("Error processing Excel file for fixed furniture:", e);
          resolve({ success: false, message: "حدث خطأ أثناء معالجة ملف Excel الخاص بالأثاث." });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: "فشل في قراءة الملف." });
      };
      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error("Error importing fixed furniture:", error);
      resolve({ success: false, message: "حدث خطأ غير متوقع أثناء عملية استيراد الأثاث." });
    }
  });
}

// Appropriations
export function getAppropriations(): Appropriation[] {
  return getStoredArray(APPROPRIATIONS_KEY, isAppropriation);
}

export function addAppropriation(appropriation: Omit<Appropriation, 'id'>): Appropriation {
  if (typeof window === 'undefined') {
    const newApprop = { ...appropriation, id: crypto.randomUUID() };
    console.warn("addAppropriation called on server, returning fallback.");
    return newApprop;
  }
  const appropriations = getAppropriations();
  const newAppropriationWithId: Appropriation = { ...appropriation, id: crypto.randomUUID() };
  appropriations.push(newAppropriationWithId);
  localStorage.setItem(APPROPRIATIONS_KEY, JSON.stringify(appropriations));
  return newAppropriationWithId;
}

export function updateAppropriation(updatedAppropriation: Appropriation): boolean {
  if (typeof window === 'undefined') return false;
  const appropriations = getAppropriations();
  const index = appropriations.findIndex(a => a.id === updatedAppropriation.id);
  if (index === -1) return false;
  appropriations[index] = updatedAppropriation;
  localStorage.setItem(APPROPRIATIONS_KEY, JSON.stringify(appropriations));
  return true;
}

export function deleteAppropriation(appropriationId: string): { success: boolean, message?: string } {
  if (typeof window === 'undefined') return { success: false, message: "لا يمكن حذف الاعتماد من الخادم."};
  
  const spendings = getSpendings();
  const isAppropriationUsed = spendings.some(s => s.appropriationId === appropriationId);
  if (isAppropriationUsed) {
    return { success: false, message: "لا يمكن حذف هذا الاعتماد لأنه يحتوي على عمليات صرف مسجلة. يجب حذف عمليات الصرف أولاً أو ربطها باعتماد آخر." };
  }

  let appropriations = getAppropriations();
  appropriations = appropriations.filter(a => a.id !== appropriationId);
  localStorage.setItem(APPROPRIATIONS_KEY, JSON.stringify(appropriations));
  return { success: true };
}

// Spendings
export function getSpendings(): Spending[] {
    return getStoredArray(SPENDINGS_KEY, isSpending);
}

export function addSpending(spending: Omit<Spending, 'id'>): Spending {
  if (typeof window === 'undefined') {
     const newSpending = { ...spending, id: crypto.randomUUID() };
    console.warn("addSpending called on server, returning fallback.");
    return newSpending;
  }
  const spendings = getSpendings();
  const newSpendingWithId: Spending = { ...spending, id: crypto.randomUUID() };
  spendings.push(newSpendingWithId);
  localStorage.setItem(SPENDINGS_KEY, JSON.stringify(spendings));
  return newSpendingWithId;
}


// Clear All Data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  try {
    ALL_APP_DATA_KEYS.forEach(key => localStorage.removeItem(key));
    localStorage.removeItem(APP_THEME_KEY); // Clear theme separately
    // Clear any reminder sent flags
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('reminder_sent_')) {
            localStorage.removeItem(key);
        }
    });
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
        if ([TRANSACTIONS_KEY, PARTIES_KEY, EQUIPMENT_DEFINITIONS_KEY, NOTIFICATIONS_KEY, CALENDAR_EVENTS_KEY, VEHICLES_KEY, APPROPRIATIONS_KEY, SPENDINGS_KEY].includes(key)) {
          appData[key] = [];
        } else if ([EQUIPMENT_SETTINGS_KEY, PARTY_EMPLOYEES_KEY, FIXED_FURNITURE_KEY].includes(key)) {
           appData[key] = {};
        } else {
          appData[key] = null;
        }
      }
    } catch (error) {
      console.error(`Error reading ${key} from localStorage during export:`, error);
      appData[key] = null;
    }
  });
  // Handle theme separately as it's a direct string
  appData[APP_THEME_KEY] = localStorage.getItem(APP_THEME_KEY) || 'default';


  const jsonString = JSON.stringify(appData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19);
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

        let allKeysPresent = true;
        for (const key of ALL_APP_DATA_KEYS) {
          if (!Object.prototype.hasOwnProperty.call(importedData, key)) {
            if ([EQUIPMENT_SETTINGS_KEY, PARTY_EMPLOYEES_KEY, FIXED_FURNITURE_KEY].includes(key) && importedData[key] === undefined) {
                console.warn(`Key ${key} missing in import file, will default to empty object.`);
                importedData[key] = {};
            } else if ([NOTIFICATIONS_KEY, CALENDAR_EVENTS_KEY, VEHICLES_KEY, APPROPRIATIONS_KEY, SPENDINGS_KEY].includes(key) && importedData[key] === undefined) {
                 console.warn(`Key ${key} missing in import file, will default to empty array.`);
                importedData[key] = [];
            }
            else if (!Object.prototype.hasOwnProperty.call(importedData, key)){
                 allKeysPresent = false;
                 console.error(`Critical key ${key} is missing in import file.`);
                 break;
            }
          }
        }
         // Check for theme key specifically
        if (!Object.prototype.hasOwnProperty.call(importedData, APP_THEME_KEY)) {
            console.warn(`Theme key ${APP_THEME_KEY} missing in import file, will default to 'default'.`);
            importedData[APP_THEME_KEY] = 'default';
        }


        if (!allKeysPresent) {
          resolve({ success: false, message: "ملف البيانات غير صالح أو لا يحتوي على جميع الأقسام المطلوبة." });
          return;
        }

        clearAllData();

        ALL_APP_DATA_KEYS.forEach(key => {
           if (importedData[key] !== undefined && importedData[key] !== null) {
            localStorage.setItem(key, JSON.stringify(importedData[key]));
          } else {
            if ([TRANSACTIONS_KEY, PARTIES_KEY, EQUIPMENT_DEFINITIONS_KEY, NOTIFICATIONS_KEY, CALENDAR_EVENTS_KEY, VEHICLES_KEY, APPROPRIATIONS_KEY, SPENDINGS_KEY].includes(key)) {
              localStorage.setItem(key, JSON.stringify([]));
            } else if ([EQUIPMENT_SETTINGS_KEY, PARTY_EMPLOYEES_KEY, FIXED_FURNITURE_KEY].includes(key)) {
              localStorage.setItem(key, JSON.stringify({}));
            } else {
              localStorage.removeItem(key);
            }
          }
        });
        // Handle theme separately
        if (importedData[APP_THEME_KEY] && typeof importedData[APP_THEME_KEY] === 'string') {
            localStorage.setItem(APP_THEME_KEY, importedData[APP_THEME_KEY]);
        } else {
            localStorage.setItem(APP_THEME_KEY, 'default');
        }

        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('reminder_sent_')) {
                localStorage.removeItem(k);
            }
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

