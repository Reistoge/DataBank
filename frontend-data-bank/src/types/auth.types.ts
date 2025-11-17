
export type UserRole = 'ADMIN' | 'CLIENT' | 'EXEC';

export interface User {
    id: string;
    username: string;
    userNumber: string;
    email: string;
    rut: string;
    birthday: Date;
    country: string;
    region: string;
    roles: UserRole[];

}
 

export interface Account {
    id: string
    userId: string; // referencia al User
    accountNumber: string;
    balance: number;
    type: string; // tipo de cuenta
    bankBranch: string;
    isActive: boolean;

    
}


export interface Card {
    id: string | undefined;
    cvv: Number;
    number: string;
    penalties: Number;
    spentLimit: Number;
}


export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

// Redux-style state management pattern for authentication using TypeScript.
// This is a discriminated union that defines all possible authentication actions:

export type AuthAction =
    | { type: 'AUTH_START' } // Triggered when login/register begins (no payload needed)
    | { type: 'AUTH_SUCCESS'; payload: User }  // When authentication succeeds (carries User data)
    | { type: 'AUTH_ERROR'; payload: string }// When authentication fails (carries error message) 
    | { type: 'AUTH_LOGOUT' } // When user logs out
    | { type: 'CLEAR_ERROR' }; // To reset error state



/*
AUTH CONTEXT TYPE: 

This extends AuthState to include action methods. It's the complete contract 
for your auth context, combining:

State properties (from AuthState): user, isAuthenticated, isLoading, error
Action methods: Functions to modify that state
How They Work Together
This follows the Action → Reducer → State pattern:

Actions (AuthAction) describe what happened
A reducer (not shown) processes actions and updates state
Context (AuthContextType) provides both current state and dispatch methods

*/

export interface AuthContextType extends AuthState {
    login: (login: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

/**
 * @string email
 * @string pass
 */
export interface LoginCredentials {

    email: string;
    password: string;


}
export interface RegisterCredentials {
    rut: string;
    username: string;
    email: string;
    password: string;
    birthday?: string;
    country: string;
    region: string;



}
export interface UserRegisterResponse {

    username: string;
    email: string;
    refreshToken: null;
    _id: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}
/**
 * @interface User
 * @string access_token
 */
export interface AuthResponse {
    user: User;
    access_token: string;
}
