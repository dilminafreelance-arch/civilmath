import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  adminEmail: string | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const ADMIN_TOKEN_KEY = 'civilmath_admin_token';
export const ADMIN_EMAIL_KEY = 'civilmath_admin_email';

async function safeParseResponseJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return null;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(ADMIN_EMAIL_KEY);
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const checkAuth = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return false;
    }

    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!savedToken) {
      setIsAuthenticated(false);
      setAdminEmail(null);
      setIsLoading(false);
      return false;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch('/api/admin/verify', {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await safeParseResponseJson(res);
        if (data && data.authenticated) {
          setIsAuthenticated(true);
          setToken(savedToken);
          if (data.user?.email) {
            setAdminEmail(data.user.email);
            localStorage.setItem(ADMIN_EMAIL_KEY, data.user.email);
          }
          setIsLoading(false);
          return true;
        }
      }
    } catch {
      // In offline or static mode, keep current authenticated state if token exists
    } finally {
      clearTimeout(timeoutId);
    }

    // Token is invalid or expired
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_EMAIL_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setAdminEmail(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    return false;
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });

      const data = await safeParseResponseJson(res);

      if (!res.ok || !data || data.status !== 'success') {
        const errorMsg = data?.error || (res.status === 404
          ? 'Authentication API endpoint not reachable. Please ensure the backend server is running.'
          : 'Authentication failed. Please verify your admin credentials.');
        return {
          success: false,
          error: errorMsg,
        };
      }

      if (data.token) {
        try {
          localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
          if (data.user?.email) {
            localStorage.setItem(ADMIN_EMAIL_KEY, data.user.email);
          }
        } catch {
          // ignore
        }
        setToken(data.token);
        setAdminEmail(data.user?.email || email);
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: 'Authentication succeeded but no token was provided.' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          error: 'Connection timed out. The backend server took too long to respond.',
        };
      }
      return {
        success: false,
        error: err.message || 'Unable to connect to the authentication server.',
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_EMAIL_KEY);
    } catch {
      // ignore
    }
    setToken(null);
    setAdminEmail(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        adminEmail,
        token,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
