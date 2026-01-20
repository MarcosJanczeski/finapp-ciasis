export type Route = "/login" | "/dashboard";

export function getRoute(): Route {
  const hash = (location.hash || "#/login").replace("#", "");
  if (hash === "/dashboard") return "/dashboard";
  return "/login";
}

export function go(route: Route) {
  location.hash = route;
}
