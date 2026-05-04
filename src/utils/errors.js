/**
 * errors.js — Centralised error parsing helpers.
 *
 * Converts Axios error responses (FastAPI / WhisperBox format) into
 * human-readable strings for display in the UI.
 */

/**
 * Extract a readable error message from an Axios error.
 *
 * WhisperBox returns errors in two shapes:
 *   - { detail: "string" }           → simple message
 *   - { detail: [{ msg, loc }] }     → FastAPI validation errors (422)
 *
 * @param {unknown} error
 * @param {string}  [fallback]
 * @returns {string}
 */
export function parseApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback

  // Axios error with a response body
  const data = error?.response?.data
  if (data) {
    if (typeof data.detail === 'string') return data.detail

    // FastAPI validation error array
    if (Array.isArray(data.detail)) {
      return data.detail
        .map((err) => `${err.loc?.slice(-1)[0] ?? 'field'}: ${err.msg}`)
        .join(' · ')
    }
  }

  // Network error / no response
  if (error?.message === 'Network Error') {
    return 'Unable to reach the server. Check your connection.'
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.'
  }

  // Fallback to the error message itself
  if (typeof error?.message === 'string') return error.message

  return fallback
}

/**
 * Returns true if the error is a 401 Unauthorized response.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isUnauthorized(error) {
  return error?.response?.status === 401
}

/**
 * Returns true if the error is a 404 Not Found response.
 * @param {unknown} error
 * @returns {boolean}
 */
export function isNotFound(error) {
  return error?.response?.status === 404
}
