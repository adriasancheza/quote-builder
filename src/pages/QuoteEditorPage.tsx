import { useId, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { LineItemsEditor } from '../components/LineItemsEditor';
import { QuoteDocument } from '../components/QuoteDocument';
import { StatusBadge } from '../components/StatusBadge';
import { TotalsSummary } from '../components/TotalsSummary';
import { navigate } from '../hooks/useRoute';
import { printQuote } from '../utils/print';
import { calculateTotals } from '../lib/calculations';
import { createId } from '../lib/id';
import { STATUS_LABELS, createLineItem } from '../lib/quotes';
import { paths } from '../lib/routes';
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from '../lib/types';
import { useAppActions, useAppState } from '../store/context';
import styles from './QuoteEditorPage.module.css';

type View = 'edit' | 'preview';

export function QuoteEditorPage({ id }: { id: string }) {
  const { data } = useAppState();
  const actions = useAppActions();
  const quote = data.quotes.find((q) => q.id === id);

  if (!quote) {
    return (
      <EmptyState
        icon="quote"
        title="Presupuesto no encontrado"
        description="Puede que se haya eliminado o que el enlace no sea correcto."
        action={
          <a className="btn btn-primary" href={paths.quotes()}>
            Volver a presupuestos
          </a>
        }
      />
    );
  }

  return <Editor quote={quote} data={data} actions={actions} />;
}

interface EditorProps {
  quote: Quote;
  data: ReturnType<typeof useAppState>['data'];
  actions: ReturnType<typeof useAppActions>;
}

function Editor({ quote, data, actions }: EditorProps) {
  const [view, setView] = useState<View>('edit');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const uid = useId();
  const totals = useMemo(() => calculateTotals(quote.items), [quote.items]);
  const client = data.clients.find((c) => c.id === quote.clientId) ?? null;
  const dateError =
    quote.validUntil && quote.issueDate && quote.validUntil < quote.issueDate
      ? 'La validez no puede ser anterior a la fecha del presupuesto.'
      : null;

  const update = (patch: Partial<Quote>) => actions.saveQuote({ ...quote, ...patch });

  const sortedClients = useMemo(
    () => [...data.clients].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [data.clients],
  );

  return (
    <div className={`page ${styles.page}`}>
      <div className={`${styles.toolbar} no-print`}>
        <div className={styles.heading}>
          <a className={`btn btn-ghost btn-sm ${styles.back}`} href={paths.quotes()}>
            <Icon name="arrowLeft" />
            Presupuestos
          </a>
          <div className={styles.titleRow}>
            <h1 className="page-title">Presupuesto {quote.number}</h1>
            <StatusBadge status={quote.status} />
          </div>
          <p className="page-subtitle">Los cambios se guardan automáticamente.</p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => printQuote(quote, client)}
            title="Abre el diálogo de impresión: elige «Guardar como PDF»"
          >
            <Icon name="download" />
            Descargar PDF
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              const copy = actions.duplicateQuote(quote.id);
              if (copy) navigate(paths.quote(copy.id));
            }}
          >
            <Icon name="copy" />
            Duplicar
          </button>
          <button
            type="button"
            className="btn btn-ghost-danger"
            onClick={() => setConfirmDelete(true)}
          >
            <Icon name="trash" />
            Eliminar
          </button>
        </div>
      </div>

      <div className={`${styles.switcher} no-print`} role="group" aria-label="Modo de vista">
        <button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}>
          <Icon name="edit" />
          Editar
        </button>
        <button type="button" aria-pressed={view === 'preview'} onClick={() => setView('preview')}>
          <Icon name="eye" />
          Vista previa
        </button>
      </div>

      <div className={styles.layout} data-view={view} data-print="layout">
        <div className={`${styles.editor} no-print`}>
          <section className="card card-body" aria-labelledby={`${uid}-general`}>
            <h2 id={`${uid}-general`} className="card-title">
              Datos generales
            </h2>
            <div className="form-grid">
              <div className="field span-2">
                <label className="field-label" htmlFor={`${uid}-client`}>
                  Cliente
                </label>
                <select
                  id={`${uid}-client`}
                  className="select"
                  value={quote.clientId ?? ''}
                  onChange={(e) => update({ clientId: e.target.value || null })}
                >
                  <option value="">Sin cliente asignado</option>
                  {sortedClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {data.clients.length === 0 && (
                  <span className="field-hint">
                    Aún no tienes clientes. <a href={paths.clients()}>Crea uno</a> para asignarlo.
                  </span>
                )}
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${uid}-issue`}>
                  Fecha
                </label>
                <input
                  id={`${uid}-issue`}
                  type="date"
                  className="input"
                  value={quote.issueDate}
                  onChange={(e) => e.target.value && update({ issueDate: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${uid}-valid`}>
                  Válido hasta
                </label>
                <input
                  id={`${uid}-valid`}
                  type="date"
                  className="input"
                  value={quote.validUntil}
                  min={quote.issueDate}
                  onChange={(e) => e.target.value && update({ validUntil: e.target.value })}
                  aria-invalid={!!dateError}
                  aria-describedby={dateError ? `${uid}-valid-error` : undefined}
                  required
                />
                {dateError && (
                  <span id={`${uid}-valid-error`} className="field-error">
                    {dateError}
                  </span>
                )}
              </div>
              <div className="field">
                <label className="field-label" htmlFor={`${uid}-status`}>
                  Estado
                </label>
                <select
                  id={`${uid}-status`}
                  className="select"
                  value={quote.status}
                  onChange={(e) => update({ status: e.target.value as QuoteStatus })}
                >
                  {QUOTE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <span className="field-label">Número</span>
                <span className={styles.readonly}>{quote.number}</span>
              </div>
            </div>
          </section>

          <section className="card card-body" aria-labelledby={`${uid}-items`}>
            <h2 id={`${uid}-items`} className="card-title">
              Conceptos
            </h2>
            <LineItemsEditor
              items={quote.items}
              onChange={(items) => update({ items })}
              onAdd={() => {
                const last = quote.items[quote.items.length - 1];
                update({ items: [...quote.items, createLineItem(createId, last?.vatRate)] });
              }}
            />
            <TotalsSummary totals={totals} />
          </section>

          <section className="card card-body" aria-labelledby={`${uid}-notes`}>
            <h2 id={`${uid}-notes`} className="card-title">
              <label htmlFor={`${uid}-notes-input`}>Notas y condiciones</label>
            </h2>
            <textarea
              id={`${uid}-notes-input`}
              className="textarea"
              rows={4}
              value={quote.notes}
              placeholder="Forma de pago, plazos de entrega, garantías…"
              onChange={(e) => update({ notes: e.target.value })}
            />
          </section>
        </div>

        <aside
          className={styles.preview}
          aria-label="Vista previa del documento"
          data-print="document"
        >
          <p className={`${styles.printHint} no-print`}>
            <Icon name="download" />
            Para guardar el PDF, elige «Guardar como PDF» en el diálogo de impresión.
          </p>
          <div className={styles.previewFrame} data-print="frame">
            <QuoteDocument quote={quote} company={data.company} client={client} />
          </div>
        </aside>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="¿Eliminar presupuesto?"
          message={`Se eliminará el presupuesto ${quote.number}. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar presupuesto"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            actions.deleteQuote(quote.id);
            navigate(paths.quotes());
          }}
        />
      )}
    </div>
  );
}
