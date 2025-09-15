export function jsonUtf8(data: any, init?: ResponseInit): Response;
export function okJsonUtf8(data?: any, init?: ResponseInit): Response;
export function errorJsonUtf8(message: string | Error, status?: number, extra?: any): Response;
export {};
