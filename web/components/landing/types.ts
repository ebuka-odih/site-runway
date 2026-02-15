export type AuthView = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

export interface SignupFormState {
  name: string;
  email: string;
  currency: string;
  phone: string;
  password: string;
}
