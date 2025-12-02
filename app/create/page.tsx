'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClaim, createClaimLocal, starsToScore } from '@/lib/linkedclaims';

export default function CreatePage() {
  const router = useRouter();
  const { token, isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [descriptionLength, setDescriptionLength] = useState(0);
  const maxDescriptionLength = 500;
  const [formData, setFormData] = useState({
    category: 'project',
    keywords: '',
    statement: '',
    stars: 5,
    date: new Date().toISOString().split('T')[0],
  });

  const handleGenerateAI = async () => {
    if (!formData.keywords.trim()) {
      alert('Please enter some keywords first!');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: formData.category,
          keywords: formData.keywords,
        }),
      });

      const data = await response.json();
      
      if (data.description) {
        setFormData({ ...formData, statement: data.description });
        setDescriptionLength(data.description.length);
      } else {
        alert('Failed to generate description. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating description. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get the user ID - works for both OAuth and email/password
      const userId = user?.issuerId || user?.id;
      
      // Check if user has a REAL backend token (not just NextAuth session)
      const hasBackendToken = token && token !== 'nextauth_session';
      const isOAuthUser = token === 'nextauth_session';
      
      // Prepare claim data
      const claimData = {
        subject: userId
          ? `http://trustclaims.whatscookin.us/user/${userId}`
          : `https://trustfolio.app/student/dana`,
        claim: formData.category === 'skill' ? 'HAS_SKILL' : 'COMPLETED_PROJECT',
        statement: formData.statement,
        effectiveDate: formData.date,
        howKnown: 'FIRST_HAND' as const,
        stars: formData.stars,
        score: starsToScore(formData.stars),
        aspect: formData.category,
      };

      // Only use backend if user has a real backend token (email/password users)
      if (hasBackendToken && userId) {
        console.log('Creating claim with backend...', claimData);
        await createClaim(claimData, token);
        alert('Achievement created successfully on LinkedTrust! 🎉');
        router.push('/portfolio');
      } else {
        // OAuth users or unauthenticated users save locally
        console.log('Creating claim locally...', claimData);
        await createClaimLocal(claimData);
        
        if (isOAuthUser) {
          alert('Achievement saved locally! 📦\n\nNote: OAuth users currently save to local storage. Backend OAuth integration coming soon!');
        } else {
          alert('Achievement saved locally! 📦\n\nSign in with email/password to sync to LinkedTrust backend.');
        }
        router.push('/portfolio');
      }
    } catch (error: any) {
      console.error('Error creating claim:', error);
      setError(error.message || 'Error creating claim. Check console for details.');
      
      // Offer to save locally on error
      const saveLocal = confirm('Backend error. Save locally instead?');
      if (saveLocal) {
        try {
          const userId = user?.issuerId || user?.id;
          await createClaimLocal({
            subject: userId 
              ? `http://trustclaims.whatscookin.us/user/${userId}`
              : `https://trustfolio.app/student/dana`,
            claim: formData.category === 'skill' ? 'HAS_SKILL' : 'COMPLETED_PROJECT',
            statement: formData.statement,
            effectiveDate: formData.date,
            howKnown: 'FIRST_HAND',
            stars: formData.stars,
            score: starsToScore(formData.stars),
            aspect: formData.category,
          });
          alert('Saved locally! 📦');
          router.push('/portfolio');
        } catch (localError) {
          console.error('Local save failed:', localError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Achievement
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

          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> <Link href="/login" className="underline font-semibold">Sign in</Link> to save your achievements to the LinkedTrust network!
              </p>
            </div>
          )}

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
                Keywords (for AI generation)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="Python, LangChain, claims extraction, prompt engineering"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter keywords about your achievement, then click generate!
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <span className="animate-spin">⚙️</span>
                    Generating with AI...
                  </>
                ) : (
                  <>
                    ✨ Generate Description with AI
                  </>
                )}
              </button>
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
                placeholder="Built an AI-powered claims extraction system using Python, LangChain, and prompt engineering..."
                className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                  formData.statement.length === 0 && error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500">
                  Generated by AI or write your own
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Creating...' : 'Create Achievement'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}