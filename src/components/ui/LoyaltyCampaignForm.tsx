import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Check, ChevronsUpDown, Loader2, Package } from "lucide-react";
import { useForm, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "./Form";
import { useCreateCampaignMutation } from "../helpers/useLoyaltyTiersQueries";
import { useProductsListQuery } from "../helpers/useProductsListQuery";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";
import { Calendar } from "./Calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./Command";
import styles from "./LoyaltyCampaignForm.module.css";

const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const formSchema = z.object({
  id: z.string().min(1, "ID de campaña es requerido.").regex(kebabCaseRegex, "El ID debe estar en formato kebab-case (ej: black-friday-2024)."),
  name: z.string().min(1, "Nombre de campaña es requerido."),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Fecha de inicio es requerida." }),
  endDate: z.date({ required_error: "Fecha de fin es requerida." }),
  pointsMultiplier: z.coerce.number()
    .min(1.0, "El multiplicador debe ser al menos 1.0.")
    .max(5.0, "El multiplicador no puede ser mayor a 5.0."),
  productIds: z.array(z.number()).min(1, "Debe seleccionar al menos un producto."),
}).refine(data => data.endDate > data.startDate, {
  message: "La fecha de fin debe ser posterior a la fecha de inicio.",
  path: ["endDate"],
});

type FormValues = z.infer<typeof formSchema>;

interface LoyaltyCampaignFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function LoyaltyCampaignForm({ onSuccess, onCancel }: LoyaltyCampaignFormProps) {
  const form = useForm({
    schema: formSchema,
    defaultValues: {
      id: "",
      name: "",
      description: "",
      pointsMultiplier: 1.5,
      productIds: [],
    },
  });

  const createCampaignMutation = useCreateCampaignMutation();
  const { data: productsData, isFetching: isProductsFetching } = useProductsListQuery();

  const [openProductSelector, setOpenProductSelector] = useState(false);

  const products = useMemo(() => {
    if (productsData?.ok) {
      return productsData.products;
    }
    return [];
  }, [productsData]);

  const selectedProducts = useMemo(() => {
    return products.filter(p => form.values.productIds?.includes(p.id));
  }, [form.values.productIds, products]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createCampaignMutation.mutateAsync(values);
      toast.success("Campaña creada exitosamente.");
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
      toast.error(`Error al crear la campaña: ${errorMessage}`);
      console.error("Failed to create campaign:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.form}>
        <div className={styles.grid}>
          <FormItem name="id">
            <FormLabel>ID de Campaña</FormLabel>
            <FormControl>
              <Input
                placeholder="ej: black-friday-2024"
                value={form.values.id}
                onChange={(e) => form.setValues(prev => ({ ...prev, id: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem name="name">
            <FormLabel>Nombre de Campaña</FormLabel>
            <FormControl>
              <Input
                placeholder="ej: Promoción de Verano"
                value={form.values.name}
                onChange={(e) => form.setValues(prev => ({ ...prev, name: e.target.value }))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="description">
          <FormLabel>Descripción</FormLabel>
          <FormControl>
            <Textarea
              placeholder="Describe brevemente la campaña (opcional)"
              value={form.values.description || ""}
              onChange={(e) => form.setValues(prev => ({ ...prev, description: e.target.value }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>

        <div className={styles.grid}>
          <FormItem name="startDate">
            <FormLabel>Fecha de Inicio</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={styles.datePickerTrigger}>
                    {form.values.startDate ? format(form.values.startDate, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                    <CalendarIcon size={16} />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent removeBackgroundAndPadding>
                <Calendar
                  mode="single"
                  selected={form.values.startDate}
                  onSelect={(date) => form.setValues(prev => ({ ...prev, startDate: date as Date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>

          <FormItem name="endDate">
            <FormLabel>Fecha de Fin</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button variant="outline" className={styles.datePickerTrigger}>
                    {form.values.endDate ? format(form.values.endDate, "dd/MM/yyyy") : <span>Seleccionar fecha</span>}
                    <CalendarIcon size={16} />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent removeBackgroundAndPadding>
                <Calendar
                  mode="single"
                  selected={form.values.endDate}
                  onSelect={(date) => form.setValues(prev => ({ ...prev, endDate: date as Date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        </div>

        <FormItem name="pointsMultiplier">
          <FormLabel>Multiplicador de Puntos</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.05"
              min="1.0"
              max="5.0"
              value={form.values.pointsMultiplier}
                            onChange={(e) => form.setValues(prev => ({ ...prev, pointsMultiplier: parseFloat(e.target.value) || 1.0 }))}
            />
          </FormControl>
          <FormDescription>Ej: 1.5 para 1.5x puntos.</FormDescription>
          <FormMessage />
        </FormItem>

        <FormItem name="productIds">
          <FormLabel>Productos Incluidos</FormLabel>
          <Popover open={openProductSelector} onOpenChange={setOpenProductSelector}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProductSelector}
                  className={styles.productSelectorTrigger}
                >
                  <Package size={16} />
                  <span className={styles.selectedProductsText}>
                    {selectedProducts.length > 0 ? `${selectedProducts.length} producto(s) seleccionado(s)` : "Seleccionar productos..."}
                  </span>
                  <ChevronsUpDown size={16} className={styles.chevrons} />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className={styles.popoverContent}>
              <Command>
                <CommandInput placeholder="Buscar producto..." />
                <CommandList>
                  <CommandEmpty>No se encontraron productos.</CommandEmpty>
                  <CommandGroup>
                    {products.map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.name}
                        onSelect={() => {
                          const currentIds = form.values.productIds || [];
                          const newIds = currentIds.includes(product.id)
                            ? currentIds.filter(id => id !== product.id)
                            : [...currentIds, product.id];
                          form.setValues(prev => ({ ...prev, productIds: newIds }));
                        }}
                      >
                        <Check
                          size={16}
                          className={`${styles.checkIcon} ${form.values.productIds?.includes(product.id) ? styles.checkIconVisible : ""}`}
                        />
                        {product.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createCampaignMutation.isPending}>
            {createCampaignMutation.isPending && <Loader2 size={16} className={styles.spinner} />}
            Crear Campaña
          </Button>
        </div>
      </form>
    </Form>
  );
}