/**
 * Das Modul besteht aus den Handler-Funktionen für die Autorisierung an der
 * REST-Schnittstelle, die in der internen Klasse `AuthorizationRequestHandler`
 * gebündelt implementiert sind.
 * @packageDocumentation
 */

import { HttpStatus, logger } from '../../shared';
import type { NextFunction, Request, Response } from 'express';
import { AuthService } from '../service';

class AuthorizationRequestHandler {
    private readonly authService = new AuthService();

    /**
     * Falls der eingeloggte User die Rolle `admin` hat, wird die Verarbeitung
     * mit der `NextFunction` fortgesetzt, sonst abgebrochen.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     */
    isAdmin(req: Request, res: Response, next: NextFunction) {
        if (!this.hasRolle(req, res, 'admin')) {
            logger.debug('AuthRequestHandler.isAdmin(): false');
            return;
        }

        logger.debug('AuthRequestHandler.isAdmin(): true');
        // Verarbeitung fortsetzen
        next();
    }

    /**
     * Falls der eingeloggte User die Rolle `mitarbeiter` hat, wird die
     * Verarbeitung mit der `NextFunction` fortgesetzt, sonst abgebrochen.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     */
    isMitarbeiter(req: Request, res: Response, next: NextFunction) {
        if (!this.hasRolle(req, res, 'mitarbeiter')) {
            logger.debug('AuthRequestHandler.isMitarbeiter(): false');
            return;
        }

        logger.debug('AuthRequestHandler.isMitarbeiter(): ok');
        // Verarbeitung fortsetzen
        next();
    }

    /**
     * Falls der eingeloggte User die Rolle `admin` oder `mitarbeiter` hat, wird
     * die Verarbeitung mit der `NextFunction` fortgesetzt, sonst abgebrochen.
     *
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     */
    isAdminMitarbeiter(req: Request, res: Response, next: NextFunction) {
        if (!this.hasRolle(req, res, 'admin', 'mitarbeiter')) {
            logger.debug('AuthRequestHandler.isAdminMitarbeiter(): false');
            return;
        }

        logger.debug('AuthRequestHandler.isAdminMitarbeiter(): ok');
        // Verarbeitung fortsetzen
        next();
    }

    // Spread-Parameter
    private hasRolle(req: Request, res: Response, ...roles: readonly string[]) {
        logger.debug('Rollen = %o', roles);

        const { user } = req;
        if (user === undefined) {
            logger.debug('AuthRequestHandler.hasRolle(): 401');
            res.sendStatus(HttpStatus.UNAUTHORIZED);
            return false;
        }

        if (!this.authService.hasAnyRole(user, roles)) {
            logger.debug('AuthRequestHandler.hasRolle(): 403');
            logger.debug('403');
            res.sendStatus(HttpStatus.FORBIDDEN);
            return false;
        }

        logger.debug('AuthRequestHandler.hasRolle(): ok');
        return true;
    }
}

const handler = new AuthorizationRequestHandler();

/**
 * Falls der eingeloggte User die Rolle `admin` hat, wird die Verarbeitung
 * mit der `NextFunction` fortgesetzt, sonst abgebrochen.
 *
 * @param req Request-Objekt von Express.
 * @param res Leeres Response-Objekt von Express.
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) =>
    handler.isAdmin(req, res, next);

/**
 * Falls der eingeloggte User die Rolle `mitarbeiter` hat, wird die
 * Verarbeitung mit der `NextFunction` fortgesetzt, sonst abgebrochen.
 *
 * @param req Request-Objekt von Express.
 * @param res Leeres Response-Objekt von Express.
 */
export const isMitarbeiter = (
    req: Request,
    res: Response,
    next: NextFunction,
) => handler.isMitarbeiter(req, res, next);

/**
 * Falls der eingeloggte User die Rolle `admin` oder `mitarbeiter` hat, wird
 * die Verarbeitung mit der `NextFunction` fortgesetzt, sonst abgebrochen.
 *
 * @param req Request-Objekt von Express.
 * @param res Leeres Response-Objekt von Express.
 */
export const isAdminMitarbeiter = (
    req: Request,
    res: Response,
    next: NextFunction,
) => handler.isAdminMitarbeiter(req, res, next);
