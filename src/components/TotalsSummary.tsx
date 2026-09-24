import type { QuoteTotals } from '../lib/calculations';
import { formatCurrency, formatPercent } from '../lib/money';
import styles from './TotalsSummary.module.css';

export function TotalsSummary({ totals }: { totals: QuoteTotals }) {
  return (
    <div className={styles.wrap}>
      {totals.vatBreakdown.length > 0 && (
        <table className={styles.breakdown}>
          <caption className={styles.caption}>Desglose de IVA</caption>
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col">Base</th>
              <th scope="col">Cuota</th>
            </tr>
          </thead>
          <tbody>
            {totals.vatBreakdown.map((row) => (
              <tr key={row.rate}>
                <th scope="row">{formatPercent(row.rate)}</th>
                <td>{formatCurrency(row.base)}</td>
                <td>{formatCurrency(row.vat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <dl className={styles.totals} aria-label="Totales">
        {totals.discount > 0 && (
          <div>
            <dt>Descuentos</dt>
            <dd>−{formatCurrency(totals.discount)}</dd>
          </div>
        )}
        <div>
          <dt>Base imponible</dt>
          <dd>{formatCurrency(totals.base)}</dd>
        </div>
        <div>
          <dt>IVA</dt>
          <dd>{formatCurrency(totals.vat)}</dd>
        </div>
        <div className={styles.total}>
          <dt>Total</dt>
          <dd data-testid="quote-total">{formatCurrency(totals.total)}</dd>
        </div>
      </dl>
    </div>
  );
}
