/**
 * Utility functions for user ID management
 */
import { supabase } from './supabase';
import { TeamInfo } from '../types/types';

// Generate a robust 12-digit userId using crypto API
export const generateUserId = (): string => {
  // Define a character set (excluding similar looking characters)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  
  // Use crypto API if available for better randomness
  let id = '';
  
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(12);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < 12; i++) {
      // Use modulo to convert random byte to index within chars
      id += chars[array[i] % chars.length];
    }
  } else {
    // Fallback to Math.random() if crypto is not available
    for (let i = 0; i < 12; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return id;
};

// Create initial team entry in the database
export const createInitialTeamEntry = async (userId: string, teamName: string = 'My Team'): Promise<void> => {
  try {
    // Check if team entry already exists
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('userId')
      .eq('userId', userId)
      .maybeSingle();
    
    console.log('Create initial team entry:', existingTeam);

    
    // Only create new entry if it doesn't exist
    if (!existingTeam) {
      const newTeam: TeamInfo = {
        userId,
        teamName,
        createdAt: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('teams')
        .insert([newTeam]);
      
      if (error) {
        console.error('Failed to create initial team entry:', error);
      } else {
        console.log('Created initial team entry for userId:', userId);
      }
    }
  } catch (err) {
    console.error('Error creating initial team entry:', err);
  }
};

// Get userId from URL search params
export const getUserIdFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('teamId');
};

// Set userId to URL
export const setUserIdToUrl = (userId: string): void => {
  const url = new URL(window.location.href);
  url.searchParams.set('teamId', userId);
  window.history.replaceState({}, '', url.toString());
};

// Get existing userId from URL, localStorage or generate a new one
export const getUserId = (): string => {
  // First try to get from URL
  const urlUserId = getUserIdFromUrl();
  if (urlUserId) {
    // Save to localStorage for future use
    localStorage.setItem('treating_calendar_user_id', urlUserId);
    // Create initial team entry in the database
    createInitialTeamEntry(urlUserId).catch(err => {
      console.error('Failed to create initial team entry after ID generation:', err);
    });
    return urlUserId;
  }
  
  // Then try localStorage
  const storageKey = 'treating_calendar_user_id';
  let userId = localStorage.getItem(storageKey);
  
  // Generate new if not found
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem(storageKey, userId);
  }

  // Create initial team entry in the database
  createInitialTeamEntry(userId).catch(err => {
    console.error('Failed to create initial team entry after ID generation:', err);
  });
  
  // Update URL with userId
  setUserIdToUrl(userId);
  
  return userId;
};