import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import MaintenancePage from "@/pages/MaintenancePage";

export default function StoreAvailabilityGate({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const availability = trpc.store.availability.useQuery(undefined, { staleTime: 15_000, refetchOnWindowFocus: true });
  const publicInformationalRoute = location === "/rules" || location === "/news" || location === "/status" || location === "/maintenance-history" || location.startsWith("/maintenance");
  const protectedRoute = location === "/login" || location.startsWith("/admin") || publicInformationalRoute;
  if (protectedRoute || availability.isLoading || availability.isError || availability.data?.publicOnline !== false || availability.data?.maintenanceMode === "CATALOG_ONLY") return <>{children}</>;
  return <MaintenancePage message={availability.data.offlineMessage} estimatedReturnAt={availability.data.estimatedReturnAt} />;
}
