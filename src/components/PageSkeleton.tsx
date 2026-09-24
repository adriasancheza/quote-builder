import styles from './PageSkeleton.module.css';

/** Placeholder shown while a lazily loaded screen is being fetched. */
export function PageSkeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-live="polite">
      <span className="visually-hidden">Cargando…</span>
      <div className={`${styles.block} ${styles.title}`} />
      <div className={styles.grid}>
        <div className={`${styles.block} ${styles.panel}`} />
        <div className={`${styles.block} ${styles.panel}`} />
      </div>
    </div>
  );
}
