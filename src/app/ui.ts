export function setRoot(html: string) {
  const el = document.querySelector<HTMLDivElement>("#app");
  if (!el) throw new Error("Missing #app element");
  el.innerHTML = html;
}
