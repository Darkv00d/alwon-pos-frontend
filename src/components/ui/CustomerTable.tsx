import { useState, useMemo } from "react";
import { type Selectable } from "kysely";
import { type Customers } from "../helpers/schema";
import { useCustomersQuery } from "../helpers/useCustomerQueries";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { Input } from "./Input";
import { CustomerForm } from "./CustomerForm";
import { CustomerPointsHistory } from "./CustomerPointsHistory";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./Dialog";
import { Plus, Edit, History, User, AlertTriangle, Search, Star, Shield, Award, Medal, Crown, Gem } from "lucide-react";
import { Badge } from "./Badge";
import styles from "./CustomerTable.module.css";

export const CustomerTable = () => {
  const getTierIcon = (iconName: string | null) => {
    if (!iconName) return <Award size={14} />;
    switch (iconName) {
      case 'medal': return <Medal size={14} />;
      case 'crown': return <Crown size={14} />;
      case 'gem': return <Gem size={14} />;
      case 'award':
      default: return <Award size={14} />;
    }
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Selectable<Customers> | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers, isFetching, error } = useCustomersQuery({ search: searchTerm });

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleEditCustomer = (customer: Selectable<Customers>) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleViewHistory = (customer: Selectable<Customers>) => {
    setSelectedCustomer(customer);
    setIsHistoryOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setSelectedCustomer(null);
  };

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    return customers;
  }, [customers]);

  const renderContent = () => {
    if (isFetching && !customers) {
      return (
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Customer</div>
          <div className={styles.headerCell}>Contact</div>
          <div className={styles.headerCell}>Apartment</div>
          <div className={styles.headerCell}>Tier</div>
          <div className={styles.headerCell}>Security</div>
          <div className={styles.headerCell}>Points</div>
          <div className={styles.headerCell}>Actions</div>
        </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.tableRow}>
            <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '80%' }} /></div>
            <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '120px' }} /></div>
            <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '100px' }} /></div>
            <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '100px' }} /></div>
            <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '80px' }} /></div>
            <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '60px' }} /></div>
            <div className={styles.cell}><Skeleton style={{ height: '1.5rem', width: '80px' }} /></div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.errorState}>
          <AlertTriangle size={48} />
          <h3>Error loading customers</h3>
          <p>{error.message}</p>
        </div>
      );
    }

    if (!filteredCustomers || filteredCustomers.length === 0) {
      return (
        <div className={styles.emptyState}>
          <User size={48} />
          <h3>No customers found</h3>
          <p>Get started by adding a new customer.</p>
          <Button onClick={handleAddCustomer}><Plus size={16} /> Add Customer</Button>
        </div>
      );
    }

    return (
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Customer</div>
          <div className={styles.headerCell}>Contact</div>
          <div className={styles.headerCell}>Apartment</div>
          <div className={styles.headerCell}>Tier</div>
          <div className={styles.headerCell}>Security</div>
          <div className={styles.headerCell}>Points</div>
          <div className={styles.headerCell}>Actions</div>
        </div>
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className={styles.tableRow}>
            <div className={styles.cell} data-label="Customer">
              <div className={styles.customerInfo}>
                <div className={styles.customerName}>
                  {customer.firstName} {customer.lastName}
                </div>
                <div className={styles.customerNumber}>
                  ID: {customer.idType} {customer.idNumber}
                </div>
              </div>
            </div>
            <div className={styles.cell} data-label="Contact">
              {customer.mobile ? (
                <a href={`tel:${customer.mobile}`} className={styles.contactLink}>
                  {customer.mobile}
                </a>
              ) : (
                '-'
              )}
            </div>
            <div className={styles.cell} data-label="Apartment">
              {customer.apartment || '-'}
            </div>
            <div className={styles.cell} data-label="Tier">
              {customer.tierName ? (
                <Badge 
                  variant="secondary" 
                  className={styles.tierBadge}
                  style={{ backgroundColor: customer.tierColor || undefined }}
                >
                  {getTierIcon(customer.tierIcon)}
                  {customer.tierName}
                </Badge>
              ) : (
                <Badge variant="outline">Sin tier</Badge>
              )}
            </div>
            <div className={styles.cell} data-label="Security">
              {customer.pinEnabled ? (
                <Badge variant="success" className={styles.pinBadge}>
                  <Shield size={14} />
                  PIN Protected
                </Badge>
              ) : (
                <Badge variant="outline" className={styles.pinBadge}>
                  No PIN
                </Badge>
              )}
            </div>
            <div className={styles.cell} data-label="Points">
              <div className={styles.points}>
                <Star size={14} />
                {customer.totalPoints ?? 0}
              </div>
            </div>
            <div className={styles.cell} data-label="Actions">
              <div className={styles.actions}>
                <Button variant="ghost" size="icon-sm" onClick={() => handleViewHistory(customer)} title="View Points History">
                  <History size={16} />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={() => handleEditCustomer(customer)} title="Edit Customer">
                  <Edit size={16} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <Input
            type="search"
          placeholder="Search customers by name, mobile, or ID number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus size={16} /> Add Customer
        </Button>
      </div>
      {renderContent()}
      <CustomerForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        customer={selectedCustomer}
      />
      <Dialog open={isHistoryOpen} onOpenChange={(open) => !open && handleCloseHistory()}>
        <DialogContent className={styles.historyDialog}>
          <DialogHeader>
            <DialogTitle>Points History for {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <CustomerPointsHistory customerId={selectedCustomer?.id} />
        </DialogContent>
      </Dialog>
    </>
  );
};