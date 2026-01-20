export type Route = "/login" | "/dashboard" | "/occurrences";


export function getRoute(): Route {
  const hash = (location.hash || "#/login").replace("#", "");
  if (hash === "/dashboard") return "/dashboard";
  if (hash === "/occurrences") return "/occurrences";
  return "/login";
}

export function go(route: Route) {
  location.hash = route;
}
