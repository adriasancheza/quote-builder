import { useRef, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';
import { backupFileName, parseBackup, serializeBackup } from '../lib/backup';
import { toISODate } from '../lib/dates';
import type { AppData } from '../lib/types';
import { useAppActions, useAppState } from '../store/context';
import { downloadTextFile, readFileAsText } from '../utils/files';
import styles from './DataPage.module.css';

type Status = { tone: 'success' | 'error'; message: string } | null;

function summary(data: AppData) {
  const q = data.quotes.length;
  const c = data.clients.length;
  return `${q} ${q === 1 ? 'presupuesto' : 'presupuestos'} y ${c} ${c === 1 ? 'cliente' : 'clientes'}`;
}

export function DataPage() {
  const { data } = useAppState();
  const { replaceData } = useAppActions();
  const [status, setStatus] = useState<Status>(null);
  const [pending, setPending] = useState<AppData | null>(null);
  const [reading, setReading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function onExport() {
    const now = new Date();
    downloadTextFile(
      backupFileName(toISODate(now)),
      serializeBackup(data, now.toISOString()),
      'application/json',
    );
    setStatus({ tone: 'success', message: `Copia descargada: ${summary(data)}.` });
  }

  async function onFileSelected(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setStatus(null);
    try {
      const result = parseBackup(await readFileAsText(file));
      if (result.ok) setPending(result.data);
      else setStatus({ tone: 'error', message: `No se puede importar: ${result.error}` });
    } catch {
      setStatus({ tone: 'error', message: 'No se pudo leer el archivo seleccionado.' });
    } finally {
      setReading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Datos</h1>
          <p className="page-subtitle">
            Todo se guarda en este navegador. Exporta una copia para no perder nada o para pasarla a
            otro equipo.
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        <section className="card card-body" aria-labelledby="export-title">
          <span className={styles.icon}>
            <Icon name="download" size={20} />
          </span>
          <h2 id="export-title" className="card-title">
            Exportar copia de seguridad
          </h2>
          <p className="card-description">
            Descarga un archivo JSON con la empresa, los clientes y los presupuestos (
            {summary(data)}).
          </p>
          <button type="button" className={`btn btn-primary ${styles.action}`} onClick={onExport}>
            <Icon name="download" />
            Descargar JSON
          </button>
        </section>

        <section className="card card-body" aria-labelledby="import-title">
          <span className={styles.icon}>
            <Icon name="upload" size={20} />
          </span>
          <h2 id="import-title" className="card-title">
            Restaurar copia
          </h2>
          <p className="card-description">
            Sustituye todos los datos actuales por los del archivo. Se valida antes de aplicar nada.
          </p>
          <input
            ref={fileInput}
            id="import-file"
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => void onFileSelected(e.target.files?.[0])}
          />
          <button
            type="button"
            className={`btn btn-secondary ${styles.action}`}
            onClick={() => fileInput.current?.click()}
            disabled={reading}
            aria-busy={reading}
          >
            <Icon name="upload" />
            {reading ? 'Leyendo archivo…' : 'Elegir archivo JSON'}
          </button>
        </section>
      </div>

      <div role="status" aria-live="polite">
        {status && <p className={`notice notice-${status.tone}`}>{status.message}</p>}
      </div>

      {pending && (
        <ConfirmDialog
          title="¿Reemplazar todos los datos?"
          message={`El archivo contiene ${summary(pending)}. Los datos actuales (${summary(data)}) se sustituirán. Te recomendamos exportar una copia antes.`}
          confirmLabel="Reemplazar datos"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            replaceData(pending);
            setStatus({ tone: 'success', message: `Datos restaurados: ${summary(pending)}.` });
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
