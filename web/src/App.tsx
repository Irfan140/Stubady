import { useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { DeleteAccount } from "./pages/DeleteAccount";
import { Home } from "./pages/Home";
import { Privacy } from "./pages/Privacy";
import { routeFromHash, type Route } from "./router";
import "./index.css";

const TITLES: Record<Route, string> = {
  home: "Stubady — Study from your own materials",
  privacy: "Privacy policy — Stubady",
  "delete-account": "Delete your account — Stubady",
};

function App() {
  const [route, setRoute] = useState<Route>(() => routeFromHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      const next = routeFromHash(window.location.hash);
      setRoute(next);
      document.title = TITLES[next];
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    document.title = TITLES[routeFromHash(window.location.hash)];
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink antialiased">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <SiteHeader route={route} />
      <div id="content" className="flex-1">
        {route === "privacy" ? (
          <Privacy />
        ) : route === "delete-account" ? (
          <DeleteAccount />
        ) : (
          <Home />
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
