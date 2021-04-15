/**
 * Das Modul besteht aus den Klassen für die Fehlerbehandlung bei der Verwaltung
 * von Büchern, z.B. beim DB-Zugriff.
 * @packageDocumentation
 */

/* eslint-disable max-classes-per-file */

import type { ValidationErrorMsg } from './../entity';

/**
 * Allgemeine Basisklasse für {@linkcode FahrzeugService}
 */
export class FahrzeugServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

/**
 * Klasse für fehlerhafte Fahrzeugdaten. Die Meldungstexte sind in der Property
 * `msg` gekapselt.
 */
export class FahrzeugInvalid extends FahrzeugServiceError {
    constructor(readonly msg: ValidationErrorMsg) {
        super();
    }
}

/**
 * Klasse für einen bereits existierenden Modell.
 */
export class ModellExists extends FahrzeugServiceError {
    constructor(
        readonly modell: string | null | undefined,
        readonly id?: string,
    ) {
        super();
    }
}

/**
 * Klasse für eine bereits existierende Fahrgestellnummer-Nummer.
 */
export class FahrgestellnummerExists extends FahrzeugServiceError {
    constructor(
        readonly fahrgestellnummer: string | null | undefined,
        readonly id?: string,
    ) {
        super();
    }
}

/**
 * Union-Type für Fehler beim Neuanlegen eines Fahrzeuges.
 */
export type CreateError = FahrzeugInvalid | FahrgestellnummerExists | ModellExists;

/**
 * Klasse für eine ungültige Versionsnummer beim Ändern.
 */
export class VersionInvalid extends FahrzeugServiceError {
    constructor(readonly version: string | undefined) {
        super();
    }
}

/**
 * Klasse für eine veraltete Versionsnummer beim Ändern.
 */
export class VersionOutdated extends FahrzeugServiceError {
    constructor(readonly id: string, readonly version: number) {
        super();
    }
}

/**
 * Klasse für ein nicht-vorhandenes Fahrzeug beim Ändern.
 */
export class FahrzeugNotExists extends FahrzeugServiceError {
    constructor(readonly id: string | undefined) {
        super();
    }
}

/**
 * Union-Type für Fehler beim Ändern eines Fahrzeuges.
 */
export type UpdateError =
    | FahrzeugInvalid
    | FahrzeugNotExists
    | ModellExists
    | VersionInvalid
    | VersionOutdated;

/**
 * Allgemeine Basisklasse für {@linkcode FahrzeugFileService}
 */
export class FahrzeugFileServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

/**
 * Klasse für eine nicht-vorhandenes Binärdatei.
 */
export class FileNotFound extends FahrzeugFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

/**
 * Klasse, falls es mehrere Binärdateien zu einem Fahrzeug gibt.
 */
export class MultipleFiles extends FahrzeugFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

/**
 * Union-Type für Fehler beim Lesen eines Fahrzeuges.
 */
export type DownloadError = FahrzeugNotExists | FileNotFound | MultipleFiles;

/* eslint-enable max-classes-per-file */
