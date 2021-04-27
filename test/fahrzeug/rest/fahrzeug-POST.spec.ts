import { HttpMethod, agent, createTestserver } from '../../testserver';
import { HttpStatus, nodeConfig } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import type { Fahrzeug } from '../../../src/fahrzeug/entity';
import { PATHS } from '../../../src/app';
import RE2 from 're2';
import type { Server } from 'http';
import chai from 'chai';
import { login } from '../../login';

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
const neuesFahrzeug: Fahrzeug = {
    modell: 'Neu',
    tueren: 1,
    art: 'Limousine',
    hersteller: 'Volkswagen',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    fahrgestellnummer: '0-0070-0644-6',
    angebot: 'https://test.de/',
    sonderausstattung: ['SITZHEIZUNG', 'SCHIEBEDACH'],
};
const neuesFahrzeugInvalid: object = {
    modell: 'Blabla',
    tueren: -1,
    art: 'UNSICHTBAR',
    hersteller: 'NO_HERSTELLER',
    preis: 0,
    rabatt: 0,
    lieferbar: true,
    datum: '12345-123-123',
    fahrgestellnummer: 'falsche-FAHRGESTELLNUMMER',
    sonderausstattung: [],
};
const neuesFahrzeugModellExistiert: Fahrzeug = {
    modell: 'RS6',
    tueren: 1,
    art: 'Coupe',
    hersteller: 'Porsche',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    fahrgestellnummer: '0-0070-9732-8',
    angebot: 'https://test.de/',
    sonderausstattung: ['SITZHEIZUNG', 'SCHIEBEDACH'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.fahrzeuge;
let fahrzeugeUri: string;
let loginUri: string;

// Test-Suite
describe('POST /api/fahrzeuge', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${nodeConfig.host}:${address.port}`;
        fahrzeugeUri = `${baseUri}${path}`;
        loginUri = `${baseUri}${PATHS.login}`;
    });

    // (done?: DoneFn) => Promise<void | undefined | unknown> | void | undefined
    // close(callback?: (err?: Error) => void): this
    afterAll(() => {
        server.close();
    });

    test('Neues Fahrzeug', async () => {
        // given
        const token = await login(loginUri);

        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesFahrzeug);
        const request = new Request(fahrzeugeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });
        const uuidRegexp = new RE2(
            '[\\dA-Fa-f]{8}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{12}',
            'u',
        );

        // when
        const response = await fetch(request);

        // then
        const { status } = response;
        expect(status).to.be.equal(HttpStatus.CREATED);

        const location = response.headers.get('Location');
        expect(location).to.exist;
        expect(typeof location === 'string').to.be.true;
        expect(location).not.to.be.empty;

        // UUID: Muster von HEX-Ziffern
        const indexLastSlash: number = location?.lastIndexOf('/') as number;
        const idStr = location?.slice(indexLastSlash + 1);
        expect(idStr).not.to.be.empty;
        expect(uuidRegexp.test(idStr as string)).to.be.true;

        const responseBody = response.text();
        expect(responseBody).to.be.empty;
    });

    test('Neues Fahrzeug mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesFahrzeugInvalid);
        const request = new Request(fahrzeugeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const {
            art,
            tueren,
            hersteller,
            datum,
            fahrgestellnummer,
        } = await response.json();

        expect(art).to.be.equal(
            'Die Fahrzeugart muss Coupe, Kombi, Cabrio, SUV oder Limousine sein.',
        );
        expect(tueren).to.be.equal(
            'Die Anzahl der Tueren muss zwischen 0 und 5 liegen.',
        );
        expect(hersteller).to.be.equal(
            'Der Hersteller eines Fahrzeuges muss BMW, Audi, Mercedes-Benz, Volkswagen oder Porsche sein.',
        );
        expect(datum).to.be.equal('Das Datum muss im Format yyyy-MM-dd sein.');
        expect(fahrgestellnummer).to.be.equal(
            'Die Fahrgestellnummer ist nicht korrekt.',
        );
    });

    test('Neues Fahrzeug, aber das Modell existiert bereits', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesFahrzeugModellExistiert);
        const request = new Request(fahrzeugeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const responseBody = await response.text();
        expect(responseBody).has.string('Modell');
    });

    test('Neues Fahrzeug, aber ohne Token', async () => {
        // given
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const body = JSON.stringify(neuesFahrzeugModellExistiert);
        const request = new Request(fahrzeugeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });

    test('Neues Fahrzeug, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesFahrzeug);
        const request = new Request(fahrzeugeUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });
});
