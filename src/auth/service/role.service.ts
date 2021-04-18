/**
 * Das Modul besteht aus der Klasse {@linkcode RoleService} für die
 * Autorisierung (RBAC = role based access control).
 * @packageDocumentation
 */

import { logger } from '../../shared';
import { roles } from './roles';

export class RoleService {
    constructor() {
        logger.info('RoleService: roles=%o', roles);
    }

    /**
     * Alle Rollen werden ermittelt.
     *
     * @returns Alle Rollen.
     */
    findAllRoles() {
        return roles;
    }

    /**
     * Alle Rollen werden ermittelt.
     *
     * @param rollen als ein JSON-Array mit Elementen vom Typ string oder undefined
     * @returns Array mit den kleingeschriebenen Rollen und ohne undefined.
     */
    getNormalizedRoles(rollen: readonly (string | undefined)[]) {
        if (rollen.length === 0) {
            logger.debug('RolesService.getNormalizedRoles(): []');
            return [];
        }

        const normalizedRoles = rollen.filter(
            (r) => this.getNormalizedRole(r) !== undefined,
        ) as string[];
        logger.debug('RolesService.getNormalizedRoles(): %o', normalizedRoles);
        return normalizedRoles;
    }

    private getNormalizedRole(role: string | undefined) {
        if (role === undefined) {
            return;
        }

        // Falls der Rollenname in Grossbuchstaben geschrieben ist, wird er
        // trotzdem gefunden
        return this.findAllRoles().find(
            (r) => r.toLowerCase() === role.toLowerCase(),
        );
    }
}
