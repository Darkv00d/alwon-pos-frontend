// Helper function to make authenticated API requests to Java backend
export async function authenticatedFetch(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    // Get API URL from env.json
    const envResponse = await fetch('/env.json');
    const env = await envResponse.json();
    const API_URL = env.API_URL || 'http://localhost:8080/api';

    // Get token from localStorage
    const token = localStorage.getItem('alwon_auth_token');

    // Merge headers with authorization
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    // Make the request
    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
}

// Helper to get API URL
export async function getApiUrl(): Promise<string> {
    const envResponse = await fetch('/env.json');
    const env = await envResponse.json();
    return env.API_URL || 'http://localhost:8080/api';
}
