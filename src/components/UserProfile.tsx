import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showNotification } from '../utils/notification';

export default function UserProfile() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      showNotification('Successfully signed out', 'success');
    } catch (error: any) {
      showNotification(error.message || 'Failed to sign out', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">User Information</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>
    </div>
  );
} 