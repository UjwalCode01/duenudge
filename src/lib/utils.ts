import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
    anonKey &&
    url !== 'https://your-project-id.supabase.co' &&
    anonKey !== 'your-anon-key' &&
    url.startsWith('https://')
  );
}

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SGD)' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar (NZD)' },
];

export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada) - New York' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada) - Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada) - Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada) - Los Angeles' },
  { value: 'Europe/London', label: 'London, Edinburgh, Dublin (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris, Berlin, Rome, Madrid (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Dubai, Abu Dhabi (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST) - Mumbai, Delhi' },
  { value: 'Asia/Singapore', label: 'Singapore, Hong Kong, Beijing (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo, Seoul (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney, Melbourne (AEST/AEDT)' },
];
