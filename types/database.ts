export interface Resource {
  id: string;
  title: string;
  url: string;
  type: 'blog' | 'video' | 'article' | 'book' | 'talk' | 'podcast' | 'handbook' | 'repo';
  topics: string[];
  description?: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  headquarters?: string;
  description?: string;
  website?: string;
  resources: Resource[];
  meta: {
    totalResources: number;
    contributors: string[];
    addedDate?: string;
    lastUpdated?: string;
  };
}

export interface DatabaseMeta {
  version: string;
  generatedAt: string;
  totalCompanies: number;
  totalResources: number;
  industries: string[];
  topics: string[];
  resourceTypes: Record<string, number>;
}

export interface Database {
  meta: DatabaseMeta;
  companies: Company[];
}
