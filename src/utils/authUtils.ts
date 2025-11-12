/**
 * Authentication utility functions
 */

/**
 * Clears all authentication-related data from localStorage
 * This is a utility function to help users who get stuck in auth loops
 */
export function clearAllAuthData(): void {
  // Clear all auth tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('lastLoginTime');
  
  // Clear any other game-related storage that might interfere
  localStorage.removeItem('hasSeenOnboarding');
  localStorage.removeItem('db_version');
  
  console.log('🧹 Cleared all authentication data');
}

/**
 * Check if user has valid authentication tokens
 */
export function hasValidTokens(): boolean {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  return !!(accessToken && refreshToken);
}

/**
 * Emergency auth reset function
 * Call this from browser console if users get stuck: window.resetAuth()
 */
export function emergencyAuthReset(): void {
  clearAllAuthData();
  
  // Clear zustand store if available
  if ((window as any).gameStore?.clearAuth) {
    (window as any).gameStore.clearAuth();
  }
  
  // Force reload to landing page
  window.location.href = '/';
  
  console.log('🚨 Emergency auth reset completed - redirecting to landing page');
}

// Make emergency function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).resetAuth = emergencyAuthReset;
  console.log('🛠️ Emergency auth reset available: window.resetAuth()');
}
