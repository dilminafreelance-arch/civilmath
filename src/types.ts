export type UnitSystem = 'metric' | 'imperial';

export const CURRENCY_MAPPING: Record<string, { symbol: string, label: string }> = {
  USD: { symbol: '$', label: 'USD ($) - United States Dollar' },
  EUR: { symbol: '€', label: 'EUR (€) - Euro' },
  GBP: { symbol: '£', label: 'GBP (£) - British Pound Sterling' },
  INR: { symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  CAD: { symbol: 'C$', label: 'CAD (C$) - Canadian Dollar' },
  AUD: { symbol: 'A$', label: 'AUD (A$) - Australian Dollar' },
  JPY: { symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  CNY: { symbol: '¥', label: 'CNY (¥) - Chinese Yuan' },
  ZAR: { symbol: 'R', label: 'ZAR (R) - South African Rand' },
  BRL: { symbol: 'R$', label: 'BRL (R$) - Brazilian Real' },
  RUB: { symbol: '₽', label: 'RUB (₽) - Russian Ruble' },
  AED: { symbol: 'د.إ', label: 'AED (د.إ) - UAE Dirham' },
  SAR: { symbol: '﷼', label: 'SAR (﷼) - Saudi Riyal' },
  SGD: { symbol: 'S$', label: 'SGD (S$) - Singapore Dollar' },
  NZD: { symbol: 'NZ$', label: 'NZD (NZ$) - New Zealand Dollar' },
  CHF: { symbol: 'CHF', label: 'CHF - Swiss Franc' },
  MXN: { symbol: '$', label: 'MXN ($) - Mexican Peso' },
  HKD: { symbol: 'HK$', label: 'HKD (HK$) - Hong Kong Dollar' },
  SEK: { symbol: 'kr', label: 'SEK (kr) - Swedish Krona' },
  TRY: { symbol: '₺', label: 'TRY (₺) - Turkish Lira' },
  PHP: { symbol: '₱', label: 'PHP (₱) - Philippine Peso' },
  IDR: { symbol: 'Rp', label: 'IDR (Rp) - Indonesian Rupiah' },
  MYR: { symbol: 'RM', label: 'MYR (RM) - Malaysian Ringgit' },
  THB: { symbol: '฿', label: 'THB (฿) - Thai Baht' },
  PKR: { symbol: '₨', label: 'PKR (₨) - Pakistani Rupee' },
  BDT: { symbol: '৳', label: 'BDT (৳) - Bangladeshi Taka' },
  NGN: { symbol: '₦', label: 'NGN (₦) - Nigerian Naira' },
  EGP: { symbol: 'E£', label: 'EGP (E£) - Egyptian Pound' },
  COP: { symbol: '$', label: 'COP ($) - Colombian Peso' },
  ARS: { symbol: '$', label: 'ARS ($) - Argentine Peso' },
  CLP: { symbol: '$', label: 'CLP ($) - Chilean Peso' },
  VND: { symbol: '₫', label: 'VND (₫) - Vietnamese Dong' },
  KRW: { symbol: '₩', label: 'KRW (₩) - South Korean Won' },
  PLN: { symbol: 'zł', label: 'PLN (zł) - Polish Zloty' },
  ILS: { symbol: '₪', label: 'ILS (₪) - Israeli New Shekel' },
  LKR: { symbol: 'Rs', label: 'LKR (Rs) - Sri Lankan Rupee' }
};

export type CalculatorCategory = 'structural' | 'concrete' | 'survey' | 'utility' | 'bbs' | 'geotech';

export interface CalculatorDef {
  id: string;
  name: string;
  category: CalculatorCategory;
  description: string;
  iconName: string; // from Lucide icons
  slug?: string; // custom URL slug (defaults to id minus category prefix)
  trending?: boolean;
  featured?: boolean;
}

export interface SavedCalculation {
  id: string;
  calculatorId: string;
  name: string;
  timestamp: number;
  unitSystem: UnitSystem;
  inputs: Record<string, number | string>;
  outputs: Record<string, number | string>;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  calculations: SavedCalculation[];
}

export interface AIExplanationResult {
  explanation: string;
  recommendations: string[];
  safetyNotes: string;
  status: 'success' | 'error';
}

export interface CalculatorHistoryItem {
  id: string;
  action: string;
  timestamp: number;
  calcState: {
    calculatorId: string;
    inputs: Record<string, number | string>;
    unitSystem: UnitSystem;
  };
}
