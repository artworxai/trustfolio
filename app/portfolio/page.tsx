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
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    loadClaims();
  }, [token]);

  const loadClaims = async () => {
    setLoading(true);
    setError('');
    
    try {
      const hasBackendToken = token && token !== 'nextauth_session';
      
      if (isAuthenticated && hasBackendToken && (user?.issuerId || user?.id)) {
        const userId = user.issuerId || user.id;
        const response = await fetchClaimsByIssuer(userId, token);
        const backendClaims = response.claims || [];
        setClaims(backendClaims);
        setMode('backend');
      } else {
        const localClaims = getLocalClaims();
        setClaims(localClaims);
        setMode('local');
      }
    } catch (err: any) {
      console.error('Error loading claims:', err);
      const localClaims = getLocalClaims();
      setClaims(localClaims);
      setMode('local');
      setError('Using local data (backend unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const deleteClaim = async (claimId: number) => {
    const confirmDelete = confirm('Are you sure you want to delete this achievement? This action cannot be undone.');
    
    if (!confirmDelete) return;
    
    try {
      if (mode === 'backend' && token && token !== 'nextauth_session') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/claims/${claimId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to delete from backend');
        
        alert('Achievement deleted successfully! 🗑️');
      } else {
        const localClaims = getLocalClaims();
        const updatedClaims = localClaims.filter(claim => claim.id !== claimId);
        localStorage.setItem('trustfolio_claims', JSON.stringify(updatedClaims));
        
        alert('Achievement deleted from local storage! 🗑️');
      }
      
      loadClaims();
    } catch (error) {
      console.error('Error deleting claim:', error);
      alert('Failed to delete achievement. Please try again.');
    }
  };

  const filteredAndSortedClaims = () => {
    let filtered = [...claims];
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(claim => 
        claim.statement?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.aspect?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(claim => claim.aspect === categoryFilter);
    }
    
    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.effectiveDate || '').getTime() - new Date(a.effectiveDate || '').getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.effectiveDate || '').getTime() - new Date(b.effectiveDate || '').getTime();
      } else if (sortBy === 'rating-desc') {
        return (b.stars || 0) - (a.stars || 0);
      } else if (sortBy === 'rating-asc') {
        return (a.stars || 0) - (b.stars || 0);
      }
      return 0;
    });
    
    return filtered;
  };

  const exportAchievements = () => {
    const dataToExport = mode === 'backend' ? claims : getLocalClaims();
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trustfolio-achievements-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Achievements exported successfully!');
  };

  const importAchievements = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (!Array.isArray(importedData)) {
          alert('❌ Invalid file format. Please upload a valid JSON file.');
          return;
        }

        const confirmImport = confirm(
          `Import ${importedData.length} achievements?\n\n` +
          `This will ADD to your existing ${claims.length} achievements.\n\n` +
          `Click OK to continue or Cancel to abort.`
        );

        if (confirmImport) {
          const existingClaims = getLocalClaims();
          const maxId = Math.max(0, ...existingClaims.map(c => c.id));
          const newClaims = importedData.map((claim, index) => ({
            ...claim,
            id: maxId + index + 1,
          }));
          
          const mergedClaims = [...existingClaims, ...newClaims];
          localStorage.setItem('trustfolio_claims', JSON.stringify(mergedClaims));
          
          alert(`✅ Successfully imported ${importedData.length} achievements!`);
          loadClaims();
        }
      } catch (error) {
        console.error('Import error:', error);
        alert('❌ Error importing file. Please check the file format.');
      }
    };
    reader.readAsText(file);
    
    event.target.value = '';
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
      .slice(0, 5);
    
    const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    claims.forEach(claim => {
      const rating = claim.stars || 0;
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating]++;
      }
    });
    
    return {
      totalAchievements,
      averageRating,
      categoryBreakdown: sortedCategories,
      ratingDistribution,
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

  const analytics = calculateAnalytics();

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
            
            {claims.length > 0 && (
              <button
                onClick={exportAchievements}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                title="Export achievements as JSON"
              >
                📥 Export
              </button>
            )}
            
            <label className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer">
              📤 Import
              <input
                type="file"
                accept=".json"
                onChange={importAchievements}
                className="hidden"
              />
            </label>
            
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

        {/* Analytics Dashboard */}
        {claims.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Analytics Dashboard</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Total Achievements */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-2xl font-bold text-indigo-900">{analytics.totalAchievements}</div>
                <div className="text-sm text-indigo-700">Total Achievements</div>
              </div>
              
              {/* Average Rating */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-2xl font-bold text-yellow-900">{analytics.averageRating}</div>
                <div className="text-sm text-yellow-700">Average Rating</div>
              </div>
              
              {/* Top Category */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-3xl mb-2">
                  {analytics.categoryBreakdown.length > 0 && getCategoryEmoji(analytics.categoryBreakdown[0][0])}
                </div>
                <div className="text-2xl font-bold text-green-900 capitalize">
                  {analytics.categoryBreakdown.length > 0 ? analytics.categoryBreakdown[0][0] : 'N/A'}
                </div>
                <div className="text-sm text-green-700">Top Category</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Category Breakdown</h3>
              <div className="space-y-2">
                {analytics.categoryBreakdown.map(([category, count]) => (
                  <div key={category} className="flex items-center gap-3">
                    <div className="text-2xl">{getCategoryEmoji(category)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                        <span className="text-sm text-gray-600">{count} ({Math.round((count / analytics.totalAchievements) * 100)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(count / analytics.totalAchievements) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Distribution */}
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
        )}

        {/* Search and Filter Controls */}
        {claims.length > 0 && (
          <div className="mb-6 bg-white rounded-xl shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing <strong>{filteredAndSortedClaims().length}</strong> of <strong>{claims.length}</strong> achievements
                </div>
              </div>
            </div>

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
            {filteredAndSortedClaims().map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-transparent hover:border-indigo-200"
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
                    <div className="flex justify-between items-center">
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