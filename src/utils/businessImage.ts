import { Business } from '../types';

type CategoryIconConfig = {
  label: string;
  accent: string;
  soft: string;
  icon: string;
};

const GENERIC_PLACEHOLDER_IMAGE_MARKERS = [
  'photo-1544197150-b99a580bb7a8',
];

const ICONS: Record<string, string> = {
  food: `
    <path d="M30 107h82" />
    <path d="M42 107a38 38 0 0 1 76 0" />
    <path d="M80 49v-9" />
    <path d="M126 47v68" />
    <path d="M140 47v68" />
    <path d="M126 47v24" />
    <path d="M133 47v24" />
    <path d="M140 47v24" />
    <path d="M30 82c5-14 14-24 27-30" />
  `,
  health: `
    <path d="M80 120S33 93 33 58c0-17 12-29 28-29 9 0 16 4 19 11 4-7 11-11 20-11 16 0 28 12 28 29 0 35-48 62-48 62Z" fill="currentColor" opacity=".22" />
    <path d="M80 120S33 93 33 58c0-17 12-29 28-29 9 0 16 4 19 11 4-7 11-11 20-11 16 0 28 12 28 29 0 35-48 62-48 62Z" />
    <path d="M113 84h28" />
    <path d="M127 70v28" />
  `,
  beauty: `
    <path d="M76 38c-24 4-41 24-41 48 0 25 18 45 43 49" />
    <path d="M72 37c23 10 34 29 27 55-5 18-19 31-38 40" />
    <path d="M93 92c27-2 44-18 51-43-25 4-43 19-51 43Z" fill="currentColor" opacity=".22" />
    <path d="M93 92c27-2 44-18 51-43-25 4-43 19-51 43Z" />
    <path d="M83 119c17-8 29-18 37-32" />
  `,
  home: `
    <path d="M24 76 80 28l56 48" />
    <path d="M39 75v58h82V75" />
    <path d="M69 133V97h22v36" />
    <path d="M106 101l27 27" />
    <path d="M132 92 117 107" />
    <path d="M122 87c8-4 17 4 13 12" />
  `,
  automotive: `
    <path d="M34 92h92l-10-28c-2-7-8-11-16-11H60c-8 0-14 4-16 11L34 92Z" fill="currentColor" opacity=".18" />
    <path d="M34 92h92l-10-28c-2-7-8-11-16-11H60c-8 0-14 4-16 11L34 92Z" />
    <path d="M30 92v29h16" />
    <path d="M130 92v29h-16" />
    <circle cx="57" cy="121" r="13" />
    <circle cx="103" cy="121" r="13" />
    <path d="M52 74h56" />
  `,
  realEstate: `
    <path d="M30 132V54h42v78" />
    <path d="M72 132V37h47v95" />
    <path d="M91 132V95h39v37" />
    <path d="M91 95 111 78l20 17" />
    <path d="M43 72h13M43 92h13M43 112h13M87 58h14M87 78h14" />
  `,
  education: `
    <path d="M28 70 80 43l52 27-52 27-52-27Z" fill="currentColor" opacity=".2" />
    <path d="M28 70 80 43l52 27-52 27-52-27Z" />
    <path d="M46 85v27c20 14 48 14 68 0V85" />
    <path d="M129 72v34" />
    <path d="M40 122c18-8 62-8 80 0" />
  `,
  shopping: `
    <path d="M36 57h18l10 57h58l14-39H66" />
    <circle cx="75" cy="128" r="8" />
    <circle cx="116" cy="128" r="8" />
    <path d="M83 57v-9c0-12 9-21 21-21s21 9 21 21v9" />
  `,
  professional: `
    <path d="M30 61h80v67H30z" fill="currentColor" opacity=".18" />
    <path d="M30 61h80v67H30z" />
    <path d="M54 61V48h32v13" />
    <path d="M30 82h80" />
    <circle cx="122" cy="78" r="18" />
    <path d="M96 132c4-19 16-29 34-29 12 0 22 5 29 16" />
  `,
  travel: `
    <path d="M44 52h64v82H44z" fill="currentColor" opacity=".2" />
    <path d="M44 52h64v82H44z" />
    <path d="M62 52V38h28v14" />
    <path d="M116 83 146 67" />
    <path d="M116 83 94 71" />
    <path d="M116 83 101 105" />
    <path d="M132 75l8 20" />
    <path d="M111 55v78" />
  `,
  event: `
    <path d="M34 50h92v82H34z" />
    <path d="M34 72h92" />
    <path d="M56 36v26M104 36v26" />
    <path d="m80 88 8 16 18 2-13 12 3 18-16-9-16 9 3-18-13-12 18-2 8-16Z" fill="currentColor" opacity=".22" />
    <path d="m80 88 8 16 18 2-13 12 3 18-16-9-16 9 3-18-13-12 18-2 8-16Z" />
  `,
  repair: `
    <path d="M47 36 124 113" />
    <path d="M117 120 132 135" />
    <path d="M35 119 95 59" />
    <path d="M105 33c9 9 9 24 0 33-7 7-17 9-26 5L45 105l-17 2 2-17 34-34c-4-9-2-19 5-26 9-9 24-9 33 0l-21 21 12 12 21-21Z" fill="currentColor" opacity=".16" />
    <path d="M105 33c9 9 9 24 0 33-7 7-17 9-26 5L45 105l-17 2 2-17 34-34c-4-9-2-19 5-26 9-9 24-9 33 0l-21 21 12 12 21-21Z" />
  `,
  finance: `
    <path d="M34 126V92" />
    <path d="M62 126V76" />
    <path d="M90 126V60" />
    <path d="M118 126V42" />
    <path d="M28 81c24-5 42-17 55-38l17 17 28-31" />
    <path d="M119 29h25v25" />
    <circle cx="122" cy="107" r="24" fill="currentColor" opacity=".16" />
    <circle cx="122" cy="107" r="24" />
    <text x="112" y="116" font-size="25" font-weight="800" fill="currentColor" stroke="none">Rs</text>
  `,
  pets: `
    <circle cx="80" cy="98" r="25" fill="currentColor" opacity=".2" />
    <circle cx="80" cy="98" r="25" />
    <circle cx="48" cy="68" r="14" />
    <circle cx="72" cy="49" r="14" />
    <circle cx="101" cy="49" r="14" />
    <circle cx="125" cy="70" r="14" />
    <path d="M65 109c9-9 22-9 31 0" />
  `,
  industrial: `
    <path d="M28 132V74l32 22V74l32 22V60h34v72H28Z" fill="currentColor" opacity=".18" />
    <path d="M28 132V74l32 22V74l32 22V60h34v72H28Z" />
    <path d="M43 112h14M72 112h14M101 112h14" />
    <path d="M101 60V43h25v17" />
  `,
  agriculture: `
    <path d="M42 91h58l-11-35H55L42 91Z" />
    <path d="M100 91h22l16 20" />
    <circle cx="57" cy="119" r="20" />
    <circle cx="126" cy="119" r="13" />
    <path d="M33 67c-14-17-12-32 5-46 18 15 20 31 5 46" fill="currentColor" opacity=".16" />
    <path d="M33 67c-14-17-12-32 5-46 18 15 20 31 5 46" />
  `,
  entertainment: `
    <circle cx="66" cy="84" r="45" fill="currentColor" opacity=".16" />
    <circle cx="66" cy="84" r="45" />
    <circle cx="66" cy="84" r="10" />
    <circle cx="50" cy="62" r="7" />
    <circle cx="82" cy="62" r="7" />
    <circle cx="50" cy="106" r="7" />
    <circle cx="82" cy="106" r="7" />
    <path d="M113 46v67" />
    <path d="M113 46l30-9v20l-30 9" />
    <circle cx="103" cy="119" r="11" />
  `,
  technology: `
    <path d="M29 43h102v67H29z" />
    <path d="M62 132h36" />
    <path d="M80 110v22" />
    <path d="M47 71h18l10-12 18 29 10-17h22" />
    <circle cx="122" cy="113" r="21" fill="currentColor" opacity=".16" />
    <circle cx="122" cy="113" r="21" />
    <path d="M122 86v10M122 130v10M95 113h10M139 113h10M103 94l7 7M134 125l7 7M141 94l-7 7M110 125l-7 7" />
  `,
  government: `
    <path d="M34 64h92" />
    <path d="M44 64v61M66 64v61M94 64v61M116 64v61" />
    <path d="M28 125h104" />
    <path d="M80 28 132 64H28L80 28Z" fill="currentColor" opacity=".18" />
    <path d="M80 28 132 64H28L80 28Z" />
    <path d="M38 138h84" />
  `,
};

