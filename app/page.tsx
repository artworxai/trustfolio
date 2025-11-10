import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            🎓 TrustFolio
          </h1>
          <p className="text-xl text-gray-600">
            Build your verifiable achievement portfolio
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Create LinkedClaims for your projects, skills, and accomplishments
          </p>
        </div>

        <div className="mb-8 text-center">
          <Link
            href="/login"
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition mr-4"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition border border-indigo-600"
          >
            Sign Up
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            href="/create"
            className="p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="text-4xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-indigo-600 mb-2">
              Create Achievement
            </h2>
            <p className="text-gray-600">
              Log a new project, skill, or certification with verifiable claims
            </p>
          </Link>
          
          <Link 
            href="/portfolio"
            className="p-8 bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <div className="text-4xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-indigo-600 mb-2">
              View Portfolio
            </h2>
            <p className="text-gray-600">
              See all your achievements and claims
            </p>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            What are LinkedClaims?
          </h3>
          <p className="text-gray-600 mb-2">
            LinkedClaims are verifiable statements about achievements, skills, and impact.
            Each claim you create is:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>Timestamped and permanent</li>
            <li>Linked to the LinkedTrust network</li>
            <li>Shareable with employers and institutions</li>
            <li>Built on open standards</li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Built with ❤️ using LinkedClaims SDK</p>
          <p>Created by Dana W. Martinez</p>
        </div>
      </div>
    </main>
  );
}