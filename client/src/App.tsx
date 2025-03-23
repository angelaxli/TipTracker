import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import UploadTip from "@/pages/upload-tip";
import EarningsLog from "@/pages/earnings-log";
import EarningsGraphPage from "@/pages/earnings-graph";
import UploadSuccess from "@/pages/upload-success";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={Dashboard} />
      <Route path="/upload-tip" component={UploadTip} />
      <Route path="/upload-success" component={UploadSuccess} />
      <Route path="/earnings-log" component={EarningsLog} />
      <Route path="/earnings-graph" component={EarningsGraphPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