const CATEGORY_ICON_CONFIGS: Record<string, CategoryIconConfig> = {
  'food-restaurants': { label: 'Food & Restaurants', accent: '#f97316', soft: '#fff7ed', icon: ICONS.food },
  'health-medical': { label: 'Health & Medical', accent: '#0faba8', soft: '#ecfeff', icon: ICONS.health },
  'beauty-wellness': { label: 'Beauty & Wellness', accent: '#ec4899', soft: '#fdf2f8', icon: ICONS.beauty },
  'home-services': { label: 'Home Services', accent: '#2563eb', soft: '#eff6ff', icon: ICONS.home },
  automotive: { label: 'Automotive', accent: '#5b3fd6', soft: '#f5f3ff', icon: ICONS.automotive },
  'real-estate': { label: 'Real Estate', accent: '#2563eb', soft: '#eff6ff', icon: ICONS.realEstate },
  'education-training': { label: 'Education & Training', accent: '#059669', soft: '#ecfdf5', icon: ICONS.education },
  'shopping-retail': { label: 'Shopping & Retail', accent: '#f04b37', soft: '#fff1f2', icon: ICONS.shopping },
  'professional-services': { label: 'Professional Services', accent: '#164e8a', soft: '#eff6ff', icon: ICONS.professional },
  'travel-hospitality': { label: 'Travel & Hospitality', accent: '#11aeb8', soft: '#ecfeff', icon: ICONS.travel },
  'event-services': { label: 'Event Services', accent: '#7c3aed', soft: '#f5f3ff', icon: ICONS.event },
  'repair-maintenance': { label: 'Repair & Maintenance', accent: '#2563eb', soft: '#eff6ff', icon: ICONS.repair },
  'financial-services': { label: 'Financial Services', accent: '#16a34a', soft: '#f0fdf4', icon: ICONS.finance },
  'pets-animals': { label: 'Pets & Animals', accent: '#f97316', soft: '#fff7ed', icon: ICONS.pets },
  'industrial-b2b': { label: 'Industrial & B2B', accent: '#4f46e5', soft: '#eef2ff', icon: ICONS.industrial },
  agriculture: { label: 'Agriculture', accent: '#16a34a', soft: '#f0fdf4', icon: ICONS.agriculture },
  'entertainment-leisure': { label: 'Entertainment & Leisure', accent: '#f97316', soft: '#fff7ed', icon: ICONS.entertainment },
  'digital-technology': { label: 'Digital & Technology', accent: '#2563eb', soft: '#eff6ff', icon: ICONS.technology },
  'government-public-services': { label: 'Government & Public Services', accent: '#0891b2', soft: '#ecfeff', icon: ICONS.government },
};

