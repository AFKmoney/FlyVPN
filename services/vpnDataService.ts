import { Server } from '../types';
import { countryToFlag, getFlagEmoji } from '../lib/utils';

// --- OpenGate (Public VPN) Data Fetcher ---
const fetchOpenGateServers = async (): Promise<Server[]> => {
    try {
        // Using a CORS proxy to bypass browser restrictions on fetching from the raw domain.
        const response = await fetch('https://api.allorigins.win/raw?url=http://www.vpngate.net/api/iphone/');
        if (!response.ok) throw new Error('Failed to fetch OpenGate server list');
        
        const textData = await response.text();
        // Optimization: parse text directly without splitting into lines or values arrays
        // This reduces memory allocation significantly for large datasets
        const servers: Server[] = [];

        let lineStart = 0;
        let lineEnd = textData.indexOf('\n', lineStart); // Skip comment line
        if (lineEnd === -1) return [];

        lineStart = lineEnd + 1;
        lineEnd = textData.indexOf('\n', lineStart); // Header line
        if (lineEnd === -1) return [];

        const headerLine = textData.substring(lineStart, lineEnd);
        const header = headerLine.split(',');

        // Find column indices dynamically
        const ipIndex = header.indexOf('IP');
        const countryLongIndex = header.indexOf('CountryLong');
        const countryShortIndex = header.indexOf('CountryShort');
        const speedIndex = header.indexOf('Speed');
        const pingIndex = header.indexOf('Ping');
        const numVpnSessionsIndex = header.indexOf('#VPN-Sessions');

        const maxIndex = Math.max(ipIndex, countryLongIndex, speedIndex, pingIndex, numVpnSessionsIndex);

        lineStart = lineEnd + 1;
        const len = textData.length;

        while (lineStart < len) {
            lineEnd = textData.indexOf('\n', lineStart);
            if (lineEnd === -1) lineEnd = len;

            if (lineEnd > lineStart) {
                let pos = lineStart;
                let colIndex = 0;

                let ip: string | undefined;
                let country: string | undefined;
                let speed = 0;
                let latency: number | null = null;
                let sessions = 0;

                while (colIndex <= maxIndex && pos <= lineEnd) {
                    let nextComma = textData.indexOf(',', pos);
                    if (nextComma === -1 || nextComma > lineEnd) {
                        nextComma = lineEnd;
                    }

                    if (colIndex === ipIndex) ip = textData.substring(pos, nextComma);
                    else if (colIndex === countryLongIndex) country = textData.substring(pos, nextComma);
                    else if (colIndex === speedIndex) speed = parseInt(textData.substring(pos, nextComma), 10);
                    else if (colIndex === pingIndex) latency = parseInt(textData.substring(pos, nextComma), 10);
                    else if (colIndex === numVpnSessionsIndex) sessions = parseInt(textData.substring(pos, nextComma), 10);

                    pos = nextComma + 1;
                    colIndex++;
                    if (nextComma === lineEnd) break;
                }

                // Simple load calculation based on sessions and speed
                const load = Math.min(99, Math.round((sessions / (speed / 1000000)) * 2));

                if (ip && country) {
                    // Extract 2-letter country code from OpenGate (e.g. "Japan (JP)" -> "JP")
                    const codeMatch = country.match(/\(([A-Z]{2})\)\s*$/);
                    const countryCode = codeMatch ? codeMatch[1] : undefined;
                    servers.push({
                        id: `og-${ip}`,
                        ip,
                        country: country.replace(/\s*\([A-Z]{2}\)\s*$/, '').trim(),
                        city: country, // OpenGate doesn't provide city-level data
                        latency,
                        load: isNaN(load) ? 50 : load,
                        flag: countryCode ? getFlagEmoji(countryCode) : countryToFlag(country),
                        type: 'opengate',
                    });
                }
            }
            lineStart = lineEnd + 1;
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
