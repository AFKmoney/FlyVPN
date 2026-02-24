import { Server } from '../types';
import { countryToFlag } from '../lib/utils';

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
                     servers.push({
                        id: `og-${ip}`,
                        ip,
                        country,
                        city: country, // OpenGate doesn't provide city-level data
                        latency,
                        load: isNaN(load) ? 50 : load,
                        flag: countryToFlag(country),
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
            flag: countryToFlag(relay.country_name),
            type: 'tor',
        }));
        return servers;
    } catch (error) {
        console.error("Error fetching Tor exit nodes:", error);
        return [];
    }
};

// --- Main Export ---
export const fetchPublicNodes = async (): Promise<{ opengate: Server[], tor: Server[] }> => {
    const [opengate, tor] = await Promise.all([
        fetchOpenGateServers(),
        fetchTorExitNodes()
    ]);
    return { opengate, tor };
};
