export type AuthView = 'login' | 'signup' | 'verify' | 'forgot' | 'reset';

export interface SignupFormState {
  username: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  password: string;
}
