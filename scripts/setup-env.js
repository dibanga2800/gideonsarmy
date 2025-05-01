const fs = require('fs').promises;
const path = require('path');

const envContent = `# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3003
NEXTAUTH_SECRET=SuperSecretKey123456789

# Google Sheets API Configuration
GOOGLE_SHEET_ID=1SBrudshivEUAGBdRFy_xBol-dk96u4DtMPyF0b0xRXw
GOOGLE_CLIENT_EMAIL=mens-fellowship-app@gideons-army-458021.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDdNZcQPc3YuBKd
zwaHCwwiuPZEi/BH2N0G50Xak8WFes+LZBltfS99PPlctk54OiT7j8hzTgq8SK1p
pXUIkwK10+mk/6rGk7KJB/MfrUzcRTwhHtR1yZniwLdRp/eCF5aMvYL+HK9JI0uA
aaypfFEfhnhxpL1izcA0t8T1a7AdYRzbNwZCc/uAEru+ytbtK4oGifKECDbqeLjp
XBPce/mQnluCwjQBGgapvV2o0JrsS52uE6W6ZrhKpsGuzoGPz4NDxvXsviesz8iU
LNz7qDiLpbsXxLkEeUcLzaQq6SDk2QFVwvhPfiOU0YWuoK2QmZDD2tNwuuD1XXze
J4iW2K73AgMBAAECggEAO70FszalmQG40VI/1odWuyfNJdzOwnBf3EXnuOwQOwhb
9S5OqaFVilJFm1KGZXR6WU9OmEj6oDdWUYID1ZFx+W2lmtAKq/7mB5iUgTj5WUD/
SIh9YuPTQYe+2ffs4P6CwzZIolxXv/4enSqsnMa8V7GmZDZTiNO8tN/t+kMfOAdp
ylNJoUh6ZWzzoY6KXrHp3NsQW4kawkxEATxYPIO82vL/I6raMUcAfv2PgMd9Ch15
FVC8G88ecc8cAIf1cHBuJOxQu0sUvUJscVQyd1UGsbLcsASJl9w9gYWmXnXegM7q
WSKXVriryZE/p9JLaTpp1fQ33fnKdquaopxt6n96QQKBgQDxmdjLmZ01171OIi46
T917vpfoMG/sEQD3qS9LRY7iR+2YvqcgEwmIVdiQLswdyku8ctrm/wfMd9L36u0c
w1CUtEJfmaELDWyXT4SU3TjhuiCDPB8nQ+DOb/vJYm0bXYQJyZ7oiFSTjW/cIVL5
YLRBP1XExI2sOlp+w0k4ISYAtwKBgQDqZJ/KRswHlLb9jEOvYPZOWQALzsZv5tcB
qT1ycsAzxrx9gBndZ3R32QRZjZ33jxGlhmHAxVGuuCO26J0V51YrcZ7Q+9+wFVJJ
qok6uW3tr+sk2nby2qB6qoNv2HFNziEssHRyz9kgGVw/1k59IoaeKb86mTRARhRl
bdQhglADwQKBgBMi83gU/83O+9CfhnfZ8Zomm5OpmoPhSOlU/kkBBnNH7TrnBwfU
WjHxUskA2+wUJPGVS192neCFMTGv6v4XPl+483TtD0N32b0WcFL2PtYqTv72GSWc
C8duOUxXPnsnahj4Xlzex4w0bMLL5O2Zyk1Mvfdq9inJKXfW8gq/HWp7AoGAUzqN
vr6q3hpBbACtXA37B9D0gjzXG48FU5KrvgLfGsN71Lhy9rowkgneUIpHyErmAjeY
aGHoYjkCfYVVmhx97Yk30o9NW3IGuR+0AMUtMpQf1AM673sQNt5rM4DQoscJ4pt5
jfcd6xb2Obi4QBjNYkYCoCUcd6IqxeVcyNVD4kECgYB/x5Y1ENYey4RCKVDOKmWK
d7eCvMgmQgzD7EuLMM7eg5uZ0qswhjrbB9D8010Gltf/2UbWFoHzi+r0BGPuMdqR
8+jyBuIT5whxPjwC4kTBx3TpBuVlfn7CfUNVzasWtLhFe7KHoCTWrKvF8aMv9Gth
uEdj81MAAeieWnypQJIldw==
-----END PRIVATE KEY-----'

# Email Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=gideonsarmylwp@gmail.com
EMAIL_SERVER_PASSWORD=lzeqngeeioexqpcj
EMAIL_FROM=gideonsarmylwp@gmail.com`;

async function setupEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    await fs.writeFile(envPath, envContent);
    console.log('✅ Created .env.local file with properly formatted private key');
  } catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
  }
}

setupEnv(); 