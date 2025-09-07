export interface CreatorProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string;
  avatar_url?: string;
  specialties: string[];
  experience_years?: number;
  verification_status: string;
  verification_badge_type: string;
  social_profiles?: any;
  created_at: string;
  location?: string;
  followers_count?: number;
  total_guides?: number;
  total_plays?: number;
  // Fixed rating fields to match database schema
  service_rating?: number;
  service_rating_count?: number;
  platform_rating?: number;
  platform_rating_count?: number;
  combined_rating?: number;
  achievements?: any[];
}

export interface ExperienceBracket {
  min: number;
  max: number;
  label: string;
  maxRating: number;
  color: string;
}

export const EXPERIENCE_BRACKETS: ExperienceBracket[] = [
  { min: 0, max: 2, label: 'Newcomer', maxRating: 3.0, color: 'bg-slate-500' },
  { min: 3, max: 5, label: 'Developing', maxRating: 3.5, color: 'bg-blue-500' },
  { min: 6, max: 10, label: 'Experienced', maxRating: 4.0, color: 'bg-green-500' },
  { min: 11, max: 15, label: 'Expert', maxRating: 4.5, color: 'bg-orange-500' },
  { min: 16, max: 20, label: 'Master', maxRating: 5.0, color: 'bg-purple-500' },
  { min: 21, max: 99, label: 'Legend', maxRating: 5.0, color: 'bg-gradient-to-r from-yellow-400 to-orange-500' },
];

export function getExperienceBracket(years: number): ExperienceBracket {
  return EXPERIENCE_BRACKETS.find(bracket => years >= bracket.min && years <= bracket.max) || EXPERIENCE_BRACKETS[0];
}