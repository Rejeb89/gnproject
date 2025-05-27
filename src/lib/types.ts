
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
  type: 'low_stock' | 'info' | 'system_update' | 'event_reminder'; // Added event_reminder
  link?: string; // Optional link for navigation
  eventId?: string; // To link notification to a specific event
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  description?: string;
  reminderValue?: number;
  reminderUnit?: 'none' | 'days' | 'hours' | 'weeks';
}

export interface FuelEntry {
  id: string; // Unique ID for the entry
  date: string; // ISO date string
  odometerReading: number;
  litersFilled: number;
  costPerLiter?: number;
  totalCost: number;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string; // Unique ID for the record
  date: string; // ISO date string
  type: string; // e.g., "تغيير زيت", "فحص دوري"
  odometerReading?: number; // Optional odometer reading
  cost?: number;
  description: string;
  nextDueDate?: string; // ISO date string
  nextDueOdometer?: number;
  notes?: string;
}

export interface Vehicle {
  id: string;
  type: string; // e.g., 'سيارة خفيفة', 'شاحنة'
  registrationNumber: string; // الرقم المنجمي
  owningParty: string; // الجهة التابعة لها (اسم الجهة)
  fuelAllowanceLiters?: number; // مقرر المحروقات باللتر
  status?: 'available' | 'on_mission' | 'maintenance'; // (للتطوير المستقبلي)
  fuelEntries: FuelEntry[]; // Changed to non-optional, initialized as empty array
  maintenanceRecords: MaintenanceRecord[]; // Changed to non-optional, initialized as empty array
}

export interface FixedFurnitureItem {
  id: string; // crypto.randomUUID()
  equipmentType: string;
  quantity: number;
  administrativeNumbering?: string;
  serialNumber?: string;
  location?: string;
  status?: string; // e.g., 'جيد', 'متوسط', 'تالف'
}

export interface Appropriation {
  id: string;
  name: string;
  allocatedAmount: number;
  description?: string;
}

export interface Spending {
  id: string;
  appropriationId: string;
  spentAmount: number;
  spendingDate: string; // ISO Date String
  description?: string;
  supplier?: string; // اسم المزود
  supplyRequestNumber?: string;
  supplyRequestDate?: string; // ISO Date String
  supplyRequestFileName?: string;
  invoiceNumber?: string;
  invoiceDate?: string; // ISO Date String
  invoiceFileName?: string;
}
