/**
 * Das Modul enthält Funktionen für den DB-Zugriff einschließlich GridFS und
 * Neuladen der Test-DB.
 * @packageDocumentation
 */

 import type { FahrzeugData } from '../../fahrzeug/entity';

 /* eslint-disable @typescript-eslint/naming-convention */
 
 /**
  * Die Testdaten, um die Test-DB neu zu laden, als JSON-Array.
  */
 export const testdaten: FahrzeugData[] = [
     {
         _id: '00000000-0000-0000-0000-000000000001',
         modell: 'C63 AMG',
         tueren: 2,
         art: 'Coupe',
         hersteller: 'Mercedes-Benz',
         preis: 93000.00,
         rabatt: 0.02,
         lieferbar: true,
         // https://docs.mongodb.com/manual/reference/method/Date
         datum: new Date('2020-02-01'),
         fahrgestellnummer: '978-3897225831',
         angebot: 'https://acme.at/',
         sonderausstattung: ['Schiebedach'],
         __v: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
     },
     {
         _id: '00000000-0000-0000-0000-000000000002',
         modell: 'RS6',
         tueren: 4,
         art: 'Kombi',
         hersteller: 'Audi',
         preis: 120000.00,
         rabatt: 0.11,
         lieferbar: true,
         datum: new Date('2020-02-02'),
         fahrgestellnummer: '978-3827315526',
         angebot: 'https://acme.biz/',
         sonderausstattung: ['Sitzheizung'],
         __v: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
     },
     {
         _id: '00000000-0000-0000-0000-000000000003',
         modell: 'S500',
         tueren: 5,
         art: 'Limousine',
         hersteller: 'Mercedes-Benz',
         preis: 140000.00,
         rabatt: 0.033,
         lieferbar: true,
         datum: new Date('2020-02-03'),
         fahrgestellnummer: '978-0201633610',
         angebot: 'https://acme.com/',
         sonderausstattung: ['AMG-Line', 'Schiebedach'],
         __v: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
     },
     {
         _id: '00000000-0000-0000-0000-000000000004',
         modell: '750d',
         tueren: 5,
         art: 'Limousine',
         hersteller: 'BMW',
         preis: 160000.00,
         rabatt: 0.044,
         lieferbar: true,
         datum: new Date('2020-02-04'),
         fahrgestellnummer: '978-0387534046',
         angebot: 'https://acme.de/',
         sonderausstattung: ['Panoramadach'],
         __v: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
     },
     {
         _id: '00000000-0000-0000-0000-000000000005',
         modell: 'Passat',
         tueren: 5,
         art: 'Kombi',
         hersteller: 'Volkswagen',
         preis: 6000.00,
         rabatt: 0.1,
         lieferbar: true,
         datum: new Date('2020-02-05'),
         fahrgestellnummer: '978-3824404810',
         angebot: 'https://acme.es/',
         sonderausstattung: ['R-Line', 'Sitzheizung'],
         __v: 0,
         createdAt: new Date(),
         updatedAt: new Date(),
     },
 ];
 Object.freeze(testdaten);
 
 /* eslint-enable @typescript-eslint/naming-convention */
 