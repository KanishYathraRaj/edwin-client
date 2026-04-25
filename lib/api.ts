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

async function handleResponse(res: Response) {
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.error || `Request failed: ${res.status}`);
    }
    return res.json();
}

export async function apiPost(path: string, body: Record<string, unknown>) {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
    return handleResponse(res);
}

export async function apiPostForm(path: string, form: FormData) {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        body: form,
    });
    return handleResponse(res);
}

export async function apiDelete(path: string) {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers });
    return handleResponse(res);
}

export async function apiStream(
    path: string,
    body: Record<string, unknown>,
    onChunk: (text: string) => void
): Promise<void> {
    const headers = await authHeaders();
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });

    if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new ApiError(res.status, err.error || 'Stream failed');
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
