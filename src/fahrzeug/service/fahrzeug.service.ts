/**
 * Das Modul besteht aus der Klasse {@linkcode AuthService} für die
 * Authentifizierung.
 * @packageDocumentation
 */

import type { Fahrzeug, FahrzeugData } from '../entity';
import {
    FahrzeugInvalid,
    FahrzeugNotExists,
    FahrzeugServiceError,
    FahrgestellnummerExists,
    ModellExists,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import { FahrzeugModel, validateFahrzeug } from '../entity';
import { cloud, logger, mailConfig } from '../../shared';
import type { QueryOptions } from 'mongoose';
import type { SendMailOptions } from 'nodemailer';

// API-Dokumentation zu Mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/* eslint-disable no-null/no-null, unicorn/no-useless-undefined, @typescript-eslint/no-unsafe-assignment */

/**
 * Die Klasse `FahrzeugService` implementiert den Anwendungskern für Fahrzeuge und
 * greift mit _Mongoose_ auf MongoDB zu.
 */
export class FahrzeugService {
    private static readonly UPDATE_OPTIONS: QueryOptions = { new: true };

    // Rueckgabetyp Promise bei asynchronen Funktionen
    //    ab ES2015
    //    vergleiche Task<> bei C# und Mono<> aus Project Reactor
    // Status eines Promise:
    //    Pending: das Resultat ist noch nicht vorhanden, weil die asynchrone
    //             Operation noch nicht abgeschlossen ist
    //    Fulfilled: die asynchrone Operation ist abgeschlossen und
    //               das Promise-Objekt hat einen Wert
    //    Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //              Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //              Im Promise-Objekt ist dann die Fehlerursache enthalten.

    /**
     * Ein Fahrzeug asynchron anhand seiner ID suchen
     * @param id ID des gesuchten Fahrzeugs
     * @returns Das gefundene Fahrzeug vom Typ {@linkcode FahrzeugData} oder undefined
     */
    async findById(id: string) {
        logger.debug('FahrzeugService.findById(): id=%s', id);

        // ein Fahrzeug zur gegebenen ID asynchron mit Mongoose suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // Das Resultat ist null, falls nicht gefunden.
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document,
        // so dass u.a. der virtuelle getter "id" auch nicht mehr vorhanden ist.
        const fahrzeug = await FahrzeugModel.findById(id).lean<FahrzeugData | null>();
        logger.debug('FahrzeugService.findById(): fahrzeug=%o', fahrzeug);

        if (fahrzeug === null) {
            return undefined;
        }

        this.deleteTimestamps(fahrzeug);
        return fahrzeug;
    }

    /**
     * Fahrzeuge asynchron suchen.
     * @param query Die DB-Query als JSON-Objekt
     * @returns Ein JSON-Array mit den gefundenen Fahrzeugen. Ggf. ist das Array leer.
     */
    // eslint-disable-next-line max-lines-per-function
    async find(query?: any | undefined) {
        logger.debug('FahrzeugService.find(): query=%o', query);

        // alle Fahrzeuge asynchron suchen u. aufsteigend nach modell sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { modell: 'a', türen: 5 } => [{ modell: 'x'}, {türen: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            logger.debug('FahrzeugService.find(): alle Fahrzeuge');
            // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
            const fahrzeuge = await FahrzeugModel.find()
                .sort('modell')
                .lean<FahrzeugData[]>();
            for await (const fahrzeug of fahrzeuge) {
                this.deleteTimestamps(fahrzeug);
            }
            return fahrzeuge;
        }

        // { modell: 'a', türen: 5, javascript: true }
        // Rest Properties
        const { modell, javascript, typescript, ...dbQuery } = query;

        // Fahrzeuge zur Query (= JSON-Objekt durch Express) asynchron suchen
        // Modell in der Query: Teilstring des Modells,
        // d.h. "LIKE" als regulaerer Ausdruck
        // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
        // NICHT /.../, weil das Muster variabel sein muss
        // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdrucksonderausstattung
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (modell !== undefined && modell.length < 10) {
            // RegExp statt Re2 wegen Mongoose
            dbQuery.modell = new RegExp(modell, 'iu'); // eslint-disable-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
        }

        // z.B. {javascript: true, typescript: true}
        const sonderausstattung = [];
        if (javascript === 'true') {
            sonderausstattung.push('JAVASCRIPT');
        }
        if (typescript === 'true') {
            sonderausstattung.push('TYPESCRIPT');
        }
        if (sonderausstattung.length === 0) {
            delete dbQuery.sonderausstattung;
        } else {
            dbQuery.sonderausstattung = sonderausstattung;
        }

        logger.debug('FahrzeugService.find(): dbQuery=%o', dbQuery);

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // FahrzeugModel.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        const fahrzeuge = await FahrzeugModel.find(dbQuery).lean<FahrzeugData[]>();
        for await (const fahrzeug of fahrzeuge) {
            this.deleteTimestamps(fahrzeug);
        }

        return fahrzeuge;
    }

    /**
     * Ein neues Fahrzeug soll angelegt werden.
     * @param fahrzeug Das neu abzulegende Fahrzeug
     * @returns Die ID des neu angelegten Fahrzeuges oder im Fehlerfall
     * - {@linkcode FahrzeugInvalid} falls die Fahrzeugdaten gegen Constraints verstoßen
     * - {@linkcode FahrgestellnummerExists} falls die FAHRGESTELLNUMMER-Nr bereits existiert
     * - {@linkcode ModellExists} falls der Modell bereits existiert
     */
    async create(
        fahrzeug: Fahrzeug,
    ): Promise<FahrzeugInvalid | FahrgestellnummerExists | ModellExists | string> {
        logger.debug('FahrzeugService.create(): fahrzeug=%o', fahrzeug);
        const validateResult = await this.validateCreate(fahrzeug);
        if (validateResult instanceof FahrzeugServiceError) {
            return validateResult;
        }

        const fahrzeugModel = new FahrzeugModel(fahrzeug);
        const saved = await fahrzeugModel.save();
        const id = saved._id as string; // eslint-disable-line @typescript-eslint/non-nullable-type-assertion-style
        logger.debug('FahrzeugService.create(): id=%s', id);

        await this.sendmail(fahrzeug);

        return id;
    }

    /**
     * Ein vorhandenes Fahrzeug soll aktualisiert werden.
     * @param fahrzeug Das zu aktualisierende Fahrzeug
     * @param versionStr Die Versionsnummer für optimistische Synchronisation
     * @returns Die neue Versionsnummer gemäß optimistischer Synchronisation
     *  oder im Fehlerfall
     *  - {@linkcode FahrzeugInvalid}, falls Constraints verletzt sind
     *  - {@linkcode FahrzeugNotExists}, falls das Fahrzeug nicht existiert
     *  - {@linkcode ModellExists}, falls der Modell bereits existiert
     *  - {@linkcode VersionInvalid}, falls die Versionsnummer ungültig ist
     *  - {@linkcode VersionOutdated}, falls die Versionsnummer nicht aktuell ist
     */
    async update(
        fahrzeug: Fahrzeug,
        versionStr: string,
    ): Promise<
        | FahrzeugInvalid
        | FahrzeugNotExists
        | ModellExists
        | VersionInvalid
        | VersionOutdated
        | number
    > {
        logger.debug('FahrzeugService.update(): fahrzeug=%o', fahrzeug);
        logger.debug('FahrzeugService.update(): versionStr=%s', versionStr);

        const validateResult = await this.validateUpdate(fahrzeug, versionStr);
        if (validateResult instanceof FahrzeugServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const fahrzeugModel = new FahrzeugModel(fahrzeug);
        // Weitere Methoden zum Aktualisieren:
        //    Fahrzeug.findOneAndUpdate(update)
        //    Fahrzeug.updateOne(bedingung)
        const updated = await FahrzeugModel.findByIdAndUpdate(
            fahrzeug._id,
            fahrzeugModel,
            FahrzeugService.UPDATE_OPTIONS,
        ).lean<FahrzeugData | null>();
        if (updated === null) {
            return new FahrzeugNotExists(fahrzeug._id);
        }

        const version = updated.__v as number; // eslint-disable-line @typescript-eslint/non-nullable-type-assertion-style
        logger.debug('FahrzeugService.update(): version=%d', version);

        return Promise.resolve(version);
    }

    /**
     * Ein Fahrzeug wird asynchron anhand seiner ID gelöscht.
     *
     * @param id ID des zu löschenden Fahrzeuges
     * @returns true, falls das Fahrzeug vorhanden war und gelöscht wurde. Sonst false.
     */
    async delete(id: string) {
        logger.debug('FahrzeugService.delete(): id=%s', id);

        // Das Fahrzeug zur gegebenen ID asynchron loeschen
        const deleted = await FahrzeugModel.findByIdAndDelete(id).lean();
        logger.debug('FahrzeugService.delete(): deleted=%o', deleted);
        return deleted !== null;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Fahrzeug.findByIdAndRemove(id)
        //  Fahrzeug.findOneAndRemove(bedingung)
    }

    private deleteTimestamps(fahrzeug: FahrzeugData) {
        delete fahrzeug.createdAt;
        delete fahrzeug.updatedAt;
    }

    private async validateCreate(fahrzeug: Fahrzeug) {
        const msg = validateFahrzeug(fahrzeug);
        if (msg !== undefined) {
            logger.debug(
                'FahrzeugService.validateCreate(): Validation Message: %o',
                msg,
            );
            return new FahrzeugInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const { modell } = fahrzeug;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await FahrzeugModel.exists({ modell })) {
            return new ModellExists(modell);
        }

        const { fahrgestellnummer } = fahrzeug;
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (await FahrzeugModel.exists({ fahrgestellnummer })) {
            return new FahrgestellnummerExists(fahrgestellnummer);
        }

        logger.debug('FahrzeugService.validateCreate(): ok');
        return undefined;
    }

    private async sendmail(fahrzeug: Fahrzeug) {
        if (cloud !== undefined || mailConfig.host === 'skip') {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Joe Doe" <Joe.Doe@acme.com>';
        const to = '"Foo Bar" <Foo.Bar@acme.com>';
        const subject = `Neues Fahrzeug ${fahrzeug._id}`;
        const body = `Das Fahrzeug mit dem Modell <strong>${fahrzeug.modell}</strong> ist angelegt`;

        const data: SendMailOptions = { from, to, subject, html: body };
        logger.debug('sendMail(): data=%o', data);

        try {
            const nodemailer = await import('nodemailer'); // eslint-disable-line node/no-unsupported-features/es-syntax
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err: unknown) {
            logger.error(
                'FahrzeugService.create(): Fehler beim Verschicken der Email: %o',
                err,
            );
        }
    }

    private async validateUpdate(fahrzeug: Fahrzeug, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        logger.debug('FahrzeugService.validateUpdate(): version=%d', version);
        logger.debug('FahrzeugService.validateUpdate(): fahrzeug=%o', fahrzeug);

        const validationMsg = validateFahrzeug(fahrzeug);
        if (validationMsg !== undefined) {
            return new FahrzeugInvalid(validationMsg);
        }

        const resultModell = await this.checkModellExists(fahrzeug);
        if (resultModell !== undefined && resultModell.id !== fahrzeug._id) {
            return resultModell;
        }

        if (fahrzeug._id === undefined) {
            return new FahrzeugNotExists(undefined);
        }

        const resultIdAndVersion = await this.checkIdAndVersion(
            fahrzeug._id,
            version,
        );
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        logger.debug('FahrzeugService.validateUpdate(): ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                'FahrzeugService.validateVersion(): VersionInvalid=%o',
                error,
            );
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                'FahrzeugService.validateVersion(): VersionInvalid=%o',
                error,
            );
            return error;
        }

        return version;
    }

    private async checkModellExists(fahrzeug: Fahrzeug) {
        const { modell } = fahrzeug;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        const result = await FahrzeugModel.findOne({ modell }, { _id: true }).lean();
        if (result !== null) {
            const id = result._id;
            logger.debug('FahrzeugService.checkModellExists(): _id=%s', id);
            return new ModellExists(modell, id);
        }

        logger.debug('FahrzeugService.checkModellExists(): ok');
        return undefined;
    }

    private async checkIdAndVersion(id: string, version: number) {
        const fahrzeugDb: FahrzeugData | null = await FahrzeugModel.findById(id).lean();
        if (fahrzeugDb === null) {
            const result = new FahrzeugNotExists(id);
            logger.debug(
                'FahrzeugService.checkIdAndVersion(): FahrzeugNotExists=%o',
                result,
            );
            return result;
        }

        // nullish coalescing
        const versionDb = fahrzeugDb.__v ?? 0;
        if (version < versionDb) {
            const result = new VersionOutdated(id, version);
            logger.debug(
                'FahrzeugService.checkIdAndVersion(): VersionOutdated=%o',
                result,
            );
            return result;
        }

        return undefined;
    }
}
/* eslint-enable no-null/no-null, unicorn/no-useless-undefined, @typescript-eslint/no-unsafe-assignment */
/* eslint-enable max-lines */
