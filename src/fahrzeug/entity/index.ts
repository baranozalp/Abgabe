/**
 * Das Modul besteht aus Interfaces, Klassen und Funktionen für Fahrzeuge als
 * _Entity_ gemäß _Domain Driven Design_. Dazu gehört auch die Validierung.
 * @packageDocumentation
 */

export { Fahrzeug, FahrzeugArt, FahrzeugData, Hersteller } from './fahrzeug';
export {
    FahrzeugDocument,
    fahrzeugModel as FahrzeugModel,
    fahrzeugSchema,
} from './fahrzeug.model';
export { MAX_TUEREN } from './jsonSchema';
export { ValidationErrorMsg, validateFahrzeug } from './validateFahrzeug';
