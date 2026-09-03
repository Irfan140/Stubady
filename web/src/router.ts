export type Route = "home" | "privacy" | "delete-account";

export function routeFromHash(hash: string): Route {
  if (hash.startsWith("#/privacy")) return "privacy";
  if (hash.startsWith("#/delete-account")) return "delete-account";
  return "home";
}

export function hashFor(route: Route): string {
  if (route === "privacy") return "#/privacy";
  if (route === "delete-account") return "#/delete-account";
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
  const scroll = () => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };
  if (routeFromHash(window.location.hash) !== "home") {
    window.location.hash = "#/";
    window.setTimeout(scroll, 80);
  } else {
    scroll();
  }
}
