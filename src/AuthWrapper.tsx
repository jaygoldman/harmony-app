import React, { createContext, useContext } from 'react';
import { useIsAuthenticated, useMsal, useAccount } from '@azure/msal-react';
import { loginRequest } from './authConfig';
import { AccountInfo } from '@azure/msal-browser';

interface AuthWrapperProps {
  children: React.ReactNode;
}

interface AuthContextType {
  account: AccountInfo | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthWrapper');
  }
  return context;
};

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const isAuthenticated = useIsAuthenticated();
  const { instance, accounts } = useMsal();
  const account = useAccount(accounts[0] || {});

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => {
      console.error('Login failed:', e);
    });
  };

  const handleLogout = () => {
    instance.logoutPopup({
      postLogoutRedirectUri: window.location.origin,
      mainWindowRedirectUri: window.location.origin
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <img 
              src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" 
              alt="Harmony AI" 
              className="w-16 h-16 mx-auto mb-4" 
            />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Welcome to Harmony</h1>
            <p className="text-slate-600 mb-6">Please sign in with your Microsoft account to continue</p>
            <button
              onClick={handleLogin}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 0H0V11H11V0Z" fill="#F25022"/>
                <path d="M23 0H12V11H23V0Z" fill="#7FBA00"/>
                <path d="M11 12H0V23H11V12Z" fill="#00A4EF"/>
                <path d="M23 12H12V23H23V12Z" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ account, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthWrapper;