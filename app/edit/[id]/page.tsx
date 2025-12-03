'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getLocalClaims, starsToScore } from '@/lib/linkedclaims';

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const { token, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingClaim, setLoadingClaim] = useState(true);
  const [error, setError] = useState('');
  const [descriptionLength, setDescriptionLength] = useState(0);
  const maxDescriptionLength = 500;
  const [formData, setFormData] = useState({
    category: 'project',
    statement: '',
    stars: 5,
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadClaim();
  }, [params.id]);

  const loadClaim = async () => {
    try {
      const claimId = parseInt(params.id as string);
      
      // For now, we only support editing local claims
      const localClaims = getLocalClaims();
      const claim = localClaims.find(c => c.id === claimId);
      
      if (claim) {
        setFormData({
          category: claim.aspect || 'project',
          statement: claim.statement || '',
          stars: claim.stars || 5,
          date: claim.effectiveDate || new Date().toISOString().split('T')[0],
        });
        setDescriptionLength(claim.statement?.length || 0);
      } else {
        setError('Achievement not found');
      }
    } catch (err) {
      console.error('Error loading claim:', err);
      setError('Failed to load achievement');
    } finally {
      setLoadingClaim(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const claimId = parseInt(params.id as string);
      const hasBackendToken = token && token !== 'nextauth_session';
      
      if (hasBackendToken && user?.issuerId) {
        // Backend update
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/claims/${claimId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            statement: formData.statement,
            effectiveDate: formData.date,
            stars: formData.stars,
            score: starsToScore(formData.stars),
            aspect: formData.category,
          }),
        });

        if (!response.ok) throw new Error('Failed to update on backend');
        
        alert('Achievement updated successfully! 🎉');
        router.push('/portfolio');
      } else {
        // Local storage update
        const localClaims = getLocalClaims();
        const updatedClaims = localClaims.map(claim => {
          if (claim.id === claimId) {
            return {
              ...claim,
              statement: formData.statement,
              effectiveDate: formData.date,
              stars: formData.stars,
              score: starsToScore(formData.stars),
              aspect: formData.category,
            };
          }
          return claim;
        });
        
        localStorage.setItem('trustfolio_claims', JSON.stringify(updatedClaims));
        alert('Achievement updated locally! 📝');
        router.push('/portfolio');
      }
    } catch (error: any) {
      console.error('Error updating claim:', error);
      setError(error.message || 'Error updating achievement');
    } finally {
      setLoading(false);
    }
  };

  if (loadingClaim) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Loading achievement...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <Link href="/portfolio" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to Portfolio
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Achievement
            </h1>
            {isAuthenticated ? (
              <span className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                ✅ Signed In
              </span>
            ) : (
              <span className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                📦 Local Mode
              </span>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="project">📁 Project</option>
                <option value="skill">💡 Skill</option>
                <option value="certification">🎓 Certification</option>
                <option value="course">📚 Course Completion</option>
                <option value="award">🏆 Award</option>
                <option value="publication">📝 Publication</option>
                <option value="volunteer">❤️ Volunteer Work</option>
                <option value="hackathon">💻 Hackathon</option>
                <option value="research">🔬 Research</option>
                <option value="presentation">🎤 Presentation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
                <span className="text-red-500 ml-1 text-xs">Required</span>
              </label>
              <textarea
                value={formData.statement}
                onChange={(e) => {
                  setFormData({ ...formData, statement: e.target.value });
                  setDescriptionLength(e.target.value.length);
                }}
                required
                maxLength={maxDescriptionLength}
                rows={4}
                placeholder="Describe your achievement..."
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  formData.statement.length === 0 && error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500">
                  Edit your achievement description
                </p>
                <p className={`text-xs ${
                  descriptionLength > maxDescriptionLength * 0.9
                    ? 'text-orange-600 font-semibold'
                    : 'text-gray-400'
                }`}>
                  {descriptionLength}/{maxDescriptionLength} characters
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating: {formData.stars} stars
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.stars}
                onChange={(e) => setFormData({ ...formData, stars: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Beginner</span>
                <span>Expert</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Updating...' : 'Update Achievement'}
              </button>
              <Link
                href="/portfolio"
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}