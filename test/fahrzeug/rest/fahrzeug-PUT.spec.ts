import { HttpMethod, agent, createTestserver } from '../../testserver';
import { HttpStatus, logger, nodeConfig } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import type { Fahrzeug } from '../../../src/fahrzeug/entity';
import { PATHS } from '../../../src/app';
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
const geaendertesFahrzeug: Omit<Fahrzeug, 'fahrgestellnummer'> = {
    modell: 'Neu',
    tueren: 1,
    art: 'SUV',
    hersteller: 'MercedesBenz',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    angebot: 'https://test.de/',
    sonderausstattung: ['SITZHEIZUNG', 'SCHIEBEDACH'],
};
const idVorhanden = '00000000-0000-0000-0000-000000000003';

const geaendertesFahrzeugIdNichtVorhanden: Omit<
    Fahrzeug,
    'fahrgestellnummer' | 'angebot'
> = {
    modell: 'wegwrgw',
    tueren: 1,
    art: 'SUV',
    hersteller: 'MercedesBenz',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    sonderausstattung: ['SITZHEIZUNG', 'SCHIEBEDACH'],
};
const idNichtVorhanden = '00000000-0000-0000-0000-000000000999';

const geaendertesFahrzeugInvalid: object = {
    modell: 'Neu',
    tueren: 9,
    art: 'ddddd',
    hersteller: 'FOO_HERSTssELLER',
    preis: 99.99,
    rabatt: 35.88,
    lieferbar: true,
    datum: '2-47-28',
    fahrgestellnummer: '0sbthwhnw',
    angebot: 'https://test.de/',
    sonderausstattung: ['SITZHEIZUNG', 'SCHIEBEDACH'],
};

const veraltesFahrzeug: object = {
    // Fahrgestellnummer wird nicht geaendet
    modell: 'veraltet',
    tueren: 1,
    art: 'Limousine',
    hersteller: 'MercedesBenz',
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    fahrgestellnummer: '0-0070-0644-6',
    angebot: 'https://test.de/',
    sonderausstattung: ['SITZHEIZUNG', 'SCHIEBEDACH'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
const path = PATHS.fahrzeuge;
let server: Server;
let fahrzeugeUri: string;
let loginUri: string;

// Test-Suite
describe('PUT /api/fahrzeuge/:id', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${nodeConfig.host}:${address.port}`;
        fahrzeugeUri = `${baseUri}${path}`;
        logger.info(`fahrzeugUri = ${fahrzeugeUri}`);
        loginUri = `${baseUri}${PATHS.login}`;
    });

    afterAll(() => {
        server.close();
    });

    test('Vorhandenes Fahrzeug aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFahrzeug);
        const request = new Request(`${fahrzeugeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.NO_CONTENT);
        const responseBody = await response.text();
        expect(responseBody).to.be.empty;
    });

    test('Nicht-vorhandenes Fahrzeug aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFahrzeugIdNichtVorhanden);
        const request = new Request(`${fahrzeugeUri}/${idNichtVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal(
            `Es gibt kein Fahrzeug mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenes Fahrzeug aendern, aber mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFahrzeugInvalid);
        const request = new Request(`${fahrzeugeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
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
            `Die Anzahl der Tueren muss zwischen 0 und 5 liegen.`,
        );
        expect(hersteller).to.be.equal(
            'Der Hersteller eines Fahrzeuges muss BMW, Audi, MercedesBenz, Volkswagen oder Porsche sein.',
        );
        expect(datum).to.be.equal('Das Datum muss im Format yyyy-MM-dd sein.');
        expect(fahrgestellnummer).to.be.equal(
            'Die Fahrgestellnummer ist nicht korrekt.',
        );
    });

    test('Vorhandenes Fahrzeug aendern, aber ohne Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(geaendertesFahrzeug);
        const request = new Request(`${fahrzeugeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_REQUIRED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal('Versionsnummer fehlt');
    });

    test('Vorhandenes Fahrzeug aendern, aber mit alter Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"-1"',
        });
        const body = JSON.stringify(veraltesFahrzeug);
        const request = new Request(`${fahrzeugeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.have.string('Die Versionsnummer');
    });

    test('Vorhandenes Fahrzeug aendern, aber ohne Token', async () => {
        // given
        const headers = new Headers({
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFahrzeug);
        const request = new Request(`${fahrzeugeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
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

    test('Vorhandenes Fahrzeug aendern, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFahrzeug);
        const request = new Request(`${fahrzeugeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
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
