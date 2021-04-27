import { agent, createTestserver, HttpMethod } from '../../testserver';
import { HttpStatus, nodeConfig } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
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
const id = '00000000-0000-0000-0000-000000000005';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.fahrzeuge;
let fahrzeugeUri: string;
let loginUri: string;

// Test-Suite
describe('DELETE /api/fahrzeuge', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${nodeConfig.host}:${address.port}`;
        fahrzeugeUri = `${baseUri}${path}`;
        loginUri = `${baseUri}${PATHS.login}`;
    });

    afterAll(() => {
        server.close();
    });

    test('Vorhandenes Fahrzeug loeschen', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({ Authorization: `Bearer ${token}` });
        const request = new Request(`${fahrzeugeUri}/${id}`, {
            method: HttpMethod.DELETE,
            headers,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.NO_CONTENT);
        const responseBody = await response.text();
        expect(responseBody).to.be.empty;
    });

    test('Fahrzeug loeschen, aber ohne Token', async () => {
        // given
        const request = new Request(`${fahrzeugeUri}/${id}`, {
            method: HttpMethod.DELETE,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });

    test('Fahrzeug loeschen, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({ Authorization: `Bearer ${token}` });
        const request = new Request(`${fahrzeugeUri}/${id}`, {
            method: HttpMethod.DELETE,
            headers,
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
