// https://json-schema.org/implementations.html

/**
 * Das Modul besteht aus dem Typ {@linkcode ValidationErrorMsg} und der
 * Funktion {@linkcode validateFahrzeug} sowie notwendigen Konstanten.
 * @packageDocumentation
 */

// https://github.com/ajv-validator/ajv/blob/master/docs/validation.md
import Ajv from 'ajv/dist/2019';
import type { Fahrzeug } from './fahrzeug';
import addFormats from 'ajv-formats';
import ajvErrors from 'ajv-errors';
import { jsonSchema } from './jsonSchema';
import { logger } from '../../shared';

/**
 * Konstante für den maximalen Wert bei den Bewertungen
 */
export const MAX_TUEREN = 5;

const ajv = new Ajv({
    allowUnionTypes: true,
    allErrors: true,
});

// Formate für Ajv bereitstellen, wie z.B. date oder uri
addFormats(ajv);

// eigene Fehlermeldungen im JSON Schema statt der generischen Texte
ajvErrors(ajv);

/**
 * Typ für mögliche Fehlertexte bei der Validierung.
 */
export type ValidationErrorMsg = Record<string, string | undefined>;

/**
 * Funktion zur Validierung, wenn neue Bücher angelegt oder vorhandene Bücher
 * aktualisiert bzw. überschrieben werden sollen.
 */
export const validateFahrzeug = (fahrzeug: Fahrzeug) => {
    const validate = ajv.compile<Fahrzeug>(jsonSchema);
    validate(fahrzeug);
    // as DefinedError[]
    const errors = validate.errors ?? [];
    logger.debug('validateFahrzeug: errors=%o', errors);
    const errorMsg: ValidationErrorMsg = {};
    errors.forEach((err) => {
        const key = err.dataPath.slice(1);
        // errorMsg[key] = (err as any).errorMessage as string; // eslint-disable-line security/detect-object-injection
        // Keine Benutzereingabe ("User Input")
        // https://github.com/nodesecurity/eslint-plugin-security/blob/master/docs/the-dangers-of-square-bracket-notation.md
        errorMsg[key] = err.message; // eslint-disable-line security/detect-object-injection
    });

    logger.debug('validateFahrzeug: errorMsg=%o', errorMsg);
    return Object.entries(errorMsg).length === 0 ? undefined : errorMsg;
};
