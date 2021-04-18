/**
 * Handler-Funktionen, um die REST-Schnittstelle mit Express zu realisieren. Die
 * einzelnen Handler-Funktionen delegieren an die jeweiligen Methoden der Klassen
 * {@linkcode FahrzeugRequestHandler} und {@linkcode FahrzeugFileRequestHandler}.
 * @packageDocumentation
 */

import type { Request, Response } from 'express';
import { FahrzeugFileRequestHandler } from './fahrzeug-file.request-handler';
import { FahrzeugRequestHandler } from './fahrzeug.request-handler';

const handler = new FahrzeugRequestHandler();
const fileHandler = new FahrzeugFileRequestHandler();

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
export const findById = (req: Request, res: Response) =>
    handler.findById(req, res);

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
export const find = (req: Request, res: Response) => handler.find(req, res);

/**
 * Ein neues Fahrzeug wird asynchron angelegt. Das neu anzulegende Fahrzeug ist als
 * JSON-Datensatz im Request-Objekt enthalten und im Request-Header muss
 * `Content-Type` auf `application\json` gesetzt sein. Wenn es keine
 * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
 * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
 * dass damit das neu angelegte Fahrzeug abgerufen werden kann.
 *
 * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
 * gesetzt und genauso auch wenn der Titel oder die ISBN-Nummer bereits
 * existieren.
 *
 * @param req Request-Objekt von Express.
 * @param res Leeres Response-Objekt von Express.
 * @returns Leeres Promise-Objekt.
 */
export const create = (req: Request, res: Response) => handler.create(req, res);

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
 * Titel oder die neue ISBN-Nummer bereits existieren.
 *
 * @param req Request-Objekt von Express.
 * @param res Leeres Response-Objekt von Express.
 * @returns Leeres Promise-Objekt.
 */
export const update = (req: Request, res: Response) => handler.update(req, res);

/**
 * Ein Fahrzeug wird anhand seiner ID-gelöscht, die als Pfad-Parameter angegeben
 * ist. Der zurückgelieferte Statuscode ist `204` (`No Content`).
 *
 * @param req Request-Objekt von Express.
 * @param res Leeres Response-Objekt von Express.
 * @returns Leeres Promise-Objekt.
 */
export const deleteFn = (req: Request, res: Response) =>
    handler.delete(req, res);

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
export const upload = (req: Request, res: Response) =>
    fileHandler.upload(req, res);

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
export const download = (req: Request, res: Response) =>
    fileHandler.download(req, res);
