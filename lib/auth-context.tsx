'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MerchantUser } from '@/types/onboarding';
import { logout as logoutAndRedirect } from '@/lib/api/client';
import {
  getMerchantUser,
  saveMerchantUser,
  getOnboardingState,
  resetOnboardingProgress,
  INITIAL_USER,
} from '@/lib/storage';

interface AuthContextType {
  user: MerchantUser | null;
  isLoading: boolean;
  login: (options?: { isNewMerchant?: boolean; email?: string; name?: string }) => void;
  logout: () => void;
  updateUser: (updated: Partial<MerchantUser>) => void;
  completeProfile: () => void;
  resetAll: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Clears local auth state after the server has ended this session (e.g. the
 * merchant revoked it from Security settings), then sends them to sign in.
 * Usable outside AuthProvider.
 */
export function endLocalSession() {
  saveMerchantUser({ ...getMerchantUser(), isLoggedIn: false });
  logoutAndRedirect();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate user from localStorage
    const savedUser = getMerchantUser();
    const onboarding = getOnboardingState();
    
    // Sync profile completion with onboarding state
    const profileCompleted = savedUser.isProfileCompleted || onboarding.isCompleted;
    const finalUser: MerchantUser = {
      ...savedUser,
      isProfileCompleted: profileCompleted,
      name: onboarding.business.name || savedUser.name,
    };
    
    setUser(finalUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    (options?: { isNewMerchant?: boolean; email?: string; name?: string }) => {
      const isNew = options?.isNewMerchant ?? true;
      const newUser: MerchantUser = {
        id: `usr_${Date.now()}`,
        email: options?.email || (isNew ? 'newmerchant@example.com' : 'merchant@acme.com'),
        name: options?.name || (isNew ? 'New Merchant' : 'Acme Store'),
        isLoggedIn: true,
        isProfileCompleted: !isNew,
      };

      setUser(newUser);
      saveMerchantUser(newUser);

      if (!newUser.isProfileCompleted) {
        // Trigger requirement: "After first login, merchants without a completed profile are sent to /onboarding"
        router.push('/onboarding');
      } else {
        router.push('/overview');
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    if (!user) return;
    const loggedOutUser: MerchantUser = { ...user, isLoggedIn: false };
    setUser(loggedOutUser);
    saveMerchantUser(loggedOutUser);
    router.push('/login');
  }, [user, router]);

  const updateUser = useCallback((updated: Partial<MerchantUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updated };
      saveMerchantUser(nextUser);
      return nextUser;
    });
  }, []);

  const completeProfile = useCallback(() => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, isProfileCompleted: true };
      saveMerchantUser(nextUser);
      return nextUser;
    });
  }, []);

  const resetAll = useCallback(() => {
    resetOnboardingProgress();
    setUser(INITIAL_USER);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        updateUser,
        completeProfile,
        resetAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
