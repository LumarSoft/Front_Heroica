'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook que centraliza la lógica de autenticación, hidratación y logout.
 * Redirige a "/" si el usuario no está autenticado.
 */
export function useAuthGuard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isHydrated, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return {
    user,
    isHydrated,
    isAuthenticated,
    handleLogout,
    /** true mientras el componente NO debe renderizar contenido */
    isGuardLoading: !isHydrated || !isAuthenticated,
  };
}
