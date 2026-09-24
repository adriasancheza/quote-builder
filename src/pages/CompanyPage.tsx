import { useId, useRef, useState, type FormEvent } from 'react';
import { Icon } from '../components/Icon';
import type { CompanyProfile } from '../lib/types';
import { useAppActions, useAppState } from '../store/context';
import { readFileAsDataURL } from '../utils/files';
import styles from './CompanyPage.module.css';

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_LOGO_BYTES = 400 * 1024;

type Status = { tone: 'success' | 'error'; message: string } | null;

export function CompanyPage() {
  const { company } = useAppState().data;
  const { updateCompany } = useAppActions();
  const [draft, setDraft] = useState<CompanyProfile>(company);
  const [status, setStatus] = useState<Status>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useId();

  const isDirty = JSON.stringify(draft) !== JSON.stringify(company);

  function set<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    setStatus(null);
  }

  async function onLogoSelected(file: File | undefined) {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type)) {
      setStatus({ tone: 'error', message: 'El logotipo debe ser PNG, JPG, WebP o SVG.' });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setStatus({
        tone: 'error',
        message: 'El logotipo supera 400 KB. Usa una versión más ligera.',
      });
      return;
    }
    setLoadingLogo(true);
    try {
      set('logoDataUrl', await readFileAsDataURL(file));
    } catch {
      setStatus({ tone: 'error', message: 'No se pudo leer la imagen.' });
    } finally {
      setLoadingLogo(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed: CompanyProfile = {
      ...draft,
      name: draft.name.trim(),
      taxId: draft.taxId.trim().toUpperCase(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      address: draft.address.trim(),
    };
    updateCompany(trimmed);
    setDraft(trimmed);
    setStatus({ tone: 'success', message: 'Datos de empresa guardados.' });
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Empresa</h1>
          <p className="page-subtitle">Estos datos aparecen en la cabecera de tus presupuestos.</p>
        </div>
      </header>

      <form className={`card ${styles.card}`} onSubmit={onSubmit} noValidate>
        <div className="card-body">
          <section className={styles.logoSection} aria-labelledby={`${id}-logo`}>
            <div className={styles.logoPreview}>
              {draft.logoDataUrl ? (
                <img src={draft.logoDataUrl} alt="Logotipo actual" />
              ) : (
                <Icon name="image" size={28} />
              )}
            </div>
            <div className={styles.logoInfo}>
              <h2 id={`${id}-logo`} className={styles.logoTitle}>
                Logotipo
              </h2>
              <p className="field-hint">PNG, JPG, WebP o SVG · máx. 400 KB</p>
              <div className={styles.logoActions}>
                <input
                  ref={fileInput}
                  id={`${id}-logo-input`}
                  type="file"
                  accept={LOGO_TYPES.join(',')}
                  className="visually-hidden"
                  onChange={(e) => void onLogoSelected(e.target.files?.[0])}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInput.current?.click()}
                  disabled={loadingLogo}
                  aria-busy={loadingLogo}
                >
                  <Icon name="upload" />
                  {loadingLogo ? 'Cargando…' : draft.logoDataUrl ? 'Cambiar' : 'Subir logotipo'}
                </button>
                {draft.logoDataUrl && (
                  <button
                    type="button"
                    className="btn btn-ghost-danger btn-sm"
                    onClick={() => set('logoDataUrl', null)}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="form-grid">
            <div className="field span-2">
              <label className="field-label" htmlFor={`${id}-name`}>
                Nombre o razón social
              </label>
              <input
                id={`${id}-name`}
                className="input"
                value={draft.name}
                onChange={(e) => set('name', e.target.value)}
                autoComplete="organization"
              />
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
                autoCapitalize="characters"
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
                autoComplete="tel"
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
                autoComplete="email"
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
                autoComplete="street-address"
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <p role="status" aria-live="polite" className={styles.status}>
            {status && <span className={`notice notice-${status.tone}`}>{status.message}</span>}
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setDraft(company);
                setStatus(null);
              }}
              disabled={!isDirty}
            >
              Descartar cambios
            </button>
            <button type="submit" className="btn btn-primary" disabled={!isDirty}>
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
