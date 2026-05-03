export type UserRole = 'driver' | 'user';

import type { GenderPref, WalkMinutes } from './shared';

export interface AuthResponse {
  token: string;
  role: UserRole;
  userId: string;
  name: string;
  isVerified: boolean;
  isApproved: boolean; // drivers only — false until admin approves
}

export interface UserSignInPayload {
  email: string;
  password: string;
}

export interface UserSignUpPayload {
  name:             string;
  email:            string;
  password:         string;
  confirmPassword:  string;
  gender:           'male' | 'female';
  dateOfBirth:      string; // "YYYY-MM-DD"
  gender_pref:      GenderPref;
  walk_minutes:     WalkMinutes;
}

export interface DriverSignInPayload {
  email: string;
  password: string;
}

export interface DriverSignUpPayload {
  // Step 1
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  nationalId: string;
  dateOfBirth: string;
  // Step 2
  carBrand: string;
  carModel: string;
  carYear: number;
  carColor: string;
  licensePlate: string;
  drivingLicenseNumber: string;
  // Step 3 — all required
  documents: {
    profilePhoto: File;
    nationalIdFront: File;
    nationalIdBack: File;
    drivingLicense: File;
    carLicense: File;
    criminalRecord: File;
  };
}

// Keep legacy aliases for existing driver portal code
export type SignInPayload = UserSignInPayload;
export type UserSignupPayload = UserSignUpPayload;
export type DriverSignupPayload = DriverSignUpPayload;
export interface DriverSignupStep {
  step: 1 | 2 | 3;
  label: string;
  description: string;
}
