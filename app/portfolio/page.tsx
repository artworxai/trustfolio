/**
 * Portfolio Page Component
 * 
 * Main dashboard for viewing, managing, and analyzing user achievements.
 * 
 * Features:
 * - Display all user achievements with filtering and sorting
 * - Analytics dashboard with statistics and visualizations
 * - Search functionality for finding specific achievements
 * - Category filtering (Project, Skill, Certification, etc.)
 * - Export achievements to JSON file
 * - Import achievements from JSON file
 * - Public portfolio sharing with copy-to-clipboard
 * - Delete achievements with confirmation
 * - Supports both backend (LinkedTrust) and localStorage modes
 * 
 * @component
 * @author Dana Martinez
 * @since December 2025
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { fetchClaimsByIssuer, getLocalClaims } from '@/lib/linkedclaims';

/**
 * Achievement/Claim data structure
 * 
 * @interface Claim
 * @property {number} id - Unique identifier for the claim
 * @property {string} subject - Subject of the claim (user ID)
 * @property {string} claim - Claim type/identifier
 * @property {string} statement - Description of the achievement
 * @property {number} [stars] - Rating from 1-5 stars (optional)
 * @property {string} [aspect] - Category/type of achievement (project, skill, etc.)
 * @property {string} [effectiveDate] - Date the achievement was earned
 * @property {string} [howKnown] - How the achievement was verified
 * @property {string} [createdAt] - Timestamp when created
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
 * Main Portfolio Page Component
 * 
 * Displays user's achievement portfolio with comprehensive management features.
 * Automatically detects if user has backend access or uses localStorage fallback.
 * 
 * @returns {JSX.Element} Portfolio dashboard page
 */
