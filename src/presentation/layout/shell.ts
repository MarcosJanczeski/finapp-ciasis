export function shell(content: string) {
  return `
  <div style="max-width:420px;margin:0 auto;padding:16px;font-family:system-ui;">
    <h1 style="font-size:20px;margin:0 0 12px 0;">FINAPP</h1>
    ${content}
  </div>
  `;
}
