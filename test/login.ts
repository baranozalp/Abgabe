import { HttpMethod, agent } from './testserver';
import fetch, { Headers, Request } from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const { env } = process;
const { USER_PASSWORD } = env; // eslint-disable-line @typescript-eslint/naming-convention

const username = 'admin';
const password = USER_PASSWORD as string;

export const login = async (
    loginUri: string,
    credentials = { username, password },
) => {
    let headers = new Headers({
        'Content-type': 'application/x-www-form-urlencoded',
    });
    let body = `username=${credentials.username}&password=${credentials.password}`;
    let request = new Request(loginUri, {
        method: HttpMethod.POST,
        headers,
        body,
        agent,
    });
    let response = await fetch(request);
    const { token } = await response.json();
    return token;
};
