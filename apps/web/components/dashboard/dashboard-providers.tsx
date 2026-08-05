import { AdminProvider } from "@/providers/admin-provider";
import { AuthProvider } from "@/providers/auth-provider";
import CropProvider from "@/providers/crop-provider";
import { FisheryProvider } from "@/providers/fishery-provider";
import LivestockProvider from "@/providers/livestock-provider";
import { MachineProvider } from "@/providers/machine-provider";
import React from "react";

export function DashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminProvider>
        <CropProvider>
          <LivestockProvider>
            <FisheryProvider>
              <MachineProvider>{children}</MachineProvider>
            </FisheryProvider>
          </LivestockProvider>
        </CropProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
