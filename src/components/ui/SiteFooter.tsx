import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Mail, MessageSquare, Instagram, Facebook } from 'lucide-react';
import styles from './SiteFooter.module.css';

interface SiteFooterProps {
  className?: string;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({ className }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} ${className || ''}`}>
      <div className={styles.container}>
        <div className={styles.contentGrid}>
          <div className={styles.brandColumn}>
            <Link to="/" className={styles.logo}>
              <Package size={28} />
              <span className={styles.logoText}>Alwon</span>
            </Link>
            <p className={styles.description}>
              Soluciones de minimarkets de autoservicio para edificios residenciales, simplificando tu vida diaria.
            </p>
          </div>

          <div className={styles.contactColumn}>
            <h3 className={styles.heading}>Contacto</h3>
            <ul className={styles.contactList}>
              <li>
                <a href="mailto:contacto@Alwon.com" className={styles.contactLink}>
                  <Mail size={16} />
                  <span>contacto@Alwon.com</span>
                </a>
              </li>
              <li>
                <a href="https://wa.me/5491112345678" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                  <MessageSquare size={16} />
                  <span>WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>

          <div className={styles.socialColumn}>
            <h3 className={styles.heading}>Síguenos</h3>
            <div className={styles.socialIcons}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            &copy; {currentYear} Alwon. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};