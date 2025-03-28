import React, { useState, useEffect } from 'react';
import { getUserId } from '../lib/userIdUtils';
import { useTeamInfo } from '../hooks/useTeamInfo';
import { useAuth } from '../contexts/AuthContext';
import { showNotification } from '../utils/notification';
import { useTreatingStore } from '../stores/treatingStore';

interface TeamInfoProps {
  onClose: () => void;
}

const TeamInfo: React.FC<TeamInfoProps> = ({ onClose }) => {
  const { teamInfo, loading, error, saveTeamInfo, linkUserToTeam } = useTeamInfo();
  const [editingName, setEditingName] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const userId = getUserId();
  const { user } = useAuth();
  
  // 使用treatingStore中的isCreator状态
  const { isCreator } = useTreatingStore();

  useEffect(() => {
    // Set initial team name
    if (teamInfo) {
      setNewTeamName(teamInfo.teamName);
    } else {
      // If no team info exists, use default name
      setNewTeamName(localStorage.getItem('treating_calendar_team_name') || 'My Team');
    }
    
    // Generate share link
    const url = new URL(window.location.href);
    url.searchParams.set('teamId', userId);
    setShareUrl(url.toString());
  }, [teamInfo, userId]);

  const handleSaveTeamName = async () => {
    if (newTeamName.trim()) {
      await saveTeamInfo(newTeamName.trim());
      setEditingName(false);
      showNotification('Team name saved successfully', 'success');
    }
  };

  const handleClaimTeam = async () => {
    if (!user) {
      showNotification('Please sign in to claim this team', 'info');
      return;
    }
    
    const success = await linkUserToTeam(userId);
    if (success) {
      showNotification('You are now the creator of this team', 'success');
    } else {
      showNotification('This team already has a creator', 'error');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    showNotification('Share link copied to clipboard', 'success');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-3 md:p-5 max-w-md mx-auto mb-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base md:text-lg font-bold text-gray-800">Team Information</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {loading ? (
        <div className="py-3 text-center text-gray-600 text-sm">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          Loading team information...
        </div>
      ) : error ? (
        <div className="py-3 text-center text-red-600 text-sm bg-red-50 rounded-md">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="text-xs md:text-sm text-gray-500 mb-1">Team ID</div>
            <div className="flex items-center">
              <span className="font-mono text-xs bg-gray-100 px-2 py-1.5 rounded w-full truncate">{userId}</span>
              <button 
                className="ml-2 bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded"
                onClick={() => {
                  navigator.clipboard.writeText(userId);
                  showNotification('Team ID copied to clipboard', 'success');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">The Team ID is used to distinguish data between teams, please keep it safe</p>
          </div>
          
          <div className="mb-4">
            <div className="text-xs md:text-sm text-gray-500 mb-1">Team Name</div>
            {editingName ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="border rounded py-1 px-2 w-full text-sm"
                  placeholder="Enter team name"
                />
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={handleSaveTeamName}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs md:text-sm font-medium"
                  >
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setEditingName(false);
                      setNewTeamName(teamInfo?.teamName || 'My Team');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded text-xs md:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="bg-gray-100 px-2 py-1.5 rounded w-full text-sm">
                  {teamInfo?.teamName || newTeamName}
                </span>
                <button 
                  className={`ml-2 bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded ${!isCreator ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => isCreator && setEditingName(true)}
                  disabled={!isCreator}
                  title={!user ? "Please login first" : !isCreator ? "Only team creator can edit team name" : "Edit team name"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <div className="text-xs md:text-sm text-gray-500 mb-1">Share Link</div>
            <div className="flex items-center">
              <input 
                type="text" 
                readOnly 
                value={shareUrl}
                className="font-mono text-xs bg-gray-100 px-2 py-1.5 rounded w-full overflow-hidden text-ellipsis"
              />
              <button 
                className="ml-2 bg-blue-50 hover:bg-blue-100 text-blue-600 p-1.5 rounded"
                onClick={copyShareLink}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Share this link with team members so they can access the same team data</p>
          </div>
          
          {/* 团队创建者状态 */}
          <div className="mb-4 border-t pt-3">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs md:text-sm font-medium">Team Creator Status</div>
                <p className="text-xs text-gray-500">
                  {isCreator 
                    ? 'You are the creator of this team' 
                    : user 
                      ? 'You are not the creator of this team' 
                      : 'Sign in to claim this team'}
                </p>
              </div>
              
              {!isCreator && user && (
                <button
                  onClick={handleClaimTeam}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                >
                  Claim Team
                </button>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-xs md:text-sm text-blue-700">
              <span className="font-semibold">Tip:</span> To share the schedule with team members, copy the share link above and send it to them.
              Team members will be able to view and manage the same team schedule when they open the link.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TeamInfo; 