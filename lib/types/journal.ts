// Standard journal structure untuk semua API
export interface Journal {
    title: string;
    year: number;
    publisher: string;
    journalLink: string;
    abstract: string;
    // Optional fields
    doi?: string;
    pdfLink?: string;           // Direct link to PDF (if available)
    authors?: string[];
    citationCount?: number;
    source?: 'openalex' | 'semantic-scholar' | 'core-ac-uk';
    summary?: string;           // LLM-generated concise summary
    correlationScore?: number;  // 0.0-1.0 relevance to query
}

export interface SearchResult {
    answer: string;
    journals: Journal[];
}

// Raw responses dari API eksternal
export interface OpenAlexWork {
    id: string;
    doi: string;
    title: string;
    publication_year: number;
    primary_location: {
        source: { display_name: string };
        pdf_url?: string;
    };
    best_oa_location?: {
        pdf_url?: string;
    };
    abstract_inverted_index: Record<string, number[]>;
    cited_by_count: number;
    authorships: Array<{ author: { display_name: string } }>;
}

export interface SemanticScholarPaper {
    paperId: string;
    title: string;
    year: number;
    abstract: string;
    url: string;
    venue: string;
    citationCount: number;
    authors: Array<{ name: string }>;
    openAccessPdf?: { url: string } | null;
}

export interface CoreWork {
    id: number;
    title: string;
    abstract: string;
    yearPublished: number;
    downloadUrl: string;
    doi: string | undefined;
    authors: Array<{ name: string }>;
    publisher: string;
    createdDate: string;
    citationCount: number;
}