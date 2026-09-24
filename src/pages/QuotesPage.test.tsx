import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithStore } from '../test/renderWithStore';
import { QuotesPage } from './QuotesPage';

describe('QuotesPage', () => {
  it('lists the seeded example quote with its total', () => {
    renderWithStore(<QuotesPage />);
    const item = screen.getByRole('link', { name: /2026-0001/ }).closest('li')!;
    expect(within(item).getByText('Enviado')).toBeInTheDocument();
    expect(item.textContent?.replace(/\s/g, ' ')).toContain('3389,28 €');
  });

  it('duplicates a quote with the next number', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(<QuotesPage />);
    await user.click(screen.getByRole('button', { name: 'Duplicar presupuesto 2026-0001' }));
    expect(store.getState().data.quotes.map((q) => q.number)).toEqual(['2026-0001', '2026-0002']);
  });

  it('asks for confirmation before deleting, and shows the empty state afterwards', async () => {
    const user = userEvent.setup();
    renderWithStore(<QuotesPage />);

    await user.click(screen.getByRole('button', { name: 'Eliminar presupuesto 2026-0001' }));
    const dialog = screen.getByRole('alertdialog', { name: '¿Eliminar presupuesto?' });
    // Cancel is focused first so Enter never deletes by accident.
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('link', { name: /2026-0001/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar presupuesto 2026-0001' }));
    await user.click(screen.getByRole('button', { name: 'Eliminar presupuesto' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aún no hay presupuestos' })).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    renderWithStore(<QuotesPage />);
    await user.click(screen.getByRole('button', { name: /^Aceptado/ }));
    expect(screen.queryByRole('link', { name: /2026-0001/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Todos/ }));
    expect(screen.getByRole('link', { name: /2026-0001/ })).toBeInTheDocument();
  });
});
