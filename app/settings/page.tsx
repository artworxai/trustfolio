'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Load user settings from localStorage
    const savedSettings = localStorage.getItem('trustfolio_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDisplayName(settings.displayName || '');
      setBio(settings.bio || '');
    } else {
      // Set defaults from user
      setDisplayName(user?.name || user?.email || '');
    }
  }, [isAuthenticated, router, user]);

  const saveProfile = () => {
    setLoading(true);

    // Save to localStorage
    const settings = {
      displayName,
      bio,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('trustfolio_settings', JSON.stringify(settings));

    setTimeout(() => {
      setLoading(false);
      alert('✅ Profile updated successfully!');
    }, 500);
  };

  const changePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('❌ Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('❌ New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      alert('❌ New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // In a real app, this would call the backend API
    setTimeout(() => {
      setLoading(false);
      alert('✅ Password changed successfully!\n\nNote: This is a demo. In production, this would update your actual password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 500);
  };

  const deleteAccount = () => {
    const confirmDelete = confirm(
      '⚠️ WARNING: Delete Account?\n\n' +
      'This will permanently delete:\n' +
      '• Your account\n' +
      '• All your achievements\n' +
      '• All your settings\n\n' +
      'This action CANNOT be undone.\n\n' +
      'Type "DELETE" to confirm.'
    );

    if (confirmDelete) {
      const confirmation = prompt('Type "DELETE" to confirm account deletion:');
      if (confirmation === 'DELETE') {
        // Clear all data
        localStorage.removeItem('trustfolio_claims');
        localStorage.removeItem('trustfolio_settings');
        alert('✅ Account deleted. You will be logged out.');
        logout();
        router.push('/');
      } else {
        alert('❌ Account deletion cancelled. Incorrect confirmation.');
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">⚙️ Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="mb-6">
          <Link
            href="/portfolio"
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            ← Back to Portfolio
          </Link>
        </div>

        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 Profile Settings</h2>
          
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">This name will appear on your public portfolio</p>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-500 bg-gray-50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/500 characters</p>
            </div>

            {/* Public Portfolio Link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Public Portfolio Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${user?.email?.split('@')[0] || 'demo'}`}
                  disabled
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-gray-50 cursor-not-allowed"
                />
                <button
                  onClick={() => {
                    const username = user?.email?.split('@')[0] || 'demo';
                    const shareUrl = `${window.location.origin}/p/${username}`;
                    navigator.clipboard.writeText(shareUrl);
                    alert('✅ Link copied to clipboard!');
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  📋 Copy
                </button>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : '💾 Save Profile'}
            </button>
          </div>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🔒 Change Password</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={changePassword}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Changing...' : '🔑 Change Password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-md p-6 border-2 border-red-200">
          <h2 className="text-2xl font-bold text-red-900 mb-4">⚠️ Danger Zone</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Once you delete your account, there is no going back. Please be certain.
            </p>

            <button
              onClick={deleteAccount}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              🗑️ Delete Account
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Account Information
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Account Type:</strong> {token === 'nextauth_session' ? 'OAuth (Google/GitHub)' : 'Email/Password'}</p>
            <p><strong>Storage Mode:</strong> Local Browser Storage</p>
            <p><strong>Member Since:</strong> {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </main>
  );
}