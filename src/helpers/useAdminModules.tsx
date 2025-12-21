import { useAuth } from './useAuth';

export const ADMIN_MODULES_QUERY_KEY = ['admin', 'modules'] as const;

// Default modules based on user role
const ROLE_MODULES: Record<string, string[]> = {
  'admin': ['admin', 'workforce', 'inventario', 'pos_kiosk', 'pos', 'clientes', 'catalogo', 'rutas', 'delivery'],
  'manager': ['workforce', 'inventario', 'pos_kiosk', 'clientes', 'delivery'],
  'operator': ['pos_kiosk', 'clientes'],
  'user': ['pos_kiosk'],
};

export function useAdminModules() {
  const { authState } = useAuth();

  // Handle authentication states
  if (authState.type === 'loading') {
    return {
      modules: [],
      isLoading: true,
      isError: false,
      error: null,
    };
  }

  if (authState.type === 'unauthenticated') {
    return {
      modules: [],
      isLoading: false,
      isError: true,
      error: new Error('User not authenticated'),
    };
  }

  // Get modules based on user role
  const userRole = authState.user.role;
  const modules = ROLE_MODULES[userRole] || ROLE_MODULES['user'];

  return {
    modules,
    isLoading: false,
    isError: false,
    error: null,
  };
}