import { useEffect } from "react";
import { z } from "zod";
import { type Selectable } from "kysely";
import { type Suppliers, IdTypeArrayValues, PaymentTermsTypeArrayValues } from "../helpers/schema";
import { useCreateSupplierMutation, useUpdateSupplierMutation } from "../helpers/useSupplierMutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Textarea } from "./Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";

interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Selectable<Suppliers> | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Supplier name is required."),
  contactPerson: z.string().min(1, "Contact person is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(1, "Phone number is required."),
  address: z.string().min(1, "Address is required."),
  taxId: z.string().min(1, "Tax ID is required."),
  idType: z.enum(IdTypeArrayValues, { required_error: "ID type is required." }),
  paymentTermsType: z.enum(PaymentTermsTypeArrayValues, { required_error: "Payment terms type is required." }),
  creditDays: z.number().min(0, "Credit days must be non-negative.").optional().nullable(),
  leadTimeDays: z.number().min(0, "Lead time days must be non-negative."),
  defaultLocationId: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // If paymentTermsType is 'CREDITO', creditDays must be provided and > 0
  if (data.paymentTermsType === 'CREDITO') {
    if (data.creditDays === undefined || data.creditDays === null || data.creditDays <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credit days are required and must be greater than 0 when payment terms type is 'CREDITO'",
        path: ["creditDays"],
      });
    }
  }
  
  // If paymentTermsType is 'CONTADO', creditDays should be null/undefined
  if (data.paymentTermsType === 'CONTADO') {
    if (data.creditDays !== undefined && data.creditDays !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Credit days should not be provided when payment terms type is 'CONTADO'",
        path: ["creditDays"],
      });
    }
  }
});

export const SupplierForm = ({ isOpen, onClose, supplier }: SupplierFormProps) => {
  const isEditMode = !!supplier;

  const createMutation = useCreateSupplierMutation();
  const updateMutation = useUpdateSupplierMutation();

  // Single source of truth for initial values with correct typing
  const initialValues = {
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    idType: "CC" as const,
    paymentTermsType: "CONTADO" as const,
    creditDays: null as number | null,
    leadTimeDays: 0,
    defaultLocationId: null as number | null,
    notes: "",
  } as const satisfies z.infer<typeof formSchema>;

  const form = useForm({
    schema: formSchema,
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (supplier) {
      form.setValues({
        name: supplier.name,
        contactPerson: supplier.contactPerson ?? "",
        email: supplier.email ?? "",
        phone: supplier.phone ?? "",
        address: supplier.address ?? "",
        taxId: supplier.taxId ?? "",
        idType: supplier.idType ?? "CC",
        paymentTermsType: supplier.paymentTermsType ?? "CONTADO",
        creditDays: supplier.creditDays,
        leadTimeDays: supplier.leadTimeDays ?? 0,
        defaultLocationId: supplier.defaultLocationId,
        notes: supplier.notes ?? "",
      });
    } else {
      form.setValues(initialValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier, isOpen]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Process values according to the API schema requirements
    const processedValues = {
      name: values.name,
      contactPerson: values.contactPerson,
      email: values.email,
      phone: values.phone,
      address: values.address,
      taxId: values.taxId,
      idType: values.idType,
      paymentTermsType: values.paymentTermsType,
      creditDays: values.creditDays,
      leadTimeDays: values.leadTimeDays,
      defaultLocationId: values.defaultLocationId,
      notes: values.notes || null,
      isActive: true, // Default to active for new suppliers
    };

    if (isEditMode) {
      updateMutation.mutate(
        { id: supplier.id, ...processedValues },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(processedValues, { onSuccess: onClose });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const showCreditDays = form.values.paymentTermsType === 'CREDITO';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of the existing supplier."
              : "Fill in the details to add a new supplier."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="supplier-form">
            <FormItem name="name">
              <FormLabel>Supplier Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., ABC Distribution"
                  value={form.values.name}
                  onChange={(e) => form.setValues((p) => ({ ...p, name: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormItem name="contactPerson">
                <FormLabel>Contact Person</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., John Smith"
                    value={form.values.contactPerson}
                    onChange={(e) => form.setValues((p) => ({ ...p, contactPerson: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="email">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="e.g., contact@supplier.com"
                    value={form.values.email}
                    onChange={(e) => form.setValues((p) => ({ ...p, email: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormItem name="phone">
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., +1 234 567 8900"
                    value={form.values.phone}
                    onChange={(e) => form.setValues((p) => ({ ...p, phone: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="taxId">
                <FormLabel>Tax ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 123456789"
                    value={form.values.taxId}
                    onChange={(e) => form.setValues((p) => ({ ...p, taxId: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormItem name="idType">
                <FormLabel>ID Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.idType}
                    onValueChange={(value) => form.setValues((p) => ({ ...p, idType: value as typeof form.values.idType }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">CC - Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="CE">CE - Cédula de Extranjería</SelectItem>
                      <SelectItem value="NIT">NIT - Número de Identificación Tributaria</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="leadTimeDays">
                <FormLabel>Lead Time (Days)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 7"
                    value={form.values.leadTimeDays.toString()}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      form.setValues((p) => ({ ...p, leadTimeDays: isNaN(value) ? 0 : value }));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="paymentTermsType">
              <FormLabel>Payment Terms</FormLabel>
              <FormControl>
                <Select
                  value={form.values.paymentTermsType}
                  onValueChange={(value) => {
                    const newPaymentTerms = value as typeof form.values.paymentTermsType;
                    form.setValues((p) => ({ 
                      ...p, 
                      paymentTermsType: newPaymentTerms,
                      // Reset creditDays when switching to CONTADO
                      creditDays: newPaymentTerms === 'CONTADO' ? null : p.creditDays
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTADO">CONTADO - Cash Payment</SelectItem>
                    <SelectItem value="CREDITO">CREDITO - Credit Payment</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            {showCreditDays && (
              <FormItem name="creditDays">
                <FormLabel>Credit Days</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 30"
                    value={form.values.creditDays?.toString() ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseInt(e.target.value, 10);
                      form.setValues((p) => ({ ...p, creditDays: isNaN(value as number) ? null : value }));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}

            <FormItem name="address">
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Full address including street, city, state, zip"
                  value={form.values.address}
                  onChange={(e) => form.setValues((p) => ({ ...p, address: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional notes about this supplier"
                  value={form.values.notes ?? ""}
                  onChange={(e) => form.setValues((p) => ({ ...p, notes: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="supplier-form" disabled={isPending}>
            {isPending ? "Saving..." : isEditMode ? "Save Changes" : "Create Supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};