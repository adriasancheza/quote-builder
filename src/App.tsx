import { useEffect } from 'react';
import { AppShell } from './components/AppShell';
import { EmptyState } from './components/EmptyState';
import { useRoute } from './hooks/useRoute';
import { paths, type Route } from './lib/routes';

const TITLES: Record<Route['name'], string> = {
  quotes: 'Presupuestos',
  quote: 'Presupuesto',
  clients: 'Clientes',
  company: 'Empresa',
  data: 'Datos',
  notFound: 'Página no encontrada',
};

export default function App() {
  const route = useRoute();

  useEffect(() => {
    document.title = `${TITLES[route.name]} · Quote Builder`;
  }, [route.name]);

  return (
    <AppShell route={route}>
      {route.name === 'notFound' ? (
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
      ) : (
        <div className="page">
          <h1 className="page-title">{TITLES[route.name]}</h1>
        </div>
      )}
    </AppShell>
  );
}
