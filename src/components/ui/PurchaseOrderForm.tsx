import React, { useEffect, useMemo } from 'react';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from './Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';
import { Input } from './Input';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Calendar } from './Calendar';
import { Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { useSuppliersQuery } from '../helpers/useSupplierQueries';
import { useProductsQuery } from '../helpers/useProductsQuery';
import { formatCurrency } from '../helpers/numberUtils';
import { schema as createPurchaseOrderSchema } from '../endpoints/purchase-orders_POST.schema';
import { type PurchaseOrderDetails } from '../endpoints/purchase-orders_GET.schema';
import styles from './PurchaseOrderForm.module.css';

type PurchaseOrderFormProps = {
  purchaseOrder?: PurchaseOrderDetails;
  onSubmit: (values: z.infer<typeof createPurchaseOrderSchema>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
};

export const PurchaseOrderForm = ({
  purchaseOrder,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditMode = false,
}: PurchaseOrderFormProps) => {
  const { data: suppliers, isLoading: isLoadingSuppliers } = useSuppliersQuery();
  const { data: products, isLoading: isLoadingProducts } = useProductsQuery();

  const form = useForm({
    schema: createPurchaseOrderSchema,
    defaultValues: {
      supplierId: purchaseOrder?.supplierId ?? undefined,
      expectedDate: purchaseOrder?.expectedDate
        ? new Date(purchaseOrder.expectedDate)
        : null,
      notes: purchaseOrder?.notes ?? '',
      items: purchaseOrder?.items && purchaseOrder.items.length > 0
        ? purchaseOrder.items.map(item => ({
            productId: item.productId,
            qty: item.qty,
            taxRate: item.taxRate ? parseFloat(item.taxRate) : undefined,
          }))
        : [],
    },
  });

  const { setValues, values } = form;

  useEffect(() => {
    if (purchaseOrder) {
      setValues({
        supplierId: purchaseOrder.supplierId,
        expectedDate: purchaseOrder.expectedDate
          ? new Date(purchaseOrder.expectedDate)
          : null,
        notes: purchaseOrder.notes ?? '',
        items: purchaseOrder.items && purchaseOrder.items.length > 0
          ? purchaseOrder.items.map(item => ({
              productId: item.productId,
              qty: item.qty,
              taxRate: item.taxRate ? parseFloat(item.taxRate) : undefined,
            }))
          : [],
      });
    }
  }, [purchaseOrder, setValues]);

  const handleAddItem = () => {
    const firstAvailableProduct = products?.[0];
    setValues(prev => ({
      ...prev,
      items: [...(prev.items || []), { 
        productId: firstAvailableProduct?.id || 0, 
        qty: 1,
        taxRate: undefined,
      }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setValues(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (
    index: number,
    field: 'productId' | 'qty' | 'taxRate',
    value: string | number | undefined
  ) => {
    const newItems = [...values.items];
    
    if (field === 'productId') {
      const parsedValue = typeof value === 'string' ? parseInt(value, 10) : value;
      if (parsedValue && parsedValue > 0) {
        newItems[index].productId = parsedValue;
      }
    } else if (field === 'qty') {
      const parsedValue = typeof value === 'string' ? parseInt(value, 10) : value;
      newItems[index].qty = (parsedValue && parsedValue > 0) ? parsedValue : 1;
    } else if (field === 'taxRate') {
      const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
      newItems[index].taxRate = (parsedValue && parsedValue >= 0 && parsedValue <= 100) ? parsedValue : undefined;
    }
    
    setValues(prev => ({ ...prev, items: newItems }));
  };

  const { subtotal, tax, total } = useMemo(() => {
    if (!products || !values.items) return { subtotal: 0, tax: 0, total: 0 };
    
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    
    values.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const itemSubtotal = parseFloat(product.price) * item.qty;
        const taxRate = item.taxRate || 0;
        const itemTax = itemSubtotal * (taxRate / 100);
        
        calculatedSubtotal += itemSubtotal;
        calculatedTax += itemTax;
      }
    });
    
    return {
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      total: calculatedSubtotal + calculatedTax,
    };
  }, [values.items, products]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.formContent}>
          <div className={styles.grid}>
            <FormItem name="supplierId">
              <FormLabel>Supplier</FormLabel>
              <FormControl>
                <Select
                  value={values.supplierId?.toString()}
                  onValueChange={value =>
                    setValues(prev => ({ ...prev, supplierId: parseInt(value, 10) }))
                  }
                  disabled={isLoadingSuppliers || isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id.toString()}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="expectedDate">
              <FormLabel>Expected Delivery Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={styles.dateButton}
                      disabled={isEditMode}
                    >
                      <CalendarIcon size={16} />
                      {values.expectedDate
                        ? new Date(values.expectedDate).toLocaleDateString()
                        : 'Pick a date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent removeBackgroundAndPadding>
                  <Calendar
                    mode="single"
                    selected={values.expectedDate ? new Date(values.expectedDate) : undefined}
                    onSelect={date =>
                      setValues(prev => ({ ...prev, expectedDate: date || null }))
                    }
                    disabled={isEditMode}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          </div>

          <FormItem name="notes">
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Add any notes for this purchase order"
                value={values.notes ?? ''}
                onChange={e => setValues(prev => ({ ...prev, notes: e.target.value }))}
                disabled={isEditMode}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <div className={styles.itemsSection}>
            <h3 className={styles.itemsHeader}>Items</h3>
            <FormItem name="items">
              <FormMessage />
            </FormItem>
            {values.items?.map((item, index) => (
              <div key={index} className={styles.itemRow}>
                <FormItem name={`items.${index}.productId`} className={styles.itemProduct}>
                  <FormLabel className={styles.srOnly}>Product</FormLabel>
                  <FormControl>
                    <Select
                      value={item.productId && item.productId > 0 ? item.productId.toString() : ''}
                      onValueChange={value => handleItemChange(index, 'productId', parseInt(value, 10))}
                      disabled={isLoadingProducts || isEditMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(product => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name={`items.${index}.qty`} className={styles.itemQuantity}>
                  <FormLabel className={styles.srOnly}>Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={e => handleItemChange(index, 'qty', e.target.value)}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name={`items.${index}.taxRate`} className={styles.itemTaxRate}>
                  <FormLabel className={styles.srOnly}>Tax Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="Tax %"
                      value={item.taxRate || ''}
                      onChange={e => handleItemChange(index, 'taxRate', e.target.value)}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                {!isEditMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    aria-label="Remove item"
                    className={styles.itemRemove}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
            {!isEditMode && products && products.length > 0 && (
              <Button type="button" variant="outline" onClick={handleAddItem} className={styles.addItemButton}>
                <Plus size={16} /> Add Item
              </Button>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.totalDetails}>
            <div className={styles.totalLine}>
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.totalLine}>
              <span>Tax:</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className={styles.totalAmount}>
              <span>Total:</span>
              <strong>
                {formatCurrency(total)}
              </strong>
            </div>
          </div>
          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            {!isEditMode && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Purchase Order'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
};