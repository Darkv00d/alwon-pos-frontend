import { useEffect } from "react";
import { z } from "zod";
import { type Selectable } from "kysely";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { type Customers } from "../helpers/schema";
import { useCreateCustomerMutation, useUpdateCustomerMutation, useSetPinMutation } from "../helpers/useCustomerQueries";
import { useLocationsQuery } from "../helpers/useLocationsQueries";
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
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";
import { Calendar } from "./Calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { toast } from "sonner";

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Selectable<Customers> | null;
}

// Schema for CREATE mode - PIN is required (4 digits only)
const createFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  idType: z.enum(["CC", "CE", "PA", "TI"], { required_error: "ID type is required." }),
  idNumber: z.string().min(1, "ID number is required."),
  mobile: z.string().regex(/^3\d{9}$/, "Mobile must be 10 digits starting with 3."),
  locationId: z.number({ required_error: "Location is required." }).int().positive(),
  apartment: z.string().min(1, "Apartment is required."),
  dateOfBirth: z.date().optional().nullable(),
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits."),
});

// Schema for EDIT mode - PIN is optional
const editFormSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  idType: z.enum(["CC", "CE", "PA", "TI"], { required_error: "ID type is required." }),
  idNumber: z.string().min(1, "ID number is required."),
  mobile: z.string().regex(/^3\d{9}$/, "Mobile must be 10 digits starting with 3."),
  locationId: z.number({ required_error: "Location is required." }).int().positive(),
  apartment: z.string().min(1, "Apartment is required."),
  dateOfBirth: z.date().optional().nullable(),
  pin: z.string().optional().refine((val) => {
    if (val && val.length > 0) {
      return /^\d{4}$/.test(val);
    }
    return true;
  }, {
    message: "PIN must be exactly 4 digits.",
  }),
});

interface CreateCustomerFormContentProps {
  onClose: () => void;
}

