// Utility function to check if user is admin
export const isAdmin = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userRole = localStorage.getItem('userRole');
  return userRole === 'admin';
};

// Utility function to get user role
export const getUserRole = (): string => {
  if (typeof window === 'undefined') return 'player';
  return localStorage.getItem('userRole') || 'player';
};