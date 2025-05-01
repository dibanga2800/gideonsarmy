const fs = require('fs').promises;
const path = require('path');

async function fixPrivateKey() {
  try {
    // Read the current .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = await fs.readFile(envPath, 'utf8');
    
    // Split the content into lines
    const lines = envContent.split('\n');
    
    // Find and fix the GOOGLE_PRIVATE_KEY line
    const updatedLines = lines.map(line => {
      if (line.startsWith('GOOGLE_PRIVATE_KEY=')) {
        // Extract the key content
        const keyMatch = line.match(/GOOGLE_PRIVATE_KEY="(.+)"/);
        if (keyMatch) {
          const key = keyMatch[1]
            .replace(/\\n/g, '\n')  // Replace \n with actual newlines
            .replace(/"/g, '')      // Remove quotes
            .trim();
          
          // Format the key with proper line breaks
          return `GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
${key.split('-----BEGIN PRIVATE KEY-----')[1].split('-----END PRIVATE KEY-----')[0].trim()}
-----END PRIVATE KEY-----"`;
        }
      }
      return line;
    });
    
    // Write the updated content back to .env.local
    await fs.writeFile(envPath, updatedLines.join('\n'));
    console.log('✅ Private key format has been fixed in .env.local');
    
  } catch (error) {
    console.error('❌ Error fixing private key:', error.message);
  }
}

fixPrivateKey(); 