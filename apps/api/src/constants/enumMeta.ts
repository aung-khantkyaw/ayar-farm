export type EnumMeta = {
    labelMM: string;   // Myanmar text
    icon: string;      // emoji or icon class (e.g., "fas fa-user")
    color: string;     // hex or CSS color
};

/**
 * Note: keys must match Prisma enum values exactly.
 * Import Prisma enum types where useful:
 *   import { UserType, Category, Gender } from '@prisma/client';
 * and use Record<UserType, EnumMeta> types if you want type-safety.
 */

/* UserType metadata */
export const USER_TYPE_META: Record<string, EnumMeta> = {
  ADMIN: {
    labelMM: 'အက်မင်',
    icon: '🛡️',
    color: '#ff6b6b',
  },
  FARMER: {
    labelMM: 'တောင်သူလယ်သမား',
    icon: '🌾',
    color: '#4CAF50',
  },
  AGRICULTURAL_SPECIALIST: {
    labelMM: 'စိုက်ပျိုးရေးပညာရှင်',
    icon: '🧑‍🔬',
    color: '#0288d1',
  },
  AGRICULTURAL_EQUIPMENT_SHOP: {
    labelMM: 'စိုက်ပျိုးရေးပစ္စည်းအရောင်းဆိုင်',
    icon: '🏬',
    color: '#8e44ad',
  },
  TRADER_VENDOR: {
    labelMM: 'ကုန်သည်/ပွဲရုံ',
    icon: '🛒',
    color: '#f39c12',
  },
  LIVESTOCK_BREEDER: {
    labelMM: 'မွေးမြူရေးလုပ်ကိုင်သူ',
    icon: '🐄',
    color: '#d35400',
  },
  LIVESTOCK_SPECIALIST: {
    labelMM: 'မွေးမြူရေးပညာရှင်',
    icon: '🔬',
    color: '#2ecc71',
  },
  OTHERS: {
    labelMM: 'အခြား',
    icon: '🧑‍💼',
    color: '#95a5a6',
  },
};

/* Category metadata */
export const CATEGORY_META: Record<string, EnumMeta> = {
  CROPS_AND_PULSES: {
    labelMM: 'ကောက်ပဲသီးနှံများ',
    icon: '🌱',
    color: '#27ae60',
  },
  LIVESTOCK_INDUSTRY: {
    labelMM: 'မွေးမြူရေးလုပ်ငန်း',
    icon: '🐖',
    color: '#d35400',
  },
  FISHERY: {
    labelMM: 'ငါးမွေးမြူရေးလုပ်ငန်း',
    icon: '🐟',
    color: '#3498db',
  },
  AGRI_INDUSTRY: {
    labelMM: 'စက်မှုလယ်ယာ',
    icon: '🏭',
    color: '#7f8c8d',
  },
};

/* Gender metadata */
export const GENDER_META: Record<string, EnumMeta> = {
  MALE: {
    labelMM: 'ကျား',
    icon: '♂️',
    color: '#3498db',
  },
  FEMALE: {
    labelMM: 'မ',
    icon: '♀️',
    color: '#e91e63',
  },
  OTHER: {
    labelMM: 'အခြား',
    icon: '⚧️',
    color: '#9b59b6',
  },
};

/* Optional helper to get meta safely */
export function getEnumMeta(enumMap: Record<string, EnumMeta>, key?: string): EnumMeta {
  if (!key) return { labelMM: '-', icon: '❓', color: '#bdc3c7' };
  return enumMap[key] ?? { labelMM: key, icon: '❓', color: '#bdc3c7' };
}