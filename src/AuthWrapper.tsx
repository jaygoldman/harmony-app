import React from 'react';
import { useIsAuthenticated, useMsal, useAccount } from '@azure/msal-react';
import { loginRequest } from './authConfig';

interface AuthWrapperProps {
  children: React.ReactNode;
}

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
    <div className="min-h-screen bg-slate-50">
      {/* User info header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn.prod.website-files.com/66cff9ff63721bcbbfd7c7ba/66ead0e91e744ceeefb9fdfd_harmony-logo.png" 
              alt="Harmony AI" 
              className="w-8 h-8" 
            />
            <span className="text-lg font-semibold text-slate-800">Harmony</span>
          </div>
          <div className="flex items-center gap-4">
            {account && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-800">{account.name}</div>
                  <div className="text-xs text-slate-500">{account.username}</div>
                </div>
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  {account.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
      
      {/* Main app content */}
      <div>
        {children}
      </div>
    </div>
  );
};

export default AuthWrapper;