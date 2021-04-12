/**
 * Das Modul besteht aus dem Schema und Model für _Mongoose_.
 * @packageDocumentation
 */

import type { Fahrzeug, FahrzeugArt, Hersteller } from './fahrzeug';
import { Document, Schema, SchemaType, model } from 'mongoose';
import { autoIndex, logColorConsole } from '../../shared';
import type { Model } from 'mongoose';
// RFC version 1: timestamps            https://github.com/uuidjs/uuid#uuidv1options-buffer-offset
// RFC version 3: namespace mit MD5     https://github.com/uuidjs/uuid#uuidv3name-namespace-buffer-offset
// RFC version 4: random                https://github.com/uuidjs/uuid#uuidv4options-buffer-offset
// RFC version 5: namespace mit SHA-1   https://github.com/uuidjs/uuid#uuidv5name-namespace-buffer-offset
import { v4 as uuid } from 'uuid';

if (logColorConsole) {
    SchemaType.set('debug', true);
}

// Mongoose ist von Valeri Karpov, der auch den Begriff "MEAN-Stack" gepraegt hat:
// http://thecodebarbarian.com/2013/04/29//easy-web-prototyping-with-mongodb-and-nodejs

/**
 * Document-Klasse für _Mongoose_ mit `_id` vom Typ `string` und passend zum
 * Interface {@linkcode Fahrzeug}
 */
export class FahrzeugDocument extends Document<string> implements Fahrzeug {
    readonly modell: string | null | undefined;

    readonly türen: number | null | undefined;

    readonly art: FahrzeugArt | '' | null | undefined;

    readonly hersteller: Hersteller | '' | null | undefined;

    readonly preis: number | undefined;

    readonly rabatt: number | undefined;

    readonly lieferbar: boolean | undefined;

    readonly datum: Date | string | undefined;

    readonly fahrgestellnummer: string | null | undefined;

    readonly angebot: string | null | undefined;

    readonly sonderausstattung?: string[];

    readonly createdAt?: number;

    readonly updatedAt?: number;
}

// Ein Schema in Mongoose definiert die Struktur und Methoden fuer die
// Dokumente in einer Collection, die aus Dokumenten im BSON-Format besteht.
// Ein Property im Schema definiert eine Property fuer jedes Dokument.
// Ein Schematyp (String, Number, Boolean, Date, Array, ObjectId) legt den Typ
// der Property fest.

// https://mongoosejs.com/docs/schematypes.html
/**
 * Das Schema für Mongoose, das dem Schema bei einem relationalen DB-System
 * entspricht, welches durch `CREATE TABLE`, `CREATE INDEX` usw. entsteht.
 */
export const fahrzeugSchema = new Schema<FahrzeugDocument, Model<FahrzeugDocument>>(
    {
        // MongoDB erstellt implizit einen Index fuer _id
        // mongoose-id-assigner hat geringe Download-Zahlen und
        // uuid-mongodb hat keine Typ-Definitionen fuer TypeScript
        _id: { type: String, default: uuid },
        modell: { type: String, required: true, unique: true },
        türen: { type: Number, min: 0, max: 5 },
        art: { type: String, enum: ['Coupe', 'Cabrio', 'Limousine', 'Kombi', 'SUV'] },
        hersteller: {
            type: String,
            required: true,
            enum: [ 'BMW', 'Audi', 'Mercedes-Benz', 'Volkswagen', 'Porsche'],
            // es gibt auch
            //  lowercase: true
            //  uppercase: true
        },
        preis: { type: Number, required: true },
        rabatt: Number,
        lieferbar: Boolean,
        datum: Date,
        fahrgestellnummer: { type: String, required: true, unique: true, immutable: true },
        angebot: String,
        sonderausstattung: { type: [String], sparse: true },
    },
    {
        // default: virtueller getter "id"
        // id: true,

        // createdAt und updatedAt als automatisch gepflegte Felder
        timestamps: true,
        // http://thecodebarbarian.com/whats-new-in-mongoose-5-10-optimistic-concurrency.html
        optimisticConcurrency: true,
        autoIndex,
    },
);

// Optimistische Synchronisation durch das Feld __v fuer die Versionsnummer
// https://mongoosejs.com/docs/guide.html#versionKey
// https://github.com/Automattic/mongoose/issues/1265
const optimistic = (schema: Schema<FahrzeugDocument, Model<FahrzeugDocument>>) => {
    schema.pre('findOneAndUpdate', function () {
        // UpdateQuery ist abgeleitet von ReadonlyPartial<Schema<...>>
        const update = this.getUpdate(); // eslint-disable-line @typescript-eslint/no-invalid-this
        // eslint-disable-next-line no-null/no-null
        if (update === null) {
            return;
        }
        // eslint-disable-next-line no-null/no-null
        if (update.__v !== null) {
            // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
            delete update.__v;
        }
        const keys = ['$set', '$setOnInsert'];
        for (const key of keys) {
            // Optional Chaining
            /* eslint-disable security/detect-object-injection */
            // eslint-disable-next-line no-null/no-null
            if (update[key]?.__v !== null) {
                delete update[key].__v;
                if (Object.entries(update[key]).length === 0) {
                    // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
                    delete update[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
                }
            }
            /* eslint-enable security/detect-object-injection */
        }
        update.$inc = update.$inc || {};
        // @ts-expect-error UpdateQuery laesst nur Lesevorgaenge zu: abgeleitet von ReadonlyPartial<...>
        update.$inc.__v = 1;
    });
};

fahrzeugSchema.plugin(optimistic);

/**
 * Ein Model ist ein übersetztes Schema und stellt die CRUD-Operationen für
 * die Dokumente bereit, d.h. das Pattern _Active Record_ wird realisiert.
 * Der Name des Models wird als Name für die Collection in MongoDB verwendet.
 */
export const FahrzeugModel = model<FahrzeugDocument>('Fahrzeug', fahrzeugSchema); // eslint-disable-line @typescript-eslint/naming-convention
