export class APIError extends Error {
    public status?: number;
    public data?: any;

    constructor(message: string, status?: number, data?: any) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

export async function fetcher<T = any>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
    });

    // Check if the response is JSON
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await res.json();
    } else {
        data = await res.text();
    }

    if (!res.ok) {
        throw new APIError(
            typeof data === 'string' ? data : (data?.error || res.statusText),
            res.status,
            data
        );
    }

    // Our new standard API wrapper returns { success: true, data: T }
    // If the success pattern is used, unwrap the data.
    if (data && typeof data === 'object' && 'success' in data) {
        if (!data.success) {
            throw new APIError(data.error || 'API requested failed', res.status, data);
        }
        return data.data; // Specifically extract the payload data
    }

    return data;
}
