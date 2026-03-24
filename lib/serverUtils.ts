import { Server } from '../types';

/**
 * Finds the server with the lowest latency from a list of servers.
 * This function is an O(N) optimization over the previous O(N log N) sorting method.
 *
 * @param servers Array of Server objects
 * @returns The Server with the lowest latency, or undefined if the array is empty.
 */
export const findFastestServer = (servers: Server[]): Server | undefined => {
  if (!servers || servers.length === 0) return undefined;

  let bestServer: Server | undefined = servers[0];
  let minLatency = bestServer.latency ?? Infinity;

  for (let i = 1; i < servers.length; i++) {
    const server = servers[i];
    const latency = server.latency ?? Infinity;

    if (latency < minLatency) {
      minLatency = latency;
      bestServer = server;
    }
  }

  return bestServer;
};
