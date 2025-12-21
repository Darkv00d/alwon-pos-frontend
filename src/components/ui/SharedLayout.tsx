import { NavLink, Link } from "react-router-dom";
import { Home, Package, ShoppingCart, Users, Truck, Car } from "lucide-react";
import styles from "./SharedLayout.module.css";

interface SharedLayoutProps {
  children: React.ReactNode;
}

export const SharedLayout = ({ children }: SharedLayoutProps) => {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <Package size={24} />
            <span>Alwon</span>
          </Link>
          <nav className={styles.nav}>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
              end
            >
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/inventory"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              <Package size={18} />
              <span>Inventario</span>
            </NavLink>
            <NavLink
              to="/pos"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              <ShoppingCart size={18} />
              <span>POS Kiosk</span>
            </NavLink>
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              <Users size={18} />
              <span>Clientes</span>
            </NavLink>
            <NavLink
              to="/workforce"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              <Truck size={18} />
              <span>Workforce</span>
            </NavLink>
            <NavLink
              to="/workforce/vehicles"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ""}`
              }
            >
              <Car size={18} />
              <span>Vehicles</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
};