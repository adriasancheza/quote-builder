import { describe, expect, it } from 'vitest';
import { backupFileName, parseBackup, serializeBackup, validateData } from './backup';
import { createSeedData } from './seed';

const seed = createSeedData('2026-03-10', '2026-03-10T09:00:00.000Z');

describe('backup round-trip', () => {
  it('serialises and parses back to identical data', () => {
    const text = serializeBackup(seed, '2026-03-10T10:00:00.000Z');
    expect(parseBackup(text)).toEqual({ ok: true, data: seed });
  });

  it('accepts raw AppData without the backup envelope', () => {
    expect(validateData(JSON.parse(JSON.stringify(seed)))).toEqual({ ok: true, data: seed });
  });

  it('names files with the date', () => {
    expect(backupFileName('2026-03-10')).toBe('quote-builder-backup-2026-03-10.json');
  });
});

describe('backup validation', () => {
  const clone = () => JSON.parse(JSON.stringify(seed)) as Record<string, unknown> & typeof seed;

  it('rejects invalid JSON', () => {
    expect(parseBackup('{nope')).toEqual({ ok: false, error: 'El archivo no es un JSON válido.' });
  });

  it('rejects unknown versions and shapes', () => {
    expect(validateData({ ...clone(), version: 99 }).ok).toBe(false);
    expect(validateData([]).ok).toBe(false);
    expect(validateData({ ...clone(), quotes: 'x' }).ok).toBe(false);
  });

  it('rejects invalid VAT rates, statuses and dates', () => {
    const badVat = clone();
    (badVat.quotes[0]!.items[0] as { vatRate: number }).vatRate = 7;
    const vatResult = validateData(badVat);
    expect(vatResult.ok).toBe(false);
    expect(!vatResult.ok && vatResult.error).toContain('IVA');

    const badStatus = clone();
    (badStatus.quotes[0] as { status: string }).status = 'paid';
    expect(validateData(badStatus).ok).toBe(false);

    const badDate = clone();
    badDate.quotes[0]!.issueDate = '10/03/2026';
    expect(validateData(badDate).ok).toBe(false);
  });

  it('rejects non-image logos', () => {
    const data = clone();
    (data.company as { logoDataUrl: string }).logoDataUrl = 'javascript:alert(1)';
    expect(validateData(data).ok).toBe(false);
  });

  it('rejects duplicate ids', () => {
    const data = clone();
    data.clients.push({ ...data.clients[0]! });
    expect(validateData(data).ok).toBe(false);
  });

  it('drops dangling client references instead of failing', () => {
    const data = clone();
    data.clients = [];
    const result = validateData(data);
    expect(result.ok && result.data.quotes[0]?.clientId).toBeNull();
  });
});
