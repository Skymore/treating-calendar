/**
 * Script for generating secure keys
 * Usage: node scripts/generate-secrets.js
 */

// Generate random string
function generateRandomString(length = 32) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  
  // Use cryptographically secure random numbers
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % characters.length);
  }
  
  return result;
}

// Generate and print keys
console.log('\n=== Secure Key Generator ===\n');
console.log(`FUNCTION_SECRET_KEY=${generateRandomString(48)}`);
console.log(`CRON_SECRET=${generateRandomString(48)}`);
console.log('\nAdd these values to your environment variables.\n'); 