/**
 * authStore — in-memory only, intentionally NO persistence.
 *
 * Because the RSA private key (keyStore) is also memory-only, a page refresh
 * always requires re-login regardless of whether the token is persisted.
 * Keeping the token out of localStorage is an additional security measure.
 */
import { create } from 'zustand'

const useAuthStore = create((set, get) => ({
  // ─── State ───────────────────────────────────────────────────────────────
  user: null,             // UserProfile object from the API
  token: null,            // JWT access token (expires in 15 min)
  refreshToken: null,     // Long-lived refresh token
  isAuthenticated: false,

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Called after a successful /auth/login or /auth/register response.
   * @param {object} authResponse - { access_token, refresh_token, user }
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

  /** Called after a successful /auth/refresh. */
  setToken: (newAccessToken) => set({ token: newAccessToken }),

  /** Update profile (e.g. after calling /auth/me). */
  setUser: (user) => set({ user }),

  /** Clear all auth state — called on logout or refresh token expiry. */
  logout: () =>
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    }),

  // ─── Getters ──────────────────────────────────────────────────────────────
  getToken: () => get().token,
  getRefreshToken: () => get().refreshToken,
}))

export default useAuthStore
