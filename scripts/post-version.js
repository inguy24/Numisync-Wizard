/**
 * Post-version script
 * Runs after npm version to remind about changelog and next steps
 */

const packageJson = require('../package.json');

console.log('\n========================================');
console.log(`Version bumped to: ${packageJson.version}`);
console.log('========================================\n');

console.log('Next steps:');
console.log('1. Update docs/CHANGELOG.md with release notes');
console.log('2. Review all changes: git diff HEAD~1');
console.log('3. Push with tags: git push && git push --tags');
console.log('4. Wait for GitHub Actions to build');
console.log('5. Approve signing in SignPath dashboard (Windows)');
console.log('6. Review and publish the draft release on GitHub\n');
