import { useAppState } from '../store/context';

/** Surfaces persistence problems (quota exceeded, corrupt data recovered…). */
export function StorageNotice() {
  const { saveError, loadNotice } = useAppState();
  if (!saveError && !loadNotice) return null;
  return (
    <div
      className="no-print"
      style={{ display: 'grid', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}
    >
      {saveError && (
        <p role="alert" className="notice notice-error">
          {saveError}
        </p>
      )}
      {loadNotice && (
        <p role="status" className="notice notice-error">
          {loadNotice}
        </p>
      )}
    </div>
  );
}
