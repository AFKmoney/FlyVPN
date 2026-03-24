import { Server } from '../types';
import { countryToFlag, getFlagEmoji } from '../lib/utils';

// --- OpenGate (Public VPN) Data Fetcher ---
const fetchOpenGateServers = async (): Promise<Server[]> => {
    try {
        // Using a CORS proxy to bypass browser restrictions on fetching from the raw domain.
        const response = await fetch('https://api.allorigins.win/raw?url=http://www.vpngate.net/api/iphone/');
        if (!response.ok) throw new Error('Failed to fetch OpenGate server list');
        
        const textData = await response.text();
        const lines = textData.split('\n');
        const servers: Server[] = [];
        const header = lines[1].split(',');

        // Find column indices dynamically
        const ipIndex = header.indexOf('IP');
        const countryLongIndex = header.indexOf('CountryLong');
        const countryShortIndex = header.indexOf('CountryShort');
        const speedIndex = header.indexOf('Speed');
        const pingIndex = header.indexOf('Ping');
        const numVpnSessionsIndex = header.indexOf('#VPN-Sessions');
        
        for (let i = 2; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length > 1) {
                const ip = values[ipIndex];
                const country = values[countryLongIndex];
                const countryCode = countryShortIndex !== -1 ? values[countryShortIndex] : undefined;
                const speed = parseInt(values[speedIndex], 10); // in bps
                const latency = pingIndex !== -1 ? parseInt(values[pingIndex], 10) : null;
                const sessions = numVpnSessionsIndex !== -1 ? parseInt(values[numVpnSessionsIndex], 10) : 0;
                
                // Simple load calculation based on sessions and speed
                const load = Math.min(99, Math.round((sessions / (speed / 1000000)) * 2));
                
                if (ip && country) {
                     servers.push({
                        id: `og-${ip}`,
                        ip,
                        country,
                        city: country, // OpenGate doesn't provide city-level data
                        latency,
                        load: isNaN(load) ? 50 : load,
                        flag: countryCode ? getFlagEmoji(countryCode) : countryToFlag(country),
                        type: 'opengate',
                    });
                }
            }
        }
        return servers;
    } catch (error) {
        console.error("Error fetching OpenGate servers:", error);
        return [];
    }
};

// --- Tor Exit Node Data Fetcher ---
const fetchTorExitNodes = async (): Promise<Server[]> => {
    try {
        const response = await fetch('https://onionoo.torproject.org/details?type=relay&flag=Exit&limit=200');
        if (!response.ok) throw new Error('Failed to fetch Tor exit nodes');
        
        const data = await response.json();
        const servers: Server[] = data.relays.map((relay: any) => ({
            id: `tor-${relay.fingerprint}`,
            ip: relay.exit_addresses ? relay.exit_addresses[0] : 'N/A',
            country: relay.country_name,
            city: relay.nickname, // Use nickname for city as it's more descriptive
            latency: null, // Tor doesn't provide latency directly
            load: Math.round((relay.consensus_weight / 10000) * 100), // Approximate load
            flag: relay.country ? getFlagEmoji(relay.country) : countryToFlag(relay.country_name),
            type: 'tor',
        }));
        return servers;
    } catch (error) {
        console.error("Error fetching Tor exit nodes:", error);
        return [];
    }
};

// --- Main Export ---
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface PublicNodesCache {
    data: { opengate: Server[], tor: Server[] } | null;
    timestamp: number;
}

let cache: PublicNodesCache = {
    data: null,
    timestamp: 0
};

let pendingPromise: Promise<{ opengate: Server[], tor: Server[] }> | null = null;

export const fetchPublicNodes = async (): Promise<{ opengate: Server[], tor: Server[] }> => {
    const now = Date.now();

    // Return cached data if valid
    if (cache.data && (now - cache.timestamp < CACHE_DURATION)) {
        return cache.data;
    }

    // Return pending promise if a fetch is already in progress
    if (pendingPromise) {
        return pendingPromise;
    }

    // Initiate new fetch
    pendingPromise = (async () => {
        try {
            const [opengate, tor] = await Promise.all([
                fetchOpenGateServers(),
                fetchTorExitNodes()
            ]);
            const data = { opengate, tor };

            cache = {
                data,
                timestamp: Date.now()
            };
            return data;
        } finally {
            pendingPromise = null;
        }
    })();

    return pendingPromise;
};
