import type { GenericJsonSchema } from './GenericJsonSchema';

export const MAX_TUEREN = 5;

export const jsonSchema: GenericJsonSchema = {
    $schema: 'https://json-schema.org/draft/2019-09/schema',
    $id: 'http://acme.com/fahrzeug.json#',
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
        tueren: {
            type: 'number',
            minimum: 0,
            maximum: MAX_TUEREN,
        },
        art: {
            type: 'string',
            enum: ['Coupe', 'Kombi', 'Cabrio', 'SUV', 'Limousine', ''],
        },
        hersteller: {
            type: 'string',
            enum: ['BMW', 'Audi', 'MercedesBenz', 'Volkswagen', 'Porsche', ''],
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
        fahrgestellnummer: { type: 'string' },
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
            tueren: 'Die Anzahl der Tueren muss zwischen 0 und 5 liegen.',
            art:
                'Die Fahrzeugart muss Coupe, Kombi, Cabrio, SUV oder Limousine sein.',
            hersteller:
                'Der Hersteller eines Fahrzeuges muss BMW, Audi, Mercedes-Benz, Volkswagen oder Porsche sein.',
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
