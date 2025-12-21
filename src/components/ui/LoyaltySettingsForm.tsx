import { useEffect } from "react";
import { z } from "zod";
import { useLoyaltySettingsQuery, useUpdateLoyaltySettingsMutation } from "../helpers/useLoyaltyQueries";
import { type Selectable } from "kysely";
import { type LoyaltySettings } from "../helpers/schema";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
  FormDescription,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import styles from "./LoyaltySettingsForm.module.css";

const formSchema = z.object({
  pointsPerDollar: z.string().refine(v => !isNaN(parseFloat(v)), "Must be a number"),
  redemptionValue: z.string().refine(v => !isNaN(parseFloat(v)), "Must be a number"),
  minPointsToRedeem: z.string().refine(v => /^\d+$/.test(v), "Must be a whole number"),
});

type FormValues = z.infer<typeof formSchema>;

const settingKeys: Record<keyof FormValues, string> = {
  pointsPerDollar: 'points_per_dollar',
  redemptionValue: 'redemption_value_per_point',
  minPointsToRedeem: 'min_points_to_redeem',
};

export const LoyaltySettingsForm = () => {
  const { data: settings, isFetching, error } = useLoyaltySettingsQuery();
  const updateMutation = useUpdateLoyaltySettingsMutation();

  const form = useForm({
    schema: formSchema,
    defaultValues: {
      pointsPerDollar: "0",
      redemptionValue: "0",
      minPointsToRedeem: "0",
    },
  });

  useEffect(() => {
    if (settings) {
      const settingsMap = new Map(settings.map(s => [s.settingKey, s.settingValue]));
      form.setValues({
        pointsPerDollar: String(settingsMap.get(settingKeys.pointsPerDollar) ?? "0"),
        redemptionValue: String(settingsMap.get(settingKeys.redemptionValue) ?? "0"),
        minPointsToRedeem: String(settingsMap.get(settingKeys.minPointsToRedeem) ?? "0"),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const onSubmit = (values: FormValues) => {
    const payload = Object.entries(values).map(([key, value]) => ({
      settingKey: settingKeys[key as keyof FormValues],
      settingValue: value,
    }));

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Loyalty settings updated successfully!");
      },
      onError: (err) => {
        if (err instanceof Error) toast.error("Update failed", { description: err.message });
      },
    });
  };

  const renderPreview = () => {
    const points = parseFloat(form.values.pointsPerDollar);
    const value = parseFloat(form.values.redemptionValue);
    const minRedeem = parseInt(form.values.minPointsToRedeem, 10);

    if (isNaN(points) || isNaN(value) || isNaN(minRedeem)) {
      return <p>Enter valid numbers to see a preview.</p>;
    }

    const pointsFor100 = 100 * points;
    const valueOf1000Points = 1000 * value;

    return (
      <>
        <p>A <strong>$100.00</strong> purchase will earn <strong>{pointsFor100.toFixed(2)}</strong> points.</p>
        <p><strong>1,000</strong> points can be redeemed for a <strong>${valueOf1000Points.toFixed(2)}</strong> discount.</p>
        <p>Customers must have at least <strong>{minRedeem}</strong> points to be able to redeem.</p>
      </>
    );
  };

  if (isFetching) {
    return (
      <div className={styles.container}>
        <Skeleton style={{ height: '2rem', width: '200px', marginBottom: 'var(--spacing-6)' }} />
        <Skeleton style={{ height: '4rem', marginBottom: 'var(--spacing-4)' }} />
        <Skeleton style={{ height: '4rem', marginBottom: 'var(--spacing-4)' }} />
        <Skeleton style={{ height: '4rem', marginBottom: 'var(--spacing-4)' }} />
        <Skeleton style={{ height: '2.5rem', width: '120px', marginTop: 'var(--spacing-4)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <AlertTriangle />
        <p>Error loading loyalty settings.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.formGrid}>
          <div className={styles.formFields}>
            <h2 className={styles.title}>Loyalty Program Settings</h2>
            <FormItem name="pointsPerDollar">
              <FormLabel>Points Earned Per Dollar Spent</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  value={form.values.pointsPerDollar}
                  onChange={(e) => form.setValues((p) => ({ ...p, pointsPerDollar: e.target.value }))}
                />
              </FormControl>
              <FormDescription>How many points a customer gets for each dollar spent.</FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="redemptionValue">
              <FormLabel>Redemption Value Per Point (in USD)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  value={form.values.redemptionValue}
                  onChange={(e) => form.setValues((p) => ({ ...p, redemptionValue: e.target.value }))}
                />
              </FormControl>
              <FormDescription>The dollar value of a single point when redeemed.</FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="minPointsToRedeem">
              <FormLabel>Minimum Points to Redeem</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  value={form.values.minPointsToRedeem}
                  onChange={(e) => form.setValues((p) => ({ ...p, minPointsToRedeem: e.target.value }))}
                />
              </FormControl>
              <FormDescription>The minimum point balance required for a customer to make a redemption.</FormDescription>
              <FormMessage />
            </FormItem>
            
            <Button type="submit" disabled={updateMutation.isPending} className={styles.submitButton}>
              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          <div className={styles.previewCard}>
            <div className={styles.previewHeader}>
              <Info size={16} />
              <h4>Configuration Preview</h4>
            </div>
            <div className={styles.previewContent}>
              {renderPreview()}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};