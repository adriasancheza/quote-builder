import { addDays } from './dates';
import { DEFAULT_TERMS } from './quotes';
import { formatQuoteNumber } from './numbering';
import { DATA_VERSION, type AppData } from './types';

/**
 * Example data shown on first run so the app is not empty. All names,
 * tax IDs and addresses are fictional.
 */
export function createSeedData(today: string, now: string): AppData {
  const year = Number(today.slice(0, 4));
  return {
    version: DATA_VERSION,
    company: {
      name: 'Estudio Brisa Digital, S.L.',
      taxId: 'B00000000',
      address: 'Carrer de l’Exemple, 12, 2.º 1.ª\n08000 Barcelona',
      email: 'hola@estudiobrisa.example',
      phone: '+34 600 000 000',
      logoDataUrl: null,
    },
    clients: [
      {
        id: 'seed-client-1',
        name: 'Panadería La Espiga Ficticia',
        taxId: '00000000T',
        email: 'pedidos@laespiga.example',
        phone: '+34 611 111 111',
        address: 'Calle Mayor Imaginaria, 5\n46000 Valencia',
      },
    ],
    quotes: [
      {
        id: 'seed-quote-1',
        number: formatQuoteNumber(year, 1),
        clientId: 'seed-client-1',
        status: 'sent',
        issueDate: today,
        validUntil: addDays(today, 30),
        items: [
          {
            id: 'seed-item-1',
            description: 'Diseño de identidad visual (logotipo y paleta)',
            quantity: 1,
            unitPrice: 850,
            discount: 0,
            vatRate: 21,
          },
          {
            id: 'seed-item-2',
            description: 'Desarrollo web corporativa (5 páginas)',
            quantity: 1,
            unitPrice: 1800,
            discount: 10,
            vatRate: 21,
          },
          {
            id: 'seed-item-3',
            description: 'Horas de formación en gestión de contenidos',
            quantity: 4,
            unitPrice: 45,
            discount: 0,
            vatRate: 21,
          },
          {
            id: 'seed-item-4',
            description: 'Libro «Guía de marca» impreso (tirada corta)',
            quantity: 10,
            unitPrice: 18.5,
            discount: 5,
            vatRate: 4,
          },
        ],
        notes: `${DEFAULT_TERMS}\nPlazo de entrega estimado: 6 semanas desde la aceptación.`,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}
