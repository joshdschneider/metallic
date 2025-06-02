import chalk from 'chalk';
import { spawn } from 'child_process';

const packagesToWatch = ['@metallichq/types', '@metallichq/database', '@metallichq/shared', '@metallichq/providers'];

const packageDependencies = {
  '@metallichq/types': [],
  '@metallichq/database': [],
  '@metallichq/shared': ['@metallichq/database', '@metallichq/types'],
  '@metallichq/providers': ['@metallichq/types', '@metallichq/shared']
};

const processes = new Map();
const readyPackages = new Set();

function startWatchProcess(packageName) {
  const dependencies = packageDependencies[packageName] || [];
  const unreadyDeps = dependencies.filter((dep) => !readyPackages.has(dep));

  if (unreadyDeps.length > 0) {
    console.log(chalk.yellow(`Waiting for dependencies of ${packageName}: ${unreadyDeps.join(', ')}`));
    setTimeout(() => {
      startWatchProcess(packageName);
    }, 5000);
    return;
  }

  const process = spawn('npm', ['run', 'watch', '-w', packageName], {
    stdio: 'pipe',
    shell: true
  });

  processes.set(packageName, process);

  process.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      if (output.includes('waiting for changes before restart')) {
        readyPackages.add(packageName);
        console.log(chalk.green(`✓ ${packageName} is ready`));
      }
      console.log(chalk.cyan(`[${packageName}] `) + output);
    }
  });

  process.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(chalk.yellow(`[${packageName}] `) + output);
    }
  });

  process.on('close', (code) => {
    console.log(chalk.red(`Process for ${packageName} exited with code ${code || 0}`));
    processes.delete(packageName);
    readyPackages.delete(packageName);
    setTimeout(() => {
      console.log(chalk.blue(`Attempting to restart ${packageName}...`));
      startWatchProcess(packageName);
    }, 5000);
  });

  return process;
}

function stopAllProcesses() {
  for (const [packageName, process] of processes.entries()) {
    process.kill();
  }
  console.log(chalk.green('\nWatch mode stopped.'));
}

async function watchPackages() {
  console.log(chalk.cyan('\n👀 Starting watch mode...\n'));
  for (const packageName of packagesToWatch) {
    startWatchProcess(packageName);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

process.on('SIGINT', () => {
  stopAllProcesses();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAllProcesses();
  process.exit(0);
});

watchPackages().catch((error) => {
  console.error(chalk.red('\n❌ Watch process failed'));
  console.error(error);
  stopAllProcesses();
  process.exit(1);
});
