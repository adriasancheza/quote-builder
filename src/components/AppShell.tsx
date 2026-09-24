import type { ReactNode } from 'react';
import type { Route } from '../lib/routes';
import { paths } from '../lib/routes';
import { Icon, type IconName } from './Icon';
import styles from './AppShell.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  active: (route: Route) => boolean;
}

const NAV: NavItem[] = [
  {
    label: 'Presupuestos',
    href: paths.quotes(),
    icon: 'quote',
    active: (r) => r.name === 'quotes' || r.name === 'quote',
  },
  { label: 'Clientes', href: paths.clients(), icon: 'users', active: (r) => r.name === 'clients' },
  {
    label: 'Empresa',
    href: paths.company(),
    icon: 'building',
    active: (r) => r.name === 'company',
  },
  { label: 'Datos', href: paths.data(), icon: 'database', active: (r) => r.name === 'data' },
];

interface AppShellProps {
  route: Route;
  children: ReactNode;
}

export function AppShell({ route, children }: AppShellProps) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Saltar al contenido
      </a>
      <header className={`${styles.header} no-print`}>
        <div className={styles.headerInner}>
          <a className={styles.brand} href={paths.quotes()}>
            <span className={styles.brandMark} aria-hidden="true">
              <Icon name="quote" size={18} />
            </span>
            <span className={styles.brandName}>Quote Builder</span>
          </a>
          <nav className={styles.nav} aria-label="Principal">
            <ul className={styles.navList}>
              {NAV.map((item) => {
                const isActive = item.active(route);
                return (
                  <li key={item.href}>
                    <a
                      className={styles.navLink}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon name={item.icon} />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>
      <footer className={`${styles.footer} no-print`}>
        Tus datos se guardan solo en este navegador.{' '}
        <a href={paths.data()}>Haz una copia de seguridad</a> de vez en cuando.
      </footer>
    </div>
  );
}
