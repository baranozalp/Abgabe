/*
 * Copyright (C) 2018 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Das Modul besteht aus der Suchfunktion für EJS.
 * @packageDocumentation
 */

import type { Request, Response } from 'express';
import { FahrzeugService } from '../service/fahrzeug.service';
import { logger } from './../../shared/logger';

const fahrzeugService = new FahrzeugService();

/**
 * Asynchrone Suchfunktion für EJS, um alle Fahrzeuge zu suchen.
 *
 * @param req Request-Objekt von Express mit der URL für EJS
 * @param res Response-Objekt von Express
 */
export const suche = async (req: Request, res: Response) => {
    logger.error('suche(): %s', req.url);
    const fahrzeuge = await fahrzeugService.find();
    res.render('suche', { modell: 'Suche', fahrzeuge });
};
