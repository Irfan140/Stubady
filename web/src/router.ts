export type Route = "home" | "privacy" | "delete-account";

export type ParsedHash =
  | { route: Route; section?: string }
  | { route: "unknown" };

const HOME_SECTIONS = ["why", "tools", "how", "data", "architecture"];

/**
 * Hash truth table (static host, no rewrites):
 *  #/  #/privacy  #/delete-account            -> routes, top
 *  #/privacy#collect                           -> route + section
 *  #why  #tools  #how  #data  #architecture    -> home + section
 *  anything else under #/                      -> unknown (404)
 */
export function parseHash(hash: string): ParsedHash {
  if (hash.startsWith("#/privacy")) {
    const rest = hash.slice("#/privacy".length);
    if (rest === "" || rest === "/") return { route: "privacy" };
    const section = rest.startsWith("#") ? rest.slice(1) : null;
    if (section && /^[a-z-]+$/.test(section))
      return { route: "privacy", section };
    return { route: "unknown" };
  }
  if (hash === "#/delete-account" || hash === "#/delete-account/")
    return { route: "delete-account" };
  if (hash === "" || hash === "#" || hash === "#/") return { route: "home" };
  if (hash.startsWith("#/")) return { route: "unknown" };
  const section = hash.startsWith("#") ? hash.slice(1) : hash;
  if (HOME_SECTIONS.includes(section)) return { route: "home", section };
  if (section === "") return { route: "home" };
  return { route: "unknown" };
}

export function routeFromHash(hash: string): Route {
  const parsed = parseHash(hash);
  return parsed.route === "unknown" ? "home" : parsed.route;
}

export function sectionFromHash(hash: string): string | undefined {
  const parsed = parseHash(hash);
  return parsed.route === "unknown" ? undefined : parsed.section;
}

export function isUnknownHash(hash: string): boolean {
  return parseHash(hash).route === "unknown";
}

export function hashFor(route: Route): string {
  if (route === "privacy") return "#/privacy";
  if (route === "delete-account") return "#/delete-account";
  return "#/";
}

export function hashForSection(section: string): string {
  if (HOME_SECTIONS.includes(section)) return `#${section}`;
  return "#/";
}

export function navigate(route: Route): void {
  if (routeFromHash(window.location.hash) === route) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  window.location.hash = hashFor(route);
}

/** Go to the home page, then scroll to a section anchor. */
export function goToSection(id: string): void {
  window.location.hash = hashForSection(id);
}

/** Scroll to a section element if present. Returns whether it scrolled. */
export function scrollToSection(id: string): boolean {
  const el = document.getElementById(id);
  if (!el) return false;
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  return true;
}
