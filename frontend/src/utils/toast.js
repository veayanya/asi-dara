// Notifikasi ringan yang tidak memblokir layar (pengganti alert()).
export function showToast(message, { type = 'info', duration = 9000 } = {}) {
  if (typeof document === 'undefined' || !message) return;
  const colors = {
    info:  { bg: '#eff6ff', bd: '#93c5fd', fg: '#1e3a8a' },
    warn:  { bg: '#fffbeb', bd: '#fcd34d', fg: '#78350f' },
    error: { bg: '#fef2f2', bd: '#fca5a5', fg: '#7f1d1d' }
  }[type] || { bg: '#eff6ff', bd: '#93c5fd', fg: '#1e3a8a' };

  let host = document.getElementById('app-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'app-toast-host';
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;max-width:min(420px,calc(100vw - 32px));';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.style.cssText = `background:${colors.bg};border:1px solid ${colors.bd};color:${colors.fg};padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.45;box-shadow:0 4px 14px rgba(0,0,0,.12);cursor:pointer;`;
  el.textContent = message;
  const close = () => el.remove();
  el.addEventListener('click', close);
  host.appendChild(el);
  setTimeout(close, duration);
}
