// Simple script to check if environment variables are loaded correctly
// Run with: node scripts/check-env.js

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

console.log('\n--- Environment Variables Check ---\n');

const requiredVars = [
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GMAIL_REFRESH_TOKEN',
  'GMAIL_REDIRECT_URI',
  'MAIL_PROVIDER',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO'
];

let missing = 0;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? 'PRESENT' : 'MISSING';
  const displayValue = value 
    ? (varName.includes('SECRET') || varName.includes('TOKEN') 
      ? `${value.substring(0, 5)}...` 
      : value)
    : '';
    
  console.log(`${varName.padEnd(25)}: ${status.padEnd(10)} ${displayValue}`);
  
  if (!value) missing++;
});

console.log('\n--- Summary ---');
if (missing === 0) {
  console.log('✅ All required environment variables are present');
} else {
  console.log(`❌ ${missing} required environment variables are missing`);
}

console.log('\nCheck that your .env.local file is in the root directory and contains all required variables.');
console.log('You may need to restart the server to apply changes.\n'); 