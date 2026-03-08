
const SERVERS = [
  { id: 'us-ny-opt', country: 'United States', city: 'New York (Optimized)', latency: 12, load: 15, flag: '🇺🇸', ip: '108.59.8.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'us-la-opt', country: 'United States', city: 'Los Angeles (Optimized)', latency: 25, load: 18, flag: '🇺🇸', ip: '198.54.130.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'us-mia-opt', country: 'United States', city: 'Miami (Optimized)', latency: 18, load: 20, flag: '🇺🇸', ip: '198.54.132.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'uk-lon-opt', country: 'United Kingdom', city: 'London (Optimized)', latency: 18, load: 22, flag: '🇬🇧', ip: '212.102.40.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'de-fra-opt', country: 'Germany', city: 'Frankfurt (Optimized)', latency: 20, load: 12, flag: '🇩🇪', ip: '185.220.101.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'nl-ams-opt', country: 'Netherlands', city: 'Amsterdam (Optimized)', latency: 15, load: 25, flag: '🇳🇱', ip: '45.132.244.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'sg-sin-opt', country: 'Singapore', city: 'Singapore (Optimized)', latency: 35, load: 20, flag: '🇸🇬', ip: '103.152.220.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'jp-tok-opt', country: 'Japan', city: 'Tokyo (Optimized)', latency: 45, load: 19, flag: '🇯🇵', ip: '103.116.44.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'au-syd-opt', country: 'Australia', city: 'Sydney (Optimized)', latency: 130, load: 14, flag: '🇦🇺', ip: '45.148.116.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'ca-tor-opt', country: 'Canada', city: 'Toronto (Optimized)', latency: 22, load: 17, flag: '🇨🇦', ip: '199.247.28.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'ch-zur-opt', country: 'Switzerland', city: 'Zurich (Optimized)', latency: 19, load: 11, flag: '🇨🇭', ip: '185.100.84.1', tier: 'optimized', type: 'flyvpn' },
  { id: 'br-rio-opt', country: 'Brazil', city: 'Rio de Janeiro (Optimized)', latency: 90, load: 25, flag: '🇧🇷', ip: '177.8.9.10', tier: 'optimized', type: 'flyvpn' },
  { id: 'in-del-opt', country: 'India', city: 'Delhi (Optimized)', latency: 70, load: 22, flag: '🇮🇳', ip: '115.10.11.12', tier: 'optimized', type: 'flyvpn' },
  { id: 'es-mad-opt', country: 'Spain', city: 'Madrid (Optimized)', latency: 25, load: 18, flag: '🇪🇸', ip: '193.30.31.32', tier: 'optimized', type: 'flyvpn' },
  { id: 'it-rom-opt', country: 'Italy', city: 'Rome (Optimized)', latency: 28, load: 21, flag: '🇮🇹', ip: '193.34.35.36', tier: 'optimized', type: 'flyvpn' },
  { id: 'kr-seo-opt', country: 'South Korea', city: 'Seoul (Optimized)', latency: 48, load: 24, flag: '🇰🇷', ip: '210.10.11.12', tier: 'optimized', type: 'flyvpn' },
  { id: 'us-east', country: 'United States', city: 'New York', latency: 24, load: 45, flag: '🇺🇸', ip: '104.21.78.112', tier: 'standard', type: 'flyvpn' },
  { id: 'us-chi', country: 'United States', city: 'Chicago', latency: 31, load: 38, flag: '🇺🇸', ip: '64.233.191.100', tier: 'standard', type: 'flyvpn' },
  { id: 'us-dal', country: 'United States', city: 'Dallas', latency: 45, load: 60, flag: '🇺🇸', ip: '172.67.132.123', tier: 'standard', type: 'flyvpn' },
  { id: 'us-mia', country: 'United States', city: 'Miami', latency: 52, load: 70, flag: '🇺🇸', ip: '104.26.10.123', tier: 'standard', type: 'flyvpn' },
  { id: 'us-west', country: 'United States', city: 'Los Angeles', latency: 65, load: 52, flag: '🇺🇸', ip: '192.147.1.1', tier: 'standard', type: 'flyvpn' },
  { id: 'uk-lon', country: 'United Kingdom', city: 'London', latency: 38, load: 62, flag: '🇬🇧', ip: '82.165.12.94', tier: 'standard', type: 'flyvpn' },
  { id: 'uk-man', country: 'United Kingdom', city: 'Manchester', latency: 41, load: 45, flag: '🇬🇧', ip: '185.220.102.4', tier: 'standard', type: 'flyvpn' },
  { id: 'de-fra', country: 'Germany', city: 'Frankfurt', latency: 42, load: 28, flag: '🇩🇪', ip: '172.67.144.11', tier: 'standard', type: 'flyvpn' },
  { id: 'de-ber', country: 'Germany', city: 'Berlin', latency: 44, load: 35, flag: '🇩🇪', ip: '78.46.39.11', tier: 'standard', type: 'flyvpn' },
  { id: 'fr-par', country: 'France', city: 'Paris', latency: 32, load: 88, flag: '🇫🇷', ip: '51.15.128.23', tier: 'standard', type: 'flyvpn' },
  { id: 'fr-mar', country: 'France', city: 'Marseille', latency: 36, load: 50, flag: '🇫🇷', ip: '92.222.138.91', tier: 'standard', type: 'flyvpn' },
  { id: 'ca-tor', country: 'Canada', city: 'Toronto', latency: 45, load: 31, flag: '🇨🇦', ip: '192.16.48.2', tier: 'standard', type: 'flyvpn' },
  { id: 'ca-van', country: 'Canada', city: 'Vancouver', latency: 70, load: 25, flag: '🇨🇦', ip: '69.16.223.1', tier: 'standard', type: 'flyvpn' },
  { id: 'au-syd', country: 'Australia', city: 'Sydney', latency: 210, load: 24, flag: '🇦🇺', ip: '103.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'au-mel', country: 'Australia', city: 'Melbourne', latency: 215, load: 19, flag: '🇦🇺', ip: '103.4.5.6', tier: 'standard', type: 'flyvpn' },
  { id: 'nz-auc', country: 'New Zealand', city: 'Auckland', latency: 220, load: 15, flag: '🇳🇿', ip: '103.14.15.16', tier: 'standard', type: 'flyvpn' },
  { id: 'jp-tok', country: 'Japan', city: 'Tokyo', latency: 156, load: 22, flag: '🇯🇵', ip: '141.193.213.20', tier: 'standard', type: 'flyvpn' },
  { id: 'kr-seo', country: 'South Korea', city: 'Seoul', latency: 165, load: 22, flag: '🇰🇷', ip: '210.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'hk-hk', country: 'Hong Kong', city: 'Hong Kong', latency: 175, load: 41, flag: '🇭🇰', ip: '202.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'tw-tpe', country: 'Taiwan', city: 'Taipei', latency: 180, load: 33, flag: '🇹🇼', ip: '1.2.3.4', tier: 'standard', type: 'flyvpn' },
  { id: 'sg-sin', country: 'Singapore', city: 'Singapore', latency: 180, load: 25, flag: '🇸🇬', ip: '103.25.202.1', tier: 'standard', type: 'flyvpn' },
  { id: 'id-jak', country: 'Indonesia', city: 'Jakarta', latency: 185, load: 40, flag: '🇮🇩', ip: '103.30.31.32', tier: 'standard', type: 'flyvpn' },
  { id: 'my-kua', country: 'Malaysia', city: 'Kuala Lumpur', latency: 190, load: 35, flag: '🇲🇾', ip: '103.35.36.37', tier: 'standard', type: 'flyvpn' },
  { id: 'vn-hoc', country: 'Vietnam', city: 'Ho Chi Minh', latency: 195, load: 30, flag: '🇻🇳', ip: '103.40.41.42', tier: 'standard', type: 'flyvpn' },
  { id: 'in-mum', country: 'India', city: 'Mumbai', latency: 140, load: 55, flag: '🇮🇳', ip: '115.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'in-blr', country: 'India', city: 'Bangalore', latency: 145, load: 48, flag: '🇮🇳', ip: '115.4.5.6', tier: 'standard', type: 'flyvpn' },
  { id: 'br-sao', country: 'Brazil', city: 'São Paulo', latency: 195, load: 61, flag: '🇧🇷', ip: '177.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'cl-san', country: 'Chile', city: 'Santiago', latency: 230, load: 28, flag: '🇨🇱', ip: '200.10.11.12', tier: 'standard', type: 'flyvpn' },
  { id: 'co-bog', country: 'Colombia', city: 'Bogota', latency: 120, load: 33, flag: '🇨🇴', ip: '190.10.11.12', tier: 'standard', type: 'flyvpn' },
  { id: 'ar-bue', country: 'Argentina', city: 'Buenos Aires', latency: 220, load: 25, flag: '🇦🇷', ip: '181.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'mx-mex', country: 'Mexico', city: 'Mexico City', latency: 85, load: 39, flag: '🇲🇽', ip: '187.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'za-joh', country: 'South Africa', city: 'Johannesburg', latency: 240, load: 21, flag: '🇿🇦', ip: '197.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'za-cap', country: 'South Africa', city: 'Cape Town', latency: 250, load: 18, flag: '🇿🇦', ip: '197.10.11.12', tier: 'standard', type: 'flyvpn' },
  { id: 'ae-dxb', country: 'UAE', city: 'Dubai', latency: 110, load: 44, flag: '🇦🇪', ip: '94.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'tr-ist', country: 'Turkey', city: 'Istanbul', latency: 95, load: 58, flag: '🇹🇷', ip: '88.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'il-tel', country: 'Israel', city: 'Tel Aviv', latency: 105, load: 29, flag: '🇮🇱', ip: '147.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'ch-zur', country: 'Switzerland', city: 'Zurich', latency: 35, load: 18, flag: '🇨🇭', ip: '185.100.84.1', tier: 'standard', type: 'flyvpn' },
  { id: 'nl-ams', country: 'Netherlands', city: 'Amsterdam', latency: 28, load: 55, flag: '🇳🇱', ip: '95.211.12.3', tier: 'standard', type: 'flyvpn' },
  { id: 'se-sto', country: 'Sweden', city: 'Stockholm', latency: 40, load: 22, flag: '🇸🇪', ip: '193.105.134.1', tier: 'standard', type: 'flyvpn' },
  { id: 'no-osl', country: 'Norway', city: 'Oslo', latency: 45, load: 15, flag: '🇳🇴', ip: '193.1.2.3', tier: 'standard', type: 'flyvpn' },
  { id: 'dk-cop', country: 'Denmark', city: 'Copenhagen', latency: 42, load: 17, flag: '🇩🇰', ip: '193.4.5.6', tier: 'standard', type: 'flyvpn' },
  { id: 'fi-hel', country: 'Finland', city: 'Helsinki', latency: 48, load: 12, flag: '🇫🇮', ip: '193.7.8.9', tier: 'standard', type: 'flyvpn' },
  { id: 'pl-war', country: 'Poland', city: 'Warsaw', latency: 52, load: 31, flag: '🇵🇱', ip: '193.10.11.12', tier: 'standard', type: 'flyvpn' },
  { id: 'ie-dub', country: 'Ireland', city: 'Dublin', latency: 35, load: 28, flag: '🇮🇪', ip: '193.13.14.15', tier: 'standard', type: 'flyvpn' },
  { id: 'be-bru', country: 'Belgium', city: 'Brussels', latency: 30, load: 34, flag: '🇧🇪', ip: '193.16.17.18', tier: 'standard', type: 'flyvpn' },
  { id: 'at-vie', country: 'Austria', city: 'Vienna', latency: 38, load: 21, flag: '🇦🇹', ip: '193.19.20.21', tier: 'standard', type: 'flyvpn' },
  { id: 'it-mil', country: 'Italy', city: 'Milan', latency: 36, load: 47, flag: '🇮🇹', ip: '193.22.23.24', tier: 'standard', type: 'flyvpn' },
  { id: 'it-rom', country: 'Italy', city: 'Rome', latency: 40, load: 53, flag: '🇮🇹', ip: '193.22.23.25', tier: 'standard', type: 'flyvpn' },
  { id: 'es-mad', country: 'Spain', city: 'Madrid', latency: 45, load: 43, flag: '🇪🇸', ip: '193.25.26.27', tier: 'standard', type: 'flyvpn' },
  { id: 'es-bcn', country: 'Spain', city: 'Barcelona', latency: 48, load: 51, flag: '🇪🇸', ip: '193.25.26.28', tier: 'standard', type: 'flyvpn' },
  { id: 'pt-lis', country: 'Portugal', city: 'Lisbon', latency: 50, load: 30, flag: '🇵🇹', ip: '91.107.136.1', tier: 'standard', type: 'flyvpn' },
  { id: 'gr-ath', country: 'Greece', city: 'Athens', latency: 60, load: 38, flag: '🇬🇷', ip: '194.39.224.1', tier: 'standard', type: 'flyvpn' },
];

// Mock translation function
const t = (key) => key;

const search = 'New York';
const iterations = 1000000;

function benchmarkOriginal() {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    SERVERS.filter(s =>
      t(s.country).toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
    );
  }
  return Date.now() - start;
}

function benchmarkOptimized() {
  const start = Date.now();
  for (let i = 0; i < iterations; i++) {
    const searchLower = search.toLowerCase();
    SERVERS.filter(s =>
      t(s.country).toLowerCase().includes(searchLower) ||
      s.city.toLowerCase().includes(searchLower)
    );
  }
  return Date.now() - start;
}

console.log('Running benchmarks...');
const originalTime = benchmarkOriginal();
console.log(`Original: ${originalTime}ms`);

const optimizedTime = benchmarkOptimized();
console.log(`Optimized: ${optimizedTime}ms`);

console.log(`Improvement: ${(((originalTime - optimizedTime) / originalTime) * 100).toFixed(2)}%`);
