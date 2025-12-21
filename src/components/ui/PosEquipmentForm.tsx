import React from "react";
import { z } from "zod";
import { Save, X } from "lucide-react";

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
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";
import { useActiveLocationsQuery } from "../helpers/useLocationsQueries";
import { useCreatePosEquipmentMutation } from "../helpers/usePosEquipmentQueries";
import { schema as posEquipmentSchema } from "../endpoints/pos-equipment_POST.schema";
import { Skeleton } from "./Skeleton";

import styles from "./PosEquipmentForm.module.css";

interface PosEquipmentFormProps {
  onClose: () => void;
}

const formSchema = posEquipmentSchema.extend({
  isActive: z.boolean().default(true),
  locationId: z.number().min(1, "Debe seleccionar una ubicación"),
});

export function PosEquipmentForm({ onClose }: PosEquipmentFormProps) {
  const { data: locations, isLoading: isLoadingLocations } = useActiveLocationsQuery();
  const createMutation = useCreatePosEquipmentMutation();

  const form = useForm({
    schema: formSchema,
    defaultValues: {
      name: "",
      locationId: 0,
      code: "",
      description: "",
      isActive: true,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        form.setValues({
          name: "",
          locationId: 0,
          code: "",
          description: "",
          isActive: true,
        });
        onClose();
      },
    });
  };

  return (
    <div className={styles.formWrapper}>
      <div className={styles.formHeader}>
        <h3>Nuevo Equipo POS</h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.grid}>
            <FormItem name="name" className={styles.span2}>
              <FormLabel>Nombre del Equipo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Caja Principal"
                  value={form.values.name}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, name: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="locationId">
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                {isLoadingLocations ? (
                  <Skeleton style={{ height: "2.5rem" }} />
                ) : (
                  <Select
                    value={form.values.locationId > 0 ? String(form.values.locationId) : ""}
                    onValueChange={(value) =>
                      form.setValues((prev) => ({ ...prev, locationId: Number(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="code">
              <FormLabel>Código (Opcional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: POS-001"
                  value={form.values.code || ""}
                  onChange={(e) => form.setValues((prev) => ({ ...prev, code: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="description" className={styles.span2}>
              <FormLabel>Descripción (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Información adicional sobre el equipo..."
                  value={form.values.description || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="isActive" className={styles.span2}>
              <div className={styles.checkboxContainer}>
                <FormControl>
                  <Checkbox
                    id="isActive"
                    checked={form.values.isActive}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, isActive: e.target.checked }))
                    }
                  />
                </FormControl>
                <FormLabel htmlFor="isActive">Activo</FormLabel>
              </div>
              <FormDescription>
                Los equipos inactivos no podrán ser utilizados para transacciones.
              </FormDescription>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save size={16} />
              {createMutation.isPending ? "Guardando..." : "Guardar Equipo"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}