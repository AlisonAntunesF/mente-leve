// 🧠 MenteLeve - Tipos TypeScript

export type FoodCategory = 'green' | 'yellow' | 'orange';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  height: number; // cm
  currentWeight: number; // kg
  goalWeight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  goal: 'weight-loss' | 'health' | 'reeducation';
  dietaryRestrictions: string[];
  createdAt: Date;
}

export interface OnboardingData {
  step: number;
  name?: string;
  age?: number;
  height?: number;
  currentWeight?: number;
  goalWeight?: number;
  activityLevel?: UserProfile['activityLevel'];
  goal?: UserProfile['goal'];
  dietaryRestrictions?: string[];
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  calories: number;
  portion: string;
  isBrazilian?: boolean;
}

export interface MealEntry {
  id: string;
  userId: string;
  foodName: string;
  category: FoodCategory;
  calories: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Date;
}

export interface DailyProgress {
  date: Date;
  caloriesConsumed: number;
  caloriesGoal: number;
  steps: number;
  stepsGoal: number;
  waterGlasses: number;
  waterGoal: number;
  weight?: number;
  mood?: 'great' | 'good' | 'neutral' | 'bad' | 'terrible';
}

export interface PsychologyLesson {
  id: string;
  title: string;
  category: 'tcc' | 'mindfulness' | 'triggers' | 'motivation' | 'restructuring';
  duration: number; // minutos
  content: string;
  isPremium: boolean;
  order: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: number; // dias
  category: string;
  participants: number;
  isActive: boolean;
}
