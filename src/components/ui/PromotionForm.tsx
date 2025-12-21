import React from 'react';
import * as z from 'zod';
import { useForm, Form } from './Form';
import { Button } from './Button';
import { useProductsQuery } from '../helpers/useProductsQuery';
import { useCategoriesQuery } from '../helpers/useCategoriesQuery';
import { usePromotionUpsertMutation } from '../helpers/usePromotionQueries';
import { schema as promotionSchema } from '../endpoints/promotions_POST.schema';
import { type OutputType as PromotionsListType } from '../endpoints/promotions_GET.schema';
import { PromotionFormBasicInfo, type PromotionBasicInfoData } from './PromotionFormBasicInfo';
import { PromotionFormDiscounts, type PromotionDiscountData } from './PromotionFormDiscounts';
import { PromotionFormDates, type PromotionDateData } from './PromotionFormDates';
import { PromotionFormProducts } from './PromotionFormProducts';
import { PromotionFormLocations } from './PromotionFormLocations';
import { type ProductWithSupplier } from '../endpoints/products_GET.schema';
import { type PublicCategory } from '../endpoints/categories_GET.schema';
import { Trash2 } from 'lucide-react';
import styles from './PromotionForm.module.css';

type Promotion = PromotionsListType[0];

interface PromotionFormProps {
  promotion?: Promotion | null;
  onClose: () => void;
  className?: string;
}

export const PromotionForm = ({ promotion, onClose, className }: PromotionFormProps) => {
  const isEditMode = !!promotion;
  const { data: allProducts = [] } = useProductsQuery();
  const { data: categoriesData } = useCategoriesQuery();
  const allCategories = categoriesData ?? [];
  const upsertMutation = usePromotionUpsertMutation();

  const form = useForm({
    schema: promotionSchema,
    defaultValues: {
      id: promotion?.id,
      name: promotion?.name ?? '',
      description: promotion?.description ?? '',
      promotionType: promotion?.promotionType ?? 'PERCENTAGE_OFF',
      priority: promotion?.priority ?? 0,
      isActive: promotion?.isActive ?? true,
      startDate: promotion?.startDate ? new Date(promotion.startDate) : new Date(),
      endDate: promotion?.endDate ? new Date(promotion.endDate) : new Date(),
      startTime: promotion?.startTime ?? '',
      endTime: promotion?.endTime ?? '',
      daysOfWeek: promotion?.daysOfWeek ?? [],
      discountPercentage: promotion?.discountPercentage != null ? parseFloat(String(promotion.discountPercentage)) : undefined,
      discountAmount: promotion?.discountAmount != null ? parseFloat(String(promotion.discountAmount)) : undefined,
      buyQuantity: promotion?.buyQuantity ?? undefined,
      getQuantity: promotion?.getQuantity ?? undefined,
      minQuantity: promotion?.minQuantity ?? undefined,
      maxTotalUses: promotion?.maxTotalUses ?? undefined,
      maxUsesPerCustomer: promotion?.maxUsesPerCustomer ?? undefined,
      productIds: promotion?.products.map(p => p.id) ?? [],
      categoryIds: promotion?.categories.map(c => c.id) ?? [],
      appliesToAllLocations: promotion?.appliesToAllLocations ?? false,
      locationIds: promotion?.locations?.map(l => l.id) ?? [],
    },
  });

  const selectedProducts: ProductWithSupplier[] = allProducts.filter(p => 
    form.values.productIds?.includes(p.id)
  );

  const selectedCategories: PublicCategory[] = allCategories.filter((c: PublicCategory) => 
    form.values.categoryIds?.includes(c.id)
  );

  const handleBasicInfoChange = <K extends keyof PromotionBasicInfoData>(
    field: K,
    value: PromotionBasicInfoData[K]
  ) => {
    form.setValues(v => ({ ...v, [field]: value }));
  };

  const handleDiscountChange = <K extends keyof PromotionDiscountData>(
    field: K,
    value: PromotionDiscountData[K]
  ) => {
    form.setValues(v => ({ ...v, [field]: value }));
  };

  const handleDateChange = <K extends keyof PromotionDateData>(
    field: K,
    value: PromotionDateData[K]
  ) => {
    form.setValues(v => ({ ...v, [field]: value }));
  };

  const handleProductsChange = (products: ProductWithSupplier[]) => {
    form.setValues(v => ({ ...v, productIds: products.map(p => p.id) }));
  };

  const handleCategoriesChange = (categories: PublicCategory[]) => {
    form.setValues(v => ({ ...v, categoryIds: categories.map(c => c.id) }));
  };

  const onSubmit = (values: z.infer<typeof promotionSchema>) => {
    upsertMutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const basicInfoData: PromotionBasicInfoData = {
    id: form.values.id ?? '',
    name: form.values.name,
    description: form.values.description ?? '',
    promotionType: form.values.promotionType as any,
    priority: form.values.priority ?? 0,
    isActive: form.values.isActive,
    daysOfWeek: form.values.daysOfWeek ?? [],
  };

  const discountData: PromotionDiscountData = {
    discountPercentage: form.values.discountPercentage ?? undefined,
    discountAmount: form.values.discountAmount ?? undefined,
    buyQuantity: form.values.buyQuantity ?? undefined,
    getQuantity: form.values.getQuantity ?? undefined,
    minQuantity: form.values.minQuantity ?? undefined,
  };

  const dateData: PromotionDateData = {
    startDate: form.values.startDate,
    endDate: form.values.endDate,
    startTime: form.values.startTime ?? undefined,
    endTime: form.values.endTime ?? undefined,
    maxUsesPerCustomer: form.values.maxUsesPerCustomer ?? undefined,
    maxTotalUses: form.values.maxTotalUses ?? undefined,
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`${styles.form} ${className || ''}`}>
        <div className={styles.formContent}>
          <PromotionFormBasicInfo
            formData={basicInfoData}
            onChange={handleBasicInfoChange}
            isEditMode={isEditMode}
          />

          <PromotionFormDiscounts
            promotionType={form.values.promotionType as any}
            formData={discountData}
            onChange={handleDiscountChange}
          />

          <PromotionFormDates
            formData={dateData}
            onChange={handleDateChange}
          />

          <PromotionFormLocations
            selectedLocationIds={form.values.locationIds ?? []}
            appliesToAllLocations={form.values.appliesToAllLocations ?? false}
            onChange={(locationIds, appliesToAll) => {
              form.setValues(v => ({
                ...v,
                locationIds,
                appliesToAllLocations: appliesToAll
              }));
            }}
          />

          <PromotionFormProducts
            selectedProducts={selectedProducts}
            selectedCategories={selectedCategories}
            onProductsChange={handleProductsChange}
            onCategoriesChange={handleCategoriesChange}
            requireBundleProducts={form.values.promotionType === 'BUNDLE'}
          />
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? 'Guardando...' : 'Guardar Promoción'}
          </Button>
          {isEditMode && (
            <Button type="button" variant="destructive" disabled>
              <Trash2 size={16} />
              Eliminar
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};