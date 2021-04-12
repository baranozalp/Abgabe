/**
 * Das Modul besteht aus Interfaces, Klassen und Funktionen für Fahrzeuge als
 * _Entity_ gemäß _Domain Driven Design_. Dazu gehört auch die Validierung.
 * @packageDocumentation
 */

export { Fahrzeug, FahrzeugArt, FahrzeugData, Hersteller } from './fahrzeug';
export { FahrzeugDocument, FahrzeugModel, fahrzeugSchema } from './fahrzeug.model';
export { MAX_TÜREN } from './jsonSchema';
export { ValidationErrorMsg, validateFahrzeug } from './validateFahrzeug';
