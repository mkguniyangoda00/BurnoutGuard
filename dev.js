#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const NPM_CMD = isWindows ? 'npm.cmd' : 'npm';
const PYTHON_CMD = isWindows ? 'python' : 'python3';

const services = [
  {
    name: 'BACKEND',
    color: '\x1b[36m',
    cwd: path.join(__dirname, 'backend'),
    command: NPM_CMD,
    args: ['run', 'dev'],
  },
  {
    name: 'FRONTEND',
    color: '\x1b[35m',
    cwd: path.join(__dirname, 'frontend'),
    command: NPM_CMD,
    args: ['run', 'dev'],
  },
  {
    name: 'ML-SERVICE',
    color: '\x1b[33m',
    cwd: path.join(__dirname, 'ml-service'),
    command: PYTHON_CMD,
    args: ['main.py'],
  },
];

const RESET = '\x1b[0m';
const children = [];

function prefixOutput(name, color, data) {
  const lines = data.toString().split('\n').filter((line) => line.length > 0);
  for (const line of lines) {
    console.log(`${color}[${name}]${RESET} ${line}`);
  }
}

function startService(service) {
  console.log(`${service.color}[${service.name}]${RESET} Starting: ${service.command} ${service.args.join(' ')} (cwd: ${service.cwd})`);
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    shell: isWindows,
    env: process.env,
  });

  child.stdout.on('data', (data) => prefixOutput(service.name, service.color, data));
  child.stderr.on('data', (data) => prefixOutput(service.name, service.color, data));
  child.on('error', (err) => console.error(`${service.color}[${service.name}]${RESET} Failed to start: ${err.message}`));
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) console.error(`${service.color}[${service.name}]${RESET} Exited with code ${code}`);
    else if (signal) console.log(`${service.color}[${service.name}]${RESET} Stopped (${signal})`);
  });

  children.push(child);
}

console.log('Starting BurnoutGuard: backend, frontend, and ml-service...\n');
services.forEach(startService);

function shutdown() {
  console.log('\nShutting down all services...');
  for (const child of children) {
    if (isWindows) spawn('taskkill', ['/pid', child.pid, '/T', '/F']);
    else child.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
