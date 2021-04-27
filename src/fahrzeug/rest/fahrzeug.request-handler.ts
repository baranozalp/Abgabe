/**
 * Das Modul besteht aus der Klasse {@linkcode FahrzeugRequestHandler}, um die
 * Handler-Funktionen für die REST-Schnittstelle auf der Basis von Express
 * gebündelt bereitzustellen.
 * @packageDocumentation
 */
/* eslint-disable max-lines */
import type { CreateError, UpdateError } from '../service';
import {
    FahrgestellnummerExists,
    FahrzeugInvalid,
    FahrzeugNotExists,
    FahrzeugService,
    FahrzeugServiceError,
    ModellExists,
    VersionInvalid,
    VersionOutdated,
} from '../service';
import type { Fahrzeug, FahrzeugData, ValidationErrorMsg } from '../entity';
import { HttpStatus, getBaseUri, logger, mimeConfig } from '../../shared';
import type { Request, Response } from 'express';

// Interface fuer die REST-Schnittstelle
interface FahrzeugHAL extends Fahrzeug {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links?: {
        self?: { href: string };
        list?: { href: string };
        add?: { href: string };
        update?: { href: string };
        remove?: { href: string };
    };
}

/**
 * Die Handler-Klasse fasst die Handler-Funktionen für Fahrzeuge zusammen, um die
 * REST-Schnittstelle auf Basis von Express zu realisieren.
 */
export class FahrzeugRequestHandler {
    // Dependency Injection ggf. durch
    // * Awilix https://github.com/jeffijoe/awilix
    // * InversifyJS https://github.com/inversify/InversifyJS
    // * Node Dependency Injection https://github.com/zazoomauro/node-dependency-injection
    // * BottleJS https://github.com/young-steveo/bottlejs
    private readonly service = new FahrzeugService();

