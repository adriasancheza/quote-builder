import { Suspense, lazy, useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { EmptyState } from './components/EmptyState';
import { PageSkeleton } from './components/PageSkeleton';
import { StorageNotice } from './components/StorageNotice';
import { useRoute } from './hooks/useRoute';
import { paths, type Route } from './lib/routes';
import { ClientsPage } from './pages/ClientsPage';
import { CompanyPage } from './pages/CompanyPage';
import { DataPage } from './pages/DataPage';
import { QuotesPage } from './pages/QuotesPage';

// The editor (and document preview) is the heaviest screen: load it on demand.
const QuoteEditorPage = lazy(() =>
  import('./pages/QuoteEditorPage').then((m) => ({ default: m.QuoteEditorPage })),
);

const TITLES: Record<Route['name'], string> = {
  quotes: 'Presupuestos',
  quote: 'Presupuesto',
  clients: 'Clientes',
  company: 'Empresa',
  data: 'Datos',
  notFound: 'Página no encontrada',
};

function NotFound() {
  return (
    <EmptyState
      icon="search"
      title="Página no encontrada"
      description="La dirección no corresponde a ninguna sección."
      action={
        <a className="btn btn-primary" href={paths.quotes()}>
          Ir a presupuestos
        </a>
      }
    />
  );
}

function Page({ route }: { route: Route }) {
  switch (route.name) {
    case 'clients':
      return <ClientsPage />;
    case 'company':
      return <CompanyPage />;
    case 'data':
      return <DataPage />;
    case 'notFound':
      return <NotFound />;
    case 'quotes':
      return <QuotesPage />;
    case 'quote':
      return (
        <Suspense fallback={<PageSkeleton />}>
          <QuoteEditorPage key={route.id} id={route.id} />
        </Suspense>
      );
  }
}

export default function App() {
  const route = useRoute();

  useEffect(() => {
    document.title = `${TITLES[route.name]} · Quote Builder`;
  }, [route.name]);

  return (
    <AppShell route={route}>
      <StorageNotice />
      <Page route={route} />
    </AppShell>
  );
}
