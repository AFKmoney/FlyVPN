
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
}

export enum VPNProtocol {
  WIREGUARD = 'WireGuard',
  OPENVPN = 'OpenVPN',
  IKEV2 = 'IKEv2',
}

export enum TransportType {
  UDP = 'UDP',
  TCP = 'TCP',
}

export enum DNSProvider {
  CLOUDFLARE = 'Cloudflare (1.1.1.1)',
  GOOGLE = 'Google (8.8.8.8)',
  QUAD9 = 'Quad9 (9.9.9.9)',
  ADGUARD = 'AdGuard DNS',
  SYSTEM = 'System Default',
  CUSTOM = 'Custom DNS',
}

export interface Server {
  id: string;
  country: string;
  city: string;
  latency: number | null;
  load: number | null;
  flag: string;
  ip: string;
  tier?: 'standard' | 'optimized';
  type: 'flyvpn' | 'opengate' | 'tor';
}

export interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet' | 'browser';
  os: string;
  status: 'online' | 'offline' | 'protected';
  lastSeen: number;
  ip: string;
  isCurrent?: boolean;
}

export interface VPNConfig {
  protocol: VPNProtocol;
  transport: TransportType;
  port: number;
  mtu: number;
  dnsProvider: DNSProvider;
  customDNS: string;
  killSwitch: boolean;
  splitTunneling: boolean;
  onionOverVPN: boolean;
  obfuscation: boolean;
  ghostMode: boolean; // Master switch for stealth
  dynamicMAC: boolean; // MAC address spoofing
  scramble: boolean; // Obfuscated tunneling
  multiHop: boolean; // Chain servers
  adBlocker: boolean; // New Threat Shield option
  malwareShield: boolean; // New Threat Shield option
  adaptiveRouting: boolean; // Auto-switch to fastest server

  // --- 34 NEW MODULES ---

  // Core Engine
  secureCoreRouting: boolean;
  dedicatedIP: boolean;

  // Stealth Protocol
  dynamicIPRotation: boolean;
  portScrambling: boolean;
  antiDPIEngine: boolean;
  decoyTrafficGenerator: boolean;
  
  // Threat Shield
  phishingShield: boolean;
  antiRansomwareEngine: boolean;
  spywareBlocker: boolean;
  iotDeviceProtection: boolean;

  // Network Fabric
  quantumResistantEncryption: boolean;
  packetPrioritizationQoS: boolean;
  jitterReduction: boolean;
  advancedPortForwarding: boolean;

  // Device Armor
  hardwareFingerprintScrambler: boolean;
  cameraMicGuard: boolean;
  usbDeviceGuard: boolean;
  firmwareIntegrityMonitor: boolean;
  geofenceProtection: boolean;

  // Intel Center
  logManagerEnabled: boolean;
}

export interface UserStatus {
  realIP: string;
  virtualIP: string;
  location: { lat: number; lon: number } | null;
  dataUsage: {
    down: number;
    up: number;
  };
}

export interface LogEntry {
  timestamp: number;
  event: string;
  details: string;
}