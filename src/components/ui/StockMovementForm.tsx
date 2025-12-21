import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "./Form";
import { useCreateStockMovementMutation } from "../helpers/useInventoryMutations";
import { useLocationsQuery, useProductLotsQuery } from "../helpers/useInventoryQueries";
import { useProductsQuery } from "../helpers/useProductsQuery";
import { MoveTypeArrayValues } from "../helpers/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { Input } from "./Input";
import { Button } from "./Button";
import { toast } from "sonner";

interface StockMovementFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  productUuid: z.string().min(1, "Product is required."),
  type: z.enum(MoveTypeArrayValues, { required_error: "Movement type is required." }),
  qty: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Quantity must be a positive number.",
  }),
  locationId: z.string().optional(),
  lotId: z.string().optional(),
  ref: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const initialValues: FormValues = {
  productUuid: "",
  type: "ADJUSTMENT",
  qty: "",
  locationId: "",
  lotId: "",
  ref: "",
};

export const StockMovementForm = ({ isOpen, onClose }: StockMovementFormProps) => {
  const form = useForm({
    schema: formSchema,
    defaultValues: initialValues,
  });

  const createMovementMutation = useCreateStockMovementMutation();

  const { data: products, isFetching: isProductsFetching } = useProductsQuery();
  const { data: locations, isFetching: isLocationsFetching } = useLocationsQuery();

  const selectedProductUuid = form.values.productUuid || undefined;
  const { data: lots, isFetching: isLotsFetching } = useProductLotsQuery(
    { productUuid: selectedProductUuid },
    { enabled: !!selectedProductUuid }
  );

  useEffect(() => {
    if (isOpen) {
      form.setValues(initialValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const onSubmit = (values: FormValues) => {
    const submissionData = {
      productUuid: values.productUuid,
      type: values.type,
      qty: parseFloat(values.qty),
      locationId: values.locationId && values.locationId !== "__empty" ? parseInt(values.locationId, 10) : null,
      lotId: values.lotId && values.lotId !== "__empty" ? values.lotId : null,
      ref: values.ref || null,
    };

    createMovementMutation.mutate(submissionData, {
      onSuccess: () => {
        toast.success("Stock movement created successfully!");
        onClose();
      },
    });
  };

  const isPending = createMovementMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Stock Movement</DialogTitle>
          <DialogDescription>Record a new inventory movement like a receipt, adjustment, or transfer.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="stock-movement-form" className="space-y-4">
            <FormItem name="productUuid">
              <FormLabel>Product</FormLabel>
              <FormControl>
                <Select
                  value={form.values.productUuid}
                  onValueChange={(value) => form.setValues((p) => ({ ...p, productUuid: value, lotId: "" }))}
                  disabled={isProductsFetching}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isProductsFetching ? "Loading products..." : "Select a product"} />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.uuid} value={product.uuid || ""}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormItem name="type">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.type}
                    onValueChange={(value) => form.setValues((p) => ({ ...p, type: value as FormValues['type'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select movement type" />
                    </SelectTrigger>
                    <SelectContent>
                      {MoveTypeArrayValues.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="qty">
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.values.qty}
                    onChange={(e) => form.setValues((p) => ({ ...p, qty: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormItem name="locationId">
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.locationId}
                    onValueChange={(value) => form.setValues((p) => ({ ...p, locationId: value }))}
                    disabled={isLocationsFetching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLocationsFetching ? "Loading..." : "Select location (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">No Location</SelectItem>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={String(location.id)}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="lotId">
                <FormLabel>Product Lot</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.lotId}
                    onValueChange={(value) => form.setValues((p) => ({ ...p, lotId: value }))}
                    disabled={!selectedProductUuid || isLotsFetching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLotsFetching ? "Loading lots..." : "Select lot (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">No Lot</SelectItem>
                      {lots?.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id}>
                          {lot.lotCode || `Lot ID: ${lot.id.substring(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormDescription>Select a product first.</FormDescription>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="ref">
              <FormLabel>Reference</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., PO-123, RMA-456"
                  value={form.values.ref}
                  onChange={(e) => form.setValues((p) => ({ ...p, ref: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button type="submit" form="stock-movement-form" disabled={isPending}>
            {isPending ? "Saving..." : "Create Movement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};