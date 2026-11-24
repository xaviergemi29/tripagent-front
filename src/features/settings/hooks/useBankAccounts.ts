import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, type ApiError } from "@/lib/api-client";
import { AGENCY_BANK_ACCOUNT_KEYS, AGENCY_KEYS } from "@/shared/api/query-keys";
import type { BankAccountInput, BankAccountOutput } from "../schemas/bank-account.schema";

const getBankAccountsApi = (): Promise<BankAccountOutput[]> =>
  apiClient.get<never, BankAccountOutput[]>("/agencies/bank-accounts");

const createBankAccountApi = (body: BankAccountInput): Promise<BankAccountOutput> =>
  apiClient.post<never, BankAccountOutput>("/agencies/bank-accounts", body);

const updateBankAccountApi = ({
  id,
  body,
}: {
  id: string;
  body: BankAccountInput;
}): Promise<BankAccountOutput> =>
  apiClient.patch<never, BankAccountOutput>(`/agencies/bank-accounts/${id}`, body);

const deleteBankAccountApi = (id: string): Promise<{ id: string }> =>
  apiClient.delete<never, { id: string }>(`/agencies/bank-accounts/${id}`);

/**
 * Las cuentas también viajan en `GET /agencies` (`bankAccounts`): banner de `/tours`, regla 22 del
 * formulario de tours, mensajes de WhatsApp y estado de cuenta del operador. Toda mutación refresca
 * ambas cachés.
 */
const invalidateBankAccounts = (queryClient: QueryClient): Promise<unknown> =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: AGENCY_BANK_ACCOUNT_KEYS.all }),
    queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.all }),
  ]);

/** Cuentas bancarias de la agencia, ordenadas por `position` (la primera es la principal). */
export function useBankAccounts() {
  return useQuery({
    queryKey: AGENCY_BANK_ACCOUNT_KEYS.all,
    queryFn: getBankAccountsApi,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation<BankAccountOutput, ApiError, BankAccountInput>({
    mutationFn: createBankAccountApi,
    onSuccess: () => {
      toast.success("Cuenta bancaria agregada", {
        description: "Tus viajeros verán estos datos para transferir.",
      });
    },
    onError: (error) => {
      toast.error("No se pudo agregar la cuenta bancaria", { description: error.message });
    },
    onSettled: () => invalidateBankAccounts(queryClient),
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation<BankAccountOutput, ApiError, { id: string; body: BankAccountInput }>({
    mutationFn: updateBankAccountApi,
    onSuccess: () => {
      toast.success("Cuenta bancaria actualizada");
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la cuenta bancaria", { description: error.message });
    },
    onSettled: () => invalidateBankAccounts(queryClient),
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, ApiError, string>({
    mutationFn: deleteBankAccountApi,
    onSuccess: () => {
      toast.success("Cuenta bancaria eliminada");
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la cuenta bancaria", { description: error.message });
    },
    onSettled: () => invalidateBankAccounts(queryClient),
  });
}
