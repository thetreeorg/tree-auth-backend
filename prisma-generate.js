// This script ensures Prisma Client is generated before the app starts
const { execSync } = require('child_process');

try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('Prisma Client generated successfully.');
} catch (error) {
  console.error('Failed to generate Prisma Client:', error);
  process.exit(1);
}
