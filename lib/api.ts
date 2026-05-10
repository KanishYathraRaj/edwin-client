import { auth } from './firebase/firebase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function authHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) return {};
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
}

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

export class AuthError extends ApiError {
    constructor(msg: string) { super(401, msg); this.name = 'AuthError'; }
}

export class NetworkError extends Error {
    constructor(msg: string) { super(msg); this.name = 'NetworkError'; }
}

async function handleResponse(res: Response) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.error || `Request failed: ${res.status}`;
        if (res.status === 401) throw new AuthError(message);
        throw new ApiError(res.status, message);
    }
    return res.json();
}

export async function apiPost(path: string, body: Record<string, unknown>) {
    const headers = await authHeaders();
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body),
        });
        return handleResponse(res);
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new NetworkError(err instanceof Error ? err.message : 'Network request failed');
    }
}

export async function apiPostForm(path: string, form: FormData) {
    const headers = await authHeaders();
    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: form,
        });
        return handleResponse(res);
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new NetworkError(err instanceof Error ? err.message : 'Network request failed');
    }
}

export async function apiGet(path: string) {
    const headers = await authHeaders();
    try {
        const res = await fetch(`${BASE_URL}${path}`, { method: 'GET', headers });
        return handleResponse(res);
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new NetworkError(err instanceof Error ? err.message : 'Network request failed');
    }
}

export async function apiDelete(path: string) {
    const headers = await authHeaders();
    try {
        const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
        return handleResponse(res);
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new NetworkError(err instanceof Error ? err.message : 'Network request failed');
    }
}

export async function apiStream(
    path: string,
    body: Record<string, unknown>,
    onChunk: (text: string) => void
): Promise<void> {
    const headers = await authHeaders();
    let res: Response;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(body),
        });
    } catch (err) {
        throw new NetworkError(err instanceof Error ? err.message : 'Network request failed');
    }

    if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        const message = err.error || 'Stream failed';
        if (res.status === 401) throw new AuthError(message);
        throw new ApiError(res.status, message);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'chunk' && data.content) onChunk(data.content);
            } catch {
                // skip malformed lines
            }
        }
    }
}
