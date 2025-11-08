'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLocalClaims } from '@/lib/linkedclaims';

interface StoredClaim {
  id: number;
  subject: string;
  claim: string;
  statement: string;
  effectiveDate: string;
  howKnown: string;
  stars?: number;
  score?: number;
  aspect?: string;
  createdAt: string;
}

export default function PortfolioPage() {
  const [claims, setClaims] = useState<StoredClaim[]>([]);

  useEffect(() => {
    // Load claims from localStorage when component mounts
    const loadedClaims = getLocalClaims();
    setClaims(loadedClaims);
  }, []);

  const getCategoryEmoji = (aspect?: string) => {
    switch (aspect) {
      case 'project': return '🚀';
      case 'skill': return '💡';
      case 'certification': return '📜';
      default: return '✨';
    }
  };

  const getStars = (stars?: number) => {
    if (!stars) return '';
    return '⭐'.repeat(stars);
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Your Portfolio
            </h1>
            <p className="text-gray-600">
              {claims.length} achievement{claims.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="space-x-4">
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition inline-block"
            >
              + Add Achievement
            </Link>
            <Link
              href="/"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition inline-block border border-indigo-600"
            >
              ← Home
            </Link>
          </div>
        </div>

        {claims.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No achievements yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start building your verifiable portfolio by creating your first achievement!
            </p>
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition inline-block"
            >
              Create Your First Achievement
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">
                    {getCategoryEmoji(claim.aspect)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(claim.effectiveDate).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                  {claim.aspect || claim.claim}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {claim.statement}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-yellow-500">
                    {getStars(claim.stars)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {claim.howKnown.replace('_', ' ')}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Created: {new Date(claim.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            💡 About Your Portfolio
          </h3>
          <p className="text-gray-600 text-sm">
            Each achievement is stored locally in your browser. In the future, these can be:
          </p>
          <ul className="list-disc list-inside text-gray-600 text-sm mt-2 space-y-1">
            <li>Published to the LinkedTrust network</li>
            <li>Shared with employers via unique links</li>
            <li>Exported to PDF or LinkedIn</li>
            <li>Verified by others</li>
          </ul>
        </div>
      </div>
    </main>
  );
}