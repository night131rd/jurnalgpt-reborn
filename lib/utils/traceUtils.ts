export function shouldTraceFullPayload(): boolean {
    // Default to false in production, true otherwise (or control via explicit env var)
    if (process.env.ENABLE_FULL_TRACING === 'true') {
        return true;
    }
    if (process.env.NODE_ENV === 'production') {
        return false;
    }
    return true; // Default to true for dev
}

/**
 * Formats a list of journals for OpenInference compatibility
 * Returns an array of JSON-stringified document objects (OTel compatible array)
 */
export function traceDocuments(journals: any[]): string[] {
    if (!journals || journals.length === 0) return [];

    if (!shouldTraceFullPayload()) {
        return [JSON.stringify({
            _summary: `[${journals.length} items] (Full payload hidden in production)`
        })];
    }

    return journals.map((j, idx) => JSON.stringify({
        id: j.id || `doc_${idx}`,
        content: j.abstract || j.text || '',
        metadata: {
            title: j.title || '',
            authors: j.authors || [],
            year: j.year || '',
            doi: j.doi || '',
            url: j.url || ''
        }
    }));
}

export function tracePayload(data: any): string {
    if (shouldTraceFullPayload()) {
        if (typeof data === 'string') return data;
        return JSON.stringify(data);
    }

    // Production mode: Truncate or summarize
    if (Array.isArray(data)) {
        return JSON.stringify({
            _summary: `[${data.length} items] (Full payload hidden in production)`,
            preview: data.slice(0, 3) // Show first 3 as sample
        });
    }

    if (typeof data === 'string') {
        if (data.length > 500) {
            return data.substring(0, 500) + '... [TRUNCATED]';
        }
        return data;
    }

    return JSON.stringify({
        _summary: '(Payload hidden in production)',
        preview: 'Set ENABLE_FULL_TRACING=true to see full data'
    });
}