const LEGACY_CATEGORY_ALIASES: Record<string, string> = {
  food: 'food-restaurants',
  health: 'health-medical',
  salon: 'beauty-wellness',
  home: 'home-services',
  services: 'professional-services',
  retail: 'shopping-retail',
  tech: 'digital-technology',
};

const DEFAULT_CATEGORY_ID = 'professional-services';
const iconDataUriCache = new Map<string, string>();

function escapeSvgText(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveCategoryIconConfig(categoryId?: string) {
  const normalizedCategoryId = String(categoryId || '').trim();
  const masterCategoryId = LEGACY_CATEGORY_ALIASES[normalizedCategoryId] || normalizedCategoryId;
  return CATEGORY_ICON_CONFIGS[masterCategoryId] || CATEGORY_ICON_CONFIGS[DEFAULT_CATEGORY_ID];
}

function buildCategoryIconDataUri(categoryId?: string) {
  const cacheKey = String(categoryId || DEFAULT_CATEGORY_ID);
  const cached = iconDataUriCache.get(cacheKey);
  if (cached) return cached;

  const config = resolveCategoryIconConfig(categoryId);
  const label = escapeSvgText(config.label);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" role="img" aria-label="${label}">
      <defs>
        <radialGradient id="glow" cx="50%" cy="42%" r="64%">
          <stop offset="0%" stop-color="${config.soft}"/>
          <stop offset="62%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="${config.soft}"/>
        </radialGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${config.accent}"/>
          <stop offset="100%" stop-color="${config.accent}" stop-opacity=".72"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="14" stdDeviation="14" flood-color="#0f172a" flood-opacity=".16"/>
        </filter>
      </defs>
      <rect width="600" height="400" fill="url(#glow)"/>
      <circle cx="300" cy="165" r="118" fill="#ffffff" stroke="${config.accent}" stroke-opacity=".16" stroke-width="4"/>
      <path d="M207 142c38-35 89-46 141-28 29 10 52 29 70 55" fill="none" stroke="${config.accent}" stroke-opacity=".08" stroke-width="10" stroke-linecap="round"/>
      <path d="M187 216c50 35 121 40 178 12 25-12 45-31 60-55" fill="none" stroke="${config.accent}" stroke-opacity=".08" stroke-width="10" stroke-linecap="round"/>
      <g color="${config.accent}" transform="translate(220 62)" filter="url(#shadow)" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
        ${config.icon}
      </g>
      <text x="300" y="326" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="34" font-weight="800" letter-spacing="0" fill="#0f172a">${label}</text>
    </svg>
  `;
  const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  iconDataUriCache.set(cacheKey, dataUri);
  return dataUri;
}

function isGenericPlaceholderImage(imageUrl: string) {
  return GENERIC_PLACEHOLDER_IMAGE_MARKERS.some((marker) => imageUrl.includes(marker));
}

export function getCategoryFallbackImage(categoryId?: string): string {
  return buildCategoryIconDataUri(categoryId);
}

export function getBusinessImageUrl(business: Pick<Business, 'imageUrl' | 'categoryId'>): string {
  const customImage = String(business.imageUrl || '').trim();
  if (customImage.length > 0 && !isGenericPlaceholderImage(customImage)) return customImage;
  return getCategoryFallbackImage(business.categoryId);
}
