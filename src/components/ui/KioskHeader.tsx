import React, { useState } from 'react';
import { Store, Search, ShoppingCart, User, LogOut } from 'lucide-react';
import { getCustomers, type OutputType as CustomerWithTier } from '../endpoints/customers_GET.schema';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { KioskCustomerLookup } from './KioskCustomerLookup';
import styles from './KioskHeader.module.css';

interface KioskHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCustomer: CustomerWithTier[0] | null;
  onCustomerFound: (customer: CustomerWithTier[0]) => void;
  onClearCustomer: () => void;
  cartItemCount: number;
  onCartClick: () => void;
  className?: string;
}

export const KioskHeader: React.FC<KioskHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCustomer,
  onCustomerFound,
  onClearCustomer,
  cartItemCount,
  onCartClick,
  className,
}) => {
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [lookupValue, setLookupValue] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchCustomer = async () => {
    setIsSearching(true);
    setLookupError(null);
    try {
      console.log(`Searching for customer with ID: ${lookupValue}`);
      
      // Search for customer by mobile or ID number
      const customers = await getCustomers({ 
        search: lookupValue,
        isActive: true 
      });

      if (customers.length === 0) {
        setLookupError('Cliente no encontrado. Intenta de nuevo.');
        return;
      }

      // If multiple customers found, take the first one
      // In a production app, you might want to show a list to choose from
      const customer = customers[0];
      
      onCustomerFound(customer);
      setIsCustomerPopoverOpen(false);
      setLookupValue('');

    } catch (error) {
      console.error("Customer search failed:", error);
      setLookupError('Cliente no encontrado. Intenta de nuevo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    onClearCustomer();
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || '..';
  };

  return (
    <header className={`${styles.header} ${className || ''}`}>
      <div className={styles.leftSection}>
        <Store size={32} className={styles.logoIcon} />
        <div className={styles.logoText}>
          <span>Alwon</span>
          <span className={styles.logoKiosk}>Kiosko</span>
        </div>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={20} />
          <Input
            type="search"
            placeholder="Buscar productos..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.rightSection}>
        {selectedCustomer ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className={styles.customerButton}>
                <div className={styles.avatar}>
                  {getInitials(selectedCustomer.firstName, selectedCustomer.lastName)}
                </div>
                <div className={styles.customerInfo}>
                  <span className={styles.customerName}>
                    {selectedCustomer.firstName || selectedCustomer.name}
                  </span>
                  <span className={styles.customerPoints}>
                    {selectedCustomer.totalPoints ?? 0} Puntos
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className={styles.logoutPopover}>
              <Button variant="ghost" onClick={handleLogout} className={styles.logoutButton}>
                <LogOut size={16} />
                Cerrar Sesión
              </Button>
            </PopoverContent>
          </Popover>
        ) : (
          <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={styles.loginButton}>
                <User size={20} />
                <span>Identifícate</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className={styles.lookupPopoverContent}>
              <KioskCustomerLookup
                value={lookupValue}
                onChange={setLookupValue}
                onSearch={handleSearchCustomer}
                errorMessage={lookupError}
                isLoading={isSearching}
              />
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="secondary"
          size="lg"
          className={styles.cartButton}
          onClick={onCartClick}
          aria-label={`Ver carrito con ${cartItemCount} productos`}
        >
          <ShoppingCart size={24} />
          {cartItemCount > 0 && (
            <Badge className={styles.cartBadge}>{cartItemCount}</Badge>
          )}
        </Button>
      </div>
    </header>
  );
};