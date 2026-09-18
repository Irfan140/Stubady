import { useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { DeleteAccount } from "./pages/DeleteAccount";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Privacy } from "./pages/Privacy";
import {
  isUnknownHash,
  routeFromHash,
  scrollToSection,
  sectionFromHash,
  type Route,
} from "./router";
import "./index.css";

const TITLES: Record<Route | "unknown", string> = {
  home: "Stubady — Study from your own materials",
  privacy: "Privacy policy — Stubady",
  "delete-account": "Delete your account — Stubady",
  unknown: "Page not found — Stubady",
};

function initialRoute(): Route | "unknown" {
  const hash = window.location.hash;
  if (isUnknownHash(hash)) return "unknown";
  return routeFromHash(hash);
}

function applyHash(): Route | "unknown" {
  const hash = window.location.hash;
  if (isUnknownHash(hash)) return "unknown";
  const section = sectionFromHash(hash);
  if (section) {
    // Render first, then scroll — the target route mounts on this pass.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!scrollToSection(section)) window.scrollTo({ top: 0 });
      });
    });
  } else {
    window.scrollTo({ top: 0 });
  }
  return routeFromHash(hash);
}

function App() {
  const [route, setRoute] = useState<Route | "unknown">(initialRoute);

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  useEffect(() => {
    // Deep links (e.g. #/privacy#collect) scroll after first paint.
    const section = sectionFromHash(window.location.hash);
    if (section) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!scrollToSection(section)) window.scrollTo({ top: 0 });
        });
      });
    }
    const onHashChange = () => setRoute(applyHash());
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
      <SiteHeader route={route === "unknown" ? "home" : route} />
      <div id="content" className="flex-1">
        {route === "privacy" ? (
          <Privacy />
        ) : route === "delete-account" ? (
          <DeleteAccount />
        ) : route === "unknown" ? (
          <NotFound />
        ) : (
          <Home />
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

export default App;
