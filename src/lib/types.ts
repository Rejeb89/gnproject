
export interface Transaction {
  id: string; // Unique ID using crypto.randomUUID()
  type: 'receive' | 'dispatch';
  equipmentName: string;
  category?: string; // Optional category for the equipment
  quantity: number;
  party: string; // Sender or Recipient ("الجهة المرسلة" أو "الجهة المتسلمة")
  date: string; // ISO date string
  receiptNumber: string;
  notes?: string;
  withdrawalOfficerName?: string; // Name of the person who withdrew the equipment
  withdrawalOfficerRank?: string; // Rank of the person who withdrew the equipment
}

export interface Equipment {
  name: string;
  category?: string; // Category of the equipment
  quantity: number; // Current stock
}

export interface Party {
  id: string;
  name: string;
}

export interface PartyEmployee {
  id: string; // crypto.randomUUID()
  rank: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

export interface EquipmentSetting {
  lowStockThreshold: number;
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  defaultCategory?: string;
  defaultLowStockThreshold?: number;
  unitOfMeasurement?: string;
}

export interface AppNotification {
  id: string;
  message: string;
  timestamp: string; // ISO date string
  isRead: boolean;
  type: 'low_stock' | 'info' | 'system_update'; // Example types
  link?: string; // Optional link for navigation
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  description?: string;
}
