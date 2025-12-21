import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type Selectable } from "kysely";
import { type Customers, type PointsTransactions } from "./schema";

import {
  getCustomers,
  type InputType as GetCustomersInput,
  type OutputType as CustomersOutput,
} from "../endpoints/customers_GET.schema";
import {
  postCustomers,
  type InputType as CreateCustomerInput,
} from "../endpoints/customers_POST.schema";
import {
  postCustomersUpdate,
  type InputType as UpdateCustomerInput,
} from "../endpoints/customers/update_POST.schema";
import {
  getCustomersPointsTransactions,
  type InputType as GetPointsTransactionsInput,
} from "../endpoints/customers/points-transactions_GET.schema";
import {
  postCustomersAwardPoints,
  type InputType as AwardPointsInput,
} from "../endpoints/customers/award-points_POST.schema";
import {
  postCustomersRedeemPoints,
  type InputType as RedeemPointsInput,
} from "../endpoints/customers/redeem-points_POST.schema";
import {
  postCustomersSetPin,
  type InputType as SetPinInput,
} from "../endpoints/customers/set-pin_POST.schema";
import {
  postCustomersVerifyPin,
  type InputType as VerifyPinInput,
} from "../endpoints/customers/verify-pin_POST.schema";
import {
  postCustomersResetPin,
  type InputType as ResetPinInput,
} from "../endpoints/customers/reset-pin_POST.schema";

export const CUSTOMERS_QUERY_KEY = "customers";
export const CUSTOMER_POINTS_TRANSACTIONS_QUERY_KEY =
  "customerPointsTransactions";

/**
 * Fetches a list of customers, with optional search and filtering.
 * @param params - Optional search and isActive filter.
 */
export const useCustomersQuery = (params?: GetCustomersInput) => {
  return useQuery<CustomersOutput, Error>({
    queryKey: [CUSTOMERS_QUERY_KEY, params],
    queryFn: () => getCustomers(params),
  });
};

/**
 * Fetches the points transaction history for a specific customer.
 * The query is disabled if no customerId is provided.
 * @param customerId - The ID of the customer.
 */
export const useCustomerPointsTransactionsQuery = (
  customerId: number | undefined | null
) => {
  return useQuery({
    queryKey: [CUSTOMER_POINTS_TRANSACTIONS_QUERY_KEY, customerId],
    queryFn: () =>
      getCustomersPointsTransactions({
        customerId: customerId as number,
      }),
    enabled: !!customerId,
  });
};

/**
 * Mutation to create a new customer.
 * Invalidates the main customers query on success to refetch the list.
 */
export const useCreateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCustomer: CreateCustomerInput) => postCustomers(newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
    },
  });
};

/**
 * Mutation to update an existing customer.
 * Invalidates the main customers query on success to refetch the list.
 */
export const useUpdateCustomerMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedCustomer: UpdateCustomerInput) =>
      postCustomersUpdate(updatedCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
    },
  });
};

/**
 * Mutation to award points to a customer.
 * Invalidates both the customers list (to update total points) and the
 * specific customer's transaction history on success.
 */
export const useAwardPointsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (awardData: AwardPointsInput) =>
      postCustomersAwardPoints(awardData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [
          CUSTOMER_POINTS_TRANSACTIONS_QUERY_KEY,
          variables.customerId,
        ],
      });
    },
  });
};

/**
 * Mutation to redeem points for a customer.
 * Invalidates both the customers list (to update total points) and the
 * specific customer's transaction history on success.
 */
export const useRedeemPointsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (redeemData: RedeemPointsInput) =>
      postCustomersRedeemPoints(redeemData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [
          CUSTOMER_POINTS_TRANSACTIONS_QUERY_KEY,
          variables.customerId,
        ],
      });
    },
  });
};

/**
 * Mutation to set or update a customer's PIN.
 * Invalidates the main customers query on success to refetch the list.
 */
export const useSetPinMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pinData: SetPinInput) => postCustomersSetPin(pinData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
    },
  });
};

/**
 * Mutation to verify a customer's PIN.
 * Does not invalidate queries as this is a read-only verification operation.
 * Returns customer data if verification is successful.
 */
export const useVerifyPinMutation = () => {
  return useMutation({
    mutationFn: (verifyData: VerifyPinInput) =>
      postCustomersVerifyPin(verifyData),
  });
};

/**
 * Mutation to reset a customer's PIN based on their identifier (email or phone).
 * Invalidates the main customers query on success to refetch the list.
 */
export const useResetPinMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resetData: ResetPinInput) => postCustomersResetPin(resetData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CUSTOMERS_QUERY_KEY] });
    },
  });
};