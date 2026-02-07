
import { findFastestServer } from '../lib/serverUtils';
import { Server } from '../types';

// Helper to create mock servers
const createServer = (id: string, latency: number | null): Server => ({
  id,
  latency,
  country: 'Test',
  city: 'Test City',
  load: 0,
  flag: '🏳️',
  ip: '0.0.0.0',
  type: 'flyvpn'
});

const runTests = () => {
  console.log('Running Server Utils Tests...');

  // Test 1: Empty array
  const emptyResult = findFastestServer([]);
  if (emptyResult !== undefined) {
    console.error('Test 1 Failed: Expected undefined for empty array');
    process.exit(1);
  }
  console.log('Test 1 Passed: Empty array handled correctly');

  // Test 2: Single server
  const singleServer = [createServer('s1', 10)];
  const singleResult = findFastestServer(singleServer);
  if (singleResult?.id !== 's1') {
    console.error('Test 2 Failed: Expected s1 for single server');
    process.exit(1);
  }
  console.log('Test 2 Passed: Single server handled correctly');

  // Test 3: Standard case
  const standardServers = [
    createServer('s1', 50),
    createServer('s2', 20), // Fastest
    createServer('s3', 100)
  ];
  const standardResult = findFastestServer(standardServers);
  if (standardResult?.id !== 's2') {
    console.error(`Test 3 Failed: Expected s2, got ${standardResult?.id}`);
    process.exit(1);
  }
  console.log('Test 3 Passed: Standard case handled correctly');

  // Test 4: With null latency (Infinity)
  const nullLatencyServers = [
    createServer('s1', null), // Infinity
    createServer('s2', 30),   // Fastest
    createServer('s3', 40)
  ];
  const nullResult = findFastestServer(nullLatencyServers);
  if (nullResult?.id !== 's2') {
    console.error(`Test 4 Failed: Expected s2 (30), got ${nullResult?.id} (${nullResult?.latency})`);
    process.exit(1);
  }
  console.log('Test 4 Passed: Null latency handled correctly');

  // Test 5: All null latencies
  const allNullServers = [
    createServer('s1', null),
    createServer('s2', null)
  ];
  const allNullResult = findFastestServer(allNullServers);
  // Sort stability implies first one is returned if all equal (Infinity - Infinity is NaN/0 behavior)
  if (allNullResult?.id !== 's1') {
    console.error(`Test 5 Failed: Expected s1 (first null), got ${allNullResult?.id}`);
    process.exit(1);
  }
  console.log('Test 5 Passed: All null latencies handled correctly (stable)');

  // Test 6: First is null, second is lower
  const firstNullThenValid = [
    createServer('s1', null),
    createServer('s2', 10)
  ];
  const firstNullResult = findFastestServer(firstNullThenValid);
  if (firstNullResult?.id !== 's2') {
    console.error(`Test 6 Failed: Expected s2, got ${firstNullResult?.id}`);
    process.exit(1);
  }
  console.log('Test 6 Passed: First null then valid handled correctly');

  console.log('All tests passed!');
};

runTests();