const CreateCustomerFormContent = ({ onClose }: CreateCustomerFormContentProps) => {
  const createMutation = useCreateCustomerMutation();
  const setPinMutation = useSetPinMutation();
  const { data: locations, isFetching: isLoadingLocations } = useLocationsQuery({ 
    locationType: "tienda",
    isActive: true 
  });

  const form = useForm({
    schema: createFormSchema,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      idType: "CC" as const,
      idNumber: "",
      mobile: "",
      locationId: undefined as any,
      apartment: "",
      dateOfBirth: null,
      pin: "",
    },
  });

  const onSubmit = (values: z.infer<typeof createFormSchema>) => {
    const processedValues = {
      ...values,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
    };

    createMutation.mutate(
      processedValues,
      { 
        onSuccess: (newCustomer) => {
          setPinMutation.mutate(
            { customerId: newCustomer.id, pin: values.pin },
            {
              onSuccess: () => {
                toast.success("Customer created successfully");
                onClose();
              },
              onError: (error) => {
                toast.error(`Failed to set PIN: ${error instanceof Error ? error.message : 'Unknown error'}`);
                onClose();
              }
            }
          );
        },
        onError: (error) => {
          toast.error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    );
  };

  const isPending = createMutation.isPending || setPinMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id="customer-form">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
          <FormItem name="firstName">
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Juan"
                value={form.values.firstName}
                onChange={(e) => form.setValues((p) => ({ ...p, firstName: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem name="lastName">
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., García"
                value={form.values.lastName}
                onChange={(e) => form.setValues((p) => ({ ...p, lastName: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="email">
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              type="email"
              placeholder="e.g., juan.garcia@example.com"
              value={form.values.email}
              onChange={(e) => form.setValues((p) => ({ ...p, email: e.target.value }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
          <FormItem name="idType">
            <FormLabel>ID Type</FormLabel>
            <Select
              value={form.values.idType}
              onValueChange={(value) => form.setValues((p) => ({ ...p, idType: value as any }))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="CC">CC - Cédula de Ciudadanía</SelectItem>
                <SelectItem value="CE">CE - Cédula de Extranjería</SelectItem>
                <SelectItem value="PA">PA - Pasaporte</SelectItem>
                <SelectItem value="TI">TI - Tarjeta de Identidad</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
          <FormItem name="idNumber">
            <FormLabel>ID Number</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., 1234567890"
                value={form.values.idNumber}
                onChange={(e) => form.setValues((p) => ({ ...p, idNumber: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="mobile">
          <FormLabel>Mobile</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., 3001234567"
              value={form.values.mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                form.setValues((p) => ({ ...p, mobile: value }));
              }}
              maxLength={10}
            />
          </FormControl>
          <FormDescription>
            10 digits starting with 3 (e.g., 3001234567)
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="locationId">
          <FormLabel>Location</FormLabel>
          <Select
            value={form.values.locationId ? String(form.values.locationId) : "__empty"}
            onValueChange={(value) => {
              const numValue = value === "__empty" ? undefined : parseInt(value, 10);
              form.setValues((p) => ({ ...p, locationId: numValue as any }));
            }}
            disabled={isLoadingLocations}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingLocations ? "Loading..." : "Select location"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {locations && locations.length > 0 ? (
                locations.map((location) => (
                  <SelectItem key={location.id} value={String(location.id)}>
                    {location.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty" disabled>No locations available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>

        <FormItem name="apartment">
          <FormLabel>Apartment</FormLabel>
          <FormControl>
            <Input
              placeholder="Torre A - Apto 501"
              value={form.values.apartment}
              onChange={(e) => form.setValues((p) => ({ ...p, apartment: e.target.value }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="dateOfBirth">
          <FormLabel>Date of Birth (Optional)</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    fontWeight: 400,
                  }}
                >
                  <CalendarIcon style={{ marginRight: 'var(--spacing-2)', height: '1rem', width: '1rem' }} />
                  {form.values.dateOfBirth ? (
                    format(form.values.dateOfBirth, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent removeBackgroundAndPadding style={{ width: 'auto' }}>
              <Calendar
                mode="single"
                selected={form.values.dateOfBirth ?? undefined}
                onSelect={(date) => form.setValues((p) => ({ ...p, dateOfBirth: date ?? null }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>

        <FormItem name="pin">
          <FormLabel>Security PIN</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="Enter 4 digit PIN"
              value={form.values.pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                form.setValues((p) => ({ ...p, pin: value }));
              }}
              maxLength={4}
            />
          </FormControl>
          <FormDescription>
            Cree un PIN de 4 dígitos para proteger los puntos del cliente
          </FormDescription>
          <FormMessage />
        </FormItem>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" form="customer-form" disabled={isPending}>
          {isPending ? "Saving..." : "Create Customer"}
        </Button>
      </DialogFooter>
    </Form>
  );
};

interface EditCustomerFormContentProps {
  customer: Selectable<Customers>;
  onClose: () => void;
}

const EditCustomerFormContent = ({ customer, onClose }: EditCustomerFormContentProps) => {
  const updateMutation = useUpdateCustomerMutation();
  const setPinMutation = useSetPinMutation();
  const { data: locations, isFetching: isLoadingLocations } = useLocationsQuery({ 
    locationType: "tienda",
    isActive: true 
  });

  const form = useForm({
    schema: editFormSchema,
    defaultValues: {
      firstName: customer.firstName ?? "",
      lastName: customer.lastName ?? "",
      email: customer.email ?? "",
      idType: (customer.idType as "CC" | "CE" | "PA" | "TI") ?? "CC",
      idNumber: customer.idNumber ?? "",
      mobile: customer.mobile ?? "",
      locationId: customer.locationId ?? undefined as any,
      apartment: customer.apartment ?? "",
      dateOfBirth: customer.dateOfBirth ? new Date(customer.dateOfBirth) : null,
      pin: "",
    },
  });

  const onSubmit = (values: z.infer<typeof editFormSchema>) => {
    const processedValues = {
      ...values,
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
    };

    const updatePayload = { 
      id: customer.id, 
      ...processedValues,
      pinEnabled: true,
    };

    updateMutation.mutate(
      updatePayload,
      { 
        onSuccess: () => {
          if (values.pin && values.pin.length > 0) {
            setPinMutation.mutate(
              { customerId: customer.id, pin: values.pin },
              {
                onSuccess: () => {
                  toast.success("Customer and PIN updated successfully");
                  onClose();
                },
                onError: (error) => {
                  toast.error(`Failed to set PIN: ${error instanceof Error ? error.message : 'Unknown error'}`);
                  onClose();
                }
              }
            );
          } else {
            toast.success("Customer updated successfully");
            onClose();
          }
        },
        onError: (error) => {
          toast.error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    );
  };

  const isPending = updateMutation.isPending || setPinMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} id="customer-form">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
          <FormItem name="firstName">
            <FormLabel>First Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., Juan"
                value={form.values.firstName}
                onChange={(e) => form.setValues((p) => ({ ...p, firstName: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem name="lastName">
            <FormLabel>Last Name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., García"
                value={form.values.lastName}
                onChange={(e) => form.setValues((p) => ({ ...p, lastName: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="email">
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              type="email"
              placeholder="e.g., juan.garcia@example.com"
              value={form.values.email}
              onChange={(e) => form.setValues((p) => ({ ...p, email: e.target.value }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
          <FormItem name="idType">
            <FormLabel>ID Type</FormLabel>
            <Select
              value={form.values.idType}
              onValueChange={(value) => form.setValues((p) => ({ ...p, idType: value as any }))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="CC">CC - Cédula de Ciudadanía</SelectItem>
                <SelectItem value="CE">CE - Cédula de Extranjería</SelectItem>
                <SelectItem value="PA">PA - Pasaporte</SelectItem>
                <SelectItem value="TI">TI - Tarjeta de Identidad</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
          <FormItem name="idNumber">
            <FormLabel>ID Number</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g., 1234567890"
                value={form.values.idNumber}
                onChange={(e) => form.setValues((p) => ({ ...p, idNumber: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="mobile">
          <FormLabel>Mobile</FormLabel>
          <FormControl>
            <Input
              placeholder="e.g., 3001234567"
              value={form.values.mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                form.setValues((p) => ({ ...p, mobile: value }));
              }}
              maxLength={10}
            />
          </FormControl>
          <FormDescription>
            10 digits starting with 3 (e.g., 3001234567)
          </FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="locationId">
          <FormLabel>Location</FormLabel>
          <Select
            value={form.values.locationId ? String(form.values.locationId) : "__empty"}
            onValueChange={(value) => {
              const numValue = value === "__empty" ? undefined : parseInt(value, 10);
              form.setValues((p) => ({ ...p, locationId: numValue as any }));
            }}
            disabled={isLoadingLocations}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingLocations ? "Loading..." : "Select location"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {locations && locations.length > 0 ? (
                locations.map((location) => (
                  <SelectItem key={location.id} value={String(location.id)}>
                    {location.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__empty" disabled>No locations available</SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>

        <FormItem name="apartment">
          <FormLabel>Apartment</FormLabel>
          <FormControl>
            <Input
              placeholder="Torre A - Apto 501"
              value={form.values.apartment}
              onChange={(e) => form.setValues((p) => ({ ...p, apartment: e.target.value }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem name="dateOfBirth">
          <FormLabel>Date of Birth (Optional)</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    fontWeight: 400,
                  }}
                >
                  <CalendarIcon style={{ marginRight: 'var(--spacing-2)', height: '1rem', width: '1rem' }} />
                  {form.values.dateOfBirth ? (
                    format(form.values.dateOfBirth, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent removeBackgroundAndPadding style={{ width: 'auto' }}>
              <Calendar
                mode="single"
                selected={form.values.dateOfBirth ?? undefined}
                onSelect={(date) => form.setValues((p) => ({ ...p, dateOfBirth: date ?? null }))}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>

        <FormItem name="pin">
          <FormLabel>Security PIN</FormLabel>
          <FormControl>
            <Input
              type="password"
              placeholder="Enter new PIN or leave blank"
              value={form.values.pin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                form.setValues((p) => ({ ...p, pin: value }));
              }}
              maxLength={4}
            />
          </FormControl>
          <FormDescription>
            Ingrese un nuevo PIN para cambiarlo, o déjelo en blanco para mantener el PIN actual
          </FormDescription>
          <FormMessage />
        </FormItem>
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" form="customer-form" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </Form>
  );
};

export const CustomerForm = ({ isOpen, onClose, customer }: CustomerFormProps) => {
  const isEditMode = !!customer;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of the existing customer."
              : "Fill in the details to add a new customer."}
          </DialogDescription>
        </DialogHeader>
        {isEditMode ? (
          <EditCustomerFormContent customer={customer} onClose={onClose} />
        ) : (
          <CreateCustomerFormContent onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};