export type Temperature = "dingin" | "hangat" | "panas" | "menyala";

export type Plan = {
  id: string;
  userId: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  status: "planned" | "done" | "skipped";
  createdAt?: string;
  updatedAt?: string;
};

export type VisitProduct = { name: string; qty?: number };

export type Visit = {
  id: string;
  userId: string;
  customerId: string;
  planId?: string;
  dateISO: string;
  temperature: Temperature;
  offered?: VisitProduct[];
  resultNote?: string;
  geo?: { lat: number; lng: number; accuracy?: number };
  locationLink?: string;
  photo?: {
    storagePath: string;
    downloadUrl?: string;
    capturedAtDeviceISO?: string;
    width?: number;
    height?: number;
    verified?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
};
