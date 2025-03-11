import React from 'react';

interface LoginButtonProps {
  onClick: () => void;
}

export default function LoginButton({ onClick }: LoginButtonProps) {
  return (
    <div className="flex justify-end mb-4">
      <button
        onClick={onClick}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
      >
        Sign In
      </button>
    </div>
  );
} 