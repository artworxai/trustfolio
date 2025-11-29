'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { fetchClaimsByIssuer, getLocalClaims } from '@/lib/linkedclaims';

interface Claim {
  id: number;
  subject: string;
  claim: string;
  statement: string;
  stars?: number;
  aspect?: string;
  effectiveDate?: string;
  howKnown?: string;
  createdAt?: string;
}

export default function PortfolioPage() {
  const { user, token, logout, isAuthenticated } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'backend' | 'local'>('backend');

  useEffect(() => {
    loadClaims();
  }, [token]);

  const loadClaims = async () => {
    setLoading(true);
    setError('');
    
    try {
      const hasBackendToken = token && token !== 'nextauth_session';
      
      if (isAuthenticated && hasBackendToken && (user?.issuerId || user?.id)) {
        // Try to get claims from backend using user ID (issuer_id)
        const userId = user.issuerId || user.id;
        const response = await fetchClaimsByIssuer(userId, token);
        const backendClaims = response.claims || [];
        setClaims(backendClaims);
        setMode('backend');
      } else {
        // Fall back to localStorage for OAuth users or unauthenticated users
        const localClaims = getLocalClaims();
        setClaims(localClaims);
        setMode('local');
      }
    } catch (err: any) {
      console.error('Error loading claims:', err);
      // Fall back to localStorage on error
      const localClaims = getLocalClaims();
      setClaims(localClaims);
      setMode('local');
      setError('Using local data (backend unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (stars?: number) => {
    if (!stars) return null;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= stars ? 'text-yellow-400' : 'text-gray-300'}>
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const getClaimEmoji = (aspect?: string) => {
    if (!aspect) return '🚀';
    const lower = aspect.toLowerCase();
    if (lower.includes('typescript') || lower.includes('javascript')) return '💻';
    if (lower.includes('react') || lower.includes('next')) return '⚛️';
    if (lower.includes('python')) return '🐍';
    if (lower.includes('design')) return '🎨';
    if (lower.includes('ai') || lower.includes('ml')) return '🤖';
    return '🚀';
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Loading your portfolio...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {isAuthenticated ? `${user?.name || user?.email}'s Portfolio` : 'Your Portfolio'}
            </h1>
            <p className="text-gray-600">
              {claims.length} achievement{claims.length !== 1 ? 's' : ''} recorded
            </p>
            {mode === 'local' && token === 'nextauth_session' && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📱 OAuth User:</strong> Your achievements are saved locally in your browser.
                  <br />
                  <span className="text-xs">Backend OAuth integration coming soon! For now, use email/password login to sync to LinkedTrust.</span>
                </p>
              </div>
            )}
            {mode === 'local' && token !== 'nextauth_session' && (
              <p className="text-sm text-orange-600 mt-1">
                📦 Local Storage Mode - Sign in to sync to backend
              </p>
            )}
            {mode === 'backend' && (
              <p className="text-sm text-green-600 mt-1">
                ✅ Connected to LinkedTrust Backend
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              + Add Achievement
            </Link>
            {isAuthenticated && (
              <button
                onClick={logout}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <div className="mb-6">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            ← Home
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            {error}
          </div>
        )}

        {/* Claims Grid */}
        {claims.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No achievements yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start building your portfolio by creating your first claim!
            </p>
            <Link
              href="/create"
              className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create First Achievement
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{getClaimEmoji(claim.aspect)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {claim.aspect || 'Project'}
                      </h3>
                      {renderStars(claim.stars)}
                    </div>
                    <p className="text-gray-700 mb-3">{claim.statement}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      {claim.howKnown && (
                        <span className="bg-gray-100 px-3 py-1 rounded-full">
                          {claim.howKnown.replace('_', ' ')}
                        </span>
                      )}
                      {claim.effectiveDate && (
                        <span>📅 Created: {new Date(claim.effectiveDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 p-6 bg-white rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            About Your Portfolio
          </h3>
          <p className="text-gray-600">
            Your achievements are {mode === 'backend' ? 'stored on the LinkedTrust network' : 'saved locally in your browser'}.
            {mode === 'backend' 
              ? ' They are verifiable and can be shared with others.'
              : ' Sign in with email/password to sync them to the LinkedTrust backend.'}
          </p>
        </div>
      </div>
    </main>
  );
}