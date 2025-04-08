import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamInfo } from '../types/types';
import { getUserId, setUserIdToUrl } from '../lib/userIdUtils';

export function useTeamInfo() {
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch team information from database
  const fetchTeamInfo = async (userId: string) => {
    setLoading(true);
    try {
      // Query teams table
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error) {
        // If error is due to no record found, don't treat as error
        if (error.code === 'PGRST116') {
          setTeamInfo(null);
        } else {
          console.error('Failed to get team information:', error);
          setError(error.message);
        }
      } else {
        setTeamInfo(data);
        // Save team name to localStorage for display
        localStorage.setItem('treating_calendar_team_name', data.teamName);
      }
    } catch (err) {
      console.error('Error while fetching team information:', err);
      setError('Failed to get team information, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Create or update team information
  const saveTeamInfo = async (teamName: string) => {
    const userId = getUserId();
    setLoading(true);
    try {
      // Check if team info already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('userId', userId)
        .single();

      if (existingTeam) {
        // Update existing team info
        console.log('Updating existing team:', userId, teamName);
        const { error } = await supabase
          .from('teams')
          .update({ teamName })
          .eq('userId', userId);

        if (error) throw error;
      } else {
        // Create new team info
        console.log('Creating new team:', userId, teamName);
        const newTeam: TeamInfo = {
          userId,
          teamName,
          createdAt: new Date().toISOString()
        };

        const { error } = await supabase
          .from('teams')
          .insert([newTeam]);

        if (error) throw error;
      }

      // Update local state
      localStorage.setItem('treating_calendar_team_name', teamName);
      setTeamInfo({ userId, teamName, createdAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to save team information:', err);
      setError('Failed to save team information, please try again later');
    } finally {
      setLoading(false);
    }
  };

  // Initialize - get team info when component mounts
  useEffect(() => {
    const userId = getUserId();
    console.log('useTeamInfo userId:', userId);
    
    // Ensure URL contains correct team ID
    setUserIdToUrl(userId);
    
    // Fetch team info from database
    fetchTeamInfo(userId);
  }, []);

  return {
    teamInfo,
    loading,
    error,
    saveTeamInfo,
    fetchTeamInfo
  };
} 