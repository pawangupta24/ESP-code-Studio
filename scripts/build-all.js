import { execSync } from 'child_process';

console.log('========================================================');
console.log('  ESP Studio — Cross-Platform Build & Verification      ');
console.log('========================================================');
console.log(`Platform: ${process.platform} (${process.arch})\n`);

try {
  console.log('[1/3] Running TypeScript Project Typechecks (tsc -b)...');
  execSync('npx tsc -b', { stdio: 'inherit' });
  console.log('  -> TypeScript check passed cleanly (0 errors)\n');

  console.log('[2/3] Building Web Application Bundle (Vite)...');
  execSync('npm --workspace=@esp-studio/web run build', { stdio: 'inherit' });
  console.log('  -> Vite web production build succeeded\n');

  console.log('[3/3] Packaging Release Archive (package:zip)...');
  execSync('node ./scripts/package-zip.js', { stdio: 'inherit' });

  console.log('\n[SUCCESS] Monorepo verification completed cleanly on ' + process.platform + '!');
} catch (error) {
  console.error('\n[ERROR] Build verification failed:', error.message);
  process.exit(1);
}
