export enum StoreName {
  STEAM = 'Steam',
  GOG = 'GOG',
  EPIC = 'Epic Games',
  HUMBLE = 'Humble Bundle',
  GAMEPASS = 'Xbox/PC Game Pass',
  UNKNOWN = 'Other'
}

export interface Deal {
  id: string;
  store: string;
  edition: string;
  currentPrice: string; // Keep as string to handle currency symbols easily
  originalPrice: string;
  discountPercent: number;
  url: string;
  lastChecked: string;
}

export interface ScanResult {
  deals: Deal[];
  summary: string;
}

export interface GroundingMetadata {
  groundingChunks: {
    web?: {
      uri: string;
      title: string;
    }
  }[];
}
