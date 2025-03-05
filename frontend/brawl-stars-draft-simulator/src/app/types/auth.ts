export interface User {
    name: string;
    email: string;
    picture: string;
    id?: string;
  }
  
  export interface GoogleAuthResponse {
    credential: string;
    clientId: string;
    select_by: string;
  }
  
  export interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
  }