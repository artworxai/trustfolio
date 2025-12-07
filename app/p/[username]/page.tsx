'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getLocalClaims } from '@/lib/linkedclaims';

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

export default function PublicPortfolioPage() {
  const params = useParams();
  const username = params.username as string;
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState('');

  useEffect(() => {
    loadPublicPortfolio();
  }, [username]);

  const loadPublicPortfolio = async () => {
    setLoading(true);
    
    try {
      // For now, we'll use localStorage
      // In a real app, this would fetch from a public API endpoint
      const localClaims = getLocalClaims();
      setClaims(localClaims);
      
      // Extract display name from username
      setUserDisplayName(username.charAt(0).toUpperCase() + username.slice(1));
    } catch (error) {
      console.error('Error loading public portfolio:', error);
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

  const calculateAnalytics = () => {
    const totalAchievements = claims.length;
    const averageRating = claims.length > 0
      ? (claims.reduce((sum, claim) => sum + (claim.stars || 0), 0) / claims.length).toFixed(1)
      : '0.0';
    
    const categoryBreakdown: { [key: string]: number } = {};
    claims.forEach(claim => {
      const category = claim.aspect || 'project';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });
    
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    return {
      totalAchievements,
      averageRating,
      categoryBreakdown: sortedCategories,
    };
  };

  const getCategoryEmoji = (category: string) => {
    const emojiMap: { [key: string]: string } = {
      'project': '📁',
      'skill': '💡',
      'certification': '🎓',
      'course': '📚',
      'award': '🏆',
      'publication': '📝',
      'volunteer': '❤️',
      'hackathon': '💻',
      'research': '🔬',
      'presentation': '🎤',
    };
    return emojiMap[category] || '🚀';
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Loading portfolio...</p>
        </div>
      </main>
    );
  }

  const analytics = calculateAnalytics();

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-block bg-white rounded-full p-6 shadow-lg mb-4">
            <div className="text-6xl">👤</div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {userDisplayName}'s Portfolio
          </h1>
          <p className="text-gray-600 mb-4">
            {claims.length} achievement{claims.length !== 1 ? 's' : ''} • ⭐ {analytics.averageRating} avg rating
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create Your Own Portfolio
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        {claims.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-indigo-900">{analytics.totalAchievements}</div>
                <div className="text-sm text-indigo-700">Achievements</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-yellow-900">{analytics.averageRating}</div>
                <div className="text-sm text-yellow-700">Avg Rating</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">
                  {analytics.categoryBreakdown.length > 0 && getCategoryEmoji(analytics.categoryBreakdown[0][0])}
                </div>
                <div className="text-2xl font-bold text-green-900 capitalize">
                  {analytics.categoryBreakdown.length > 0 ? analytics.categoryBreakdown[0][0] : 'N/A'}
                </div>
                <div className="text-sm text-green-700">Top Category</div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements */}
        {claims.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-md">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              No achievements yet
            </h2>
            <p className="text-gray-600">
              This portfolio is empty. Check back later!
            </p>
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
                      <h3 className="text-xl font-bold text-gray-900 capitalize">
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
                        <span>📅 {new Date(claim.effectiveDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 p-6 bg-white rounded-xl shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Build Your Own Portfolio
          </h3>
          <p className="text-gray-600 mb-4">
            Create and showcase your achievements with TrustFolio
          </p>
          <Link
            href="/register"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </main>
  );
}