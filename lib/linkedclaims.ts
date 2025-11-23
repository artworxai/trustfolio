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
  issuerId?: string;
}

// SDK Pattern: Convert 1-5 stars to -1 to 1 score
export function starsToScore(stars: number): number {
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

// Create claim with REAL API v4
export async function createClaim(claimData: CreateClaimInput, token: string) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/claims`,
      {
        ...claimData,
        subject: normalizeUri(claimData.subject),
        score: claimData.stars ? starsToScore(claimData.stars) : claimData.score,
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

// Get claims from REAL API v4 by subject URI
export async function getClaims(token: string, subjectUri?: string) {
  try {
    const endpoint = subjectUri 
      ? `${API_BASE_URL}/api/v4/claims/subject/${encodeURIComponent(subjectUri)}`
      : `${API_BASE_URL}/api/v4/claims`;
      
    const response = await axios.get(endpoint, {
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

// Fetch claims by issuer ID (the correct way according to Golda!)
export async function fetchClaimsByIssuer(userId: number, token: string) {
  try {
    console.log('Fetching claims by issuer ID:', userId);
    
    const response = await axios.get(
      `${API_BASE_URL}/api/claim`,
      {
        params: {
          issuer_id: `http://trustclaims.whatscookin.us/user/${userId}`,
          limit: 50,
          page: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    console.log('Claims found:', response.data.claims ? response.data.claims.length : 0);
    console.log('Response data:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching claims by issuer:', error);
    throw error;
  }
}

// Get claims by current user (uses the authenticated user's URI)
export async function getMyClaimsFromBackend(token: string, userEmail: string) {
  try {
    // Construct the subject URI from user email (pattern from talent repo)
    const subjectUri = `https://dev.linkedtrust.us/user/${userEmail}`;
    
    // URL encode the URI (similar to Base64 encoding in talent repo)
    const encodedUri = encodeURIComponent(subjectUri);
    
    console.log('Fetching claims for subject:', subjectUri);
    console.log('Encoded URI:', encodedUri);
    
    // Get claims for this subject
    const response = await axios.get(
      `${API_BASE_URL}/api/v4/claims/subject/${encodedUri}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    console.log('Raw API Response:', response);
    console.log('Response data:', response.data);
    console.log('Response data type:', typeof response.data);
    console.log('Is response.data an array?:', Array.isArray(response.data));

    // Handle different response formats
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && response.data.claims) {
      return response.data.claims; // Might be wrapped in { claims: [...] }
    } else {
      console.error('Unexpected response format:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching my claims:', error);
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