import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { getProductsList } from "../endpoints/products/list_GET.schema";
import { Button } from "./Button";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./Command";
import { Skeleton } from "./Skeleton";

interface ProductSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}

export const ProductSelector = ({ value, onChange, placeholder = "Select a product...", allowClear = false }: ProductSelectorProps) => {
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", "list"],
    queryFn: () => getProductsList({}),
  });

  const products = useMemo(() => {
    if (data?.ok) {
      // Filter out products that don't have a valid uuid
      return data.products.filter((product) => product.uuid != null && product.uuid.trim() !== "");
    }
    return [];
  }, [data]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.uuid === value);
  }, [products, value]);

  const handleSelect = (currentValue: string) => {
    const newValue = currentValue === value && allowClear ? "" : currentValue;
    onChange(newValue);
    setOpen(false);
  };

  if (isLoading) {
    return <Skeleton style={{ height: '2.5rem' }} />;
  }

  if (error) {
    return <div style={{ color: 'var(--error)' }}>Failed to load products.</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          {selectedProduct ? selectedProduct.name : placeholder}
          <ChevronsUpDown size={16} style={{ opacity: 0.5 }} />
        </Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: 'var(--radix-popover-trigger-width)', padding: 0 }}>
        <Command>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            <CommandEmpty>No product found.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.uuid || ""}
                  onSelect={handleSelect}
                >
                  <Check
                    size={16}
                    style={{ marginRight: 'var(--spacing-2)', opacity: value === product.uuid ? 1 : 0 }}
                  />
                  {product.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};