export default function PortfolioPage() {
  // Authentication context - provides user info, token, and auth methods
  const { user, token, logout, isAuthenticated } = useAuth();
  
  // State management
  const [claims, setClaims] = useState<Claim[]>([]);           // All achievements
  const [loading, setLoading] = useState(true);                 // Loading indicator
  const [error, setError] = useState('');                       // Error messages
  const [mode, setMode] = useState<'backend' | 'local'>('backend'); // Data source mode
  const [searchQuery, setSearchQuery] = useState('');           // Search filter
  const [categoryFilter, setCategoryFilter] = useState('all');  // Category filter
  const [sortBy, setSortBy] = useState('date-desc');            // Sort option

  /**
   * Load achievements on component mount and when token changes
   */
  useEffect(() => {
    loadClaims();
  }, [token]);

  /**
   * Load achievements from backend or localStorage
   * 
   * Attempts to load from LinkedTrust backend first if user has valid token.
   * Falls back to localStorage if backend is unavailable or user is not authenticated.
   * 
   * @async
   * @function loadClaims
   * @returns {Promise<void>}
   */
  const loadClaims = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check if user has a valid backend token (not NextAuth session token)
      const hasBackendToken = token && token !== 'nextauth_session';
      
      if (isAuthenticated && hasBackendToken && (user?.issuerId || user?.id)) {
        // Try loading from LinkedTrust backend
        const userId = user.issuerId || user.id;
        const response = await fetchClaimsByIssuer(userId, token);
        const backendClaims = response.claims || [];
        setClaims(backendClaims);
        setMode('backend');
      } else {
        // Fall back to localStorage
        const localClaims = getLocalClaims();
        setClaims(localClaims);
        setMode('local');
      }
    } catch (err: any) {
      console.error('Error loading claims:', err);
      // On error, fall back to localStorage
      const localClaims = getLocalClaims();
      setClaims(localClaims);
      setMode('local');
      setError('Using local data (backend unavailable)');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an achievement with user confirmation
   * 
   * Deletes from backend if in backend mode, otherwise removes from localStorage.
   * Shows confirmation dialog before deletion to prevent accidental data loss.
   * 
   * @async
   * @function deleteClaim
   * @param {number} claimId - ID of the achievement to delete
   * @returns {Promise<void>}
   */
  const deleteClaim = async (claimId: number) => {
    // Confirm deletion to prevent accidents
    const confirmDelete = confirm('Are you sure you want to delete this achievement? This action cannot be undone.');
    
    if (!confirmDelete) return;
    
    try {
      if (mode === 'backend' && token && token !== 'nextauth_session') {
        // Delete from LinkedTrust backend
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/claims/${claimId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to delete from backend');
        
        alert('Achievement deleted successfully! 🗑️');
      } else {
        // Delete from localStorage
        const localClaims = getLocalClaims();
        const updatedClaims = localClaims.filter(claim => claim.id !== claimId);
        localStorage.setItem('trustfolio_claims', JSON.stringify(updatedClaims));
        
        alert('Achievement deleted from local storage! 🗑️');
      }
      
      // Reload achievements to reflect deletion
      loadClaims();
    } catch (error) {
      console.error('Error deleting claim:', error);
      alert('Failed to delete achievement. Please try again.');
    }
  };

  /**
   * Filter and sort achievements based on user selections
   * 
   * Applies search query, category filter, and sort order to achievements list.
   * Search is case-insensitive and searches both statement and aspect fields.
   * 
   * @function filteredAndSortedClaims
   * @returns {Claim[]} Filtered and sorted array of achievements
   */
  const filteredAndSortedClaims = () => {
    let filtered = [...claims];
    
    // Apply search query filter (case-insensitive)
    if (searchQuery.trim()) {
      filtered = filtered.filter(claim => 
        claim.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.aspect?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(claim => claim.aspect === categoryFilter);
    }
    
    // Apply sort order
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') {
        // Newest first
        return new Date(b.effectiveDate || '').getTime() - new Date(a.effectiveDate || '').getTime();
      } else if (sortBy === 'date-asc') {
        // Oldest first
        return new Date(a.effectiveDate || '').getTime() - new Date(b.effectiveDate || '').getTime();
      } else if (sortBy === 'rating-desc') {
        // Highest rated first
        return (b.stars || 0) - (a.stars || 0);
      } else if (sortBy === 'rating-asc') {
        // Lowest rated first
        return (a.stars || 0) - (b.stars || 0);
      }
      return 0;
    });
    
    return filtered;
  };

  /**
   * Export achievements to JSON file
   * 
   * Creates a downloadable JSON file containing all achievements.
   * File is named with current date for easy organization.
   * 
   * @function exportAchievements
   * @returns {void}
   */
  const exportAchievements = () => {
    // Get data from current mode (backend or local)
    const dataToExport = mode === 'backend' ? claims : getLocalClaims();
    
    // Convert to formatted JSON
    const dataStr = JSON.stringify(dataToExport, null, 2);
    
    // Create downloadable blob
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    // Trigger download with date-stamped filename
    const link = document.createElement('a');
    link.href = url;
    link.download = `trustfolio-achievements-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // Clean up object URL
    URL.revokeObjectURL(url);
    alert('✅ Achievements exported successfully!');
  };

  /**
   * Import achievements from JSON file
   * 
   * Reads uploaded JSON file and merges achievements with existing data.
   * Validates file format and shows confirmation before importing.
   * Generates new IDs to prevent conflicts with existing achievements.
   * 
   * @function importAchievements
   * @param {React.ChangeEvent<HTMLInputElement>} event - File input change event
   * @returns {void}
   */
  const importAchievements = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        // Parse uploaded JSON
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validate file format
        if (!Array.isArray(importedData)) {
          alert('❌ Invalid file format. Please upload a valid JSON file.');
          return;
        }

        // Confirm import with user
        const confirmImport = confirm(
          `Import ${importedData.length} achievements?\n\n` +
          `This will ADD to your existing ${claims.length} achievements.\n\n` +
          `Click OK to continue or Cancel to abort.`
        );

        if (confirmImport) {
          // Get existing data and find max ID
          const existingClaims = getLocalClaims();
          const maxId = Math.max(0, ...existingClaims.map(c => c.id));
          
          // Assign new IDs to imported achievements to avoid conflicts
          const newClaims = importedData.map((claim, index) => ({
            ...claim,
            id: maxId + index + 1,
          }));
          
          // Merge and save to localStorage
          const mergedClaims = [...existingClaims, ...newClaims];
          localStorage.setItem('trustfolio_claims', JSON.stringify(mergedClaims));
          
          alert(`✅ Successfully imported ${importedData.length} achievements!`);
          loadClaims(); // Reload to show imported data
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('❌ Error importing file. Please check the file format.');
      }
    };
    
    reader.readAsText(file);
    
    // Clear file input for next import
    event.target.value = '';
  };

  /**
   * Calculate analytics data from achievements
   * 
   * Computes various statistics including:
   * - Total achievement count
   * - Average rating
   * - Category breakdown (top 5)
   * - Rating distribution (1-5 stars)
   * - Top category
   * 
   * @function calculateAnalytics
   * @returns {Object} Analytics object with computed statistics
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
    
    // Get top 5 categories sorted by count
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    
    // Count achievements by star rating (1-5)
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    claims.forEach(claim => {
      const rating = claim.stars || 0;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });
    
    // Determine top category (most achievements)
    const topCategory = sortedCategories.length > 0
      ? sortedCategories[0][0]
      : 'project';
    
    return {
      totalAchievements,
      averageRating,
      categoryBreakdown: sortedCategories,
      ratingDistribution,
      topCategory,
    };
  };

  const analytics = calculateAnalytics();

  /**
   * Render star rating display
   * 
   * Displays filled and empty stars based on rating value.
   * 
   * @function renderStars
   * @param {number} [rating=0] - Rating value from 1-5
   * @returns {JSX.Element} Star rating component
   */
  const renderStars = (rating: number = 0) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}>
            ⭐
          </span>
        ))}
      </div>
    );
  };

  /**
   * Get emoji icon for achievement category
   * 
   * Returns a relevant emoji based on the achievement type/category.
   * 
   * @function getClaimEmoji
   * @param {string} [aspect='project'] - Achievement category
   * @returns {string} Emoji character
   */
  const getClaimEmoji = (aspect: string = 'project') => {
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
    return emojiMap[aspect.toLowerCase()] || '📁';
  };

  /**
   * Copy public portfolio link to clipboard
   * 
   * Generates and copies the public portfolio URL to user's clipboard.
   * Username is extracted from email address.
   * 
   * @async
   * @function copyPublicLink
   * @returns {Promise<void>}
   */
  const copyPublicLink = async () => {
    // Extract username from email (part before @)
    const username = user?.email?.split('@')[0] || 'user';
    
    // Generate public portfolio URL
    const publicUrl = `${window.location.origin}/p/${username}`;
    
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(publicUrl);
      alert('✅ Portfolio link copied to clipboard!\n\nShare this link with anyone:\n' + publicUrl);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('❌ Failed to copy link. Please try again.');
    }
  };

  // Show loading state while fetching data
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-700">Loading your achievements...</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {user?.name || 'Dana Martinez'}'s Portfolio
            </h1>
            <p className="text-gray-600">
              {claims.length} achievement{claims.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="flex gap-3">
            {/* Action buttons */}
            <Link
              href="/create"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg"
            >
              + Add Achievement
            </Link>
            <button
              onClick={copyPublicLink}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition shadow-lg flex items-center gap-2"
              title="Share your public portfolio"
            >
              🔗 Share
            </button>
            <button
              onClick={exportAchievements}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
              title="Export achievements to JSON"
            >
              📥 Export
            </button>
            <label className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg cursor-pointer">
              📤 Import
              <input
                type="file"
                accept=".json"
                onChange={importAchievements}
                className="hidden"
              />
            </label>
            <button
              onClick={logout}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition shadow-lg"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="mb-8 flex gap-4">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2">
            ← Home
          </Link>
          <Link href="/settings" className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-2">
            ⚙️ Settings
          </Link>
        </div>

        {/* Analytics Dashboard - Only shown if achievements exist */}
        {claims.length > 0 && (
          <div className="mb-8 bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📊</div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Achievements Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border-2 border-indigo-200">
                <div className="text-4xl mb-3">🎯</div>
                <div className="text-3xl font-bold text-indigo-600 mb-1">
                  {analytics.totalAchievements}
                </div>
                <div className="text-sm font-medium text-indigo-800">
                  Total Achievements
                </div>
              </div>

              {/* Average Rating Card */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border-2 border-yellow-200">
                <div className="text-4xl mb-3">⭐</div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">
                  {analytics.averageRating}
                </div>
                <div className="text-sm font-medium text-yellow-800">
                  Average Rating
                </div>
              </div>

              {/* Top Category Card */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                <div className="text-4xl mb-3">📁</div>
                <div className="text-3xl font-bold text-green-600 mb-1 capitalize">
                  {analytics.topCategory}
                </div>
                <div className="text-sm font-medium text-green-800">
                  Top Category
                </div>
              </div>
            </div>

            {/* Category Breakdown Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Category Breakdown</h3>
                <div className="space-y-3">
                  {analytics.categoryBreakdown.map(([category, count]) => (
                    <div key={category} className="flex items-center gap-3">
                      <div className="text-2xl">{getClaimEmoji(category)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                          <span className="text-sm text-gray-600">{count} ({((count / analytics.totalAchievements) * 100).toFixed(0)}%)</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(count / analytics.totalAchievements) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Distribution Chart */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating Distribution</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="text-center">
                      <div className="text-sm text-gray-600 mb-1">{rating}⭐</div>
                      <div className="bg-gray-200 rounded-lg overflow-hidden" style={{ height: '100px' }}>
                        <div
                          className="bg-yellow-400 w-full transition-all duration-300"
                          style={{
                            height: analytics.totalAchievements > 0
                              ? `${(analytics.ratingDistribution[rating] / analytics.totalAchievements) * 100}%`
                              : '0%',
                            marginTop: 'auto',
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{analytics.ratingDistribution[rating]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter Controls - Only shown if achievements exist */}
        {claims.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Search Achievements
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by keyword or description..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📁 Filter by Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="project">📁 Project</option>
                  <option value="skill">💡 Skill</option>
                  <option value="certification">🎓 Certification</option>
                  <option value="course">📚 Course</option>
                  <option value="award">🏆 Award</option>
                  <option value="publication">📝 Publication</option>
                  <option value="volunteer">❤️ Volunteer</option>
                  <option value="hackathon">💻 Hackathon</option>
                  <option value="research">🔬 Research</option>
                  <option value="presentation">🎤 Presentation</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔢 Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="date-desc">📅 Newest First</option>
                  <option value="date-asc">📅 Oldest First</option>
                  <option value="rating-desc">⭐ Highest Rated</option>
                  <option value="rating-asc">⭐ Lowest Rated</option>
                </select>
              </div>

              {/* Results Counter */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing <strong>{filteredAndSortedClaims().length}</strong> of <strong>{claims.length}</strong> achievements
                </div>
              </div>
            </div>

            {/* Clear Filters Button - Only shown when filters are active */}
            {(searchQuery || categoryFilter !== 'all' || sortBy !== 'date-desc') && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setSortBy('date-desc');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                  🔄 Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Error Message Display */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            {error}
          </div>
        )}

        {/* Empty State - Shown when no achievements exist */}
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
          /* Achievements List - Grid of achievement cards */
          <div className="grid gap-6">
            {filteredAndSortedClaims().map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-transparent hover:border-indigo-200"
              >
                <div className="flex items-start gap-4">
                  {/* Achievement Icon */}
                  <div className="text-4xl">{getClaimEmoji(claim.aspect)}</div>
                  
                  {/* Achievement Content */}
                  <div className="flex-1">
                    {/* Title and Rating */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {claim.aspect || 'Project'}
                      </h3>
                      {renderStars(claim.stars)}
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-700 mb-3">{claim.statement}</p>
                    
                    {/* Metadata and Actions */}
                    <div className="flex justify-between items-center">
                      {/* Metadata Tags */}
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
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/edit/${claim.id}`}
                          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1 rounded-lg transition text-sm font-semibold"
                          title="Edit achievement"
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => deleteClaim(claim.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg transition text-sm font-semibold"
                          title="Delete achievement"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Footer - Shows data storage mode */}
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
