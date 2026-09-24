import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { StatusBadge } from '../components/StatusBadge';
import { navigate } from '../hooks/useRoute';
import { calculateTotals } from '../lib/calculations';
import { formatDateShort, isExpired, toISODate } from '../lib/dates';
import { formatCurrency } from '../lib/money';
import { compareQuoteNumbersDesc } from '../lib/numbering';
import { STATUS_LABELS } from '../lib/quotes';
import { paths } from '../lib/routes';
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from '../lib/types';
import { useAppActions, useAppState } from '../store/context';
import styles from './QuotesPage.module.css';

type Filter = QuoteStatus | 'all';

export function QuotesPage() {
  const { data } = useAppState();
  const { createQuote, duplicateQuote, deleteQuote } = useAppActions();
  const [filter, setFilter] = useState<Filter>('all');
  const [deleting, setDeleting] = useState<Quote | null>(null);
  const today = toISODate(new Date());

  const clientNames = useMemo(
    () => new Map(data.clients.map((c) => [c.id, c.name])),
    [data.clients],
  );

  const rows = useMemo(
    () =>
      [...data.quotes]
        .sort((a, b) => compareQuoteNumbersDesc(a.number, b.number))
        .map((quote) => ({ quote, total: calculateTotals(quote.items).total })),
    [data.quotes],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: 0, draft: 0, sent: 0, accepted: 0, rejected: 0 };
    for (const { quote } of rows) {
      c.all += 1;
      c[quote.status] += 1;
    }
    return c;
  }, [rows]);

  const visible = filter === 'all' ? rows : rows.filter((r) => r.quote.status === filter);

  function onCreate() {
    const quote = createQuote();
    navigate(paths.quote(quote.id));
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Presupuestos</h1>
          <p className="page-subtitle">Crea, envía y haz seguimiento de tus presupuestos.</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={onCreate}>
            <Icon name="plus" />
            Nuevo presupuesto
          </button>
        </div>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon="quote"
          title="Aún no hay presupuestos"
          description="Crea tu primer presupuesto: añade conceptos, revisa el total con IVA y descárgalo en PDF."
          action={
            <button type="button" className="btn btn-primary" onClick={onCreate}>
              <Icon name="plus" />
              Crear presupuesto
            </button>
          }
        />
      ) : (
        <>
          <div className={styles.filters} role="group" aria-label="Filtrar por estado">
            {(['all', ...QUOTE_STATUSES] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={styles.chip}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'Todos' : STATUS_LABELS[f]}
                <span className={styles.chipCount}>{counts[f]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className={styles.noResults}>
              No hay presupuestos con estado «{filter === 'all' ? '' : STATUS_LABELS[filter]}».
            </p>
          ) : (
            <ul className={styles.list}>
              {visible.map(({ quote, total }) => {
                const clientName = quote.clientId ? clientNames.get(quote.clientId) : undefined;
                const expired =
                  (quote.status === 'draft' || quote.status === 'sent') &&
                  isExpired(quote.validUntil, today);
                return (
                  <li key={quote.id} className={`card ${styles.item}`}>
                    <a className={styles.link} href={paths.quote(quote.id)}>
                      <span className={styles.number}>{quote.number}</span>
                      <span className={styles.client}>{clientName ?? 'Sin cliente'}</span>
                    </a>
                    <span className={styles.date}>
                      {formatDateShort(quote.issueDate)}
                      {expired && <span className={styles.expired}> · Caducado</span>}
                    </span>
                    <span className={styles.status}>
                      <StatusBadge status={quote.status} />
                    </span>
                    <span className={styles.total}>{formatCurrency(total)}</span>
                    <span className={styles.actions}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => {
                          const copy = duplicateQuote(quote.id);
                          if (copy) navigate(paths.quote(copy.id));
                        }}
                        aria-label={`Duplicar presupuesto ${quote.number}`}
                        title="Duplicar"
                      >
                        <Icon name="copy" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost-danger btn-icon btn-sm"
                        onClick={() => setDeleting(quote)}
                        aria-label={`Eliminar presupuesto ${quote.number}`}
                        title="Eliminar"
                      >
                        <Icon name="trash" />
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {deleting && (
        <ConfirmDialog
          title="¿Eliminar presupuesto?"
          message={`Se eliminará el presupuesto ${deleting.number}. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar presupuesto"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteQuote(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
