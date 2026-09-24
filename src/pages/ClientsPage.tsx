import { useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import type { Client } from '../lib/types';
import { useAppActions, useAppState } from '../store/context';
import { ClientFormModal, type ClientDraft } from './ClientFormModal';
import styles from './ClientsPage.module.css';

const EMPTY_CLIENT: ClientDraft = { name: '', taxId: '', email: '', phone: '', address: '' };

const collator = new Intl.Collator('es', { sensitivity: 'base' });

function normalise(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function ClientsPage() {
  const { clients, quotes } = useAppState().data;
  const { saveClient, deleteClient } = useAppActions();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ClientDraft | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const quoteCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const q of quotes) {
      if (q.clientId) counts.set(q.clientId, (counts.get(q.clientId) ?? 0) + 1);
    }
    return counts;
  }, [quotes]);

  const visible = useMemo(() => {
    const q = normalise(query.trim());
    return clients
      .filter((c) => !q || normalise(`${c.name} ${c.taxId} ${c.email}`).includes(q))
      .sort((a, b) => collator.compare(a.name, b.name));
  }, [clients, query]);

  const deletingCount = deleting ? (quoteCount.get(deleting.id) ?? 0) : 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">
            {clients.length === 1 ? '1 cliente' : `${clients.length} clientes`}
          </p>
        </div>
        <div className="page-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setEditing({ ...EMPTY_CLIENT })}
          >
            <Icon name="plus" />
            Nuevo cliente
          </button>
        </div>
      </header>

      {clients.length === 0 ? (
        <EmptyState
          icon="users"
          title="Todavía no tienes clientes"
          description="Añade tus clientes para asignarlos a los presupuestos y no repetir sus datos."
          action={
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setEditing({ ...EMPTY_CLIENT })}
            >
              <Icon name="plus" />
              Añadir el primer cliente
            </button>
          }
        />
      ) : (
        <>
          <div className={styles.search}>
            <Icon name="search" className={styles.searchIcon} />
            <label htmlFor="client-search" className="visually-hidden">
              Buscar clientes
            </label>
            <input
              id="client-search"
              type="search"
              className="input"
              placeholder="Buscar por nombre, NIF o correo"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {visible.length === 0 ? (
            <p className={styles.noResults}>Ningún cliente coincide con «{query}».</p>
          ) : (
            <ul className={styles.list}>
              {visible.map((client) => {
                const count = quoteCount.get(client.id) ?? 0;
                return (
                  <li key={client.id} className={`card ${styles.item}`}>
                    <div className={styles.avatar} aria-hidden="true">
                      {client.name.trim().charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className={styles.info}>
                      <h2 className={styles.name}>{client.name}</h2>
                      <p className={styles.meta}>
                        {[client.taxId, client.email, client.phone].filter(Boolean).join(' · ') ||
                          'Sin datos de contacto'}
                      </p>
                    </div>
                    <span className={styles.count}>
                      {count === 1 ? '1 presupuesto' : `${count} presupuestos`}
                    </span>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => setEditing(client)}
                        aria-label={`Editar ${client.name}`}
                        title="Editar"
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost-danger btn-icon btn-sm"
                        onClick={() => setDeleting(client)}
                        aria-label={`Eliminar ${client.name}`}
                        title="Eliminar"
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {editing && (
        <ClientFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(client) => {
            saveClient(client);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="¿Eliminar cliente?"
          message={
            <>
              Se eliminará <strong>{deleting.name}</strong>.{' '}
              {deletingCount > 0
                ? `Sus ${deletingCount === 1 ? 'presupuesto se conservará' : `${deletingCount} presupuestos se conservarán`} sin cliente asignado.`
                : 'Esta acción no se puede deshacer.'}
            </>
          }
          confirmLabel="Eliminar cliente"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteClient(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
