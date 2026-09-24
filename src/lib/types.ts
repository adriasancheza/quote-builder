/** Domain model. Everything is plain, JSON-serialisable data. */

export const VAT_RATES = [21, 10, 4, 0] as const;
export type VatRate = (typeof VAT_RATES)[number];

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** Discount percentage, 0–100. */
  discount: number;
  vatRate: VatRate;
}

export interface Client {
  id: string;
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
}

export interface CompanyProfile {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  /** Logo stored as a data URL (e.g. `data:image/png;base64,...`), or null. */
  logoDataUrl: string | null;
}

export interface Quote {
  id: string;
  /** Human-readable number, e.g. `2026-0001`. */
  number: string;
  clientId: string | null;
  status: QuoteStatus;
  /** ISO date (YYYY-MM-DD). */
  issueDate: string;
  /** ISO date (YYYY-MM-DD). */
  validUntil: string;
  items: LineItem[];
  notes: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

export const DATA_VERSION = 1;

export interface AppData {
  version: typeof DATA_VERSION;
  company: CompanyProfile;
  clients: Client[];
  quotes: Quote[];
}

export const EMPTY_COMPANY: CompanyProfile = {
  name: '',
  taxId: '',
  address: '',
  email: '',
  phone: '',
  logoDataUrl: null,
};

export function createEmptyData(): AppData {
  return { version: DATA_VERSION, company: { ...EMPTY_COMPANY }, clients: [], quotes: [] };
}
