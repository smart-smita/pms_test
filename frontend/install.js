const { execSync } = require('child_process');

try {
  console.log('Installing dependencies...');
  execSync('npm.cmd install react-leaflet leaflet @types/leaflet --save', { stdio: 'inherit' });
  console.log('Installation complete.');
} catch (error) {
  console.error('Failed to install:', error);
}
