import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';

describe('API Tests', () => {
  const BASE_URL = 'http://localhost:4001'; // Use different port for tests
  let serverProcess;

  beforeAll(async () => {
    // Start the server before tests with test port
    serverProcess = spawn('node', ['src/server.js'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test', PORT: '4001' }
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server startup timeout'));
      }, 10000);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Server running on http://localhost:4001')) {
          clearTimeout(timeout);
          setTimeout(resolve, 500); // Give server a moment to be fully ready
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });
    });
  }, 15000);

  afterAll(async () => {
    // Stop the server after tests
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise((resolve) => {
        serverProcess.on('close', resolve);
      });
    }
  });

  describe('Health Check', () => {
    it('should return alive status from root endpoint', async () => {
      const response = await fetch(`${BASE_URL}/`);
      const text = await response.text();
      expect(text).toBe('Backend is alive');
    });

    it('should have CORS enabled', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
    });
  });

  describe('Authentication', () => {
    it('should reject login with invalid credentials', async () => {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'invalid@test.com', password: 'wrong' })
      });
      expect(response.status).toBe(401);
    });
  });
});
