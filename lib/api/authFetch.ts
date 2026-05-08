export interface ApiFetchOptions extends RequestInit {
    skipAuth?: boolean;
}

export type AccessTokenGetter = () => Promise<string | null>;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export function buildAuthedFetch(getAccessToken: AccessTokenGetter) {
    return async function apiFetch<T>(
        path: string,
        options: ApiFetchOptions = {},
    ): Promise<T> {
        const headers = new Headers(options.headers);

        if (!options.skipAuth) {
            const token = await getAccessToken();
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }
        }

        if (!headers.has("Content-Type") && options.body) {
            headers.set("Content-Type", "application/json");
        }

        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Request failed");
        }

        return response.json() as Promise<T>;
    };
}
