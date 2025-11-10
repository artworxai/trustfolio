import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://dev.linkedtrust.us';

interface CreateClaimInput {
  subject: string;
  claim: string;
  statement: string;
  effectiveDate: string;
  howKnown: string;
  stars?: number;
  score?: number;
  aspect?: string;
}

// SDK Pattern: Convert 1-5 stars to -1 to 1 score
export function starsToScore(stars: number): number {
  // Formula from SDK: (stars - 2.5) / 2.5
  // 1 star → -0.6, 3 stars → 0.2, 5 stars → 1.0
  return (stars - 2.5) / 2.5;
}

// SDK Pattern: Normalize URI (add https:// if missing)
export function normalizeUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }
  return `https://${uri}`;
}

// Create claim with REAL API
export async function createClaim(claimData: CreateClaimInput, token: string) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims`,
      {
        ...claimData,
        subject: normalizeUri(claimData.subject),
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating claim:', error);
    throw error;
  }
}

// Get claims from REAL API
export async function getClaims(token: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/claims`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching claims:', error);
    throw error;
  }
}

// LOCAL STORAGE FALLBACK (for demo/offline mode)
interface StoredClaim extends CreateClaimInput {
  id: number;
  createdAt: string;
}

export function getLocalClaims(): StoredClaim[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem('trustfolio_claims');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export async function createClaimLocal(claimData: CreateClaimInput): Promise<StoredClaim> {
  const existingClaims = getLocalClaims();
  
  const newClaim: StoredClaim = {
    ...claimData,
    id: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  existingClaims.push(newClaim);
  localStorage.setItem('trustfolio_claims', JSON.stringify(existingClaims));
  
  return newClaim;
}