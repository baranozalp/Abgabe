/**
 * Das Modul besteht aus dem JSON-Array mit den vorhandenen Benutzerkennungen
 * vom Typ {@linkcode User}.
 * @packageDocumentation
 */

import type { User } from './user.service';
import dotenv from 'dotenv';

dotenv.config();
const password = '$2b$10$YTg4.iW.FPRqHExVLRf05Ob/z/BQqjUxJgncct2TgxGBjl4cCUNGS';

/**
 * Ein JSON-Array der Benutzerdaten mit den vorhandenen Rollen.
 * Nicht Set, weil es dafür keine Suchfunktion gibt.
 */
export const users: User[] = [
    {
        id: '20000000-0000-0000-0000-000000000001',
        username: 'admin',
        password,
        email: 'admin@acme.com',
        roles: ['admin', 'mitarbeiter', 'abteilungsleiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000002',
        username: 'adriana.alpha',
        password,
        email: 'adriana.alpha@acme.com',
        roles: ['admin', 'mitarbeiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000003',
        username: 'alfred.alpha',
        password,
        email: 'alfred.alpha@acme.com',
        roles: ['mitarbeiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000004',
        username: 'antonia.alpha',
        password,
        email: 'antonia.alpha@acme.com',
        roles: ['mitarbeiter', 'kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000005',
        username: 'dirk.delta',
        password,
        email: 'dirk.delta@acme.com',
        roles: ['kunde'],
    },
    {
        id: '20000000-0000-0000-0000-000000000006',
        username: 'emilia.epsilon',
        password,
        email: 'emilia.epsilon@acme.com',
    },
];
