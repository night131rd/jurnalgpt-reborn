export async function getGoogleSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];

    try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Google suggestions:', error);
        return [];
    }
}
