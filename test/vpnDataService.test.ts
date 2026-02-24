
import { fetchPublicNodes } from '../services/vpnDataService';

// Mock fetch
const originalFetch = global.fetch;
global.fetch = async (url: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (url.toString().includes('vpngate')) {
        return {
            ok: true,
            text: async () => `#Header
HostName,IP,Score,Ping,Speed,CountryLong,CountryShort,#VPN-Sessions,Uptime,TotalUsers,TotalTraffic,LogType,Operator,Message,OpenVPN_ConfigData_Base64
opengate1,1.1.1.1,123,50,10000000,Country A,CA,100,1000,5000,10000000,public,opengate,message,base64
opengate2,2.2.2.2,456,100,5000000,Country B,CB,50,500,2500,5000000,public,opengate,message,base64
`, // 3 lines: header, 2 data lines
            json: async () => ({})
        } as Response;
    } else if (url.toString().includes('onionoo')) {
         return {
            ok: true,
            json: async () => ({
                relays: [
                    { fingerprint: 'tor1', exit_addresses: ['3.3.3.3'], country_name: 'Country C', nickname: 'torNode1', consensus_weight: 5000 }
                ]
            }),
            text: async () => ''
        } as Response;
    }
    return { ok: false } as Response;
};

// Test
const runTest = async () => {
    console.log("Running vpnDataService tests...");
    try {
        const { opengate, tor } = await fetchPublicNodes();

        console.log(`OpenGate servers: ${opengate.length}`);
        if (opengate.length !== 2) throw new Error(`Expected 2 OpenGate servers, got ${opengate.length}`);

        // Verify parsing logic
        const s1 = opengate.find(s => s.ip === '1.1.1.1');
        if (!s1) throw new Error('Server 1.1.1.1 not found');
        if (s1.country !== 'Country A') throw new Error(`Expected Country A, got ${s1.country}`);
        // Speed 10000000 -> 10Mbps. Sessions 100. Load calculation: (100 / (10000000/1000000)) * 2 = (100 / 10) * 2 = 20.
        // But code: Math.min(99, Math.round((sessions / (speed / 1000000)) * 2))
        // s1: sessions=100, speed=10000000 (10M). speed/1M = 10. sessions/10 = 10. *2 = 20.
        if (s1.load !== 20) throw new Error(`Expected load 20, got ${s1.load}`);

        console.log(`Tor servers: ${tor.length}`);
        if (tor.length !== 1) throw new Error(`Expected 1 Tor server, got ${tor.length}`);
        if (tor[0].ip !== '3.3.3.3') throw new Error(`Expected IP 3.3.3.3, got ${tor[0].ip}`);

        console.log("All tests passed!");
    } catch (e) {
        console.error("Test failed:", e);
        process.exit(1);
    } finally {
        global.fetch = originalFetch;
    }
};

runTest();
