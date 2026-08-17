import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCatalog from "./pages/AdminCatalog";
import AdminOperations from "./pages/AdminOperations";
import OrderDetail from "./pages/OrderDetail";
import OrderHistory from "./pages/OrderHistory";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import AdminCommunity from "./pages/AdminCommunity";
import { NewsPage, RulesPage } from "./pages/CommunityContent";
import { STORE_ROUTES } from "./lib/storeRoutes";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
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
      <Route path={"/products/:slug"} component={ProductDetail} />
      <Route path={"/orders"} component={OrderHistory} />
      <Route path={"/orders/:id"} component={OrderDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
