import { useEffect } from "react";
import { z } from "zod";
import { type Selectable } from "kysely";
import { type Products } from "../helpers/schema";
import { useCreateProductMutation, useUpdateProductMutation } from "../helpers/useProductMutations";
import { useSuppliersQuery } from "../helpers/useSupplierQueries";
import { useCategoriesQuery } from "../helpers/useCategoriesQuery";
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
import { Textarea } from "./Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { ImageUploader } from "./ImageUploader";

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Selectable<Products> | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Product name is required."),
  price: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Price must be a non-negative number.",
  }),
  stockQuantity: z.coerce.number().int().min(0, "Stock must be non-negative.").default(0),
  minimumStock: z.coerce.number().int().min(0, "Minimum stock must be non-negative.").default(0),
  barcode: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  description: z.string().optional(),
  supplierId: z.string().optional(),
  imageUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal("")),
  promotionalLabel: z.string().max(50).optional(),
  promotionalLabelType: z.string().optional(), // For tracking if "Custom" is selected
});

export const ProductForm = ({ isOpen, onClose, product }: ProductFormProps) => {
  const isEditMode = !!product;

  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const { data: suppliers } = useSuppliersQuery();
  const { data: categories, isFetching: categoriesLoading } = useCategoriesQuery();

  // Single source of truth for initial values with correct typing
  const initialValues = {
    name: "",
    price: "0.00",
    stockQuantity: 0,
    minimumStock: 0,
    barcode: "",
    categoryId: "",
    subcategoryId: "",
    description: "",
    supplierId: "",
    imageUrl: "",
    promotionalLabel: "",
    promotionalLabelType: "",
  } as const satisfies z.infer<typeof formSchema>;

  const form = useForm({
    schema: formSchema,
    defaultValues: initialValues,
  });

  useEffect(() => {
    if (product) {
      // For existing products, try to match the category string to categoryId/subcategoryId
      let matchedCategoryId = "";
      let matchedSubcategoryId = "";
      
      if (product.category && categories) {
        // Try to find matching category/subcategory based on the existing category string
        for (const cat of categories) {
          if (cat.name === product.category) {
            matchedCategoryId = String(cat.id);
            break;
          }
          // Check subcategories
          for (const sub of cat.subs) {
            if (sub.name === product.category) {
              matchedCategoryId = String(cat.id);
              matchedSubcategoryId = String(sub.id);
              break;
            }
          }
          if (matchedSubcategoryId) break;
        }
      }

      // Determine if promotional label is a preset or custom
      const presetLabels = ["Nuevo", "Descuento", "Lo tienes que probar", "Oferta", "Recomendado"];
      const isPreset = product.promotionalLabel && presetLabels.includes(product.promotionalLabel);
      
      form.setValues({
        name: product.name,
        price: String(product.price),
        stockQuantity: product.stockQuantity,
        minimumStock: product.minimumStock,
        barcode: product.barcode ?? "",
        categoryId: matchedCategoryId,
        subcategoryId: matchedSubcategoryId,
        description: product.description ?? "",
        supplierId: product.supplierId ? String(product.supplierId) : "",
        imageUrl: product.imageurl ?? "",
        promotionalLabel: product.promotionalLabel ?? "",
                promotionalLabelType: isPreset ? (product.promotionalLabel || "") : (product.promotionalLabel ? "Custom" : ""),
      });

    } else {
      form.setValues(initialValues);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, isOpen, categories]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Determine the final promotional label value
    let finalPromotionalLabel: string | null = null;
    if (values.promotionalLabelType && values.promotionalLabelType !== "__empty") {
      if (values.promotionalLabelType === "Custom") {
        finalPromotionalLabel = values.promotionalLabel || null;
      } else {
        finalPromotionalLabel = values.promotionalLabelType;
      }
    }

    // Convert supplierId, categoryId, and subcategoryId to numbers or null
    const processedValues = {
      ...values,
      supplierId: values.supplierId && values.supplierId !== "__empty" 
        ? parseInt(values.supplierId, 10) 
        : null,
      categoryId: values.categoryId && values.categoryId !== "__empty"
        ? parseInt(values.categoryId, 10)
        : null,
      subcategoryId: values.subcategoryId && values.subcategoryId !== "__empty"
        ? parseInt(values.subcategoryId, 10)
        : null,
      imageUrl: values.imageUrl || null,
      promotionalLabel: finalPromotionalLabel,
      // Remove the old categoryId and subcategoryId from the payload since they're not in the Products schema
      category: getCategoryDisplayName(values.categoryId, values.subcategoryId),
    };

    // Remove categoryId, subcategoryId, and promotionalLabelType from processedValues as they're not in the database schema
    const { categoryId, subcategoryId, promotionalLabelType, ...finalValues } = processedValues;

    if (isEditMode) {
      updateMutation.mutate(
        { id: product.id, ...finalValues },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(finalValues, { onSuccess: onClose });
    }
  };

  const getCategoryDisplayName = (categoryId?: string, subcategoryId?: string): string | null => {
    if (!categories) return null;
    
    const category = categories.find(cat => String(cat.id) === categoryId);
    if (!category) return null;
    
    if (subcategoryId && subcategoryId !== "__empty") {
      const subcategory = category.subs.find(sub => String(sub.id) === subcategoryId);
      return subcategory ? subcategory.name : category.name;
    }
    
    return category.name;
  };

  const selectedCategory = categories?.find(cat => String(cat.id) === form.values.categoryId);
  const availableSubcategories = selectedCategory?.subs || [];

  const handleCategoryChange = (value: string) => {
    form.setValues((p) => ({ 
      ...p, 
      categoryId: value,
      subcategoryId: "" // Clear subcategory when category changes
    }));
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Check if current imageUrl is a valid URL for preview
  const showImagePreview = form.values.imageUrl && form.values.imageUrl.trim() !== "";

  const handleImageUploaded = (url: string) => {
    form.setValues((p) => ({ ...p, imageUrl: url }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details of the existing product."
              : "Fill in the details to add a new product to your inventory."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="product-form">
            <FormItem name="name">
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Soda Can"
                  value={form.values.name}
                  onChange={(e) => form.setValues((p) => ({ ...p, name: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="barcode">
              <FormLabel>Código de Barras</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: 7501234567890"
                  value={form.values.barcode}
                  onChange={(e) => form.setValues((p) => ({ ...p, barcode: e.target.value }))}
                />
              </FormControl>
              <FormDescription>
                Código de barras del producto (EAN-13, UPC, etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormItem name="price">
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.values.price}
                    onChange={(e) => form.setValues((p) => ({ ...p, price: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="categoryId">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select 
                    value={form.values.categoryId} 
                    onValueChange={handleCategoryChange}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">No category</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="subcategoryId">
              <FormLabel>Subcategory</FormLabel>
              <FormControl>
                <Select 
                  value={form.values.subcategoryId} 
                  onValueChange={(value) => form.setValues((p) => ({ ...p, subcategoryId: value }))}
                  disabled={!selectedCategory || availableSubcategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        !selectedCategory 
                          ? "Select a category first" 
                          : availableSubcategories.length === 0 
                            ? "No subcategories available"
                            : "Select a subcategory (optional)"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">No subcategory</SelectItem>
                    {availableSubcategories.map((subcategory) => (
                      <SelectItem key={subcategory.id} value={String(subcategory.id)}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                {selectedCategory && availableSubcategories.length === 0 
                  ? "This category has no subcategories."
                  : "Optional: Select a subcategory for more specific classification."
                }
              </FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="supplierId">
              <FormLabel>Supplier</FormLabel>
              <FormControl>
                <Select 
                  value={form.values.supplierId} 
                  onValueChange={(value) => form.setValues((p) => ({ ...p, supplierId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">No supplier</SelectItem>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={String(supplier.id)}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="imageUrl">
              <FormLabel>Product Image</FormLabel>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-2)', alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/product-image.jpg"
                      value={form.values.imageUrl}
                      onChange={(e) => form.setValues((p) => ({ ...p, imageUrl: e.target.value }))}
                    />
                  </FormControl>
                </div>
                <ImageUploader
                  onUploaded={handleImageUploaded}
                  folder="products"
                  buttonLabel="Upload"
                />
              </div>
              
              <FormDescription style={{ marginTop: 'var(--spacing-2)' }}>
                Enter an image URL or upload a file (JPG, PNG, or WebP, max 5MB).
              </FormDescription>
              
              {showImagePreview && (
                <div style={{ marginTop: 'var(--spacing-3)' }}>
                  <img
                    src={form.values.imageUrl}
                    alt="Product preview"
                    style={{
                      width: '100%',
                      maxWidth: '200px',
                      height: 'auto',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'block';
                    }}
                  />
                </div>
              )}
              
              <FormMessage />
            </FormItem>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)' }}>
              <FormItem name="stockQuantity">
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.values.stockQuantity}
                    onChange={(e) => form.setValues((p) => ({ ...p, stockQuantity: parseInt(e.target.value) || 0 }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem name="minimumStock">
                <FormLabel>Minimum Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.values.minimumStock}
                    onChange={(e) => form.setValues((p) => ({ ...p, minimumStock: parseInt(e.target.value) || 0 }))}
                  />
                </FormControl>
                <FormDescription>Alert level for low stock.</FormDescription>
                <FormMessage />
              </FormItem>
            </div>



            <FormItem name="promotionalLabelType">
              <FormLabel>Promotional Label</FormLabel>
              <FormControl>
                <Select 
                  value={form.values.promotionalLabelType} 
                  onValueChange={(value) => form.setValues((p) => ({ 
                    ...p, 
                    promotionalLabelType: value,
                    // Clear custom label when switching away from Custom
                    promotionalLabel: value === "Custom" ? p.promotionalLabel : ""
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select promotional label (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty">No label</SelectItem>
                    <SelectItem value="Nuevo">Nuevo</SelectItem>
                    <SelectItem value="Descuento">Descuento</SelectItem>
                    <SelectItem value="Lo tienes que probar">Lo tienes que probar</SelectItem>
                    <SelectItem value="Oferta">Oferta</SelectItem>
                    <SelectItem value="Recomendado">Recomendado</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Choose a promotional badge to display on the product in the kiosk.
              </FormDescription>
              <FormMessage />
            </FormItem>

            {form.values.promotionalLabelType === "Custom" && (
              <FormItem name="promotionalLabel">
                <FormLabel>Custom Label</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter custom promotional label"
                    value={form.values.promotionalLabel}
                    onChange={(e) => form.setValues((p) => ({ ...p, promotionalLabel: e.target.value }))}
                    maxLength={50}
                  />
                </FormControl>
                <FormDescription>
                  Maximum 50 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}

            <FormItem name="description">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Optional product description"
                  value={form.values.description}
                  onChange={(e) => form.setValues((p) => ({ ...p, description: e.target.value }))}
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
          <Button type="submit" form="product-form" disabled={isPending}>
            {isPending ? "Saving..." : isEditMode ? "Save Changes" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};