// Auth helpers for the SysTracker dashboard
// Token is stored in localStorage (appropriate for self-hosted LAN tool)

const TOKEN_KEY = 'systracker_token';
const USERNAME_KEY = 'systracker_username';

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, username: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
}

export function clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
}

export function getUsername(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(USERNAME_KEY);
}

export function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

export function isAuthenticated(): boolean {
    const token = getToken();
    if (!token) return false;
    return !isTokenExpired(token);
}

// Fetch wrapper that automatically adds Authorization header
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = getToken();
    return fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });
}
