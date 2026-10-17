
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const root = byId('updatePopup');
  if (!root || !window.witi) return;
  const dialog = root.querySelector('[role="dialog"]');
  const action = byId('updatePopupInstall');
  const later = byId('updatePopupLater');
  const closeButton = byId('updatePopupClose');
  const notesButton = byId('updatePopupShowNotes');
  const notesBox = byId('updatePopupNotesBox');
  const progressBox = byId('updatePopupProgressBox');
  const progress = byId('updatePopupProgress');
  const errorBox = byId('updatePopupError');
  const postponedThisSession = new Set();
  let current = null;
  let lastFocused = null;
  let busy = false;
  let isOpen = false;

  function isBlockedByLive() {

    return Boolean(byId('liveLock')?.checked);
  }
  function closeForNow() {
    if (current?.version) postponedThisSession.add(current.version);
    root.hidden = true;
    isOpen = false;
    document.body.classList.remove('witi-update-open');
    if (lastFocused && document.contains(lastFocused) && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }
  function show() {
    if (isOpen || busy || !current || current.status !== 'available' || !/^\d+\.\d+\.\d+$/.test(current.version || '') || postponedThisSession.has(current.version) || isBlockedByLive()) return;
    lastFocused = document.activeElement;
    byId('updatePopupCurrent').textContent = 'Versión ' + (byId('version')?.textContent.match(/\d+\.\d+\.\d+/)?.[0] || 'instalada');
    byId('updatePopupVersion').textContent = 'Versión ' + current.version;
    byId('updatePopupDescription').textContent = 'Hay una nueva versión de WITI BOT lista para descargar e instalar.';
    notesBox.hidden = true;
    errorBox.hidden = true;
    notesButton.textContent = 'Ver novedades';
    root.hidden = false;
    isOpen = true;
    dialog.focus();
  }
  function describeNotes(u) {
    const raw = typeof u?.notes === 'string' ? u.notes : Array.isArray(u?.notes) ? u.notes.map(v => String(v.note || '')).join('\n') : '';
    byId('updatePopupNotes').textContent = raw.slice(0, 12000) || 'Actualización de rendimiento, estabilidad y seguridad.';
  }
  function render(u) {
    if (!u || typeof u.status !== 'string') return;
    current = u;
    describeNotes(u);
    const pct = Number.isFinite(Number(u.percent)) ? Math.max(0, Math.min(100, Number(u.percent))) : 0;
    if (u.version) byId('updatePopupVersion').textContent = 'Versión ' + u.version;
    if (u.status === 'downloading') {
      progressBox.hidden = false;
      progress.value = pct;
      byId('updatePopupPercent').textContent = Math.round(pct) + ' %';
      byId('updatePopupProgressLabel').textContent = 'Descargando actualización…';
      action.textContent = 'Descargando…';
      action.disabled = true;
    } else if (u.status === 'downloaded') {
      progressBox.hidden = false;
      progress.value = 100;
      byId('updatePopupPercent').textContent = '100 %';
      byId('updatePopupProgressLabel').textContent = 'Descarga completada y verificada';
      action.textContent = 'Instalar y reiniciar →';
      action.disabled = busy;
    } else {
      progressBox.hidden = true;
      action.textContent = 'Actualizar ahora →';
      action.disabled = busy;
    }
    if (u.status === 'available') show();
  }
  function trapFocus(event) {
    if (!isOpen || event.key !== 'Tab') return;
    const items = [...dialog.querySelectorAll('button:not([disabled]):not([hidden])')].filter(el => el.getClientRects().length || el === document.activeElement);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}
  }
  document.addEventListener('keydown', e => {
    if (!isOpen) return;
    if (e.key === 'Escape' && !busy) {e.preventDefault();closeForNow();}
    else trapFocus(e);
  });
  later.addEventListener('click', closeForNow);
  closeButton.addEventListener('click', closeForNow);
  notesButton.addEventListener('click', () => {
    notesBox.hidden = !notesBox.hidden;
    notesButton.textContent = notesBox.hidden ? 'Ver novedades' : 'Ocultar novedades';
  });
  action.addEventListener('click', async () => {
    if (busy || !current || !['available', 'downloaded'].includes(current.status)) return;
    if (isBlockedByLive()) {errorBox.hidden = false;errorBox.textContent = 'Termina tu directo antes de instalar una actualización.';return;}
    busy = true;
    errorBox.hidden = true;
    action.disabled = true;
    try {
      if (current.status === 'available') await window.witi.call('update-download');

      await window.witi.call('update-install');
    } catch (e) {
      errorBox.textContent = e?.message || 'No se pudo completar la actualización.';
      errorBox.hidden = false;
    } finally {
      busy = false;
      action.disabled = false;
      if (current?.status === 'downloaded') action.textContent = 'Instalar y reiniciar →';
      else action.textContent = 'Volver a intentar →';
    }
  });
  byId('liveLock')?.addEventListener('change', () => { if (isBlockedByLive()) { if (isOpen) closeForNow(); } else window.setTimeout(() => {if (!isBlockedByLive()) show();}, 400); });
  window.witi.on('update', render);

  window.witi.call('snapshot').then(s => {
    if (s?.update) render(s.update);
  }).catch(() => {});
})();
