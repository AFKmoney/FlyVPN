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
    // Expanded based on API requirements and common countries
    'Korea Republic of': '🇰🇷', 'Iran (ISLAMIC Republic Of)': '🇮🇷', 'Russian Federation': '🇷🇺',
    'Viet Nam': '🇻🇳', 'Thailand': '🇹🇭', 'United Arab Emirates': '🇦🇪', 'Philippines': '🇵🇭',
    'Myanmar': '🇲🇲', 'Turkmenistan': '🇹🇲', 'Bangladesh': '🇧🇩', 'Ukraine': '🇺🇦',
    'Saudi Arabia': '🇸🇦', 'Iraq': '🇮🇶', 'Czech Republic': '🇨🇿', 'Hungary': '🇭🇺',
    'Bulgaria': '🇧🇬', 'Serbia': '🇷🇸', 'Croatia': '🇭🇷', 'Slovakia': '🇸🇰', 'Moldova': '🇲🇩',
    'Belarus': '🇧🇾', 'Lithuania': '🇱🇹', 'Latvia': '🇱🇻', 'Estonia': '🇪🇪', 'Slovenia': '🇸🇮',
    'Cyprus': '🇨🇾', 'Luxembourg': '🇱🇺', 'Malta': '🇲🇹', 'Iceland': '🇮🇸', 'Pakistan': '🇵🇰',
    'Kazakhstan': '🇰🇿', 'Uzbekistan': '🇺🇿', 'Georgia': '🇬🇪', 'Azerbaijan': '🇦🇿',
    'Armenia': '🇦🇲', 'Egypt': '🇪🇬', 'Morocco': '🇲🇦', 'Algeria': '🇩🇿', 'Tunisia': '🇹🇳',
    'Libya': '🇱🇾', 'Kenya': '🇰🇪', 'Tanzania': '🇹🇿', 'Uganda': '🇺🇬', 'Ethiopia': '🇪🇹',
    'Ghana': '🇬🇭', 'Ivory Coast': '🇨🇮', 'Cameroon': '🇨🇲', 'Senegal': '🇸🇳', 'Zambia': '🇿🇲',
    'Zimbabwe': '🇿🇼', 'Namibia': '🇳🇦', 'Botswana': '🇧🇼', 'Mozambique': '🇲🇿', 'Angola': '🇦🇴',
    'Peru': '🇵🇪', 'Venezuela': '🇻🇪', 'Ecuador': '🇪🇨', 'Bolivia': '🇧🇴', 'Paraguay': '🇵🇾',
    'Uruguay': '🇺🇾', 'Panama': '🇵🇦', 'Costa Rica': '🇨🇷', 'Guatemala': '🇬🇹', 'Honduras': '🇭🇳',
    'El Salvador': '🇸🇻', 'Nicaragua': '🇳🇮', 'Cuba': '🇨🇺', 'Dominican Republic': '🇩🇴',
    'Jamaica': '🇯🇲', 'Trinidad and Tobago': '🇹🇹', 'Bahamas': '🇧🇸', 'Barbados': '🇧🇧',
    'Saint Lucia': '🇱🇨'
};

/**
 * Converts a 2-letter ISO country code (case-insensitive) to a flag emoji.
 */
export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const countryToFlag = (countryName: string): string => {
    // 1. Try direct lookup in our map
    if (COUNTRY_FLAGS[countryName]) {
        return COUNTRY_FLAGS[countryName];
    }

    // 2. Try to interpret as a 2-letter country code
    if (countryName && countryName.length === 2 && /^[a-zA-Z]{2}$/.test(countryName)) {
         return getFlagEmoji(countryName);
    }

    return '🏳️';
};
