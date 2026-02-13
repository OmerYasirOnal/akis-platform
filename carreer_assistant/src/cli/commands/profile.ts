import { loadUserProfile } from '../../config/user-profile.js';
import { getEnabledPlatforms } from '../../config/platforms.js';

export async function profileCommand(opts: {
  sync?: boolean;
  show?: string;
}): Promise<void> {
  const profile = loadUserProfile();

  console.log('User Profile:');
  console.log(`  Name: ${profile.name}`);
  console.log(`  Roles: ${profile.targetRoles.join(', ')}`);
  console.log(`  Work Models: ${profile.workModels.join(', ')}`);
  console.log(`  Locations: ${profile.preferredLocations.join(', ')}`);
  console.log(`  Salary Floor: ${profile.salaryFloorTRY} TRY`);
  console.log(`  Languages: ${profile.languages.join(', ')}`);
  console.log(`  Tech Stack: ${profile.techStack.join(', ')}`);
  console.log(`  Bonus Keywords: ${profile.bonusKeywords.join(', ')}`);
  console.log('');

  const platforms = getEnabledPlatforms();
  console.log('Enabled Platforms:');
  for (const p of platforms) {
    const status = p.method === 'api'
      ? hasEnvVar(p.platform)
        ? 'configured'
        : 'missing credentials'
      : 'browser-based';
    console.log(`  ${p.platform} (${p.method}): ${status}`);
  }
  console.log('');

  if (opts.sync) {
    console.log('Profile sync not yet implemented. Use web UI to update profiles.');
  }

  if (opts.show) {
    console.log(`Profile details for ${opts.show}: Use web UI to view full profile.`);
  }
}

function hasEnvVar(platform: string): boolean {
  switch (platform) {
    case 'upwork':
      return !!process.env.UPWORK_ACCESS_TOKEN;
    case 'freelancer':
      return !!process.env.FREELANCER_OAUTH_TOKEN;
    case 'fiverr':
      return !!process.env.FIVERR_EMAIL;
    case 'bionluk':
      return !!process.env.BIONLUK_EMAIL;
    case 'linkedin':
      return !!process.env.LINKEDIN_EMAIL;
    default:
      return false;
  }
}
