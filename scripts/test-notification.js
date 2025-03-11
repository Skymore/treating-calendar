/**
 * Script for manually testing the Wednesday automatic notification feature
 * Usage: node scripts/test-notification.js
 */

// Using ESM module syntax
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Manually load .env file
try {
  const envConfig = config();
  if (!envConfig.parsed) {
    const envContent = readFileSync('.env', 'utf8');
    const envVars = envContent.split('\n').reduce((acc, line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        acc[match[1]] = match[2] || '';
      }
      return acc;
    }, {});
    
    // Set environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  }
} catch (error) {
  console.error('Unable to load .env file:', error.message);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing environment variables. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in the .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function triggerNotification() {
  // Check if force resend is enabled
  const forceResend = process.argv.includes('--force');
  
  console.log('Testing Wednesday automatic notification...');
  console.log(`Using Supabase project: ${SUPABASE_URL}`);
  if (forceResend) {
    console.log('Force resend mode enabled');
  }
  
  try {
    console.log('Calling Edge Function directly...');
    const { data, error } = await supabase.functions.invoke('send-weekly-notification', {
      body: {
        isScheduledExecution: true,
        timestamp: new Date().toISOString(),
        isTest: true,
        forceResend: forceResend
      }
    });
    
    if (error) {
      throw new Error(`Function call failed: ${error.message}`);
    }
    
    console.log('\n======= Notification Results =======');
    console.log(`✅ Host notifications sent: ${data.hostNotificationsSent || 0}`);
    console.log(`✅ Team notifications sent: ${data.teamNotificationsSent || 0}`);
    
    if (data.errors && data.errors.length > 0) {
      console.log('\n⚠️ Errors during sending:');
      data.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. Team ID: ${error.teamId}, Error: ${error.error}`);
      });
    }
    
    console.log('\nComplete response data:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\nNotification test completed!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Execute test
triggerNotification(); 