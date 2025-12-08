/**
 * Public Portfolio Page Component
 * 
 * Public-facing view of user portfolios accessible via /p/[username].
 * This page displays achievements in a read-only format for sharing.
 * 
 * Features:
 * - View-only achievement display
 * - Public stats dashboard
 * - No edit/delete capabilities (public view)
 * - "Create Your Own Portfolio" CTA
 * - Shareable URL format: /p/username
 * 
 * @component
 * @author Dana Martinez
 * @since December 2025
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getLocalClaims } from '@/lib/linkedclaims';

/**
 * Achievement/Claim data structure
 * 
 * @interface Claim
 * @property {number} id - Unique identifier
 * @property {string} subject - Subject of the claim
 * @property {string} claim - Claim type
 * @property {string} statement - Achievement description
 * @property {number} [stars] - Rating (1-5 stars)
 * @property {string} [aspect] - Category type
 * @property {string} [effectiveDate] - Date earned
 * @property {string} [howKnown] - Verification method
 * @property {string} [createdAt] - Creation timestamp
 */
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

/**
 * Public Portfolio Page Component
 * 
 * Displays a user's portfolio publicly based on username from URL parameter.
 * Username is extracted from email (part before @).
 * 
 * Example URLs:
 * - /p/dana (for dana@example.com)
 * - /p/john (for john@example.com)
 * 
 * @returns {JSX.Element} Public portfolio page
 */
export default function PublicPortfolioPage() {
  // Extract username from URL parameters
  const params = useParams();
  const username = params.username as string;
  
  // State management
  const [claims, setClaims] = useState<Claim[]>([]);      // User's achievements
  const [loading, setLoading] = useState(true);            // Loading state
  const [userDisplayName, setUserDisplayName] = useState(''); // Formatted display name

  /**
   * Load public portfolio data when component mounts or username changes
   */
  useEffect(() => {
    loadPublicPortfolio();
  }, [username]);

  /**
   * Load public portfolio achievements
   * 
   * Currently loads from localStorage. In a production app, this would:
   * 1. Make an API call to fetch user's public achievements
   * 2. Filter by username parameter
   * 3. Return only publicly visible achievements
   * 
   * @async
   * @function loadPublicPortfolio
   * @returns {Promise<void>}
   */
  const loadPublicPortfolio = async () => {
    setLoading(true);
    
    try {
      // For demo purposes, use localStorage
      // TODO: In production, fetch from public API endpoint
      const localClaims = getLocalClaims();
      setClaims(localClaims);
      
      // Format username for display (capitalize first letter)
      setUserDisplayName(username.charAt(0).toUpperCase() + username.slice(1));
    } catch (error) {
      console.error('Error loading public portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render star rating display
   * 
   * Shows filled stars for rating value, gray stars for remainder.
   * Returns null if no rating provided.
   * 
   * @function renderStars
   * @param {number} [stars] - Rating value (1-5)
   * @returns {JSX.Element|null} Star rating component or null
   */
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

  /**
   * Get appropriate emoji for achievement aspect/category
   * 
   * Returns tech-specific emojis based on achievement type.
   * Used for visual categorization of achievements.
   * 
   * @function getClaimEmoji
   * @param {string} [aspect] - Achievement category/type
   * @returns {string} Emoji character
   */
  const getClaimEmoji = (aspect?: string) => {
    if (!aspect) return '🚀';
    const lower = aspect.toLowerCase();
    
    // Technology-specific emojis
    if (lower.includes('typescript') || lower.includes('javascript')) return '💻';
    if (lower.includes('react') || lower.includes('next')) return '⚛️';
    if (lower.includes('python')) return '🐍';
    if (lower.includes('design')) return '🎨';
    if (lower.includes('ai') || lower.includes('ml')) return '🤖';
    
    return '🚀';
  };

  /**
   * Calculate analytics from achievements
   * 
   * Computes:
   * - Total achievement count
   * - Average rating across all achievements
   * - Top 3 categories by count
   * 
   * @function calculateAnalytics
   * @returns {Object} Analytics object with computed stats
   */
  const calculateAnalytics = () => {
    const totalAchievements = claims.length;
    
    // Calculate average rating
    const averageRating = claims.length > 0
      ? (claims.reduce((sum, claim) => sum + (claim.stars || 0), 0) / claims.length).toFixed(1)
      : '0.0';
    
    // Count achievements by category
    const categoryBreakdown: { [key: string]: number } = {};
    claims.forEach(claim => {
      const category = claim.aspect || 'project';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
    });
    
    // Get top 3 categories sorted by count
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    return {
      totalAchievements,
      averageRating,
      categoryBreakdown: sortedCategories,
    };
  };

  /**
   * Get emoji for achievement category
   * 
   * Maps standard achievement categories to emojis for display.
   * 
   * @function getCategoryEmoji
   * @param {string} category - Achievement category name
   * @returns {string} Emoji character
   */
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

  // Show loading state
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
        {/* Portfolio Header */}
        <div className="mb-8 text-center">
          {/* User Avatar */}
          <div className="inline-block bg-white rounded-full p-6 shadow-lg mb-4">
            <div className="text-6xl">👤</div>
          </div>
          
          {/* User Name and Stats */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {userDisplayName}'s Portfolio
          </h1>
          <p className="text-gray-600 mb-4">
            {claims.length} achievement{claims.length !== 1 ? 's' : ''} • ⭐ {analytics.averageRating} avg rating
          </p>
          
          {/* CTA Button */}
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Create Your Own Portfolio
            </Link>
          </div>
        </div>

        {/* Quick Stats Section - Only shown if achievements exist */}
        {claims.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Achievements */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-indigo-900">{analytics.totalAchievements}</div>
                <div className="text-sm text-indigo-700">Achievements</div>
              </div>
              
              {/* Average Rating */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-yellow-900">{analytics.averageRating}</div>
                <div className="text-sm text-yellow-700">Avg Rating</div>
              </div>
              
              {/* Top Category */}
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

        {/* Achievements List */}
        {claims.length === 0 ? (
          /* Empty State - No achievements */
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
          /* Achievement Cards Grid */
          <div className="grid gap-6">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Achievement Icon */}
                  <div className="text-4xl">{getClaimEmoji(claim.aspect)}</div>
                  
                  {/* Achievement Content */}
                  <div className="flex-1">
                    {/* Title and Rating */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900 capitalize">
                        {claim.aspect || 'Project'}
                      </h3>
                      {renderStars(claim.stars)}
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-700 mb-3">{claim.statement}</p>
                    
                    {/* Metadata Tags */}
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

        {/* Footer CTA Section */}
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
