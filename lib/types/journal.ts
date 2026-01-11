// Standard journal structure untuk semua API
export interface Journal {
    title: string;
    year: number;
    publisher: string;
    journalLink: string;
    abstract: string;
    // Optional fields
    doi?: string;
    authors?: string[];
    citationCount?: number;
    source?: 'openalex' | 'semantic-scholar' | 'core-ac-uk';
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