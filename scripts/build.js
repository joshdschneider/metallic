import chalk from 'chalk';
import { execSync } from 'child_process';

const packages = [
  {
    name: '@metallichq/types',
    dependencies: []
  },
  {
    name: '@metallichq/database',
    dependencies: []
  },
  {
    name: '@metallichq/shared',
    dependencies: ['@metallichq/database', '@metallichq/types']
  },
  {
    name: '@metallichq/providers',
    dependencies: ['@metallichq/types', '@metallichq/shared']
  },
  {
    name: '@metallichq/server',
    dependencies: ['@metallichq/database', '@metallichq/types', '@metallichq/shared', '@metallichq/providers']
  },
  {
    name: '@metallichq/dashboard',
    dependencies: ['@metallichq/types']
  }
];

const buildResults = new Map();

function formatError(error) {
  if (error.stdout) {
    const tsErrors = error.stdout
      .split('\n')
      .filter((line) => line.includes('error TS'))
      .join('\n');

    if (tsErrors) {
      console.log(chalk.red('\nTypeScript Errors:'));
      console.log(tsErrors);
    }
  }
}

async function buildPackage(pkg) {
  const startTime = Date.now();
  try {
    process.stdout.write(chalk.blue(`Building ${pkg.name}... `));

    try {
      execSync(`npm run clean -w ${pkg.name}`, { stdio: 'ignore' });
    } catch (cleanError) {
      console.log(chalk.yellow('Clean failed, continuing with build...'));
    }

    execSync(`npm run build -w ${pkg.name}`, {
      stdio: 'pipe',
      encoding: 'utf8'
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.green(`✓ Done (${duration}s)`));
    buildResults.set(pkg.name, { success: true, duration });
  } catch (error) {
    console.log(chalk.red('✗ Failed'));
    formatError(error);
    buildResults.set(pkg.name, { success: false, error });
    throw error;
  }
}

async function buildPackages() {
  console.log(chalk.cyan('\n🚀 Starting build process...\n'));

  let failedPackages = [];
  for (const pkg of packages) {
    try {
      await buildPackage(pkg);
    } catch (error) {
      failedPackages.push(pkg.name);
    }
  }

  console.log(chalk.cyan('\n📊 Build Summary:'));
  for (const [name, result] of buildResults) {
    if (result.success) {
      console.log(chalk.green(`✓ ${name}: ${result.duration}s`));
    } else {
      console.log(chalk.red(`✗ ${name}: Failed`));
    }
  }

  if (failedPackages.length > 0) {
    console.log(chalk.red(`\n❌ Build failed for ${failedPackages.length} package(s):`));
    failedPackages.forEach((pkg) => console.log(chalk.yellow(`  - ${pkg}`)));
    process.exit(1);
  }
}

buildPackages().catch((error) => {
  console.error(chalk.red('\n❌ Build process failed'));
  formatError(error);
  process.exit(1);
});
