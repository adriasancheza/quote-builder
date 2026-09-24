import { STATUS_LABELS } from '../lib/quotes';
import type { QuoteStatus } from '../lib/types';
import styles from './StatusBadge.module.css';

export function StatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
