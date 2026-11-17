const rawUrl = import.meta.env.VITE_API_URL || 'https://go-green-sharm-api.vercel.app';

// Enforce HTTPS in production
export const API_URL =
  import.meta.env.PROD && rawUrl.startsWith('http://')
    ? rawUrl.replace('http://', 'https://')
    : rawUrl;

export const getAdminHeaders = () => {
  const token = sessionStorage.getItem('sharm_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const handleAuthFailure = (res, onUnauthorized) => {
  if (res.status === 401 || res.status === 403) {
    sessionStorage.removeItem('sharm_admin_token');
    if (typeof onUnauthorized === 'function') onUnauthorized();
    return true;
  }
  return false;
};