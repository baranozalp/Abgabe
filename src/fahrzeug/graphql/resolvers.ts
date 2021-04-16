/**
 * Das Modul enthält die _Resolver_ für GraphQL.
 *
 * Die Referenzimplementierung von GraphQL soll übrigens nach TypeScript
 * migriert werden: https://github.com/graphql/graphql-js/issues/2860
 * @packageDocumentation
 */

import {
    FahrzeugInvalid,
    FahrzeugNotExists,
    ModellExists,
    VersionInvalid,
    VersionOutdated,
} from './../service/errors';
import { FahrzeugService, FahrzeugServiceError } from '../service';
import type { Fahrzeug } from './../entity';
import { logger } from '../../shared';

const fahrzeugService = new FahrzeugService();

// https://www.apollographql.com/docs/apollo-server/data/resolvers
// Zugriff auf Header-Daten, z.B. Token
// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#accessing-request-headers
// https://www.apollographql.com/docs/apollo-server/security/authentication

// Resultat mit id (statt _id) und version (statt __v)
// __ ist bei GraphQL fuer interne Zwecke reserviert
const withIdAndVersion = (fahrzeug: Fahrzeug) => {
    const result: any = fahrzeug;
    result.id = fahrzeug._id;
    result.version = fahrzeug.__v;
    return fahrzeug;
};

const findFahrzeugById = async (id: string) => {
    const fahrzeug = await fahrzeugService.findById(id);
    if (fahrzeug === undefined) {
        return;
    }
    return withIdAndVersion(fahrzeug);
};

const findFahrzeuge = async (modell: string | undefined) => {
    const suchkriterium = modell === undefined ? {} : { modell };
    const fahrzeuge = await fahrzeugService.find(suchkriterium);
    return fahrzeuge.map((fahrzeug: Fahrzeug) => withIdAndVersion(fahrzeug));
};

interface ModellCriteria {
    modell: string;
}

interface IdCriteria {
    id: string;
}

const createFahrzeug = async (fahrzeug: Fahrzeug) => {
    const result = await fahrzeugService.create(fahrzeug);
    logger.debug('resolvers createFahrzeug(): result=%o', result);
    if (result instanceof FahrzeugServiceError) {
        return;
    }
    return result;
};

const logUpdateResult = (
    result:
        | FahrzeugInvalid
        | FahrzeugNotExists
        | ModellExists
        | VersionInvalid
        | VersionOutdated
        | number,
) => {
    if (result instanceof FahrzeugInvalid) {
        logger.debug('resolvers updateFahrzeug(): validation msg = %o', result.msg);
    } else if (result instanceof ModellExists) {
        logger.debug(
            'resolvers updateFahrzeug(): vorhandener modell = %s',
            result.modell,
        );
    } else if (result instanceof FahrzeugNotExists) {
        logger.debug(
            'resolvers updateFahrzeug(): nicht-vorhandene id = %s',
            result.id,
        );
    } else if (result instanceof VersionInvalid) {
        logger.debug(
            'resolvers updateFahrzeug(): ungueltige version = %d',
            result.version,
        );
    } else if (result instanceof VersionOutdated) {
        logger.debug(
            'resolvers updateFahrzeug(): alte version = %d',
            result.version,
        );
    } else {
        logger.debug(
            'resolvers updateFahrzeug(): aktualisierte Version= %d',
            result,
        );
    }
};

const updateFahrzeug = async (fahrzeug: Fahrzeug) => {
    logger.debug(
        'resolvers updateFahrzeug(): zu aktualisieren = %s',
        JSON.stringify(fahrzeug),
    );
    // nullish coalescing
    const version = fahrzeug.__v ?? 0;
    const result = await fahrzeugService.update(fahrzeug, version.toString());
    logUpdateResult(result);
    return result;
};

const deleteFahrzeug = async (id: string) => {
    const result = await fahrzeugService.delete(id);
    logger.debug('resolvers deleteFahrzeug(): result = %s', result);
    return result;
};

// Queries passend zu "type Query" in typeDefs.ts
const query = {
    /**
     * Fahrzeuge suchen
     * @param _ nicht benutzt
     * @param __namedParameters JSON-Objekt mit `modell` als Suchkriterium
     * @returns Promise mit einem JSON-Array der gefundenen Fahrzeuge
     */
     fahrzeuge: (_: unknown, { modell }: ModellCriteria) => findFahrzeuge(modell),

    /**
     * Fahrzeug suchen
     * @param _ nicht benutzt
     * @param __namedParameters JSON-Objekt mit `id` als Suchkriterium
     * @returns Promise mit dem gefundenen {@linkcode Fahrzeug} oder `undefined`
     */
     fahrzeug: (_: unknown, { id }: IdCriteria) => findFahrzeugById(id),
};

const mutation = {
    /**
     * Neues Fahrzeug anlegen
     * @param _ nicht benutzt
     * @param fahrzeug JSON-Objekt mit dem neuen {@linkcode Fahrzeug}
     * @returns Promise mit der generierten ID
     */
    createFahrzeug: (_: unknown, fahrzeug: Fahrzeug) => createFahrzeug(fahrzeug),

    /**
     * Vorhandenes {@linkcode Fahrzeug} aktualisieren
     * @param _ nicht benutzt
     * @param fahrzeug JSON-Objekt mit dem zu aktualisierenden Fahrzeug
     * @returns Das aktualisierte Fahrzeug als {@linkcode FahrzeugData} in einem Promise,
     * falls kein Fehler aufgetreten ist. Ansonsten ein Promise mit einem Fehler
     * durch:
     * - {@linkcode FahrzeugInvalid}
     * - {@linkcode FahrzeugNotExists}
     * - {@linkcode ModellExists}
     * - {@linkcode VersionInvalid}
     * - {@linkcode VersionOutdated}
     */
    updateFahrzeugFahrzeug: (_: unknown, fahrzeug: Fahrzeug) => updateFahrzeug(fahrzeug),

    /**
     * Fahrzeug löschen
     * @param _ nicht benutzt
     * @param __namedParameters JSON-Objekt mit `id` zur Identifikation
     * @returns true, falls das Fahrzeug gelöscht wurde. Sonst false.
     */
    deleteFahrzeug: (_: unknown, { id }: IdCriteria) => deleteFahrzeug(id),
};

/**
 * Die Resolver bestehen aus `Query` und `Mutation`.
 */
export const resolvers /* : IResolvers */ = {
    Query: query, // eslint-disable-line @typescript-eslint/naming-convention
    Mutation: mutation, // eslint-disable-line @typescript-eslint/naming-convention
};
