import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { STORE_ROUTES } from "./lib/storeRoutes";
import StoreAvailabilityGate from "./components/StoreAvailabilityGate";

const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminCatalog = lazy(() => import("./pages/AdminCatalog"));
const AdminOperations = lazy(() => import("./pages/AdminOperations"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const AdminCommunity = lazy(() => import("./pages/AdminCommunity"));
const NewsPage = lazy(() => import("./pages/CommunityContent").then((module) => ({ default: module.NewsPage })));
const RulesPage = lazy(() => import("./pages/CommunityContent").then((module) => ({ default: module.RulesPage })));
const PoliciesPage = lazy(() => import("./pages/CommunityContent").then((module) => ({ default: module.PoliciesPage })));
const OperationsStatus = lazy(() => import("./pages/OperationsStatus"));
const MaintenanceHistory = lazy(() => import("./pages/MaintenanceHistory"));
const MaintenancePortal = lazy(() => import("./pages/MaintenancePortal"));

function RouteLoading() {
  return <main className="grid min-h-screen place-items-center bg-[#07111d] px-5 text-slate-200"><div className="rounded-2xl border border-white/10 bg-slate-900/75 px-5 py-4 text-sm shadow-2xl">Carregando página…</div></main>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
        <Route path={STORE_ROUTES.HOME} component={Home} />
        <Route path={STORE_ROUTES.CART} component={Home} />
        <Route path={"/login"} component={Login} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/admin/catalog"} component={AdminCatalog} />
        <Route path={"/admin/operations"} component={AdminOperations} />
        <Route path={"/admin/community"} component={AdminCommunity} />
        <Route path={"/rules"} component={RulesPage} />
        <Route path={"/news"} component={NewsPage} />
        <Route path={"/policies"} component={PoliciesPage} />
        <Route path={"/status"} component={OperationsStatus} />
        <Route path={"/maintenance-history"} component={MaintenanceHistory} />
        <Route path={"/maintenance"} component={MaintenancePortal} />
        <Route path={"/products/:slug"} component={ProductDetail} />
        <Route path={"/orders"} component={OrderHistory} />
        <Route path={"/orders/:id"} component={OrderDetail} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <StoreAvailabilityGate><Router /></StoreAvailabilityGate>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
