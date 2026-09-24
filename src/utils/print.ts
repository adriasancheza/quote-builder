import type { Client, Quote } from '../lib/types';

/** File name suggested by the browser's "Save as PDF" (taken from the document title). */
export function pdfTitle(quote: Quote, client: Client | null): string {
  const clientPart = client?.name.trim() ? ` - ${client.name.trim()}` : '';
  // Characters that are invalid in file names on common OSes.
  return `Presupuesto ${quote.number}${clientPart}`.replace(/[\\/:*?"<>|]+/g, '-');
}

/**
 * Opens the print dialog for the current quote. The print stylesheet
 * (src/styles/print.css) hides the app chrome so only the document is
 * printed; choosing "Save as PDF" produces the PDF.
 */
export function printQuote(quote: Quote, client: Client | null) {
  const previousTitle = document.title;
  document.title = pdfTitle(quote, client);
  const restore = () => {
    document.title = previousTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
  // Some browsers print synchronously and never fire `afterprint`.
  setTimeout(restore, 1000);
}
