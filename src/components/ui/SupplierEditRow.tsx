import { z } from "zod";
import { type Selectable } from "kysely";
import { type Suppliers, type IdType, IdTypeArrayValues, type PaymentTermsType, PaymentTermsTypeArrayValues } from "../helpers/schema";
import {
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
} from "../helpers/useSupplierMutations";
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
import { Checkbox } from "./Checkbox";
import { Spinner } from "./Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import styles from "./SupplierEditRow.module.css";

interface SupplierEditRowProps {
  supplier?: Selectable<Suppliers>;
  onSave: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  idType: z.enum(IdTypeArrayValues).optional(),
  taxId: z.string().optional(),
  email: z.string().email("Invalid email.").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  paymentTermsType: z.enum(PaymentTermsTypeArrayValues).optional(),
  creditDays: z.coerce.number().min(1, "Credit days must be at least 1").optional(),
  leadTimeDays: z.coerce.number().min(0).optional(),
  isActive: z.boolean(),
}).refine((data) => {
  // If payment terms is CREDITO, creditDays is required
  if (data.paymentTermsType === "CREDITO" && !data.creditDays) {
    return false;
  }
  return true;
}, {
  message: "Credit days is required when payment terms is CREDITO",
  path: ["creditDays"],
});

type FormValues = z.infer<typeof formSchema>;

// Helper function to safely convert string to IdType
const toIdType = (value: string): IdType | undefined => {
  if (value === "__empty") return undefined;
  return IdTypeArrayValues.includes(value as IdType) ? (value as IdType) : undefined;
};

// Helper function to safely convert string to PaymentTermsType
const toPaymentTermsType = (value: string): PaymentTermsType | undefined => {
  if (value === "__empty") return undefined;
  return PaymentTermsTypeArrayValues.includes(value as PaymentTermsType) ? (value as PaymentTermsType) : undefined;
};

export const SupplierEditRow = ({
  supplier,
  onSave,
  onCancel,
}: SupplierEditRowProps) => {
  const isEditMode = !!supplier;
  const createMutation = useCreateSupplierMutation();
  const updateMutation = useUpdateSupplierMutation();

  const form = useForm({
    schema: formSchema,
    defaultValues: {
      name: supplier?.name ?? "",
      idType: supplier?.idType ?? undefined,
      taxId: supplier?.taxId ?? "",
      email: supplier?.email ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      paymentTermsType: supplier?.paymentTermsType ?? undefined,
      creditDays: supplier?.creditDays ?? undefined,
      leadTimeDays: supplier?.leadTimeDays ?? 0,
      isActive: supplier?.isActive ?? true,
    },
  });

  const onSubmit = (values: FormValues) => {
    const processedValues = {
      ...values,
      idType: values.idType || null,
      taxId: values.taxId || null,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
      paymentTermsType: values.paymentTermsType || null,
      creditDays: values.creditDays || null,
      leadTimeDays: values.leadTimeDays || null,
    };

    if (isEditMode) {
      updateMutation.mutate(
        { id: supplier.id, ...processedValues },
        { onSuccess: onSave },
      );
    } else {
      createMutation.mutate(processedValues, { onSuccess: onSave });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className={styles.editRow}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={styles.formGrid}
        >
          <div className={styles.basicInfo}>
            <FormItem name="name" className={styles.formItem}>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del proveedor"
                  value={form.values.name}
                  onChange={(e) =>
                    form.setValues((p) => ({ ...p, name: e.target.value }))
                  }
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="idType" className={styles.formItem}>
              <FormLabel>Tipo de ID</FormLabel>
              <FormControl>
                <Select
                  value={form.values.idType || "__empty"}
                  onValueChange={(value) =>
                    form.setValues((p) => ({
                      ...p,
                      idType: toIdType(value),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">Sin especificar</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="taxId" className={styles.formItem}>
              <FormLabel>Número de ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="Número de identificación"
                  value={form.values.taxId}
                  onChange={(e) =>
                    form.setValues((p) => ({ ...p, taxId: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.contactInfo}>
            <FormItem name="email" className={styles.formItem}>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={form.values.email}
                  onChange={(e) =>
                    form.setValues((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="phone" className={styles.formItem}>
              <FormLabel>Teléfono</FormLabel>
              <FormControl>
                <Input
                  placeholder="Número de teléfono"
                  value={form.values.phone}
                  onChange={(e) =>
                    form.setValues((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="address" className={styles.formItem}>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input
                  placeholder="Dirección completa"
                  value={form.values.address}
                  onChange={(e) =>
                    form.setValues((p) => ({ ...p, address: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.businessInfo}>
            <FormItem name="paymentTermsType" className={styles.formItem}>
              <FormLabel>Términos de Pago</FormLabel>
              <FormControl>
                <Select
                  value={form.values.paymentTermsType || "__empty"}
                  onValueChange={(value) =>
                    form.setValues((p) => ({
                      ...p,
                      paymentTermsType: toPaymentTermsType(value),
                      // Clear creditDays if switching away from CREDITO
                      creditDays: toPaymentTermsType(value) === "CREDITO" ? p.creditDays : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar términos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">Sin especificar</SelectItem>
                    <SelectItem value="CONTADO">Contado</SelectItem>
                    <SelectItem value="CREDITO">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            {form.values.paymentTermsType === "CREDITO" && (
              <FormItem name="creditDays" className={styles.formItem}>
                <FormLabel>Días de Crédito</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={form.values.creditDays || ""}
                    onChange={(e) =>
                      form.setValues((p) => ({
                        ...p,
                        creditDays: Number(e.target.value) || undefined,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}

            <FormItem name="leadTimeDays" className={styles.formItem}>
              <FormLabel>Tiempo de Entrega (días)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.values.leadTimeDays || ""}
                  onChange={(e) =>
                    form.setValues((p) => ({
                      ...p,
                      leadTimeDays: Number(e.target.value) || 0,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="isActive" className={styles.formItem}>
              <FormLabel>Estado</FormLabel>
              <label className={styles.checkboxLabel}>
                <FormControl>
                  <Checkbox
                    checked={form.values.isActive}
                    onChange={(e) =>
                      form.setValues((p) => ({
                        ...p,
                        isActive: e.target.checked,
                      }))
                    }
                  />
                </FormControl>
                <span>Proveedor activo</span>
              </label>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.actionButtons}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Spinner size="sm" /> : "Guardar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};