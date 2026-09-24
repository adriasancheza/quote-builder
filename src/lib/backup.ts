import { isISODate } from './dates';
import {
  DATA_VERSION,
  QUOTE_STATUSES,
  VAT_RATES,
  type AppData,
  type Client,
  type CompanyProfile,
  type LineItem,
  type Quote,
} from './types';

export const BACKUP_APP_ID = 'quote-builder';

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  exportedAt: string;
  data: AppData;
}

export type ParseResult = { ok: true; data: AppData } | { ok: false; error: string };

type UnknownRecord = Record<string, unknown>;

const isRecord = (v: unknown): v is UnknownRecord =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === 'string';
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

class ValidationError extends Error {}

function fail(message: string): never {
  throw new ValidationError(message);
}

function str(obj: UnknownRecord, key: string, where: string): string {
  const value = obj[key];
  if (value === undefined || value === null) return '';
  if (!isString(value)) fail(`${where}: el campo «${key}» debe ser texto.`);
  return value;
}

function readCompany(value: unknown): CompanyProfile {
  if (!isRecord(value)) fail('Falta el perfil de empresa.');
  const logo = value.logoDataUrl;
  if (logo !== null && logo !== undefined && !(isString(logo) && logo.startsWith('data:image/'))) {
    fail('Empresa: el logotipo debe ser una imagen en formato data URL.');
  }
  return {
    name: str(value, 'name', 'Empresa'),
    taxId: str(value, 'taxId', 'Empresa'),
    address: str(value, 'address', 'Empresa'),
    email: str(value, 'email', 'Empresa'),
    phone: str(value, 'phone', 'Empresa'),
    logoDataUrl: isString(logo) ? logo : null,
  };
}

function readId(obj: UnknownRecord, where: string): string {
  const id = obj.id;
  if (!isString(id) || id.length === 0) fail(`${where}: falta el identificador.`);
  return id;
}

function readClient(value: unknown, index: number): Client {
  const where = `Cliente ${index + 1}`;
  if (!isRecord(value)) fail(`${where}: formato no válido.`);
  return {
    id: readId(value, where),
    name: str(value, 'name', where),
    taxId: str(value, 'taxId', where),
    email: str(value, 'email', where),
    phone: str(value, 'phone', where),
    address: str(value, 'address', where),
  };
}

function readItem(value: unknown, where: string): LineItem {
  if (!isRecord(value)) fail(`${where}: línea con formato no válido.`);
  const { quantity, unitPrice, discount, vatRate } = value;
  if (!isFiniteNumber(quantity) || !isFiniteNumber(unitPrice) || !isFiniteNumber(discount)) {
    fail(`${where}: cantidad, precio y descuento deben ser números.`);
  }
  if (!VAT_RATES.includes(vatRate as never)) fail(`${where}: tipo de IVA no válido.`);
  return {
    id: readId(value, where),
    description: str(value, 'description', where),
    quantity,
    unitPrice,
    discount,
    vatRate: vatRate as LineItem['vatRate'],
  };
}

function readQuote(value: unknown, index: number): Quote {
  let where = `Presupuesto ${index + 1}`;
  if (!isRecord(value)) fail(`${where}: formato no válido.`);
  const number = str(value, 'number', where);
  if (!number) fail(`${where}: falta el número.`);
  where = `Presupuesto ${number}`;
  if (!QUOTE_STATUSES.includes(value.status as never)) fail(`${where}: estado no válido.`);
  if (!isISODate(value.issueDate) || !isISODate(value.validUntil)) {
    fail(`${where}: las fechas deben tener el formato AAAA-MM-DD.`);
  }
  if (value.clientId !== null && value.clientId !== undefined && !isString(value.clientId)) {
    fail(`${where}: cliente no válido.`);
  }
  if (!Array.isArray(value.items)) fail(`${where}: faltan las líneas.`);
  return {
    id: readId(value, where),
    number,
    clientId: isString(value.clientId) ? value.clientId : null,
    status: value.status as Quote['status'],
    issueDate: value.issueDate,
    validUntil: value.validUntil,
    items: value.items.map((item) => readItem(item, where)),
    notes: str(value, 'notes', where),
    createdAt: str(value, 'createdAt', where),
    updatedAt: str(value, 'updatedAt', where),
  };
}

/** Validates unknown input and returns a well-formed `AppData`, or throws. */
function readAppData(value: unknown): AppData {
  if (!isRecord(value)) fail('El archivo no contiene datos válidos.');
  if (value.version !== DATA_VERSION) fail('Versión de datos no compatible.');
  if (!Array.isArray(value.clients) || !Array.isArray(value.quotes)) {
    fail('Faltan las listas de clientes o presupuestos.');
  }
  const clients = value.clients.map(readClient);
  const quotes = value.quotes.map(readQuote);

  const clientIds = new Set(clients.map((c) => c.id));
  if (clientIds.size !== clients.length) fail('Hay clientes con identificadores duplicados.');
  if (new Set(quotes.map((q) => q.id)).size !== quotes.length) {
    fail('Hay presupuestos con identificadores duplicados.');
  }

  return {
    version: DATA_VERSION,
    company: readCompany(value.company),
    clients,
    // Drop dangling client references instead of rejecting the whole backup.
    quotes: quotes.map((q) =>
      q.clientId && !clientIds.has(q.clientId) ? { ...q, clientId: null } : q,
    ),
  };
}

/** Validates already-parsed JSON (either a backup file or raw `AppData`). */
export function validateData(value: unknown): ParseResult {
  try {
    const payload = isRecord(value) && value.app === BACKUP_APP_ID ? value.data : value;
    return { ok: true, data: readAppData(payload) };
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Parses the text of a backup file. Never throws. */
export function parseBackup(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido.' };
  }
  return validateData(json);
}

export function serializeBackup(data: AppData, exportedAt: string): string {
  const backup: BackupFile = { app: BACKUP_APP_ID, exportedAt, data };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(isoDate: string): string {
  return `quote-builder-backup-${isoDate}.json`;
}
