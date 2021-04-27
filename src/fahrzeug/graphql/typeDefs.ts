/**
 * Das Modul enthält die _Typdefinitionen_ für GraphQL, die mit einem _Tagged
 * Template String_ für Apollo realisiert sind.
 *
 * Vordefinierte skalare Typen
 * - Int: 32‐bit Integer
 * - Float: Gleitkommmazahl mit doppelter Genauigkeit
 * - String:
 * - Boolean: true, false
 * - ID: eindeutiger Bezeichner, wird serialisiert wie ein String
 *
 * `Fahrzeug`: eigene Typdefinition für Queries. `!` markiert Pflichtfelder
 *
 * `Query`: Signatur der Lese-Methoden
 *
 * `Mutation`: Signatur der Schreib-Methoden
 * @packageDocumentation
 */

import { gql } from 'apollo-server-express';

// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#the-gql-tag
// https://www.apollographql.com/docs/apollo-server/schema/schema

/**
 * _Tagged Template String_, d.h. der Template-String wird durch eine Funktion
 * (hier: `gql`) modifiziert. Die Funktion `gql` wird für Syntax-Highlighting
 * und für die Formatierung durch Prettier verwendet.
 */
export const typeDefs = gql`
    "Enum-Typ fuer die Art eines Fahrzeuges"
    enum Art {
        Coupe
        Kombi
        Cabrio
        SUV
        Limousine
    }

    "Enum-Typ fuer den Hersteller eines Fahrzeuges"
    enum Hersteller {
        BMW
        Audi
        MercedesBenz
        Volkswagen
        Porsche
    }

    "Datenschema eines Fahrzeuges, das empfangen oder gesendet wird"
    type Fahrzeug {
        id: ID!
        version: Int
        modell: String!
        tueren: Int
        art: Art
        hersteller: Hersteller!
        preis: Float
        rabatt: Float
        lieferbar: Boolean
        datum: String
        fahrgestellnummer: String
        angebot: String
        sonderausstattung: [String]
    }

    "Funktionen, um Fahrzeuge zu empfangen"
    type Query {
        fahrzeuge(modell: String): [Fahrzeug]
        fahrzeug(id: ID!): Fahrzeug
    }

    "Funktionen, um Fahrzeuge anzulegen, zu aktualisieren oder zu loeschen"
    type Mutation {
        createFahrzeug(
            modell: String!
            tueren: Int
            art: String
            hersteller: String!
            preis: Float
            rabatt: Float
            lieferbar: Boolean
            datum: String
            fahrgestellnummer: String
            angebot: String
            sonderausstattung: [String]
        ): String
        updateFahrzeug(
            _id: ID
            modell: String!
            tueren: Int
            art: String
            hersteller: String!
            preis: Float
            rabatt: Float
            lieferbar: Boolean
            datum: String
            fahrgestellnummer: String
            angebot: String
            sonderausstattung: [String]
            version: Int
        ): Int
        deleteFahrzeug(id: ID!): Boolean
    }
`;
