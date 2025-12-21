import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, Home, ShoppingCart, Monitor, Users, Truck, Car, BarChart3, Grid, Briefcase, Settings, Menu, LogOut, User, Warehouse, Rocket, FileText, BookOpen } from 'lucide-react';

import { useAuth } from '../../helpers/useAuth';
import { useAdminModules } from '../../helpers/useAdminModules';
import { Skeleton } from './Skeleton';
import { Button } from './Button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from './DropdownMenu';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Extract the authenticated user type from useAuth hook
type AuthenticatedUser = Extract<ReturnType<typeof useAuth>['authState'], { type: 'authenticated' }>['user'];

interface NavigationCategory {
  label: string;
  path: string;
  icon: React.ElementType;
  requiredModules: string[]; // Array of module codes - user needs at least one
}

const navigationCategories: NavigationCategory[] = [
  {
    label: '👥 Gestión de Usuarios & Seguridad',
    path: '/admin/usuarios-completo',
    icon: Users,
    requiredModules: ['admin'],
  },
    {
    label: '📦 Inventario & Productos',
    path: '/admin/inventario',
    icon: Package,
    requiredModules: ['inventario', 'catalogo', 'ubicaciones_inventario'],
  },
  {
    label: '🏷️ Promociones & Precios',
    path: '/admin/promociones',
    icon: Package,
    requiredModules: ['catalogo', 'admin'],
  },
  {
    label: '🏪 POS & Equipos',
    path: '/admin',
    icon: Monitor,
    requiredModules: ['pos', 'pos_kiosk'],
  },
  {
    label: '🖥️ Gestión de Kiosks',
    path: '/admin/kiosks',
    icon: Monitor,
    requiredModules: ['pos_kiosk', 'admin'],
  },
  {
    label: '👷 Recursos Humanos',
    path: '/workforce',
    icon: Briefcase,
    requiredModules: ['workforce'],
  },
  {
    label: '👥 Gestión de Clientes',
    path: '/customers',
    icon: Users,
    requiredModules: ['clientes'],
  },
  {
    label: '🚚 Logística & Delivery',
    path: '/delivery',
    icon: Truck,
    requiredModules: ['delivery', 'rutas'],
  },
      {
      label: '📊 Dashboard & Reportes',
      path: '/admin/dashboard',
      icon: BarChart3,
      requiredModules: ['admin'],
    },
  {
    label: '🚀 Despliegue Automatizado',
    path: '/admin/deployment',
    icon: Rocket,
    requiredModules: ['admin'],
  },
  {
    label: '⚙️ Utilidades del Sistema',
    path: '/admin/utilidades',
    icon: Settings,
    requiredModules: ['admin'],
  },
  {
    label: '📖 Documentación',
    path: '/admin/documentation',
    icon: BookOpen,
    requiredModules: ['admin'],
  },
  {
    label: '📋 Variables de Entorno',
    path: '/admin/environment',
    icon: FileText,
    requiredModules: ['admin'],
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { authState, logout } = useAuth();
  const { modules, isLoading: isLoadingModules } = useAdminModules();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (authState.type === 'unauthenticated') {
      console.log('User is not authenticated. Redirecting to login.');
      navigate('/login', { replace: true });
    }
  }, [authState.type, navigate]);

  // Filter navigation categories based on user's module access
  const visibleNavigationCategories = navigationCategories.filter(category => {
    // Show category if user has access to at least one of the required modules
    return category.requiredModules.some(moduleCode => modules.includes(moduleCode));
  });

  const isActive = (path: string) => {
    // Exact match for most paths
    if (location.pathname === path) return true;
    // Special handling for nested routes
    if (path === '/workforce' && location.pathname.startsWith('/workforce')) return true;
    if (path === '/inventory' && location.pathname.startsWith('/inventory')) return true;
    if (path === '/admin' && location.pathname.startsWith('/admin') && location.pathname !== '/admin') return false; // Don't highlight admin home for sub-paths
    return false;
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getUserInitials = (user: AuthenticatedUser) => {
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  if (authState.type === 'loading' || isLoadingModules) {
    return (
      <div className={styles.loadingOverlay}>
        <div className={styles.loadingContent}>
          <Package size={48} className={styles.loadingIcon} />
          <Skeleton style={{ height: '2rem', width: '150px', marginTop: 'var(--spacing-4)' }} />
          <Skeleton style={{ height: '1rem', width: '200px', marginTop: 'var(--spacing-2)' }} />
        </div>
      </div>
    );
  }

  if (authState.type === 'authenticated') {
    return (
      <div className={styles.layout}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <Link to="/admin" className={styles.logo}>
              <Package size={24} />
              <span>Alwon • Admin</span>
            </Link>
            
            <nav className={styles.navigation}>
              <Link
                to="/admin"
                className={`${styles.navItem} ${isActive('/admin') ? styles.navItemActive : ''}`}
              >
                <Home size={18} />
                <span className={styles.navItemLabel}>Home</span>
              </Link>
              
              {visibleNavigationCategories.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className={styles.modulesButton}>
                      <Menu size={18} />
                      <span>Modules</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className={styles.dropdownContent}>
                    {visibleNavigationCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <DropdownMenuItem key={category.path} asChild>
                          <Link
                            to={category.path}
                            className={`${styles.dropdownItem} ${isActive(category.path) ? styles.dropdownItemActive : ''}`}
                          >
                            <Icon size={16} />
                            <span>{category.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            <div className={styles.userSection}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className={styles.userButton}>
                    <div className={styles.userAvatar}>
                      {authState.user.avatarUrl ? (
                        <img 
                          src={authState.user.avatarUrl} 
                          alt="User Avatar" 
                          className={styles.avatarImage}
                        />
                      ) : (
                        <span className={styles.avatarInitials}>
                          {getUserInitials(authState.user)}
                        </span>
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>
                        {authState.user.displayName || authState.user.email}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={styles.userDropdownContent}>
                  <div className={styles.userDropdownHeader}>
                    <div className={styles.userFullName}>
                      {authState.user.displayName || authState.user.email}
                    </div>
                    <div className={styles.userEmail}>
                      {authState.user.email}
                    </div>
                    <div className={styles.userRole}>
                      Role: {authState.user.role}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={styles.logoutItem}
                  >
                    <LogOut size={16} />
                    <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Render nothing while redirecting or in an invalid state
  return null;
};