const amenityNameExceptions: Record<string, string> = {
  ac: 'AC',
  'air con': 'Air Con',
  'air conditioning': 'Air Conditioning',
  bbq: 'BBQ',
  cctv: 'CCTV',
  ev: 'EV Charging',
  'ev charging': 'EV Charging',
  'hot tub': 'Hot Tub',
  jacuzzi: 'Jacuzzi',
  tv: 'TV',
  wifi: 'WiFi',
  'wi-fi': 'WiFi',
  'wi fi': 'WiFi'
};

function titleCaseAmenity(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map(word => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(' ');
}

export function parseAmenities(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

export function normalizeAmenityName(value: string) {
  const compact = value.trim().replace(/\s+/g, ' ');
  const key = compact.toLowerCase();
  return amenityNameExceptions[key] ?? titleCaseAmenity(compact);
}

export function amenityIconFor(name: string) {
  const key = name.toLowerCase();

  if (/\bcctv\b|security|camera/.test(key)) return 'Cctv';
  if (/\bwifi\b|wi-fi|internet|broadband/.test(key)) return 'Wifi';
  if (/\btv\b|television|netflix|streaming/.test(key)) return 'Tv';
  if (/parking|driveway|garage/.test(key)) return 'CircleParking';
  if (/kitchen|cooker|oven|stove|hob/.test(key)) return 'CookingPot';
  if (/coffee|espresso/.test(key)) return 'Coffee';
  if (/washer|washing|laundry/.test(key)) return 'WashingMachine';
  if (/bath|bathroom/.test(key)) return 'Bath';
  if (/shower/.test(key)) return 'ShowerHead';
  if (/hot tub|jacuzzi|pool|swim/.test(key)) return 'Waves';
  if (/air con|air conditioning|\bac\b|cooling/.test(key)) return 'Snowflake';
  if (/heating|fireplace|fire pit|log burner/.test(key)) return 'Flame';
  if (/garden|patio|terrace|outdoor|yard/.test(key)) return 'Trees';
  if (/bbq|barbecue|grill/.test(key)) return 'Flame';
  if (/pet|dog/.test(key)) return 'Dog';
  if (/baby|cot|crib|high chair/.test(key)) return 'Baby';
  if (/gym|fitness|weights/.test(key)) return 'Dumbbell';
  if (/wine|bar/.test(key)) return 'Wine';
  if (/key|self check|lockbox/.test(key)) return 'KeyRound';
  if (/bed|sleep/.test(key)) return 'BedDouble';

  return 'Sparkles';
}

export function normalizeAmenities(value: FormDataEntryValue | null) {
  return Array.from(
    new Map(
      parseAmenities(value)
        .map(normalizeAmenityName)
        .map(amenityName => [amenityName.toLowerCase(), {
          name: amenityName,
          icon: amenityIconFor(amenityName)
        }])
    ).values()
  );
}
