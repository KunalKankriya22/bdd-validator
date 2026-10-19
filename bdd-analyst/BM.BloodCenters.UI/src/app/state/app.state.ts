import { Injectable, signal, computed } from '@angular/core';

export interface AppState {
    isLoading: boolean;
    user: any | null;
    error: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class AppStateService {
    // Signals for reactive state management
    private state = signal<AppState>({
        isLoading: false,
        user: null,
        error: null
    });

    // Computed values
    readonly isLoading = computed(() => this.state().isLoading);
    readonly user = computed(() => this.state().user);
    readonly error = computed(() => this.state().error);
    readonly isAuthenticated = computed(() => !!this.state().user);

    setLoading(loading: boolean): void {
        this.state.update(state => ({ ...state, isLoading: loading }));
    }

    setUser(user: any): void {
        this.state.update(state => ({ ...state, user, error: null }));
    }

    setError(error: string): void {
        this.state.update(state => ({ ...state, error }));
    }

    clearError(): void {
        this.state.update(state => ({ ...state, error: null }));
    }

    clearUser(): void {
        this.state.update(state => ({ ...state, user: null }));
    }

    resetState(): void {
        this.state.set({
            isLoading: false,
            user: null,
            error: null
        });
    }
}
