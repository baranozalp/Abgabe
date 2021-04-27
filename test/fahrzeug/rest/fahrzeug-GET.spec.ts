import { HttpStatus, nodeConfig } from '../../../src/shared';
import { agent, createTestserver } from '../../testserver';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import type { AddressInfo } from 'net';
import type { Fahrzeug } from '../../../src/fahrzeug/entity';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import each from 'jest-each';
import fetch from 'node-fetch';

const { expect } = chai;

// IIFE (= Immediately Invoked Function Expression) statt top-level await
// https://developer.mozilla.org/en-US/docs/Glossary/IIFE
(async () => {
    // startWith(), endWith()
    const chaiString = await import('chai-string');
    chai.use(chaiString.default);
})();

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const modellVorhanden = ['a', 'r', 'g'];
const modellNichtVorhanden = ['xx', 'yy'];
const sonderAustattungNichtVorhanden = ['A', 'xyz'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.fahrzeuge;
let fahrzeugeUri: string;

// Test-Suite
describe('GET /api/fahrzeuge', () => {
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        fahrzeugeUri = `https://${nodeConfig.host}:${address.port}${path}`;
    });

    afterAll(() => {
        server.close();
    });

    test('Alle Fahrzeuge', async () => {
        // given

        // when
        const response = await fetch(fahrzeugeUri, { agent });

        // then
        const { status, headers } = response;
        expect(status).to.be.equal(HttpStatus.OK);
        expect(headers.get('Content-Type')).to.match(/json/iu);
        // https://jestjs.io/docs/en/expect
        // JSON-Array mit mind. 1 JSON-Objekt
        const fahrzeuge: Array<any> = await response.json();
        expect(fahrzeuge).not.to.be.empty;
        fahrzeuge.forEach((fahrzeug) => {
            const selfLink = fahrzeug._links.self.href;
            expect(selfLink).to.have.string(path);
        });
    });

    each(modellVorhanden).test(
        'Fahrzeuge mit einem Modell, der "%s" enthaelt',
        async (teilModell) => {
            // given
            const uri = `${fahrzeugeUri}?modell=${teilModell}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            const { status, headers } = response;
            expect(status).to.be.equal(HttpStatus.OK);
            expect(headers.get('Content-Type')).to.match(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            const body = await response.json();
            expect(body).not.to.be.empty;

            // Jedes Fahrzeug hat ein Modell mit dem Teilstring 'a'
            body.map(
                (fahrzeug: Fahrzeug) => fahrzeug.modell,
            ).forEach((modell: string) =>
                expect(modell.toLowerCase()).to.have.string(teilModell),
            );
        },
    );

    each(modellNichtVorhanden).test(
        'Keine Fahrzeuge mit einem Modell, der "%s" nicht enthaelt',
        async (teilModell) => {
            // given
            const uri = `${fahrzeugeUri}?modell=${teilModell}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );

    each(sonderAustattungNichtVorhanden).test(
        'Keine Fahrzeuge mit der Sonderausststtung "%s"',
        async (modell) => {
            // given
            const uri = `${fahrzeugeUri}?${modell}=true`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );
});
