import type { Journal } from '@/lib/types/journal';

export function mergeAndDeduplicate(journals: Journal[]): Journal[] {
    // Use Map to track unique journals by normalized title
    const uniqueMap = new Map<string, Journal>();

    for (const journal of journals) {
        const normalizedTitle = journal.title.toLowerCase().trim();

        // If duplicate found, keep the one with better quality
        if (uniqueMap.has(normalizedTitle)) {
            const existing = uniqueMap.get(normalizedTitle)!;

            // Priority: higher citation count, then non-null abstract
            const shouldReplace =
                (journal.citationCount || 0) > (existing.citationCount || 0) ||
                ((journal.citationCount || 0) === (existing.citationCount || 0) &&
                    journal.abstract && journal.abstract !== 'No abstract available' &&
                    (!existing.abstract || existing.abstract === 'No abstract available'));

            if (shouldReplace) {
                uniqueMap.set(normalizedTitle, journal);
            }
        } else {
            uniqueMap.set(normalizedTitle, journal);
        }
    }

    // Convert Map back to array and sort by citation count (descending)
    return Array.from(uniqueMap.values())
        .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
}
