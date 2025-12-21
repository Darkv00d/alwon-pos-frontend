import { z } from "zod";
import { useForm } from "./Form";
import { useCustomersQuery, useAwardPointsMutation, useRedeemPointsMutation } from "../helpers/useCustomerQueries";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { toast } from "sonner";
import styles from "./PointsTransactionForm.module.css";

interface PointsTransactionFormProps {
  onSuccess?: () => void;
}

const awardSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  pointsAmount: z.coerce.number().int().refine(val => val !== 0, "Points must not be zero."),
  transactionType: z.enum(["bonus", "adjustment", "earned"]),
  description: z.string().optional(),
});

const redeemSchema = z.object({
  customerId: z.string().min(1, "Customer is required."),
  pointsAmount: z.coerce.number().int().positive("Points must be a positive number."),
  description: z.string().optional(),
});

const AWARD_DEFAULT = {
  customerId: "",
  pointsAmount: 0,
  transactionType: "bonus" as const,
  description: "",
} satisfies z.infer<typeof awardSchema>;

const REDEEM_DEFAULT = {
  customerId: "",
  pointsAmount: 0,
  description: "",
} satisfies z.infer<typeof redeemSchema>;

export const PointsTransactionForm = ({ onSuccess }: PointsTransactionFormProps) => {
  const { data: customers, isFetching: isFetchingCustomers } = useCustomersQuery();
  const awardMutation = useAwardPointsMutation();
  const redeemMutation = useRedeemPointsMutation();

  const awardForm = useForm({
    schema: awardSchema,
    defaultValues: AWARD_DEFAULT,
  });

  const redeemForm = useForm({
    schema: redeemSchema,
    defaultValues: REDEEM_DEFAULT,
  });

  const handleAwardSubmit = (values: z.infer<typeof awardSchema>) => {
    awardMutation.mutate(
      { ...values, customerId: parseInt(values.customerId, 10) },
      {
        onSuccess: () => {
          toast.success("Points awarded successfully!");
          awardForm.setValues(AWARD_DEFAULT);
          onSuccess?.();
        },
        onError: (err) => {
          if (err instanceof Error) toast.error("Failed to award points", { description: err.message });
        },
      }
    );
  };

  const handleRedeemSubmit = (values: z.infer<typeof redeemSchema>) => {
    redeemMutation.mutate(
      { ...values, customerId: parseInt(values.customerId, 10) },
      {
        onSuccess: () => {
          toast.success("Points redeemed successfully!");
          redeemForm.setValues(REDEEM_DEFAULT);
          onSuccess?.();
        },
        onError: (err) => {
          if (err instanceof Error) toast.error("Failed to redeem points", { description: err.message });
        },
      }
    );
  };

  const isPending = awardMutation.isPending || redeemMutation.isPending;

  return (
    <div className={styles.container}>
      <Tabs defaultValue="award">
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="award">Award Points</TabsTrigger>
          <TabsTrigger value="redeem">Redeem Points</TabsTrigger>
        </TabsList>
        <TabsContent value="award" className={styles.tabContent}>
          <Form {...awardForm}>
            <form onSubmit={awardForm.handleSubmit(handleAwardSubmit)}>
              <FormItem name="customerId">
                <FormLabel>Customer</FormLabel>
                <Select
                  value={awardForm.values.customerId}
                  onValueChange={(value) => awardForm.setValues((p) => ({ ...p, customerId: value }))}
                  disabled={isFetchingCustomers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.email ?? c.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>

              <div className={styles.grid}>
                <FormItem name="pointsAmount">
                  <FormLabel>Points Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 100 or -50"
                      value={awardForm.values.pointsAmount}
                      onChange={(e) => awardForm.setValues((p) => ({ ...p, pointsAmount: parseInt(e.target.value) || 0 }))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem name="transactionType">
                  <FormLabel>Type</FormLabel>
                  <Select
                    value={awardForm.values.transactionType}
                    onValueChange={(value) => awardForm.setValues((p) => ({ ...p, transactionType: value as any }))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                      <SelectItem value="earned">Earned</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              </div>

              <FormItem name="description">
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Welcome bonus"
                    value={awardForm.values.description}
                    onChange={(e) => awardForm.setValues((p) => ({ ...p, description: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <Button type="submit" disabled={isPending} className={styles.submitButton}>
                {awardMutation.isPending ? "Awarding..." : "Award Points"}
              </Button>
            </form>
          </Form>
        </TabsContent>
        <TabsContent value="redeem" className={styles.tabContent}>
          <Form {...redeemForm}>
            <form onSubmit={redeemForm.handleSubmit(handleRedeemSubmit)}>
              <FormItem name="customerId">
                <FormLabel>Customer</FormLabel>
                <Select
                  value={redeemForm.values.customerId}
                  onValueChange={(value) => redeemForm.setValues((p) => ({ ...p, customerId: value }))}
                  disabled={isFetchingCustomers}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} ({c.email ?? c.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>

              <FormItem name="pointsAmount">
                <FormLabel>Points to Redeem</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={redeemForm.values.pointsAmount}
                    onChange={(e) => redeemForm.setValues((p) => ({ ...p, pointsAmount: parseInt(e.target.value) || 0 }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="description">
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Redeemed for discount"
                    value={redeemForm.values.description}
                    onChange={(e) => redeemForm.setValues((p) => ({ ...p, description: e.target.value }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <Button type="submit" variant="destructive" disabled={isPending} className={styles.submitButton}>
                {redeemMutation.isPending ? "Redeeming..." : "Redeem Points"}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};