import { useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { EmptyState } from './components/EmptyState';
import { StorageNotice } from './components/StorageNotice';
import { useRoute } from './hooks/useRoute';
import { paths, type Route } from './lib/routes';
import { ClientsPage } from './pages/ClientsPage';
import { CompanyPage } from './pages/CompanyPage';
import { DataPage } from './pages/DataPage';

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
    default:
      return (
        <div className="page">
          <h1 className="page-title">{TITLES[route.name]}</h1>
        </div>
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
