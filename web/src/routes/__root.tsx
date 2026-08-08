import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthProvider } from "@/providers/auth-provider";
import { SocketProvider } from "@/providers/socket-provider";
import { LanguageProvider } from "@/lib/LanguageContext";
import { Toaster } from "@/components/ui/sonner";
import { NotFound } from "@/components/not-found";

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <SocketProvider>
        <LanguageProvider>
          <Outlet />
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            expand
            visibleToasts={3}
            toastOptions={{
              duration: 5000,
            }}
          />
        </LanguageProvider>
      </SocketProvider>
    </AuthProvider>
  ),
  notFoundComponent: () => {
    return <NotFound />;
  },
});
