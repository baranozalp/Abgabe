/**
 * Das Modul besteht aus dem Interface {@linkcode FahrzeugData} und der Klasse
 * {@linkcode FahrzeugDocument} für Mongoose. Aus dem Interface {@linkcode FahrzeugData}
 * ist das Interface {@linkcode Fahrzeug} extrahiert, das an der REST- und
 * GraphQL-Schnittstelle verwendet wird.
 * @packageDocumentation
 */

/**
 * Alias-Typ für gültige Strings bei Herstellern.
 */
export type Hersteller =
    | 'Audi'
    | 'BMW'
    | 'MercedesBenz'
    | 'Porsche'
    | 'Volkswagen';

/**
 * Alias-Typ für gültige Strings bei der Fahrzeugart.
 */
export type FahrzeugArt = 'Cabrio' | 'Coupe' | 'Kombi' | 'Limousine' | 'SUV';

// export type Getriebe = 'Schaltgetriebe' | 'Automatik';

/**
 * Gemeinsames Interface für _REST_, _GraphQL_ und _Mongoose_.
 */
export interface Fahrzeug {
    // _id und __v werden bei REST durch HATEOAS und ETag abgedeckt
    // und deshalb beim Response entfernt.
    // Ausserdem wird _id bei einem POST-Request generiert
    _id?: string; // eslint-disable-line @typescript-eslint/naming-convention

    __v?: number; // eslint-disable-line @typescript-eslint/naming-convention

    readonly modell: string | null | undefined;
    readonly tueren: number | null | undefined;
    readonly art: FahrzeugArt | '' | null | undefined;
    readonly hersteller: Hersteller | '' | null | undefined;
    readonly preis: number | undefined;
    readonly rabatt: number | undefined;
    readonly lieferbar: boolean | undefined;

    // Falls wir Lust haben mehr zu machen
    // readonly baujahr: Date | undefined;
    // readonly kmstand: number | null | undefined;
    // readonly vorbesitzer: number | null | undefined;
    // readonly unfall: boolean | undefined;
    // readonly getriebe: Getriebe | undefined;

    // string bei REST und Date bei GraphQL sowie Mongoose
    datum: Date | string | undefined;

    readonly fahrgestellnummer: string | null | undefined;
    readonly angebot: string | null | undefined;
    readonly sonderausstattung?: string[];
}

/**
 * Interface für die Rohdaten aus MongoDB durch die _Mongoose_-Funktion `lean()`.
 */
export interface FahrzeugData extends Fahrzeug {
    // Zeitstempel fuer die MongoDB-Dokumente:
    // wird bei der Rueckgabe aus dem Anwendungskern entfernt
    createdAt?: Date;

    updatedAt?: Date;
}
