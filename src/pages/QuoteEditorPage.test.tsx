import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithStore } from '../test/renderWithStore';
import { QuoteEditorPage } from './QuoteEditorPage';

// Intl uses no-break spaces in currency output.
const text = (el: HTMLElement) => el.textContent?.replace(/\s/g, ' ');

function renderEditor() {
  const utils = renderWithStore(<QuoteEditorPage id="placeholder" />);
  const quote = utils.store.actions.createQuote();
  utils.rerender(<QuoteEditorPage id={quote.id} />);
  return { ...utils, quote };
}

describe('QuoteEditorPage', () => {
  it('shows a not-found state for an unknown quote', () => {
    renderWithStore(<QuoteEditorPage id="missing" />);
    expect(screen.getByRole('heading', { name: 'Presupuesto no encontrado' })).toBeInTheDocument();
  });

  it('adds a line item and focuses its description', async () => {
    const user = userEvent.setup();
    const { store, quote } = renderEditor();
    expect(screen.getAllByLabelText(/^Descripción \(línea/)).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Añadir línea' }));

    const descriptions = screen.getAllByLabelText(/^Descripción \(línea/);
    expect(descriptions).toHaveLength(2);
    expect(descriptions[1]).toHaveFocus();
    const saved = store.getState().data.quotes.find((q) => q.id === quote.id);
    expect(saved?.items).toHaveLength(2);
  });

  it('updates totals and the VAT breakdown as lines are edited', async () => {
    const user = userEvent.setup();
    renderEditor();
    const total = screen.getByTestId('quote-total');
    expect(text(total)).toBe('0,00 €');

    await user.type(screen.getByLabelText('Descripción (línea 1)'), 'Consultoría');
    await user.clear(screen.getByLabelText('Cantidad (línea 1)'));
    await user.type(screen.getByLabelText('Cantidad (línea 1)'), '2');
    await user.type(screen.getByLabelText('Precio unitario (línea 1)'), '100');
    expect(text(total)).toBe('242,00 €');

    // Second line at 10 % VAT with a comma decimal and a 50 % discount.
    await user.click(screen.getByRole('button', { name: 'Añadir línea' }));
    await user.type(screen.getByLabelText('Precio unitario (línea 2)'), '50,5');
    await user.type(screen.getByLabelText('Descuento % (línea 2)'), '50');
    await user.selectOptions(screen.getByLabelText('IVA (línea 2)'), '10');

    // 200 + 21 % = 242; 25,25 + 10 % = 27,78 (27,775 rounded half up) → 269,78
    expect(text(total)).toBe('269,78 €');
    // The first breakdown is the editor's; the second one belongs to the live preview.
    const [breakdown] = screen.getAllByRole('table', { name: 'Desglose de IVA' });
    const rows = within(breakdown!).getAllByRole('row').slice(1).map(text);
    expect(rows).toEqual(['21 %200,00 €42,00 €', '10 %25,25 €2,53 €']);
  });

  it('opens the print dialog to download the PDF', async () => {
    const user = userEvent.setup();
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }));
    expect(print).toHaveBeenCalledOnce();
  });

  it('removes a line', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'Eliminar línea 1' }));
    expect(screen.queryByLabelText(/^Descripción \(línea/)).not.toBeInTheDocument();
    expect(screen.getByText(/no tiene conceptos/)).toBeInTheDocument();
  });
});
