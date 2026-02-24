// A mapping for country names to flags.
// This list includes standard names and common variations found in VPN/Tor APIs.
const COUNTRY_FLAGS: Record<string, string> = {
    // A
    'Afghanistan': '🇦🇫', 'Albania': '🇦🇱', 'Algeria': '🇩🇿', 'Andorra': '🇦🇩', 'Angola': '🇦🇴',
    'Antigua and Barbuda': '🇦🇬', 'Argentina': '🇦🇷', 'Armenia': '🇦🇲', 'Australia': '🇦🇺', 'Austria': '🇦🇹', 'Azerbaijan': '🇦🇿',

    // B
    'Bahamas': '🇧🇸', 'Bahrain': '🇧🇭', 'Bangladesh': '🇧🇩', 'Barbados': '🇧🇧', 'Belarus': '🇧🇾',
    'Belgium': '🇧🇪', 'Belize': '🇧🇿', 'Benin': '🇧🇯', 'Bhutan': '🇧🇹', 'Bolivia': '🇧🇴', 'Bolivia (Plurinational State of)': '🇧🇴',
    'Bosnia and Herzegovina': '🇧🇦', 'Botswana': '🇧🇼', 'Brazil': '🇧🇷', 'Brunei': '🇧🇳', 'Bulgaria': '🇧🇬',
    'Burkina Faso': '🇧🇫', 'Burundi': '🇧🇮',

    // C
    'Cabo Verde': '🇨🇻', 'Cambodia': '🇰🇭', 'Cameroon': '🇨🇲', 'Canada': '🇨🇦', 'Central African Republic': '🇨🇫',
    'Chad': '🇹🇩', 'Chile': '🇨🇱', 'China': '🇨🇳', 'Colombia': '🇨🇴', 'Comoros': '🇰🇲',
    'Congo': '🇨🇬', 'Democratic Republic of the Congo': '🇨🇩', 'Costa Rica': '🇨🇷', 'Croatia': '🇭🇷', 'Cuba': '🇨🇺',
    'Cyprus': '🇨🇾', 'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿',

    // D
    'Denmark': '🇩🇰', 'Djibouti': '🇩🇯', 'Dominica': '🇩🇲', 'Dominican Republic': '🇩🇴',

    // E
    'Ecuador': '🇪🇨', 'Egypt': '🇪🇬', 'El Salvador': '🇸🇻', 'Equatorial Guinea': '🇬🇶', 'Eritrea': '🇪🇷',
    'Estonia': '🇪🇪', 'Eswatini': '🇸🇿', 'Ethiopia': '🇪🇹',

    // F
    'Fiji': '🇫🇯', 'Finland': '🇫🇮', 'France': '🇫🇷',

    // G
    'Gabon': '🇬🇦', 'Gambia': '🇬🇲', 'Georgia': '🇬🇪', 'Germany': '🇩🇪', 'Ghana': '🇬🇭',
    'Greece': '🇬🇷', 'Grenada': '🇬🇩', 'Guatemala': '🇬🇹', 'Guinea': '🇬🇳', 'Guinea-Bissau': '🇬🇼',
    'Guyana': '🇬🇾',

    // H
    'Haiti': '🇭🇹', 'Honduras': '🇭🇳', 'Hong Kong': '🇭🇰', 'Hungary': '🇭🇺',

    // I
    'Iceland': '🇮🇸', 'India': '🇮🇳', 'Indonesia': '🇮🇩', 'Iran': '🇮🇷', 'Iran (ISLAMIC Republic Of)': '🇮🇷',
    'Iraq': '🇮🇶', 'Ireland': '🇮🇪', 'Israel': '🇮🇱', 'Italy': '🇮🇹', 'Ivory Coast': '🇨🇮', "Cote d'Ivoire": '🇨🇮',

    // J
    'Jamaica': '🇯🇲', 'Japan': '🇯🇵', 'Jordan': '🇯🇴',

    // K
    'Kazakhstan': '🇰🇿', 'Kenya': '🇰🇪', 'Kiribati': '🇰🇮', 'Kuwait': '🇰🇼', 'Kyrgyzstan': '🇰🇬',

    // L
    'Laos': '🇱🇦', "Lao People's Democratic Republic": '🇱🇦', 'Latvia': '🇱🇻', 'Lebanon': '🇱🇧', 'Lesotho': '🇱🇸',
    'Liberia': '🇱🇷', 'Libya': '🇱🇾', 'Liechtenstein': '🇱🇮', 'Lithuania': '🇱🇹', 'Luxembourg': '🇱🇺',

    // M
    'Macao': '🇲🇴', 'Madagascar': '🇲🇬', 'Malawi': '🇲🇼', 'Malaysia': '🇲🇾', 'Maldives': '🇲🇻',
    'Mali': '🇲🇱', 'Malta': '🇲🇹', 'Marshall Islands': '🇲🇭', 'Mauritania': '🇲🇷', 'Mauritius': '🇲🇺',
    'Mexico': '🇲🇽', 'Micronesia': '🇫🇲', 'Moldova': '🇲🇩', 'Moldova, Republic of': '🇲🇩', 'Monaco': '🇲🇨',
    'Mongolia': '🇲🇳', 'Montenegro': '🇲🇪', 'Morocco': '🇲🇦', 'Mozambique': '🇲🇿', 'Myanmar': '🇲🇲',

    // N
    'Namibia': '🇳🇦', 'Nauru': '🇳🇷', 'Nepal': '🇳🇵', 'Netherlands': '🇳🇱', 'New Zealand': '🇳🇿',
    'Nicaragua': '🇳🇮', 'Niger': '🇳🇪', 'Nigeria': '🇳🇬', 'North Korea': '🇰🇵', 'North Macedonia': '🇲🇰',
    'Norway': '🇳🇴',

    // O
    'Oman': '🇴🇲',

    // P
    'Pakistan': '🇵🇰', 'Palau': '🇵🇼', 'Palestine': '🇵🇸', 'Panama': '🇵🇦', 'Papua New Guinea': '🇵🇬',
    'Paraguay': '🇵🇾', 'Peru': '🇵🇪', 'Philippines': '🇵🇭', 'Poland': '🇵🇱', 'Portugal': '🇵🇹',

    // Q
    'Qatar': '🇶🇦',

    // R
    'Romania': '🇷🇴', 'Russia': '🇷🇺', 'Russian Federation': '🇷🇺', 'Rwanda': '🇷🇼',

    // S
    'Saint Kitts and Nevis': '🇰🇳', 'Saint Lucia': '🇱🇨', 'Saint Vincent and the Grenadines': '🇻🇨',
    'Samoa': '🇼🇸', 'San Marino': '🇸🇲', 'Sao Tome and Principe': '🇸🇹', 'Saudi Arabia': '🇸🇦',
    'Senegal': '🇸🇳', 'Serbia': '🇷🇸', 'Seychelles': '🇸🇨', 'Sierra Leone': '🇸🇱', 'Singapore': '🇸🇬',
    'Slovakia': '🇸🇰', 'Slovenia': '🇸🇮', 'Solomon Islands': '🇸🇧', 'Somalia': '🇸🇴',
    'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Korea Republic of': '🇰🇷', 'Republic of Korea': '🇰🇷', 'Korea, Republic of': '🇰🇷',
    'South Sudan': '🇸🇸', 'Spain': '🇪🇸', 'Sri Lanka': '🇱🇰', 'Sudan': '🇸🇩', 'Suriname': '🇸🇷',
    'Sweden': '🇸🇪', 'Switzerland': '🇨🇭', 'Syria': '🇸🇾', 'Syrian Arab Republic': '🇸🇾',

    // T
    'Taiwan': '🇹🇼', 'Taiwan, Province of China': '🇹🇼', 'Tajikistan': '🇹🇯', 'Tanzania': '🇹🇿', 'Tanzania, United Republic of': '🇹🇿',
    'Thailand': '🇹🇭', 'Timor-Leste': '🇹🇱', 'Togo': '🇹🇬', 'Tonga': '🇹🇴', 'Trinidad and Tobago': '🇹🇹',
    'Tunisia': '🇹🇳', 'Turkey': '🇹🇷', 'Turkmenistan': '🇹🇲', 'Tuvalu': '🇹🇻',

    // U
    'Uganda': '🇺🇬', 'Ukraine': '🇺🇦', 'UAE': '🇦🇪', 'United Arab Emirates': '🇦🇪',
    'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'Great Britain': '🇬🇧',
    'United States': '🇺🇸', 'USA': '🇺🇸', 'US': '🇺🇸', 'Uruguay': '🇺🇾', 'Uzbekistan': '🇺🇿',

    // V
    'Vanuatu': '🇻🇺', 'Vatican City': '🇻🇦', 'Holy See (Vatican City State)': '🇻🇦',
    'Venezuela': '🇻🇪', 'Venezuela (Bolivarian Republic of)': '🇻🇪', 'Vietnam': '🇻🇳', 'Viet Nam': '🇻🇳',

    // Y
    'Yemen': '🇾🇪',

    // Z
    'Zambia': '🇿🇲', 'Zimbabwe': '🇿🇼'
};

export const countryToFlag = (countryName: string): string => {
    return COUNTRY_FLAGS[countryName] || '🏳️';
};
