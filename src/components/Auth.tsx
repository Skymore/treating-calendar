import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showNotification } from '../utils/notification';

export default function Auth() {
  const [loading, setLoading] = useState<'google' | 'github' | 'azure' | null>(null);
  const { signInWithGoogle, signInWithGithub, signInWithAzure } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google');
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Success message will be shown after redirect back
    } catch (error: any) {
      showNotification(error.message || 'Failed to sign in with Google', 'error');
      setLoading(null);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      setLoading('github');
      const { error } = await signInWithGithub();
      if (error) throw error;
      // Success message will be shown after redirect back
    } catch (error: any) {
      showNotification(error.message || 'Failed to sign in with GitHub', 'error');
      setLoading(null);
    }
  };

  const handleAzureSignIn = async () => {
    try {
      setLoading('azure');
      const { error } = await signInWithAzure();
      if (error) throw error;
      // Success message will be shown after redirect back
    } catch (error: any) {
      showNotification(error.message || 'Failed to sign in with Microsoft', 'error');
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">
        Sign In
      </h2>
      
      <div className="w-full space-y-4">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'google' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>
        
        <button
          onClick={handleGithubSignIn}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'github' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Sign in with GitHub
            </>
          )}
        </button>

        <button
          onClick={handleAzureSignIn}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'azure' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 23 23" fill="white">
                <path d="M10.5 10.5H0V0h10.5V10.5z" fill="#f25022"/>
                <path d="M22 10.5H11.5V0H22v10.5z" fill="#7fba00"/>
                <path d="M10.5 22H0V11.5h10.5V22z" fill="#00a4ef"/>
                <path d="M22 22H11.5V11.5H22V22z" fill="#ffb900"/>
              </svg>
              Sign in with Microsoft
            </>
          )}
        </button>
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-600">
        By signing in, you agree to our Terms of Service and Privacy Policy.
      </div>
    </div>
  );
} 