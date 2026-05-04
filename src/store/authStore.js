import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * authStore — handles authentication state.
 *
 * Persisted fields: user, token, refreshToken
 * (The RSA private key is NEVER persisted here — that lives only in keyStore / memory)
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ─── State ───────────────────────────────────────────────────────────────
      user: null,           // UserProfile object from the API
      token: null,          // Current JWT access token (expires in 15 min)
      refreshToken: null,   // Long-lived refresh token
      isAuthenticated: false,

      // ─── Actions ─────────────────────────────────────────────────────────────

      /**
       * Called after a successful /auth/login or /auth/register response.
       * Stores the user profile and both tokens.
       *
       * @param {object} authResponse - Full AuthResponse from the API
       *   { access_token, refresh_token, expires_in, user }
       */
      login: (authResponse) => {
        const { access_token, refresh_token, user } = authResponse
        set({
          token: access_token,
          refreshToken: refresh_token,
          user,
          isAuthenticated: true,
        })
      },

      /**
       * Update the access token after a successful /auth/refresh call.
       * The refresh token is unchanged.
       *
       * @param {string} newAccessToken
       */
      setToken: (newAccessToken) => {
        set({ token: newAccessToken })
      },

      /**
       * Update the stored user profile (e.g. after calling /auth/me).
       *
       * @param {object} user - UserProfile object
       */
      setUser: (user) => {
        set({ user })
      },

      /**
       * Clear all auth state. Called on logout or when the refresh token expires.
       */
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      // ─── Selectors (derived) ─────────────────────────────────────────────────
      getToken: () => get().token,
      getRefreshToken: () => get().refreshToken,
    }),
    {
      name: 'chatify-auth',           // localStorage key
      // Only persist tokens and user — never key material
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
