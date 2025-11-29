'use client'

import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Forgot Password</h1>
        <p className="mb-6">Choose an option:</p>
        
        <Link href="/login" className="block bg-blue-600 text-white px-4 py-2 rounded mb-4 text-center">
          Sign in with Google
        </Link>
        
        <a href="mailto:support@linkedtrust.us" className="block text-blue-600 text-center">
          Contact Support
        </a>
      </div>
    </div>
  )
}