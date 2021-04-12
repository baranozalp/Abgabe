import type { GenericJsonSchema } from './GenericJsonSchema';

export const MAX_TÜREN = 5;

export const jsonSchema: GenericJsonSchema = {
    $schema: 'https://json-schema.org/draft/2019-09/schema',
    $id: 'http://acme.com/buch.json#',
    title: 'Fahrzeug',
    description: 'Eigenschaften eines Fahrzeugs: Typen und Einschraenkungen',
    type: 'object',
    properties: {
        /* eslint-disable @typescript-eslint/naming-convention */
        _id: {
            type: 'string',
            pattern:
                '^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$',
        },
        __v: {
            type: 'number',
            minimum: 0,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
        modell: {
            type: 'string',
            pattern: '^\\w.*',
        },
        türen: {
            type: 'number',
            minimum: 0,
            maximum: MAX_TÜREN,
        },
        art: {
            type: 'string',
            enum: ['Coupe', 'Kombi', 'Cabrio', 'SUV', 'Limousine', ''],
        },
        hersteller: {
            type: 'string',
            enum: ['BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen', 'Porsche', ''],
        },
        preis: {
            type: 'number',
            minimum: 0,
        },
        rabatt: {
            type: 'number',
            exclusiveMinimum: 0,
            exclusiveMaximum: 1,
        },
        lieferbar: { type: 'boolean' },
        // https://github.com/ajv-validator/ajv-formats
        datum: { type: 'string', format: 'date' },
        fahrgestellnummer: {
            type: 'string',
            // https://www.oreilly.com/library/view/regular-expressions-cookbook/9781449327453/ch04s13.html
            // TODO https://github.com/ajv-validator/ajv-formats/issues/14
            pattern:
                '^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|' +
                '(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|' +
                '(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?' +
                '[0-9]+[- ]?[0-9]+[- ]?[0-9X]*',
        },
        // https://github.com/ajv-validator/ajv-formats
        angebot: { type: 'string', format: 'uri' },
        sonderausstattung: {
            type: 'array',
            items: { type: 'string' },
        },
    },
    // isbn ist NUR beim Neuanlegen ein Pflichtfeld
    // Mongoose bietet dazu die Funktion MyModel.findByIdAndUpdate()
    required: ['modell', 'art', 'hersteller'],
    errorMessage: {
        properties: {
            modell:
                'Ein Fahrzeugmodell muss mit einem Buchstaben, einer Ziffer oder _ beginnen.',
            türen: 'Die Anzahl der Türen muss zwischen 0 und 5 liegen.',
            art: 'Die Fahrzeugart muss Coupe, Kombi, Cabrio, SUV oder Limousine sein.',
            hersteller:
                'Der Hersteller eines Fahrzeugs muss BMW, Audi, Mercedes-Benz, Volkswagen oder Porsche sein.',
            preis: 'Der Preis darf nicht negativ sein.',
            rabatt: 'Der Rabatt muss ein Wert zwischen 0 und 1 sein.',
            lieferbar: '"lieferbar" muss auf true oder false gesetzt sein.',
            datum: 'Das Datum muss im Format yyyy-MM-dd sein.',
            fahrgestellnummer: 'Die Fahrgestellnummer ist nicht korrekt.',
            angebot: 'Die URL des Angebots ist nicht korrekt.',
        },
    },
    additionalProperties: false,
};
