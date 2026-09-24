import { useId, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import type { Client } from '../lib/types';

export type ClientDraft = Omit<Client, 'id'> & { id?: string };

interface ClientFormModalProps {
  initial: ClientDraft;
  onSave: (client: ClientDraft) => void;
  onClose: () => void;
}

export function ClientFormModal({ initial, onSave, onClose }: ClientFormModalProps) {
  const [draft, setDraft] = useState<ClientDraft>(initial);
  const [showErrors, setShowErrors] = useState(false);
  const id = useId();
  const formId = `${id}-form`;
  const nameError = draft.name.trim() === '' ? 'El nombre es obligatorio.' : null;

  const set = (key: keyof Omit<Client, 'id'>, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (nameError) {
      setShowErrors(true);
      document.getElementById(`${id}-name`)?.focus();
      return;
    }
    onSave({
      ...draft,
      name: draft.name.trim(),
      taxId: draft.taxId.trim().toUpperCase(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      address: draft.address.trim(),
    });
  }

  return (
    <Modal
      title={initial.id ? 'Editar cliente' : 'Nuevo cliente'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form={formId} className="btn btn-primary">
            {initial.id ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </>
      }
    >
      <form id={formId} className="form-grid" onSubmit={onSubmit} noValidate>
        <div className="field span-2">
          <label className="field-label" htmlFor={`${id}-name`}>
            Nombre o razón social *
          </label>
          <input
            id={`${id}-name`}
            className="input"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={showErrors && !!nameError}
            aria-describedby={showErrors && nameError ? `${id}-name-error` : undefined}
            required
            data-autofocus
          />
          {showErrors && nameError && (
            <span id={`${id}-name-error`} className="field-error">
              {nameError}
            </span>
          )}
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${id}-tax`}>
            NIF / CIF
          </label>
          <input
            id={`${id}-tax`}
            className="input"
            value={draft.taxId}
            onChange={(e) => set('taxId', e.target.value)}
            spellCheck={false}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`${id}-phone`}>
            Teléfono
          </label>
          <input
            id={`${id}-phone`}
            className="input"
            type="tel"
            value={draft.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>
        <div className="field span-2">
          <label className="field-label" htmlFor={`${id}-email`}>
            Correo electrónico
          </label>
          <input
            id={`${id}-email`}
            className="input"
            type="email"
            value={draft.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
        <div className="field span-2">
          <label className="field-label" htmlFor={`${id}-address`}>
            Dirección
          </label>
          <textarea
            id={`${id}-address`}
            className="textarea"
            rows={3}
            value={draft.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