    /**
     * Ein Fahrzeug wird asynchron anhand seiner ID als Pfadparameter gesucht.
     *
     * Falls es ein solches Fahrzeug gibt und `If-None-Match` im Request-Header
     * auf die aktuelle Version des Fahrzeuges gesetzt war, wird der Statuscode
     * `304` (`Not Modified`) zurückgeliefert. Falls `If-None-Match` nicht
     * gesetzt ist oder eine veraltete Version enthält, wird das gefundene
     * Fahrzeug im Rumpf des Response als JSON-Datensatz mit Atom-Links für HATEOAS
     * und dem Statuscode `200` (`OK`) zurückgeliefert.
     *
     * Falls es kein Fahrzeug zur angegebenen ID gibt, wird der Statuscode `404`
     * (`Not Found`) zurückgeliefert.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    // vgl Kotlin: Schluesselwort "suspend"
    // eslint-disable-next-line max-statements
    async findById(req: Request, res: Response) {
        const versionHeader = req.header('If-None-Match');
        logger.debug(
            'FahrzeugRequestHandler.findById(): versionHeader=%s',
            versionHeader,
        );
        const { id } = req.params;
        logger.debug('FahrzeugRequestHandler.findById(): id=%s', id);

        if (id === undefined) {
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        let fahrzeug: FahrzeugData | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            fahrzeug = await this.service.findById(id);
        } catch (err: unknown) {
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            logger.error('FahrzeugRequestHandler.findById(): error=%o', err);
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        if (fahrzeug === undefined) {
            logger.debug('FahrzeugRequestHandler.findById(): status=NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }
        logger.debug(
            'FahrzeugRequestHandler.findById(): fahrzeug=%o',
            fahrzeug,
        );

        // ETags
        const versionDb = fahrzeug.__v;
        if (versionHeader === `"${versionDb}"`) {
            res.sendStatus(HttpStatus.NOT_MODIFIED);
            return;
        }
        logger.debug(
            'FahrzeugRequestHandler.findById(): VersionDb=%d',
            versionDb,
        );
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const fahrzeugHAL = this.toHAL(fahrzeug, req, id);
        res.json(fahrzeugHAL);
    }

    /**
     * Fahrzeuge werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Fahrzeug gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Fahrzeuge, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Fahrzeug zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Fahrzeuge ermittelt.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    async find(req: Request, res: Response) {
        // z.B. https://.../fahrzeuge?modell=a
        // => req.query = { modell: 'a' }
        const { query } = req;
        logger.debug('FahrzeugRequestHandler.find(): queryParams=%o', query);

        let fahrzeuge: FahrzeugData[];
        try {
            fahrzeuge = await this.service.find(query);
        } catch (err: unknown) {
            logger.error('FahrzeugRequestHandler.find(): error=%o', err);
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug('FahrzeugRequestHandler.find(): fahrzeuge=%o', fahrzeuge);
        if (fahrzeuge.length === 0) {
            // Alternative: https://www.npmjs.com/package/http-errors
            // Damit wird aber auch der Stacktrace zum Client
            // uebertragen, weil das resultierende Fehlerobjekt
            // von Error abgeleitet ist.
            logger.debug('FahrzeugRequestHandler.find(): status = NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        const baseUri = getBaseUri(req);
        // asynchrone for-of Schleife statt synchrones fahrzeuge.forEach()
        for await (const fahrzeug of fahrzeuge) {
            // HATEOAS: Atom Links je Fahrzeug
            const fahrzeugHAL: FahrzeugHAL = fahrzeug;
            // eslint-disable-next-line no-underscore-dangle
            fahrzeugHAL._links = {
                self: { href: `${baseUri}/${fahrzeug._id}` },
            };

            delete fahrzeug._id;
            delete fahrzeug.__v;
        }
        logger.debug('FahrzeugRequestHandler.find(): fahrzeuge=%o', fahrzeuge);

        res.json(fahrzeuge);
    }

    /**
     * Ein neues Fahrzeug wird asynchron angelegt. Das neu anzulegende Fahrzeug ist als
     * JSON-Datensatz im Request-Objekt enthalten und im Request-Header muss
     * `Content-Type` auf `application\json` gesetzt sein. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Fahrzeug abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn der modell oder die ISBN-Nummer bereits
     * existieren.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    async create(req: Request, res: Response) {
        const contentType = req.header(mimeConfig.contentType);
        if (
            // Optional Chaining
            contentType?.toLowerCase() !== mimeConfig.json
        ) {
            logger.debug(
                'FahrzeugRequestHandler.create() status=NOT_ACCEPTABLE',
            );
            res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
            return;
        }

        const fahrzeug = req.body as Fahrzeug;
        logger.debug('FahrzeugRequestHandler.create(): fahrzeug=%o', fahrzeug);

        const result = await this.service.create(fahrzeug);
        if (result instanceof FahrzeugServiceError) {
            this.handleCreateError(result, res);
            return;
        }

        const location = `${getBaseUri(req)}/${result}`;
        logger.debug('FahrzeugRequestHandler.create(): location=%s', location);
        res.location(location).sendStatus(HttpStatus.CREATED);
    }

    /**
     * Ein vorhandenes Fahrzeug wird asynchron aktualisiert.
     *
     * Im Request-Objekt von Express muss die ID des zu aktualisierenden Fahrzeuges
     * als Pfad-Parameter enthalten sein. Außerdem muss im Rumpf das zu
     * aktualisierende Fahrzeug als JSON-Datensatz enthalten sein. Damit die
     * Aktualisierung überhaupt durchgeführt werden kann, muss im Header
     * `If-Match` auf die korrekte Version für optimistische Synchronisation
     * gesetzt sein.
     *
     * Bei erfolgreicher Aktualisierung wird der Statuscode `204` (`No Content`)
     * gesetzt und im Header auch `ETag` mit der neuen Version mitgeliefert.
     *
     * Falls die Versionsnummer fehlt, wird der Statuscode `428` (`Precondition
     * required`) gesetzt; und falls sie nicht korrekt ist, der Statuscode `412`
     * (`Precondition failed`). Falls Constraints verletzt sind, wird der
     * Statuscode `400` (`Bad Request`) gesetzt und genauso auch wenn der neue
     * Modell oder die neue ISBN-Nummer bereits existieren.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    async update(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug('FahrzeugRequestHandler.update(): id=%s', id);

        const contentType = req.header(mimeConfig.contentType);
        // Optional Chaining
        if (contentType?.toLowerCase() !== mimeConfig.json) {
            res.status(HttpStatus.NOT_ACCEPTABLE);
            return;
        }
        const version = this.getVersionHeader(req, res);
        if (version === undefined) {
            return;
        }

        const fahrzeug = req.body as Fahrzeug;
        fahrzeug._id = id;
        logger.debug('FahrzeugRequestHandler.update(): fahrzeug=%o', fahrzeug);

        const result = await this.service.update(fahrzeug, version);
        if (result instanceof FahrzeugServiceError) {
            this.handleUpdateError(result, res);
            return;
        }

        logger.debug('FahrzeugRequestHandler.update(): version=%d', result);
        res.set('ETag', result.toString()).sendStatus(HttpStatus.NO_CONTENT);
    }

    /**
     * Ein Fahrzeug wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
     * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    async delete(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug('FahrzeugRequestHandler.delete(): id=%s', id);

        if (id === undefined) {
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        try {
            await this.service.delete(id);
        } catch (err: unknown) {
            logger.error('FahrzeugRequestHandler.delete(): error=%o', err);
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug('FahrzeugRequestHandler.delete(): NO_CONTENT');
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    private toHAL(fahrzeug: FahrzeugData, req: Request, id: string) {
        delete fahrzeug._id;
        delete fahrzeug.__v;
        const fahrzeugHAL: FahrzeugHAL = fahrzeug;

        const baseUri = getBaseUri(req);
        // eslint-disable-next-line no-underscore-dangle
        fahrzeugHAL._links = {
            self: { href: `${baseUri}/${id}` },
            list: { href: `${baseUri}` },
            add: { href: `${baseUri}` },
            update: { href: `${baseUri}/${id}` },
            remove: { href: `${baseUri}/${id}` },
        };

        return fahrzeugHAL;
    }

    private handleCreateError(err: CreateError, res: Response) {
        if (err instanceof FahrzeugInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof ModellExists) {
            this.handleModellExists(err.modell, err.id, res);
            return;
        }

        if (err instanceof FahrgestellnummerExists) {
            this.handleFahrgestellnummerExists(
                err.fahrgestellnummer,
                err.id,
                res,
            );
        }
    }

    private handleFahrgestellnummerExists(
        fahrgestellnummer: string | null | undefined,
        id: string | undefined,
        res: Response,
    ) {
        const msg = `Die ISBN-Nummer "${fahrgestellnummer}" existiert bereits bei ${id}.`;
        logger.debug(
            'FahrzeugRequestHandler.handleFahrgestellnummerExists(): msg=%s',
            msg,
        );
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private handleValidationError(msg: ValidationErrorMsg, res: Response) {
        logger.debug(
            'FahrzeugRequestHandler.handleValidationError(): msg=%o',
            msg,
        );
        res.status(HttpStatus.BAD_REQUEST).send(msg);
    }

    private handleModellExists(
        modell: string | null | undefined,
        id: string | undefined,
        res: Response,
    ) {
        const msg = `Der Modell "${modell}" existiert bereits bei ${id}.`;
        logger.debug(
            'FahrzeugRequestHandler.handleModellExists(): msg=%s',
            msg,
        );
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private getVersionHeader(req: Request, res: Response) {
        const versionHeader = req.header('If-Match');
        logger.debug(
            'FahrzeugRequestHandler.getVersionHeader() versionHeader=%s',
            versionHeader,
        );

        if (versionHeader === undefined) {
            const msg = 'Versionsnummer fehlt';
            logger.debug(
                'FahrzeugRequestHandler.getVersionHeader(): status=428, message=',
                msg,
            );
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        const { length } = versionHeader;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (length < 3) {
            const msg = `Ungueltige Versionsnummer: ${versionHeader}`;
            logger.debug(
                'FahrzeugRequestHandler.getVersionHeader(): status=412, message=',
                msg,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        // slice: einschl. Start, ausschl. Ende
        const version = versionHeader.slice(1, -1);
        logger.debug(
            'FahrzeugRequestHandler.getVersionHeader(): version=%s',
            version,
        );
        return version;
    }

    private handleUpdateError(err: UpdateError, res: Response) {
        if (err instanceof FahrzeugInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof FahrzeugNotExists) {
            const { id } = err;
            const msg = `Es gibt kein Fahrzeug mit der ID "${id}".`;
            logger.debug(
                'FahrzeugRequestHandler.handleUpdateError(): msg=%s',
                msg,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof ModellExists) {
            this.handleModellExists(err.modell, err.id, res);
            return;
        }

        if (err instanceof VersionInvalid) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
            logger.debug(
                'FahrzeugRequestHandler.handleUpdateError(): msg=%s',
                msg,
            );
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof VersionOutdated) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
            logger.debug(
                'FahrzeugRequestHandler.handleUpdateError(): msg=%s',
                msg,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }
    }
}

/* eslint-enable max-lines */
