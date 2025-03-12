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

// 用于跟踪创建团队条目的操作
let createTeamPromise: Record<string, Promise<void>> = {};

// Create initial team entry in the database
export const createInitialTeamEntry = async (userId: string, teamName: string = 'My Team'): Promise<void> => {
  // 如果这个userId已经有一个正在进行的创建操作，等待它完成
  if (userId in createTeamPromise) {
    console.log('Already creating team entry for userId:', userId, 'waiting for completion');
    return createTeamPromise[userId];
  }

  // 创建新的Promise并保存到缓存
  createTeamPromise[userId] = (async () => {
    try {
      console.log('Try to create initial team entry for userId:', userId);
      // Check if team entry already exists
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('userId')
        .eq('userId', userId)
        .maybeSingle();
      
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
        
        console.log('Create initial team entry:', newTeam);
        if (error) {
          console.error('Failed to create initial team entry:', error);
        } else {
          console.log('Created initial team entry for userId:', userId);
        }
      } else {
        console.log('Team entry already exists for userId:', userId);
      }
    } catch (err) {
      console.error('Error creating initial team entry:', err);
    } finally {
      // 完成后移除Promise缓存
      delete createTeamPromise[userId];
    }
  })();

  return createTeamPromise[userId];
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
    // Create initial team entry in the database (不阻塞主流程)
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
    
    // 只在生成新ID时创建初始团队条目 (不阻塞主流程)
    createInitialTeamEntry(userId).catch(err => {
      console.error('Failed to create initial team entry after ID generation:', err);
    });
  }
  
  // Update URL with userId
  setUserIdToUrl(userId);
  
  return userId;
};