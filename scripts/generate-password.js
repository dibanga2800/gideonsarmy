const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the password to hash: ', (password) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log('\nHashed Password:');
  console.log(hashedPassword);
  console.log('\nCopy this hashed password to use in your Google Sheets Users worksheet.');
  rl.close();
}); 