/**
 * Das Modul besteht aus der Klasse {@linkcode FahrzeugFileRequestHandler}, um die
 * Handler-Funktionen für die REST-Schnittstelle auf der Basis von Express
 * gebündelt bereitzustellen, damit Binärdateien hoch- und heruntergeladen
 * werden können.
 * @packageDocumentation
 */

import {
    FahrzeugFileService,
    FahrzeugFileServiceError,
    FahrzeugNotExists,
    FileNotFound,
    MultipleFiles,
} from '../service';
import { HttpStatus, logger } from '../../shared';
import type { Request, Response } from 'express';
import type { DownloadError } from '../service';

// export bei async und await:
// https://blogs.msdn.microsoft.com/typescript/2015/11/30/announcing-typescript-1-7
// http://tc39.github.io/ecmascript-export
// https://nemethgergely.com/async-function-best-practices#Using-async-functions-with-express

/**
 * Die Handler-Klasse fasst die Handler-Funktionen für Fahrzeuge zusammen, um die
 * REST-Schnittstelle auf Basis von Express für das Hoch- und Herunterladen
 * von Binärdateien zu realisieren.
 */
export class FahrzeugFileRequestHandler {
    private readonly service = new FahrzeugFileService();

    /**
     * Zu einem vorhandenen Fahrzeug wird eine Binärdatei mit z.B. einem Bild oder
     * einem Video hochgeladen.
     *
     * Im Request-Objekt von Express muss die ID des zu betreffenden Fahrzeuges
     * als Pfad-Parameter enthalten sein. Außerdem muss im Rumpf die Binärdatei
     * enthalten sein. Bei erfolgreicher Durchführung wird der Statuscode `204`
     * (`No Content`) gesetzt.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     */
    upload(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug('FahrzeugFileRequestHandler.upload(): id=%s', id);

        if (id === undefined) {
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        // https://jsao.io/2019/06/uploading-and-downloading-files-buffering-in-node-js

        const data: Uint8Array[] = [];
        let totalBytesInBuffer = 0;

        // Wenn body-parser verwendet wird (z.B. bei textuellen JSON-Daten),
        // dann verarbeitet body-parser die Events "data" und "end".
        // https://nodejs.org/api/http.html#http_class_http_clientrequest

        req.on('data', (chunk: Uint8Array) => {
            const { length } = chunk;
            logger.debug(
                'FahrzeugFileRequestHandler.upload(): data %d',
                length,
            );
            data.push(chunk);
            totalBytesInBuffer += length;
        })
            .on('aborted', () =>
                logger.debug('FahrzeugFileRequestHandler.upload(): aborted'),
            )
            .on('end', () => {
                logger.debug(
                    'FahrzeugFileRequestHandler.upload(): end %d',
                    totalBytesInBuffer,
                );
                const buffer = Buffer.concat(data, totalBytesInBuffer);

                // IIFE (= Immediately Invoked Function Expression) wegen await
                // https://developer.mozilla.org/en-US/docs/Glossary/IIFE
                // https://github.com/typescript-eslint/typescript-eslint/issues/647
                // https://github.com/typescript-eslint/typescript-eslint/pull/1799
                (async () => {
                    try {
                        await this.save(req, id, buffer);
                    } catch (err: unknown) {
                        logger.error('Fehler beim Abspeichern: %o', err);
                        return;
                    }

                    res.sendStatus(HttpStatus.NO_CONTENT);
                })();
            });
    }

    /**
     * Zu einem vorhandenen Fahrzeug wird eine Binärdatei mit z.B. einem Bild oder
     * einem Video asynchron heruntergeladen. Im Request-Objekt von Express muss
     * die ID des zu betreffenden Fahrzeuges als Pfad-Parameter enthalten sein.
     *
     * Bei erfolgreicher Durchführung wird der Statuscode `200` (`OK`) gesetzt.
     * Falls es kein Fahrzeug mit der angegebenen ID gibt, wird der Statuscode `412`
     * (`Precondition Failed`) gesetzt. Wenn es das Fahrzeug zur angegebenen ID zwar
     * gibt, aber zu diesem Fahrzeug keine Binärdatei existiert, dann wird der
     * Statuscode `404` (`Not Found`) gesetzt.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    async download(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug('FahrzeugFileRequestHandler.downloadBinary(): %s', id);
        if (id === undefined) {
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        const findResult = await this.service.find(id);
        if (
            findResult instanceof FahrzeugFileServiceError ||
            findResult instanceof FahrzeugNotExists
        ) {
            this.handleDownloadError(findResult, res);
            return;
        }

        const file = findResult;
        const { readStream, contentType } = file;
        res.contentType(contentType);
        // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93
        readStream.pipe(res);
    }

    private async save(req: Request, id: string, buffer: Buffer) {
        const contentType = req.headers['content-type'];
        await this.service.save(id, buffer, contentType);
    }

    private handleDownloadError(
        err: DownloadError | FahrzeugNotExists,
        res: Response,
    ) {
        if (err instanceof FahrzeugNotExists) {
            const { id } = err;
            const msg = `Es gibt kein Fahrzeug mit der ID "${id}".`;
            logger.debug(
                'FahrzeugFileRequestHandler.handleDownloadError(): msg=%s',
                msg,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof FileNotFound) {
            const { filename } = err;
            const msg = `Es gibt kein File mit Name ${filename}`;
            logger.debug(
                'FahrzeugFileRequestHandler.handleDownloadError(): msg=%s',
                msg,
            );
            res.status(HttpStatus.NOT_FOUND).send(msg);
            return;
        }

        if (err instanceof MultipleFiles) {
            const { filename } = err;
            const msg = `Es gibt mehr als ein File mit Name ${filename}`;
            logger.debug(
                'FahrzeugFileRequestHandler.handleDownloadError(): msg=%s',
                msg,
            );
            res.status(HttpStatus.INTERNAL_ERROR).send(msg);
        }
    }
}
