import { Server } from '../types';

/**
 * Finds the fastest server from a list based on latency.
 * Uses reduce for better performance over sort when finding extrema.
 *
 * @param servers - Array of servers to search through
 * @returns The server with the lowest latency, or undefined if the list is empty
 */
export const findFastestServer = (servers: Server[]): Server | undefined => {
  if (servers.length === 0) return undefined;

  return servers.reduce((prev, curr) => {
    const prevLatency = prev.latency ?? Infinity;
    const currLatency = curr.latency ?? Infinity;
    return currLatency < prevLatency ? curr : prev;
  });
};
