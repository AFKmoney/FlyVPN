// A simple mapping for country names to flags. This can be expanded.
const COUNTRY_FLAGS: Record<string, string> = {
    'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Canada': '🇨🇦',
    'Australia': '🇦🇺', 'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Hong Kong': '🇭🇰', 'Taiwan': '🇹🇼',
    'Singapore': '🇸🇬', 'India': '🇮🇳', 'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Mexico': '🇲🇽',
    'South Africa': '🇿🇦', 'UAE': '🇦🇪', 'Turkey': '🇹🇷', 'Israel': '🇮🇱', 'Switzerland': '🇨🇭',
    'Netherlands': '🇳🇱', 'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Finland': '🇫🇮',
    'Poland': '🇵🇱', 'Ireland': '🇮🇪', 'Belgium': '🇧🇪', 'Austria': '🇦🇹', 'Italy': '🇮🇹',
    'Spain': '🇪🇸', 'New Zealand': '🇳🇿', 'Chile': '🇨🇱', 'Colombia': '🇨🇴', 'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾', 'Vietnam': '🇻🇳', 'Russia': '🇷🇺', 'China': '🇨🇳', 'North Korea': '🇰🇵',
    'Iran': '🇮🇷', 'Nigeria': '🇳🇬', 'Portugal': '🇵🇹', 'Greece': '🇬🇷',
    // Add more as needed by the APIs
};

export const countryToFlag = (countryName: string): string => {
    return COUNTRY_FLAGS[countryName] || '🏳️';
};
