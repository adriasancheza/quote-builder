import { useEffect, useRef } from 'react';
import { calculateLine } from '../lib/calculations';
import { clamp, formatCurrency, formatPercent } from '../lib/money';
import { VAT_RATES, type LineItem, type VatRate } from '../lib/types';
import { Icon } from './Icon';
import { NumberInput } from './NumberInput';
import styles from './LineItemsEditor.module.css';

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  onAdd: () => void;
}

export function LineItemsEditor({ items, onChange, onAdd }: LineItemsEditorProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const previousCount = useRef(items.length);

  // Move focus to the new line's description after "Add line".
  useEffect(() => {
    if (items.length > previousCount.current) {
      const inputs = listRef.current?.querySelectorAll<HTMLTextAreaElement>('[data-description]');
      inputs?.[inputs.length - 1]?.focus();
    }
    previousCount.current = items.length;
  }, [items.length]);

  function update(id: string, patch: Partial<LineItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className={styles.empty}>
          Este presupuesto no tiene conceptos. Añade al menos una línea.
        </p>
      ) : (
        <ol ref={listRef} className={styles.list}>
          {items.map((item, index) => {
            const n = index + 1;
            const { net } = calculateLine(item);
            return (
              <li key={item.id} className={styles.row}>
                <div className={`${styles.cell} ${styles.description}`}>
                  <label className={styles.label} htmlFor={`desc-${item.id}`}>
                    Descripción<span className="visually-hidden"> (línea {n})</span>
                  </label>
                  <textarea
                    id={`desc-${item.id}`}
                    data-description
                    className="textarea"
                    rows={1}
                    value={item.description}
                    placeholder="Concepto o servicio"
                    onChange={(e) => update(item.id, { description: e.target.value })}
                  />
                </div>
                <div className={styles.cell}>
                  <label className={styles.label} htmlFor={`qty-${item.id}`}>
                    Cantidad<span className="visually-hidden"> (línea {n})</span>
                  </label>
                  <NumberInput
                    id={`qty-${item.id}`}
                    value={item.quantity}
                    allowNegative
                    onValueChange={(quantity) => update(item.id, { quantity })}
                  />
                </div>
                <div className={styles.cell}>
                  <label className={styles.label} htmlFor={`price-${item.id}`}>
                    Precio<span className="visually-hidden"> unitario (línea {n})</span>
                  </label>
                  <NumberInput
                    id={`price-${item.id}`}
                    value={item.unitPrice}
                    allowNegative
                    onValueChange={(unitPrice) => update(item.id, { unitPrice })}
                  />
                </div>
                <div className={styles.cell}>
                  {/* Short visible label; the input carries the full accessible name. */}
                  <span className={styles.label} aria-hidden="true">
                    Dto. %
                  </span>
                  <NumberInput
                    id={`disc-${item.id}`}
                    aria-label={`Descuento % (línea ${n})`}
                    value={item.discount}
                    onValueChange={(discount) =>
                      update(item.id, { discount: clamp(discount, 0, 100) })
                    }
                  />
                </div>
                <div className={styles.cell}>
                  <label className={styles.label} htmlFor={`vat-${item.id}`}>
                    IVA<span className="visually-hidden"> (línea {n})</span>
                  </label>
                  <select
                    id={`vat-${item.id}`}
                    className="select"
                    value={item.vatRate}
                    onChange={(e) =>
                      update(item.id, { vatRate: Number(e.target.value) as VatRate })
                    }
                  >
                    {VAT_RATES.map((rate) => (
                      <option key={rate} value={rate}>
                        {formatPercent(rate)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.cell} ${styles.amount}`}>
                  <span className={styles.label}>Importe</span>
                  <output className="tabular" aria-label={`Importe línea ${n}`}>
                    {formatCurrency(net)}
                  </output>
                </div>
                <div className={styles.remove}>
                  <button
                    type="button"
                    className="btn btn-ghost-danger btn-icon btn-sm"
                    onClick={() => remove(item.id)}
                    aria-label={`Eliminar línea ${n}`}
                    title="Eliminar línea"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <button type="button" className={`btn btn-secondary ${styles.add}`} onClick={onAdd}>
        <Icon name="plus" />
        Añadir línea
      </button>
    </div>
  );
}
