"use client";

import { BankAccountFormDialog } from "./bank-accounts/BankAccountFormDialog";

interface BankAccountQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "Configurar cuenta ahora" (OBS-038, regla 22): agrega una cuenta bancaria
 * (`POST /agencies/bank-accounts`) sin salir del formulario del tour, así el operador no pierde lo
 * que ya escribió. Mismo formulario que Configuración → Agencia → Cuentas bancarias.
 */
export function BankAccountQuickModal({ isOpen, onClose }: BankAccountQuickModalProps) {
  return (
    <BankAccountFormDialog
      isOpen={isOpen}
      onClose={onClose}
      description="Tus viajeros verán estos datos para transferir sus pagos. Lo que ya escribiste en el tour se conserva."
    />
  );
}
