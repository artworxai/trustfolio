import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://live.linkedtrust.us';

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

interface StoredClaim extends CreateClaimInput {
  id: number;
  createdAt: string;
}

// Helper: Convert 1-5 stars to -1 to 1 score
export function starsToScore(stars: number): number {
  return (stars - 3) / 3;
}

// LOCAL STORAGE FUNCTIONS (for demo without auth)
export async function createClaim(claimData: CreateClaimInput): Promise<StoredClaim> {
  // Get existing claims from localStorage
  const existingClaims = getLocalClaims();
  
  // Create new claim with ID and timestamp
  const newClaim: StoredClaim = {
    ...claimData,
    id: Date.now(), // Use timestamp as unique ID
    createdAt: new Date().toISOString()
  };
  
  // Add to array
  existingClaims.push(newClaim);
  
  // Save back to localStorage
  localStorage.setItem('trustfolio_claims', JSON.stringify(existingClaims));
  
  return newClaim;
}

export function getLocalClaims(): StoredClaim[] {
  if (typeof window === 'undefined') return []; // Server-side guard
  
  const stored = localStorage.getItem('trustfolio_claims');
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function getClaims(subject?: string): StoredClaim[] {
  const claims = getLocalClaims();
  
  if (!subject) return claims;
  
  // Filter by subject if provided
  return claims.filter(claim => claim.subject === subject);
}

// FUTURE: Real API functions (commented out for now)
/*
export async function createClaimAPI(claimData: CreateClaimInput) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/claims`, claimData);
    return response.data;
  } catch (error) {
    console.error('Error creating claim:', error);
    throw error;
  }
}

export async function getClaimsAPI(subject: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/claims`, {
      params: { subject }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching claims:', error);
    throw error;
  }
}
*/