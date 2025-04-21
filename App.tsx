import { Route, Switch } from "wouter";
import { Toaster } from "./ui-toast";
import Home from "./home";
import Movies from "./movies";
import Series from "./series";
import Channels from "./channels";
import Watch from "./watch";
import NotFound from "./not-found";

// Router component that handles all the routes
function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/movies" component={Movies} />
      <Route path="/series" component={Series} />
      <Route path="/channels" component={Channels} />
      <Route path="/watch/:id" component={Watch} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Main App component
function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Router />
      <Toaster />
    </div>
  );
}

export default App;
