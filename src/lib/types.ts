
export interface Transaction {
  id: string; // Unique ID using crypto.randomUUID()
  type: 'receive' | 'dispatch';
  equipmentName: string;
  category?: string; // Optional category for the equipment
  quantity: number;
  party: string; // Sender or Recipient ("الجهة المرسلة" أو "الجهة المستلمة")
  date: string; // ISO date string
  receiptNumber: string;
  notes?: string;
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

export interface EquipmentSetting {
  lowStockThreshold: number;
}
