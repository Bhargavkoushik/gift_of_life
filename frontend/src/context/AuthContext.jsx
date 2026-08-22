import { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentWorkspace, setCurrentWorkspace] = useState(localStorage.getItem('workspace') || null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          setRoles(profile.roles || []);
          setIsAuthenticated(true);
          
          // Verify if current workspace is still valid
          const storedWorkspace = localStorage.getItem('workspace');
          if (storedWorkspace && profile.roles.includes(storedWorkspace)) {
            setCurrentWorkspace(storedWorkspace);
          } else if (profile.roles.length > 0) {
            const defaultWorkspace = profile.roles[0];
            setCurrentWorkspace(defaultWorkspace);
            localStorage.setItem('workspace', defaultWorkspace);
          }
        } catch (err) {
          console.error('Failed to restore auth session:', err.message);
          // Token expired or invalid
          logout(true);
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setRoles(data.user.roles || []);
      setIsAuthenticated(true);

      // Default workspace selection logic
      const userRoles = data.user.roles || [];
      if (userRoles.length > 1) {
        // Multi-role user, must select role workspace
        setCurrentWorkspace(null);
        localStorage.removeItem('workspace');
      } else if (userRoles.length === 1) {
        // Single role, auto-select workspace
        const singleRole = userRoles[0];
        setCurrentWorkspace(singleRole);
        localStorage.setItem('workspace', singleRole);
      } else {
        // No activated profiles/roles yet, defaults to guest or null
        setCurrentWorkspace(null);
      }
      setLoading(false);
      return data.user;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const signup = async (name, email, phone, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.register(name, email, phone, password);
      setLoading(false);
      return data;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const setupAdmin = async (name, email, phone, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.setupSuperAdmin(name, email, phone, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setRoles(data.user.roles || []);
      setIsAuthenticated(true);
      setCurrentWorkspace('SUPER_ADMIN');
      localStorage.setItem('workspace', 'SUPER_ADMIN');
      setLoading(false);
      return data.user;
    } catch (err) {
      setLoading(false);
      const errMsg = err.response?.data?.message || 'Setup failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async (force = false) => {
    const hasToken = localStorage.getItem('token');
    if (hasToken && !force) {
      try {
        await authService.logoutServer();
      } catch (err) {
        console.error('Backend logout call failed:', err);
        throw err;
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('workspace');
    setToken(null);
    setUser(null);
    setRoles([]);
    setIsAuthenticated(false);
    setCurrentWorkspace(null);
    setError(null);
  };

  const promoteToDonor = async (donorData) => {
    setError(null);
    try {
      const data = await authService.becomeDonor(donorData);
      localStorage.setItem('token', data.token);
      setToken(data.token); // updates token, triggering restoreSession logic
      
      const nextRoles = data.roles || [];
      setRoles(nextRoles);
      
      // Auto-set workspace if switching
      if (!currentWorkspace) {
        setCurrentWorkspace('DONOR');
        localStorage.setItem('workspace', 'DONOR');
      }
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to become donor';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const promoteToReceiver = async (receiverData) => {
    setError(null);
    try {
      const data = await authService.becomeReceiver(receiverData);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      
      const nextRoles = data.roles || [];
      setRoles(nextRoles);

      if (!currentWorkspace) {
        setCurrentWorkspace('RECEIVER');
        localStorage.setItem('workspace', 'RECEIVER');
      }
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to become receiver';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };



  const switchWorkspace = (role) => {
    if (roles.includes(role)) {
      setCurrentWorkspace(role);
      localStorage.setItem('workspace', role);
    } else {
      throw new Error(`User does not possess role '${role}' to select workspace.`);
    }
  };

  const sendVerificationOtp = async (method) => {
    setError(null);
    try {
      const response = await authService.sendVerificationOtp(method);
      return response;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to send verification code';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const verifyOtp = async (code) => {
    setError(null);
    try {
      const data = await authService.verifyOtp(code);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Verification failed';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const getAuthConfig = async () => {
    try {
      return await authService.getAuthConfig();
    } catch (err) {
      console.error('Failed to get auth config:', err.message);
      return { success: false, sms_enabled: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        token,
        isAuthenticated,
        loading,
        currentWorkspace,
        error,
        login,
        signup,
        setupAdmin,
        logout,
        promoteToDonor,
        promoteToReceiver,
        switchWorkspace,
        sendVerificationOtp,
        verifyOtp,
        getAuthConfig
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
