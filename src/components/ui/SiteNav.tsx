import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Package } from 'lucide-react';
import styles from './SiteNav.module.css';

interface SiteNavProps {
  className?: string;
}

export const SiteNav: React.FC<SiteNavProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/quienes-somos', label: 'Quiénes somos' },
    { href: '/nuestra-solucion', label: 'Nuestras soluciones' },
    { href: '/delivery', label: 'Delivery' },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <header className={`${styles.header} ${className || ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <Package size={28} />
          <span className={styles.logoText}>Alwon</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <Link to="/login" className={styles.loginButton}>
            Ingresar
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className={styles.menuButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir menú"
        >
          Menú
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuContent}>
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `${styles.mobileNavLink} ${isActive ? styles.mobileActive : ''}`
                }
                onClick={handleNavClick}
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className={styles.mobileLoginButton}
              onClick={handleNavClick}
            >
              Ingresar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};