import { calculateLine, calculateTotals } from '../lib/calculations';
import { formatDateLong } from '../lib/dates';
import { formatCurrency, formatPercent } from '../lib/money';
import type { Client, CompanyProfile, Quote } from '../lib/types';
import styles from './QuoteDocument.module.css';

interface QuoteDocumentProps {
  quote: Quote;
  company: CompanyProfile;
  client: Client | null;
}

const qtyFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 });

function Lines({ text }: { text: string }) {
  return (
    <>
      {text
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line, i) => (
          <span key={i} className={styles.line}>
            {line}
          </span>
        ))}
    </>
  );
}

/**
 * The quote as a printable A4 document. Used for the live preview and, via
 * the print stylesheet, for "Download PDF".
 */
export function QuoteDocument({ quote, company, client }: QuoteDocumentProps) {
  const totals = calculateTotals(quote.items);
  const items = quote.items.filter(
    (item) => item.description.trim() !== '' || item.unitPrice !== 0,
  );
  const hasDiscounts = items.some((item) => item.discount > 0);

  return (
    <article className={styles.paper} aria-label={`Documento del presupuesto ${quote.number}`}>
      <header className={styles.header}>
        <div className={styles.company}>
          {company.logoDataUrl && (
            <img className={styles.logo} src={company.logoDataUrl} alt={company.name || 'Logo'} />
          )}
          <p className={styles.companyName}>{company.name || 'Tu empresa'}</p>
          <p className={styles.muted}>
            {company.taxId && <span className={styles.line}>NIF/CIF: {company.taxId}</span>}
            <Lines text={company.address} />
            {company.email && <span className={styles.line}>{company.email}</span>}
            {company.phone && <span className={styles.line}>{company.phone}</span>}
          </p>
        </div>
        <div className={styles.titleBlock}>
          <h2 className={styles.docTitle}>Presupuesto</h2>
          <p className={styles.number}>Nº {quote.number}</p>
          <dl className={styles.meta}>
            <div>
              <dt>Fecha</dt>
              <dd>{formatDateLong(quote.issueDate)}</dd>
            </div>
            <div>
              <dt>Válido hasta</dt>
              <dd>{formatDateLong(quote.validUntil)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <section className={styles.client} aria-label="Cliente">
        <p className={styles.label}>Cliente</p>
        {client ? (
          <>
            <p className={styles.clientName}>{client.name}</p>
            <p className={styles.muted}>
              {client.taxId && <span className={styles.line}>NIF/CIF: {client.taxId}</span>}
              <Lines text={client.address} />
              {client.email && <span className={styles.line}>{client.email}</span>}
              {client.phone && <span className={styles.line}>{client.phone}</span>}
            </p>
          </>
        ) : (
          <p className={styles.muted}>Sin cliente asignado</p>
        )}
      </section>

      <table className={styles.items}>
        <thead>
          <tr>
            <th scope="col" className={styles.descCol}>
              Descripción
            </th>
            <th scope="col" className={styles.num}>
              Cant.
            </th>
            <th scope="col" className={styles.num}>
              Precio
            </th>
            {hasDiscounts && (
              <th scope="col" className={styles.num}>
                Dto.
              </th>
            )}
            <th scope="col" className={styles.num}>
              IVA
            </th>
            <th scope="col" className={styles.num}>
              Importe
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={hasDiscounts ? 6 : 5} className={styles.emptyRow}>
                Añade conceptos para verlos aquí.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td className={styles.descCol}>{item.description || '—'}</td>
                <td className={styles.num}>{qtyFormatter.format(item.quantity)}</td>
                <td className={styles.num}>{formatCurrency(item.unitPrice)}</td>
                {hasDiscounts && (
                  <td className={styles.num}>
                    {item.discount > 0 ? formatPercent(item.discount) : '—'}
                  </td>
                )}
                <td className={styles.num}>{formatPercent(item.vatRate)}</td>
                <td className={styles.num}>{formatCurrency(calculateLine(item).net)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className={styles.summary}>
        <table className={styles.vatTable}>
          <caption className={styles.label}>Desglose de IVA</caption>
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col" className={styles.num}>
                Base
              </th>
              <th scope="col" className={styles.num}>
                Cuota
              </th>
            </tr>
          </thead>
          <tbody>
            {totals.vatBreakdown.length === 0 ? (
              <tr>
                <td colSpan={3} className={styles.muted}>
                  —
                </td>
              </tr>
            ) : (
              totals.vatBreakdown.map((row) => (
                <tr key={row.rate}>
                  <td>IVA {formatPercent(row.rate)}</td>
                  <td className={styles.num}>{formatCurrency(row.base)}</td>
                  <td className={styles.num}>{formatCurrency(row.vat)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <dl className={styles.totals}>
          {totals.discount > 0 && (
            <>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(totals.gross)}</dd>
              </div>
              <div>
                <dt>Descuentos</dt>
                <dd>−{formatCurrency(totals.discount)}</dd>
              </div>
            </>
          )}
          <div>
            <dt>Base imponible</dt>
            <dd>{formatCurrency(totals.base)}</dd>
          </div>
          <div>
            <dt>IVA</dt>
            <dd>{formatCurrency(totals.vat)}</dd>
          </div>
          <div className={styles.grandTotal}>
            <dt>Total</dt>
            <dd>{formatCurrency(totals.total)}</dd>
          </div>
        </dl>
      </div>

      {quote.notes.trim() && (
        <section className={styles.notes} aria-label="Notas y condiciones">
          <p className={styles.label}>Notas y condiciones</p>
          <p className={styles.notesText}>{quote.notes}</p>
        </section>
      )}

      <footer className={styles.footer}>
        Presupuesto válido hasta el {formatDateLong(quote.validUntil)}.
      </footer>
    </article>
  );
}
