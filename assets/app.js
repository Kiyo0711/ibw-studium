(() => {
'use strict';

/* ───────── Helfer ───────── */
const KEY = 'ibw-studium-v1';
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const monday = d => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const fmt = (d, o) => new Intl.DateTimeFormat('de-DE', o).format(d);
const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const today = () => startOfDay(new Date());
const daysUntil = s => Math.round((parseYmd(s) - today()) / 864e5);
const narrow = window.matchMedia('(max-width: 760px)');
const HUES = [226, 160, 32, 338, 272, 192, 96, 8];

const ICON = {
  heute: '<path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>',
  kalender: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  todos: '<path d="m4 7 2 2 3.5-4M4 16l2 2 3.5-4M13 7h7M13 16h7"/>',
  klausuren: '<path d="M5 20V5a1 1 0 0 1 1-1h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM14 4v5h5M9 13h6M9 17h4"/>',
  module: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5" transform="scale(.92) translate(1 0)"/>',
  lernzettel: '<path d="M6 3h12a1 1 0 0 1 1 1v13l-4 4H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM15 21v-4h4M9 8h6M9 12h6"/>',
  einstellungen: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  mehr: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

const NAV = [
  ['heute', 'Heute'], ['kalender', 'Kalender'], ['todos', 'To-dos'], ['klausuren', 'Klausuren'],
  ['module', 'Module & Noten'], ['lernzettel', 'Lernzettel'], ['einstellungen', 'Einstellungen']
];

/* ───────── Daten ───────── */
const defaults = () => ({
  v: 1,
  settings: { sem: 1, theme: 'auto', focus: '', name: '' },
  mods: {}, custom: [], todos: [], exams: [], notes: [], events: [],
  links: [
    { label: 'Canvas', url: 'https://aalen.instructure.com' },
    { label: 'Stundenplan (sPlan)', url: 'https://vorlesungen.htw-aalen.de/splan/' },
    { label: 'Hochschule Aalen', url: 'https://www.hs-aalen.de' }
  ],
  ics: '', lastBackup: null
});

let state = defaults();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) { const s = JSON.parse(raw); state = { ...defaults(), ...s, settings: { ...defaults().settings, ...(s.settings || {}) } }; }
} catch (e) { /* Speicher nicht lesbar: mit leerem Stand starten */ }

let saveTimer = null, storageOk = true;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageOk = true; }
    catch (e) { if (storageOk) toast('Speichern nicht möglich. Der Browser-Speicher ist voll oder gesperrt.'); storageOk = false; }
  }, 150);
}

const ui = { calView: 'week', calCursor: today(), todoFilter: 'sem', showDone: false, noteMode: null, search: '' };

function allModules() {
  const base = window.CURRICULUM.concat(state.custom);
  const perSem = {};
  return base.map(m => {
    const o = state.mods[m.id] || {};
    const i = perSem[m.sem] = (perSem[m.sem] ?? -1) + 1;
    let name = o.name || m.name;
    if (!o.name && m.type === 'schwerpunkt' && state.settings.focus) {
      const f = window.FOCI.find(f => f.id === state.settings.focus);
      if (f) name = `Schwerpunkt: ${f.name}`;
    }
    return { ...m, name, cp: o.cp ?? m.cp, prof: o.prof || '', info: o.info || '', status: o.status || 'offen', grade: o.grade ?? '', hue: HUES[i % HUES.length], custom: state.custom.includes(m) };
  });
}
const modOf = id => allModules().find(m => m.id === id) || null;
const semMods = sem => allModules().filter(m => m.sem === sem);
const setMod = (id, patch) => { state.mods[id] = { ...(state.mods[id] || {}), ...patch }; save(); };
const gradeNum = g => { const n = parseFloat(String(g).replace(',', '.')); return isFinite(n) ? n : null; };

function stats(mods = allModules()) {
  let cpDone = 0, cpAll = 0, w = 0, wcp = 0;
  for (const m of mods) {
    cpAll += m.cp;
    if (m.status === 'bestanden') cpDone += m.cp;
    const g = gradeNum(m.grade);
    if (g !== null && g >= 1 && g <= 4) { w += g * m.cp; wcp += m.cp; }
  }
  return { cpDone, cpAll, avg: wcp ? w / wcp : null };
}

function modOptions(sel, withNone = true) {
  const mods = allModules(), cur = state.settings.sem;
  const sems = [cur, ...[1, 2, 3, 4, 5, 6, 7].filter(s => s !== cur)];
  return (withNone ? `<option value="">Kein Fach</option>` : '') + sems.map(s =>
    `<optgroup label="${s}. Semester">${mods.filter(m => m.sem === s).map(m => `<option value="${m.id}"${m.id === sel ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</optgroup>`).join('');
}
const chip = m => m ? `<span class="chip" style="--h:${m.hue}">${esc(m.name)}</span>` : '';

/* ───────── Stundenplan (iCal) ───────── */
let lectures = [];
const lectureMeta = { state: 'loading', updated: null };

function icsDate(v) {
  const m = /^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?/.exec(v.trim());
  if (!m) return null;
  const [, y, mo, d, H = 0, M = 0, , z] = m;
  return z ? new Date(Date.UTC(+y, mo - 1, +d, +H, +M)) : new Date(+y, mo - 1, +d, +H, +M);
}
const icsText = v => v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');

function parseICS(text) {
  const lines = text.replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  const out = []; let cur = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { cur = { ex: [] }; continue; }
    if (line === 'END:VEVENT') { if (cur && cur.start) out.push(cur); cur = null; continue; }
    if (!cur) continue;
    const i = line.indexOf(':'); if (i < 0) continue;
    const name = line.slice(0, i).split(';')[0].toUpperCase(), val = line.slice(i + 1);
    if (name === 'SUMMARY') cur.title = icsText(val);
    else if (name === 'LOCATION') cur.location = icsText(val);
    else if (name === 'DESCRIPTION') cur.desc = icsText(val);
    else if (name === 'URL') cur.url = val.trim();
    else if (name === 'UID') cur.uid = val.trim();
    else if (name === 'DTSTART') { cur.start = icsDate(val); cur.allDay = /^\d{8}$/.test(val.trim()); }
    else if (name === 'DTEND') cur.end = icsDate(val);
    else if (name === 'RRULE') cur.rrule = val;
    else if (name === 'EXDATE') val.split(',').forEach(x => { const d = icsDate(x); if (d) cur.ex.push(+d); });
  }
  const res = [];
  for (const e of out) {
    if (!e.end) e.end = new Date(+e.start + (e.allDay ? 864e5 : 36e5));
    e.title = e.title || 'Termin';
    if (!e.rrule) { res.push(e); continue; }
    const r = Object.fromEntries(e.rrule.split(';').map(p => p.split('=')));
    const step = (r.FREQ === 'DAILY' ? 1 : r.FREQ === 'WEEKLY' ? 7 : 0) * (+r.INTERVAL || 1);
    if (!step) { res.push(e); continue; }
    const until = r.UNTIL ? icsDate(r.UNTIL) : null, max = Math.min(+r.COUNT || 200, 200), dur = e.end - e.start;
    for (let k = 0, s = new Date(e.start); k < max && (!until || s <= until); k++, s = addDays(s, step)) {
      if (!e.ex.includes(+s)) res.push({ ...e, start: new Date(s), end: new Date(+s + dur), uid: `${e.uid}-${k}` });
    }
  }
  return res;
}

async function loadLectures() {
  const texts = [];
  const R = window.REPO;
  const bases = [];
  if (R && location.protocol !== 'file:') bases.push(`https://raw.githubusercontent.com/${R.owner}/${R.name}/${R.branch}/data/`);
  bases.push('data/');
  for (const base of bases) {
    try {
      const r = await fetch(base + 'stundenplan.json', { cache: 'no-store' });
      if (!r.ok) continue;
      const meta = await r.json();
      for (const f of meta.files || []) {
        const t = await fetch(base + f, { cache: 'no-store' });
        if (t.ok) texts.push(await t.text());
      }
      lectureMeta.updated = meta.updated || null;
      if (texts.length) break;
    } catch (e) { /* nächste Quelle versuchen */ }
  }
  if (state.ics) texts.push(state.ics);
  const seen = new Set();
  lectures = texts.flatMap(parseICS).filter(e => { const k = `${e.uid || e.title}|${+e.start}`; if (seen.has(k)) return false; seen.add(k); return true; });
  lectureMeta.state = lectures.length ? 'ok' : 'empty';
  matchCache.clear();
  render();
}

const cleanTitle = t => t.replace(/\s*\(\d[\d-]*\)\s*$/, '').trim();
const matchCache = new Map();
function matchModule(title) {
  const key = state.settings.sem + '|' + title;
  if (matchCache.has(key)) return matchCache.get(key);
  const t = title.toLowerCase(), clean = cleanTitle(t), sem = state.settings.sem, mods = allModules();
  const ordered = [...mods.filter(m => m.sem === sem), ...mods.filter(m => m.sem !== sem)];
  const hit = ordered.find(m => m.name.toLowerCase() === clean)
    || ordered.find(m => (m.match || []).some(k => t.includes(k)))
    || ordered.find(m => m.name.length > 5 && t.includes(m.name.toLowerCase())) || null;
  matchCache.set(key, hit);
  return hit;
}
const hashHue = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

/* Alle Termine in einem Zeitraum: Vorlesungen, eigene Termine, Klausuren, To-do-Fristen */
let evIndex = new Map();
function getEvents(from, to) {
  const out = [];
  lectures.forEach((e, i) => {
    if (e.end <= from || e.start >= to) return;
    const m = matchModule(e.title);
    out.push({ id: 'L' + i, kind: 'lecture', title: cleanTitle(e.title), start: e.start, end: e.end, allDay: e.allDay, location: e.location, url: e.url, desc: e.desc, mod: m, hue: m ? m.hue : hashHue(e.title) });
  });
  for (const e of state.events) {
    const start = new Date(`${e.date}T${e.start || '00:00'}`), end = new Date(`${e.date}T${e.end || e.start || '23:59'}`);
    if (end < from || start >= to) continue;
    const m = modOf(e.module);
    out.push({ id: 'E' + e.id, kind: 'own', title: e.title, start, end: end > start ? end : new Date(+start + 36e5), allDay: !e.start, location: e.location, mod: m, hue: m ? m.hue : 215, ref: e });
  }
  for (const x of state.exams) {
    if (!x.date) continue;
    const start = new Date(`${x.date}T${x.time || '00:00'}`), end = new Date(+start + (+x.duration || 90) * 6e4);
    if (end < from || start >= to) continue;
    const m = modOf(x.module);
    out.push({ id: 'X' + x.id, kind: 'exam', title: `${x.kind || 'Klausur'}: ${m ? m.name : (x.title || 'Prüfung')}`, start, end, allDay: !x.time, location: x.room, mod: m, hue: 0, ref: x });
  }
  for (const t of state.todos) {
    if (!t.due || t.done) continue;
    const start = parseYmd(t.due);
    if (start < from || start >= to) continue;
    const m = modOf(t.module);
    out.push({ id: 'T' + t.id, kind: 'todo', title: t.text, start, end: addDays(start, 1), allDay: true, mod: m, hue: m ? m.hue : 215, ref: t });
  }
  out.sort((a, b) => a.start - b.start);
  out.forEach(e => evIndex.set(e.id, e));
  return out;
}

/* ───────── Markdown für Lernzettel ───────── */
function md(src) {
  const inline = s => s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out = []; let list = null, para = [], code = null;
  const flushP = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const flushL = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const open = t => { flushP(); if (list !== t) { flushL(); out.push(`<${t}>`); list = t; } };
  for (const line of esc(src).split('\n')) {
    if (code !== null) { if (/^```/.test(line)) { out.push(`<pre>${code.join('\n')}</pre>`); code = null; } else code.push(line); continue; }
    let m;
    if (/^```/.test(line)) { flushP(); flushL(); code = []; }
    else if ((m = /^(#{1,3})\s+(.*)/.exec(line))) { flushP(); flushL(); out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`); }
    else if ((m = /^[-*]\s+\[( |x|X)\]\s?(.*)/.exec(line))) { open('ul'); out.push(`<li class="task${m[1] !== ' ' ? ' done' : ''}"><span class="box" aria-hidden="true"></span>${inline(m[2])}</li>`); }
    else if ((m = /^[-*]\s+(.*)/.exec(line))) { open('ul'); out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = /^\d+[.)]\s+(.*)/.exec(line))) { open('ol'); out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = /^&gt;\s?(.*)/.exec(line))) { flushP(); flushL(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); }
    else if (/^-{3,}\s*$/.test(line)) { flushP(); flushL(); out.push('<hr>'); }
    else if ((m = /^(.+?)\s*::\s*(.+)$/.exec(line))) { flushP(); flushL(); out.push(`<div class="qa"><span>${inline(m[1])}</span><span>${inline(m[2])}</span></div>`); }
    else if (!line.trim()) { flushP(); flushL(); }
    else { flushL(); para.push(line); }
  }
  if (code !== null) out.push(`<pre>${code.join('\n')}</pre>`);
  flushP(); flushL();
  return out.join('\n');
}
const cardsOf = body => body.split('\n').map(l => /^(.+?)\s*::\s*(.+)$/.exec(l)).filter(Boolean).map(m => ({ q: m[1].replace(/^[-*]\s+/, ''), a: m[2] }));

/* ───────── Oberfläche: Rahmen ───────── */
const main = $('#main'), dlg = $('#dlg');
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600);
}
const route = () => (location.hash.replace(/^#\/?/, '') || 'heute').split('/').map(decodeURIComponent);
const go = p => { location.hash = '#/' + p; };

function applyTheme() {
  const t = state.settings.theme;
  if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = t;
}

function renderChrome() {
  const [view] = route(), sem = state.settings.sem;
  $('#nav').innerHTML = NAV.map(([id, label]) => `<a href="#/${id}"${id === view ? ' aria-current="page"' : ''}>${icon(id)}<span>${label}</span></a>`).join('');
  const tabs = [['heute', 'Heute'], ['kalender', 'Kalender'], ['todos', 'To-dos'], ['lernzettel', 'Lernzettel']];
  const more = ['klausuren', 'module', 'einstellungen'].includes(view);
  $('#tabbar').innerHTML = tabs.map(([id, label]) => `<a href="#/${id}"${id === view ? ' aria-current="page"' : ''}>${icon(id)}<span>${label}</span></a>`).join('')
    + `<button type="button" data-act="more"${more ? ' aria-current="page"' : ''}>${icon('mehr')}<span>Mehr</span></button>`;
  const st = stats();
  $('#sideFoot').innerHTML = `<div class="foot-cp"><div class="bar"><i style="width:${(st.cpDone / st.cpAll * 100).toFixed(1)}%"></i></div><span>${st.cpDone} von ${st.cpAll} CP</span></div>`;
  $('#rail').innerHTML = `<span class="rail-label">Semester</span><div class="rail-track">` + [1, 2, 3, 4, 5, 6, 7].map(s => {
    const ms = semMods(s), done = ms.length && ms.every(m => m.status === 'bestanden');
    return `<button type="button" role="tab" class="stop${done ? ' done' : ''}" aria-selected="${s === sem}" aria-label="${s}. Semester${done ? ', abgeschlossen' : ''}" data-act="sem" data-sem="${s}">${s}</button>`;
  }).join('') + `</div>`;
}

function render() {
  renderChrome();
  const [view, a, b] = route();
  evIndex = new Map();
  const fn = views[view] || views.heute;
  main.innerHTML = fn(a, b);
  document.title = `${(NAV.find(n => n[0] === view) || NAV[0])[1]} – IBW Studium`;
}

/* ───────── Dialoge ───────── */
function field(f) {
  const id = 'f_' + f.name, v = f.value ?? '';
  let ctl;
  if (f.type === 'select') ctl = `<select id="${id}" name="${f.name}">${f.html || f.options.map(([val, l]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (f.type === 'textarea') ctl = `<textarea id="${id}" name="${f.name}" rows="3">${esc(v)}</textarea>`;
  else if (f.type === 'checkbox') return `<label class="check-row"><input type="checkbox" name="${f.name}"${v ? ' checked' : ''}> ${esc(f.label)}</label>`;
  else ctl = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(v)}"${f.required ? ' required' : ''}${f.placeholder ? ` placeholder="${esc(f.placeholder)}"` : ''}${f.attrs || ''}>`;
  return `<div class="fld${f.half ? ' half' : ''}"><label for="${id}">${esc(f.label)}</label>${ctl}</div>`;
}
function openForm({ title, fields, submit = 'Speichern', onSave, onDelete, extra = '' }) {
  dlg.innerHTML = `<form class="form"><h2>${esc(title)}</h2><div class="flds">${fields.map(field).join('')}</div>${extra}
    <div class="form-actions">${onDelete ? `<button type="button" class="btn danger" data-del>Löschen</button>` : ''}<span class="grow"></span>
    <button type="button" class="btn ghost" data-cancel>Abbrechen</button><button class="btn primary">${esc(submit)}</button></div></form>`;
  const form = $('form', dlg);
  form.onsubmit = e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    fields.filter(f => f.type === 'checkbox').forEach(f => data[f.name] = form.elements[f.name].checked);
    onSave(data); dlg.close(); render();
  };
  $('[data-cancel]', dlg).onclick = () => dlg.close();
  if (onDelete) $('[data-del]', dlg).onclick = () => { if (confirm('Wirklich löschen?')) { onDelete(); dlg.close(); render(); } };
  dlg.showModal();
}
function openInfo(html) {
  dlg.innerHTML = `<div class="form">${html}<div class="form-actions"><span class="grow"></span><button type="button" class="btn primary" data-cancel>Schließen</button></div></div>`;
  $('[data-cancel]', dlg).onclick = () => dlg.close();
  dlg.showModal();
}
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

function todoForm(t = {}) {
  openForm({
    title: t.id ? 'To-do bearbeiten' : 'Neues To-do',
    fields: [
      { name: 'text', label: 'Was ist zu tun?', value: t.text, required: true },
      { name: 'module', label: 'Fach', type: 'select', html: modOptions(t.module) },
      { name: 'due', label: 'Fällig am', type: 'date', value: t.due, half: true },
      { name: 'prio', label: 'Priorität', type: 'select', value: t.prio || 'normal', options: [['normal', 'Normal'], ['hoch', 'Hoch']], half: true }
    ],
    onSave: d => { if (!d.text.trim()) return; if (t.id) Object.assign(t, d); else state.todos.push({ id: uid(), done: false, created: Date.now(), ...d }); save(); },
    onDelete: t.id ? () => { state.todos = state.todos.filter(x => x !== t); save(); } : null
  });
}
function examForm(x = {}) {
  openForm({
    title: x.id ? 'Prüfung bearbeiten' : 'Prüfung eintragen',
    fields: [
      { name: 'module', label: 'Fach', type: 'select', html: modOptions(x.module, false) },
      { name: 'kind', label: 'Art', type: 'select', value: x.kind || 'Klausur', options: ['Klausur', 'Hausarbeit', 'Präsentation', 'Mündliche Prüfung', 'Projektarbeit', 'Sonstiges'].map(k => [k, k]), half: true },
      { name: 'date', label: 'Datum', type: 'date', value: x.date, half: true },
      { name: 'time', label: 'Beginn', type: 'time', value: x.time, half: true },
      { name: 'duration', label: 'Dauer in Minuten', type: 'number', value: x.duration || 90, half: true, attrs: ' min="0" step="5"' },
      { name: 'room', label: 'Raum', value: x.room, half: true },
      { name: 'aids', label: 'Erlaubte Hilfsmittel', value: x.aids, half: true, placeholder: 'z. B. Taschenrechner' },
      { name: 'notes', label: 'Notizen', type: 'textarea', value: x.notes, placeholder: 'Klausurrelevante Kapitel, Tipps vom Prof …' },
      { name: 'registered', label: 'Zur Prüfung angemeldet', type: 'checkbox', value: x.registered }
    ],
    onSave: d => { if (x.id) Object.assign(x, d); else state.exams.push({ id: uid(), ...d }); save(); },
    onDelete: x.id ? () => { state.exams = state.exams.filter(e => e !== x); save(); } : null
  });
}
function eventForm(e = {}) {
  openForm({
    title: e.id ? 'Termin bearbeiten' : 'Neuer Termin',
    fields: [
      { name: 'title', label: 'Titel', value: e.title, required: true, placeholder: 'z. B. Lerngruppe Mathe' },
      { name: 'date', label: 'Datum', type: 'date', value: e.date || ymd(ui.calCursor), required: true },
      { name: 'start', label: 'Von', type: 'time', value: e.start, half: true },
      { name: 'end', label: 'Bis', type: 'time', value: e.end, half: true },
      { name: 'location', label: 'Ort', value: e.location, half: true },
      { name: 'module', label: 'Fach', type: 'select', html: modOptions(e.module), half: true }
    ],
    onSave: d => { if (!d.title.trim() || !d.date) return; if (e.id) Object.assign(e, d); else state.events.push({ id: uid(), ...d }); save(); },
    onDelete: e.id ? () => { state.events = state.events.filter(x => x !== e); save(); } : null
  });
}
function moduleForm(m) {
  const isNew = !m;
  m = m || { sem: state.settings.sem, cp: 5, name: '', type: 'wahl' };
  openForm({
    title: isNew ? 'Eigenes Modul hinzufügen' : 'Modul bearbeiten',
    fields: [
      { name: 'name', label: 'Name', value: m.name, required: true },
      { name: 'cp', label: 'Credit Points', type: 'number', value: m.cp, half: true, attrs: ' min="0" max="60"' },
      { name: 'prof', label: 'Dozent:in', value: m.prof, half: true },
      { name: 'info', label: 'Notizen zum Modul', type: 'textarea', value: m.info, placeholder: 'Prüfungsform, Literatur, Canvas-Kurs …' }
    ],
    onSave: d => {
      if (!d.name.trim()) return;
      let id = m.id;
      if (isNew) { id = 'c-' + uid(); state.custom.push({ id, sem: m.sem, cp: +d.cp || 0, type: 'wahl', name: d.name.trim(), match: [] }); }
      setMod(id, { name: d.name.trim(), cp: +d.cp || 0, prof: d.prof, info: d.info });
    },
    onDelete: m.custom ? () => { state.custom = state.custom.filter(c => c.id !== m.id); delete state.mods[m.id]; save(); } : null
  });
}

function eventInfo(e) {
  if (e.kind === 'own') return eventForm(e.ref);
  if (e.kind === 'exam') return examForm(e.ref);
  if (e.kind === 'todo') return todoForm(e.ref);
  const when = `${fmt(e.start, { weekday: 'long', day: 'numeric', month: 'long' })}, ${hm(e.start)} bis ${hm(e.end)} Uhr`;
  openInfo(`<h2>${esc(e.title)}</h2>${e.mod ? `<p>${chip(e.mod)}</p>` : ''}
    <dl class="facts"><dt>Wann</dt><dd>${when}</dd>${e.location ? `<dt>Wo</dt><dd>${esc(e.location)}</dd>` : ''}${e.desc ? `<dt>Info</dt><dd>${esc(e.desc)}</dd>` : ''}</dl>
    <p class="row-actions">${e.url ? `<a class="btn" href="${esc(e.url)}" target="_blank" rel="noopener">In Canvas öffnen</a>` : ''}${e.mod ? `<a class="btn" href="#/lernzettel/${e.mod.id}" data-close>Lernzettel zum Fach</a>` : ''}</p>`);
}

/* ───────── Bausteine ───────── */
function dueLabel(s) {
  const d = daysUntil(s);
  if (d < -1) return [`seit ${-d} Tagen überfällig`, 'late'];
  if (d === -1) return ['seit gestern überfällig', 'late'];
  if (d === 0) return ['heute', 'soon'];
  if (d === 1) return ['morgen', 'soon'];
  if (d < 7) return [fmt(parseYmd(s), { weekday: 'long' }), ''];
  return [fmt(parseYmd(s), { day: 'numeric', month: 'short' }), ''];
}
function todoRow(t) {
  const m = modOf(t.module), due = t.due ? dueLabel(t.due) : null;
  return `<li class="todo${t.done ? ' done' : ''}">
    <button type="button" class="tick" role="checkbox" aria-checked="${!!t.done}" aria-label="${esc(t.text)} erledigt" data-act="todo-toggle" data-id="${t.id}"></button>
    <button type="button" class="todo-body" data-act="todo-edit" data-id="${t.id}">
      <span class="todo-text">${t.prio === 'hoch' && !t.done ? '<b class="prio" title="Hohe Priorität">!</b> ' : ''}${esc(t.text)}</span>
      <span class="todo-meta">${chip(m)}${due && !t.done ? `<span class="due ${due[1]}">${due[0]}</span>` : ''}</span>
    </button></li>`;
}
function countdown(dateStr) {
  const d = daysUntil(dateStr);
  if (d < 0) return 'vorbei';
  if (d === 0) return 'heute';
  if (d === 1) return 'morgen';
  return `in ${d} Tagen`;
}
const sortTodos = (a, b) => (a.due || '9999').localeCompare(b.due || '9999') || (b.prio === 'hoch') - (a.prio === 'hoch') || a.created - b.created;
const empty = (title, text, action = '') => `<div class="empty"><h3>${title}</h3><p>${text}</p>${action}</div>`;

function agendaRow(e, now = new Date()) {
  const live = !e.allDay && e.start <= now && e.end > now, past = e.end <= now;
  return `<li><button type="button" class="slot${live ? ' live' : ''}${past ? ' past' : ''} k-${e.kind}" style="--h:${e.hue}" data-act="ev" data-id="${e.id}">
    <span class="slot-time">${e.allDay ? 'ganztägig' : `${hm(e.start)}<small>${hm(e.end)}</small>`}</span>
    <span class="slot-main"><b>${esc(e.title)}</b><span>${[live ? 'läuft gerade' : '', e.location].filter(Boolean).map(esc).join(', ')}</span></span>
  </button></li>`;
}

/* ───────── Ansichten ───────── */
const views = {};

views.heute = () => {
  const now = new Date(), t0 = today(), sem = state.settings.sem;
  const h = now.getHours(), hello = h < 5 ? 'Gute Nacht' : h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  const upcoming = getEvents(now, addDays(t0, 22)).filter(e => e.kind !== 'todo');
  const byDay = new Map();
  for (const e of getEvents(t0, addDays(t0, 22)).filter(e => e.kind !== 'todo')) {
    const k = ymd(e.start); if (!byDay.has(k)) byDay.set(k, []); byDay.get(k).push(e);
  }
  const todayEv = byDay.get(ymd(t0)) || [];
  const nextKey = upcoming.length ? ymd(upcoming[0].start < t0 ? t0 : upcoming[0].start) : null;
  let planTitle = 'Heute', planList = todayEv, planNote = '';
  if (nextKey && nextKey !== ymd(t0)) {
    const d = daysUntil(nextKey);
    planTitle = d === 1 ? 'Morgen' : fmt(parseYmd(nextKey), { weekday: 'long', day: 'numeric', month: 'long' });
    planList = byDay.get(nextKey) || [];
    planNote = todayEv.length ? 'Für heute bist du durch.' : 'Heute steht nichts im Stundenplan.';
  }
  const plan = planList.length
    ? `${planNote ? `<p class="muted">${planNote}</p>` : ''}<ol class="agenda">${planList.map(e => agendaRow(e, now)).join('')}</ol>`
    : lectureMeta.state === 'loading' ? `<p class="muted">Stundenplan wird geladen …</p>`
      : empty('Keine Termine in den nächsten drei Wochen', lectureMeta.state === 'empty' ? 'Der Stundenplan ist noch nicht geladen. In den Einstellungen siehst du, wie er verbunden wird.' : 'Vorlesungsfreie Zeit. Eigene Termine trägst du im Kalender ein.', `<a class="btn" href="#/${lectureMeta.state === 'empty' ? 'einstellungen' : 'kalender'}">${lectureMeta.state === 'empty' ? 'Zu den Einstellungen' : 'Zum Kalender'}</a>`);

  const open = state.todos.filter(t => !t.done).sort(sortTodos);
  const exams = state.exams.filter(x => x.date && daysUntil(x.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const st = stats(), stSem = stats(semMods(sem));

  return `<header class="page-head hello">
      <h1>${hello}${state.settings.name ? ', ' + esc(state.settings.name) : ''}</h1>
      <p>${fmt(now, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${sem}. Semester</p>
    </header>
    <div class="cols">
      <section class="panel plan">
        <div class="panel-head"><h2>${planTitle}</h2><a href="#/kalender">Ganze Woche</a></div>
        ${plan}
      </section>
      <div class="stack">
        <section class="panel">
          <div class="panel-head"><h2>To-dos</h2><a href="#/todos">Alle ${open.length ? `(${open.length})` : ''}</a></div>
          <form class="quick" data-sub="todo-quick"><input name="text" aria-label="Neues To-do" placeholder="Neues To-do, Enter drücken" autocomplete="off"><button class="btn primary" aria-label="To-do hinzufügen">+</button></form>
          ${open.length ? `<ul class="todos">${open.slice(0, 6).map(todoRow).join('')}</ul>` : `<p class="muted">Alles erledigt.</p>`}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Nächste Prüfungen</h2><a href="#/klausuren">Klausurenplan</a></div>
          ${exams.length ? `<ul class="exam-mini">${exams.map(x => { const m = modOf(x.module); return `<li><button type="button" data-act="exam-edit" data-id="${x.id}"><span class="cd">${countdown(x.date)}</span><b>${esc(m ? m.name : 'Prüfung')}</b><span>${fmt(parseYmd(x.date), { weekday: 'short', day: 'numeric', month: 'short' })}${x.time ? ', ' + x.time + ' Uhr' : ''}${x.room ? ', ' + esc(x.room) : ''}</span></button></li>`; }).join('')}</ul>`
      : `<p class="muted">Noch keine Prüfung eingetragen. Sobald der Prüfungsplan da ist, trag die Termine ein.</p><button type="button" class="btn" data-act="exam-new">Prüfung eintragen</button>`}
        </section>
        <section class="panel">
          <div class="panel-head"><h2>Studienfortschritt</h2><a href="#/module">Module & Noten</a></div>
          <div class="segbar" aria-hidden="true">${[1, 2, 3, 4, 5, 6, 7].map(s => { const x = stats(semMods(s)); return `<i title="${s}. Semester"><b style="width:${x.cpAll ? x.cpDone / x.cpAll * 100 : 0}%"></b></i>`; }).join('')}</div>
          <p class="progress-line"><strong>${st.cpDone} von ${st.cpAll} CP</strong> bestanden, davon ${stSem.cpDone} von ${stSem.cpAll} im ${sem}. Semester.${st.avg ? ` Notenschnitt bisher <strong>${st.avg.toFixed(2).replace('.', ',')}</strong>.` : ''}</p>
        </section>
        ${state.links.length ? `<section class="panel"><div class="panel-head"><h2>Schnellzugriff</h2><a href="#/einstellungen">Anpassen</a></div><p class="links">${state.links.map(l => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p></section>` : ''}
      </div>
    </div>`;
};

/* Kalender */
function layoutDay(evs) {
  const res = [], cols = []; let group = [], gEnd = 0;
  const flush = () => { group.forEach(g => g.cols = cols.length); cols.length = 0; group = []; };
  for (const e of evs.slice().sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (group.length && +e.start >= gEnd) { flush(); gEnd = 0; }
    let i = cols.findIndex(end => end <= +e.start);
    if (i < 0) { i = cols.length; cols.push(+e.end); } else cols[i] = +e.end;
    const item = { e, col: i, cols: 1 }; group.push(item); res.push(item); gEnd = Math.max(gEnd, +e.end);
  }
  flush();
  return res;
}

views.kalender = () => {
  const v = ui.calView, c = ui.calCursor, t0 = today();
  let body, title;
  if (v === 'week') {
    const one = narrow.matches;
    let days;
    if (one) days = [c];
    else {
      const mo = monday(c); days = [0, 1, 2, 3, 4].map(i => addDays(mo, i));
      const wkEnd = getEvents(addDays(mo, 5), addDays(mo, 7)).filter(e => e.kind !== 'todo');
      if (wkEnd.some(e => e.start.getDay() === 6) || wkEnd.length) days.push(addDays(mo, 5));
      if (wkEnd.some(e => e.start.getDay() === 0)) days.push(addDays(mo, 6));
    }
    const evs = getEvents(days[0], addDays(days[days.length - 1], 1));
    const timed = evs.filter(e => !e.allDay), allDay = evs.filter(e => e.allDay);
    let h0 = 8, h1 = 18;
    timed.forEach(e => { h0 = Math.min(h0, e.start.getHours()); h1 = Math.max(h1, e.end.getHours() + (e.end.getMinutes() ? 1 : 0)); });
    h1 = Math.min(24, Math.max(h1, h0 + 6));
    const H = 56, now = new Date();
    title = one ? fmt(c, { weekday: 'long', day: 'numeric', month: 'long' })
      : `${fmt(days[0], { day: 'numeric', month: days[0].getMonth() === days[days.length - 1].getMonth() ? undefined : 'short' })}${days[0].getMonth() === days[days.length - 1].getMonth() ? '.' : ''} bis ${fmt(days[days.length - 1], { day: 'numeric', month: 'long', year: 'numeric' })}`;
    body = `<div class="wk" style="--n:${days.length};--H:${H}px;--rows:${h1 - h0}">
      <div class="wk-corner"></div>
      ${days.map(d => `<div class="wk-day${+d === +t0 ? ' is-today' : ''}"><span>${fmt(d, { weekday: 'short' })}</span> <b>${d.getDate()}.</b></div>`).join('')}
      <div class="wk-corner wk-allday-label">${allDay.length ? 'Fristen' : ''}</div>
      ${days.map(d => `<div class="wk-allday">${allDay.filter(e => ymd(e.start) === ymd(d)).map(e => `<button type="button" class="pill k-${e.kind}" style="--h:${e.hue}" data-act="ev" data-id="${e.id}">${esc(e.title)}</button>`).join('')}</div>`).join('')}
      <div class="wk-hours">${Array.from({ length: h1 - h0 }, (_, i) => `<span>${pad(h0 + i)}:00</span>`).join('')}</div>
      ${days.map(d => {
        const list = layoutDay(timed.filter(e => ymd(e.start) === ymd(d)));
        const nowLine = +d === +t0 && now.getHours() >= h0 && now.getHours() < h1 ? `<i class="now" style="top:${((now.getHours() - h0) * 60 + now.getMinutes()) / 60 * H}px"></i>` : '';
        return `<div class="wk-col${+d === +t0 ? ' is-today' : ''}">${nowLine}${list.map(({ e, col, cols }) => {
          const top = ((e.start.getHours() - h0) * 60 + e.start.getMinutes()) / 60 * H, hgt = Math.max(24, (e.end - e.start) / 36e5 * H - 3);
          return `<button type="button" class="ev k-${e.kind}${hgt < 44 ? ' tight' : ''}" style="--h:${e.hue};top:${top}px;height:${hgt}px;left:calc(${col / cols * 100}% + 2px);width:calc(${100 / cols}% - 4px)" data-act="ev" data-id="${e.id}"><b>${esc(e.title)}</b><span>${hm(e.start)} bis ${hm(e.end)}${e.location ? '<br>' + esc(e.location) : ''}</span></button>`;
        }).join('')}</div>`;
      }).join('')}
    </div>${!evs.length && lectureMeta.state !== 'loading' ? `<p class="muted cal-note">${one ? 'An diesem Tag' : 'In dieser Woche'} ist nichts eingetragen.</p>` : ''}`;
  } else if (v === 'month') {
    const first = new Date(c.getFullYear(), c.getMonth(), 1), start = monday(first);
    const evs = getEvents(start, addDays(start, 42));
    title = fmt(first, { month: 'long', year: 'numeric' });
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i === 35 && d.getMonth() !== c.getMonth()) break;
      const list = evs.filter(e => ymd(e.start) === ymd(d));
      cells.push(`<div class="mcell${d.getMonth() !== c.getMonth() ? ' out' : ''}${+d === +t0 ? ' is-today' : ''}" data-act="cal-goto" data-date="${ymd(d)}" role="button" tabindex="0" aria-label="${fmt(d, { day: 'numeric', month: 'long' })}, ${list.length} Termine">
        <span class="mnum">${d.getDate()}</span>
        ${list.slice(0, 3).map(e => `<span class="mchip k-${e.kind}" style="--h:${e.hue}">${e.allDay ? '' : `<small>${hm(e.start)}</small> `}${esc(e.title)}</span>`).join('')}
        ${list.length > 3 ? `<span class="mmore">+${list.length - 3} weitere</span>` : ''}
        ${list.length ? `<span class="mdots" aria-hidden="true">${list.slice(0, 4).map(e => `<i class="k-${e.kind}" style="--h:${e.hue}"></i>`).join('')}</span>` : ''}
      </div>`);
    }
    body = `<div class="month"><div class="mhead">${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => `<span>${d}</span>`).join('')}</div><div class="mgrid">${cells.join('')}</div></div>`;
  } else {
    const evs = getEvents(c, addDays(c, 60));
    title = `Ab ${fmt(c, { day: 'numeric', month: 'long' })}`;
    const groups = new Map();
    evs.forEach(e => { const k = ymd(e.start < c ? c : e.start); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(e); });
    body = groups.size ? [...groups].map(([k, list]) => `<section class="list-day"><h3>${fmt(parseYmd(k), { weekday: 'long', day: 'numeric', month: 'long' })}${k === ymd(t0) ? ' <span class="tag">heute</span>' : ''}</h3><ol class="agenda">${list.map(e => agendaRow(e)).join('')}</ol></section>`).join('')
      : empty('Keine Termine in den nächsten 60 Tagen', 'Trag eigene Termine ein oder verbinde den Stundenplan in den Einstellungen.');
  }
  const seg = [['week', narrow.matches ? 'Tag' : 'Woche'], ['month', 'Monat'], ['list', 'Liste']];
  return `<header class="page-head row"><h1>Kalender</h1><button type="button" class="btn primary" data-act="event-new">Termin eintragen</button></header>
    <div class="cal-bar">
      <div class="cal-nav"><button type="button" class="btn icon" data-act="cal-step" data-dir="-1" aria-label="Zurück">‹</button><button type="button" class="btn" data-act="cal-today">Heute</button><button type="button" class="btn icon" data-act="cal-step" data-dir="1" aria-label="Weiter">›</button></div>
      <h2 class="cal-title">${title}</h2>
      <div class="seg" role="group" aria-label="Ansicht">${seg.map(([id, l]) => `<button type="button" aria-pressed="${v === id}" data-act="cal-view" data-view="${id}">${l}</button>`).join('')}</div>
    </div>
    ${lectureMeta.state === 'empty' ? `<p class="notice">Der Stundenplan der Hochschule ist noch nicht geladen. <a href="#/einstellungen">So verbindest du ihn</a></p>` : ''}
    ${body}`;
};

/* To-dos */
views.todos = () => {
  const f = ui.todoFilter, sem = state.settings.sem;
  const semIds = new Set(semMods(sem).map(m => m.id));
  const match = t => f === 'all' ? true : f === 'sem' ? (!t.module || semIds.has(t.module)) : t.module === f;
  const list = state.todos.filter(match), open = list.filter(t => !t.done).sort(sortTodos), done = list.filter(t => t.done);
  const groups = [['Überfällig', []], ['Heute', []], ['Diese Woche', []], ['Später', []], ['Ohne Datum', []]];
  for (const t of open) {
    const d = t.due ? daysUntil(t.due) : null;
    groups[d === null ? 4 : d < 0 ? 0 : d === 0 ? 1 : d <= 7 ? 2 : 3][1].push(t);
  }
  return `<header class="page-head"><h1>To-dos</h1></header>
    <form class="quick big" data-sub="todo-add">
      <input name="text" aria-label="Neues To-do" placeholder="Was steht an?" autocomplete="off" required>
      <select name="module" aria-label="Fach">${modOptions(f !== 'all' && f !== 'sem' ? f : '')}</select>
      <input name="due" type="date" aria-label="Fällig am">
      <button class="btn primary">Hinzufügen</button>
    </form>
    <div class="filter"><label for="todoFilter">Anzeigen</label>
      <select id="todoFilter" data-chg="todo-filter"><option value="sem"${f === 'sem' ? ' selected' : ''}>${sem}. Semester und Allgemeines</option><option value="all"${f === 'all' ? ' selected' : ''}>Alle To-dos</option>
      <optgroup label="Nur ein Fach">${semMods(sem).map(m => `<option value="${m.id}"${f === m.id ? ' selected' : ''}>${esc(m.name)}</option>`).join('')}</optgroup></select><span class="grow"></span><button type="button" class="btn small" data-act="remind">Erinnerungen aufs Handy</button></div>
    ${open.length ? groups.filter(g => g[1].length).map(([name, items]) => `<section class="todo-group${name === 'Überfällig' ? ' late' : ''}"><h2>${name} <span class="count">${items.length}</span></h2><ul class="todos">${items.map(todoRow).join('')}</ul></section>`).join('')
      : empty(list.length ? 'Alles erledigt' : 'Noch keine To-dos', 'Schreib oben auf, was ansteht: Übungsblatt, Kapitel lesen, Anmeldung zur Prüfung.')}
    ${done.length ? `<section class="todo-group"><h2><button type="button" class="linklike" data-act="toggle-done" aria-expanded="${ui.showDone}">Erledigt <span class="count">${done.length}</span> ${ui.showDone ? 'ausblenden' : 'anzeigen'}</button></h2>
      ${ui.showDone ? `<ul class="todos">${done.map(todoRow).join('')}</ul><button type="button" class="btn ghost" data-act="clear-done">Erledigte löschen</button>` : ''}</section>` : ''}`;
};

/* Klausuren */
views.klausuren = () => {
  const sem = state.settings.sem;
  const up = state.exams.filter(x => !x.date || daysUntil(x.date) >= 0).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const past = state.exams.filter(x => x.date && daysUntil(x.date) < 0).sort((a, b) => b.date.localeCompare(a.date));
  const planned = new Set(state.exams.map(x => x.module));
  const missing = semMods(sem).filter(m => !planned.has(m.id) && m.status !== 'bestanden' && m.type !== 'praxis');
  const card = x => {
    const m = modOf(x.module), d = x.date ? daysUntil(x.date) : null;
    const prep = state.todos.filter(t => t.module === x.module && !t.done).length;
    const notes = state.notes.filter(n => n.module === x.module).length;
    return `<li class="exam" style="--h:${m ? m.hue : 215}">
      <div class="exam-when"><b>${x.date ? countdown(x.date) : 'Termin offen'}</b>${x.date ? `<span>${fmt(parseYmd(x.date), { weekday: 'long', day: 'numeric', month: 'long' })}</span>` : ''}${d !== null && d <= 14 && d >= 0 ? `<span class="tag hot">Endspurt</span>` : ''}</div>
      <div class="exam-main">
        <h3>${esc(m ? m.name : 'Prüfung')}</h3>
        <p>${[x.kind || 'Klausur', x.time ? `${x.time} Uhr` : '', x.duration ? `${x.duration} Minuten` : '', x.room ? `Raum ${x.room}` : ''].filter(Boolean).map(esc).join(', ')}</p>
        ${x.aids ? `<p><span class="muted">Hilfsmittel:</span> ${esc(x.aids)}</p>` : ''}${x.notes ? `<p class="exam-notes">${esc(x.notes)}</p>` : ''}
        <p class="row-actions">
          <label class="check-row"><input type="checkbox" data-chg="exam-reg" data-id="${x.id}"${x.registered ? ' checked' : ''}> Angemeldet</label>
          ${m ? `<a class="btn small" href="#/lernzettel/${m.id}">Lernzettel (${notes})</a>` : ''}
          ${prep ? `<a class="btn small" href="#/todos">${prep === 1 ? '1 offenes To-do' : prep + ' offene To-dos'}</a>` : ''}
          <button type="button" class="btn small" data-act="exam-edit" data-id="${x.id}">Bearbeiten</button>
        </p>
      </div></li>`;
  };
  return `<header class="page-head row"><h1>Klausurenplan</h1><span class="row-actions"><button type="button" class="btn" data-act="remind">Erinnerungen aufs Handy</button><button type="button" class="btn primary" data-act="exam-new">Prüfung eintragen</button></span></header>
    ${up.length ? `<ul class="exams">${up.map(card).join('')}</ul>` : empty('Noch keine Prüfung eingetragen', 'Sobald die Hochschule den Prüfungsplan veröffentlicht, trägst du hier Datum, Raum und Hilfsmittel ein. Die Termine erscheinen dann auch im Kalender und auf der Startseite.')}
    ${missing.length ? `<section class="hint"><h2>Im ${sem}. Semester noch ohne Prüfungstermin</h2><p class="links">${missing.map(m => `<button type="button" class="chip as-btn" style="--h:${m.hue}" data-act="exam-new" data-mod="${m.id}">${esc(m.name)} eintragen</button>`).join('')}</p></section>` : ''}
    ${past.length ? `<section><h2 class="sub">Geschrieben</h2><ul class="past">${past.map(x => { const m = modOf(x.module); return `<li><button type="button" data-act="exam-edit" data-id="${x.id}"><span>${fmt(parseYmd(x.date), { day: 'numeric', month: 'short', year: 'numeric' })}</span><b>${esc(m ? m.name : 'Prüfung')}</b><span>${m && m.grade ? 'Note ' + esc(m.grade) : 'Note noch offen'}</span></button></li>`; }).join('')}</ul><p class="muted">Noten trägst du unter <a href="#/module">Module & Noten</a> ein.</p></section>` : ''}`;
};

/* Module & Noten */
views.module = () => {
  const sem = state.settings.sem, mods = semMods(sem), st = stats(), ss = stats(mods);
  const hasFocus = mods.some(m => m.type === 'schwerpunkt'), cur = state.settings.focus;
  return `<header class="page-head"><h1>${sem}. Semester</h1>${window.SEM_NOTES[sem] ? `<p>${window.SEM_NOTES[sem]}</p>` : ''}</header>
    ${hasFocus ? `<p class="${cur ? 'filter' : 'notice'}"><label for="focusPick">${cur ? 'Dein Schwerpunkt' : 'Welchen Schwerpunkt hast du gewählt?'}</label> <select id="focusPick" data-chg="focus"><option value="">Noch offen</option>${window.FOCI.map(f => `<option value="${f.id}"${f.id === cur ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select></p>` : ''}
    <ul class="mods">${mods.map(m => {
      const n = state.notes.filter(x => x.module === m.id).length, td = state.todos.filter(t => t.module === m.id && !t.done).length;
      return `<li class="mod s-${m.status}" style="--h:${m.hue}">
        <div class="mod-name"><h3>${esc(m.name)}</h3><p>${window.TYPES[m.type] || 'Modul'}, ${m.cp} CP${m.prof ? ', ' + esc(m.prof) : ''}</p>${m.info ? `<p class="mod-info">${esc(m.info)}</p>` : ''}</div>
        <div class="mod-ctl">
          <label>Status<select data-chg="mod-status" data-id="${m.id}">${[['offen', 'Offen'], ['laufend', 'Läuft'], ['bestanden', 'Bestanden']].map(([v, l]) => `<option value="${v}"${m.status === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
          <label>Note<input data-chg="mod-grade" data-id="${m.id}" value="${esc(m.grade)}" inputmode="decimal" placeholder="–" size="3" maxlength="4"></label>
        </div>
        <p class="row-actions"><a class="btn small" href="#/lernzettel/${m.id}">Lernzettel (${n})</a>${td ? `<a class="btn small" href="#/todos">${td === 1 ? '1 To-do' : td + ' To-dos'}</a>` : ''}<button type="button" class="btn small" data-act="mod-edit" data-id="${m.id}">Bearbeiten</button></p>
      </li>`;
    }).join('')}</ul>
    <p><button type="button" class="btn" data-act="mod-new">Eigenes Modul hinzufügen</button></p>
    <section class="panel overview">
      <div class="panel-head"><h2>Gesamtes Studium</h2><span>${st.cpDone} von ${st.cpAll} CP${st.avg ? `, Schnitt ${st.avg.toFixed(2).replace('.', ',')}` : ''}</span></div>
      <ul class="sem-rows">${[1, 2, 3, 4, 5, 6, 7].map(s => { const x = stats(semMods(s)); return `<li><button type="button" data-act="sem" data-sem="${s}"${s === sem ? ' aria-current="true"' : ''}><span>${s}. Semester</span><span class="bar"><i style="width:${x.cpAll ? x.cpDone / x.cpAll * 100 : 0}%"></i></span><span>${x.cpDone}/${x.cpAll} CP</span><span>${x.avg ? 'Ø ' + x.avg.toFixed(2).replace('.', ',') : ''}</span></button></li>`; }).join('')}</ul>
      <p class="muted">Der Schnitt ist nach Credit Points gewichtet und dient nur zur Orientierung. Verbindlich ist die Berechnung nach deiner Studien- und Prüfungsordnung. Dieses Semester: ${ss.cpDone} von ${ss.cpAll} CP.</p>
    </section>`;
};

/* Lernzettel */
const excerpt = b => b.replace(/[#*`>=\[\]-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 110);
const noteCard = (n, withMod) => { const m = modOf(n.module); return `<li><a class="note" style="--h:${m ? m.hue : 215}" href="#/lernzettel/${n.module}/${n.id}"><h3>${esc(n.title || 'Ohne Titel')}</h3><p>${esc(excerpt(n.body)) || 'Noch leer'}</p><span>${withMod && m ? esc(m.name) + ', ' : ''}bearbeitet am ${fmt(new Date(n.updated), { day: 'numeric', month: 'short' })}</span></a></li>`; };

views.lernzettel = (modId, noteId) => {
  const sem = state.settings.sem;
  if (noteId) {
    const n = state.notes.find(x => x.id === noteId), m = modOf(modId);
    if (!n) return empty('Lernzettel nicht gefunden', 'Vielleicht wurde er gelöscht.', `<a class="btn" href="#/lernzettel">Zur Übersicht</a>`);
    const mode = ui.noteMode || (narrow.matches ? 'edit' : 'both'), cards = cardsOf(n.body).length;
    return `<nav class="crumbs no-print"><a href="#/lernzettel">Lernzettel</a> / <a href="#/lernzettel/${modId}">${esc(m ? m.name : 'Fach')}</a></nav>
      <div class="editor mode-${mode}" style="--h:${m ? m.hue : 215}">
        <input class="note-title no-print" data-inp="note-title" data-id="${n.id}" value="${esc(n.title)}" placeholder="Titel des Lernzettels" aria-label="Titel">
        <div class="editor-bar no-print">
          <div class="seg" role="group" aria-label="Ansicht">${[['edit', 'Schreiben'], ['both', 'Beides'], ['view', 'Lesen']].map(([id, l]) => `<button type="button" aria-pressed="${mode === id}" data-act="note-mode" data-mode="${id}"${id === 'both' ? ' class="wide-only"' : ''}>${l}</button>`).join('')}</div>
          <div class="fmt" role="group" aria-label="Formatierung">${[['# ', 'Überschrift'], ['**', 'Fett'], ['==', 'Markieren'], ['- ', 'Liste'], ['- [ ] ', 'Checkbox'], [' :: ', 'Karteikarte']].map(([s, l]) => `<button type="button" class="btn small" data-act="fmt" data-s="${esc(s)}">${l}</button>`).join('')}</div>
          <span class="grow"></span>
          <button type="button" class="btn small" data-act="cards" data-id="${n.id}" id="cardsBtn"${cards ? '' : ' disabled'}>Karteikarten lernen (${cards})</button>
          <button type="button" class="btn small" data-act="print">Drucken / PDF</button>
          <button type="button" class="btn small danger" data-act="note-del" data-id="${n.id}">Löschen</button>
        </div>
        <div class="editor-panes">
          <textarea class="no-print" id="noteBody" data-inp="note-body" data-id="${n.id}" spellcheck="true" aria-label="Inhalt" placeholder="Schreib los. # Überschrift, **fett**, ==markiert==, - Liste, Frage :: Antwort für Karteikarten">${esc(n.body)}</textarea>
          <article class="prose" id="notePreview"><h1 class="print-only">${esc(n.title)}</h1>${md(n.body) || '<p class="muted">Die Vorschau erscheint hier.</p>'}</article>
        </div>
      </div>`;
  }
  if (modId) {
    const m = modOf(modId);
    if (!m) return empty('Fach nicht gefunden', '', `<a class="btn" href="#/lernzettel">Zur Übersicht</a>`);
    const notes = state.notes.filter(n => n.module === modId).sort((a, b) => b.updated - a.updated);
    return `<nav class="crumbs"><a href="#/lernzettel">Lernzettel</a> / ${m.sem}. Semester</nav>
      <header class="page-head row"><h1><span class="swatch" style="--h:${m.hue}"></span>${esc(m.name)}</h1><button type="button" class="btn primary" data-act="note-new" data-mod="${m.id}">Neuer Lernzettel</button></header>
      ${notes.length ? `<ul class="notes">${notes.map(n => noteCard(n)).join('')}</ul>` : empty('Noch kein Lernzettel für dieses Fach', 'Starte mit einer Vorlage: Zusammenfassung, Formelsammlung oder Karteikarten.', `<button type="button" class="btn primary" data-act="note-new" data-mod="${m.id}">Ersten Lernzettel anlegen</button>`)}`;
  }
  const q = ui.search.trim().toLowerCase();
  const hits = q ? state.notes.filter(n => (n.title + ' ' + n.body).toLowerCase().includes(q)) : [];
  return `<header class="page-head"><h1>Lernzettel</h1><p>Fächer im ${sem}. Semester. Über die Semesterleiste oben wechselst du das Semester.</p></header>
    <div class="filter"><label for="noteSearch">Alle Lernzettel durchsuchen</label><input id="noteSearch" type="search" data-inp="note-search" value="${esc(ui.search)}" placeholder="Begriff eingeben"></div>
    <div id="noteHits">${q ? (hits.length ? `<ul class="notes">${hits.map(n => noteCard(n, true)).join('')}</ul>` : `<p class="muted">Kein Lernzettel enthält „${esc(ui.search)}“.</p>`) : ''}</div>
    <ul class="subjects">${semMods(sem).map(m => {
      const ns = state.notes.filter(n => n.module === m.id), last = ns.reduce((a, n) => Math.max(a, n.updated), 0);
      return `<li><a class="subject" style="--h:${m.hue}" href="#/lernzettel/${m.id}"><h3>${esc(m.name)}</h3><p>${ns.length ? `${ns.length} Lernzettel, zuletzt am ${fmt(new Date(last), { day: 'numeric', month: 'short' })}` : 'Noch kein Lernzettel'}</p></a></li>`;
    }).join('')}</ul>`;
};

/* Einstellungen */
views.einstellungen = () => {
  const s = state.settings, R = window.REPO;
  const plan = lectureMeta.state === 'ok'
    ? `${lectures.length} Termine geladen${lectureMeta.updated ? `, zuletzt aktualisiert am ${fmt(new Date(lectureMeta.updated), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr` : ''}.`
    : lectureMeta.state === 'loading' ? 'Wird geladen …' : 'Noch kein Stundenplan geladen.';
  return `<header class="page-head"><h1>Einstellungen</h1></header>
    <section class="panel set">
      <h2>Über dich</h2>
      <div class="flds">
        <div class="fld half"><label for="setName">Dein Vorname</label><input id="setName" data-chg="set-name" value="${esc(s.name)}" placeholder="Für die Begrüßung"></div>
        <div class="fld half"><label for="setSem">Aktuelles Semester</label><select id="setSem" data-chg="set-sem">${[1, 2, 3, 4, 5, 6, 7].map(i => `<option value="${i}"${i === s.sem ? ' selected' : ''}>${i}. Semester</option>`).join('')}</select></div>
        <div class="fld half"><label for="setFocus">Schwerpunkt (ab dem 4. Semester)</label><select id="setFocus" data-chg="focus"><option value="">Noch offen</option>${window.FOCI.map(f => `<option value="${f.id}"${f.id === s.focus ? ' selected' : ''}>${esc(f.name)}</option>`).join('')}</select></div>
        <div class="fld half"><label for="setTheme">Darstellung</label><select id="setTheme" data-chg="set-theme">${[['auto', 'Wie das Gerät'], ['light', 'Hell'], ['dark', 'Dunkel']].map(([v, l]) => `<option value="${v}"${v === s.theme ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
      </div>
    </section>
    <section class="panel set">
      <h2>Stundenplan der Hochschule</h2>
      <p>${plan}</p>
      <p class="muted">Der Stundenplan wird jede Nacht automatisch aus dem sPlan der Hochschule Aalen geholt. Zu jedem neuen Semester trägst du den neuen Kalender-Link in die Datei <code>stundenplan-url.txt</code> ein, der alte bleibt einfach darüber stehen.</p>
      <p class="row-actions">${R ? `<a class="btn" href="https://github.com/${R.owner}/${R.name}/edit/${R.branch}/stundenplan-url.txt" target="_blank" rel="noopener">Kalender-Link ändern</a><a class="btn" href="https://github.com/${R.owner}/${R.name}/actions/workflows/stundenplan.yml" target="_blank" rel="noopener">Jetzt aktualisieren</a>` : ''}</p>
      <div class="fld"><label for="icsFile">Oder eine .ics-Datei direkt in diesem Browser laden</label><input id="icsFile" type="file" accept=".ics,text/calendar" data-chg="ics-file"></div>
      ${state.ics ? `<p><button type="button" class="btn ghost" data-act="ics-clear">Geladene Datei wieder entfernen</button></p>` : ''}
    </section>
    <section class="panel set">
      <h2>Schnellzugriff</h2>
      <ul class="link-list">${state.links.map((l, i) => `<li><span><b>${esc(l.label)}</b> ${esc(l.url)}</span><button type="button" class="btn small ghost" data-act="link-del" data-i="${i}" aria-label="${esc(l.label)} entfernen">Entfernen</button></li>`).join('')}</ul>
      <form class="quick" data-sub="link-add"><input name="label" placeholder="Name, z. B. Hochschul-Mail" aria-label="Name" required><input name="url" type="url" placeholder="https://…" aria-label="Adresse" required><button class="btn">Hinzufügen</button></form>
    </section>
    <section class="panel set">
      <h2>Erinnerungen aufs Handy</h2>
      <p>Überträgt alle kommenden Prüfungen und To-dos mit Datum in den Kalender deines Handys. Der Kalender erinnert dich dann von selbst, auch wenn diese Website geschlossen ist.</p>
      <p class="muted">Prüfungen: eine Woche vorher, am Tag davor und zwei Stunden vor Beginn. To-dos: am Vorabend um 18 Uhr und am Fälligkeitstag um 8 Uhr. Nach neuen Einträgen einfach noch einmal übertragen, bestehende Termine werden dabei aktualisiert statt verdoppelt.</p>
      <p><button type="button" class="btn primary" data-act="remind">In den Kalender übertragen</button></p>
    </section>
    <section class="panel set">
      <h2>Sicherung</h2>
      <p>Deine To-dos, Noten, Prüfungen und Lernzettel liegen nur in diesem Browser auf diesem Gerät, nicht auf GitHub. Sichere sie regelmäßig als Datei. Mit derselben Datei überträgst du alles auf ein anderes Gerät.</p>
      <p class="muted">${state.lastBackup ? `Letzte Sicherung am ${fmt(new Date(state.lastBackup), { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'Noch keine Sicherung erstellt.'}</p>
      <p class="row-actions"><button type="button" class="btn primary" data-act="backup">Sicherung herunterladen</button><label class="btn" for="restoreFile">Sicherung einspielen</label><input class="sr" id="restoreFile" type="file" accept="application/json,.json" data-chg="restore"></p>
      <p><button type="button" class="btn ghost danger" data-act="reset">Alle Daten in diesem Browser löschen</button></p>
    </section>`;
};

/* ───────── Erinnerungen: Export in den Handy-Kalender ───────── */
function exportReminders() {
  const E = v => String(v || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
  const D = d => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const T = d => `${D(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const alarm = (trigger, text) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${E(text)}`, `TRIGGER:${trigger}`, 'END:VALARM'];
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IBW Studium//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:IBW Studium'];
  let n = 0;
  for (const x of state.exams) {
    if (!x.date || daysUntil(x.date) < 0) continue;
    const m = modOf(x.module), title = `${x.kind || 'Klausur'}: ${m ? m.name : 'Prüfung'}`;
    const desc = [x.aids ? `Hilfsmittel: ${x.aids}` : '', x.registered ? 'Angemeldet' : 'Noch nicht angemeldet!', x.notes].filter(Boolean).join('\n');
    out.push('BEGIN:VEVENT', `UID:exam-${x.id}@ibw-studium`, `DTSTAMP:${stamp}`, `SUMMARY:${E(title)}`);
    if (x.time) {
      const st = new Date(`${x.date}T${x.time}`);
      out.push(`DTSTART:${T(st)}`, `DTEND:${T(new Date(+st + (+x.duration || 90) * 6e4))}`, ...alarm('-P7D', `${title} in einer Woche`), ...alarm('-P1D', `${title} morgen`), ...alarm('-PT2H', `${title} in 2 Stunden`));
    } else {
      const st = parseYmd(x.date);
      out.push(`DTSTART;VALUE=DATE:${D(st)}`, `DTEND;VALUE=DATE:${D(addDays(st, 1))}`, ...alarm('-P6DT15H', `${title} in einer Woche`), ...alarm('-PT15H', `${title} morgen`));
    }
    if (x.room) out.push(`LOCATION:${E(x.room)}`);
    if (desc) out.push(`DESCRIPTION:${E(desc)}`);
    out.push('END:VEVENT'); n++;
  }
  for (const t of state.todos) {
    if (!t.due || t.done || daysUntil(t.due) < 0) continue;
    const m = modOf(t.module), st = parseYmd(t.due), title = `To-do: ${t.text}`;
    out.push('BEGIN:VEVENT', `UID:todo-${t.id}@ibw-studium`, `DTSTAMP:${stamp}`, `SUMMARY:${E(title)}`, `DTSTART;VALUE=DATE:${D(st)}`, `DTEND;VALUE=DATE:${D(addDays(st, 1))}`, 'TRANSP:TRANSPARENT');
    if (m) out.push(`DESCRIPTION:${E(m.name)}`);
    out.push(...alarm('-PT6H', `Morgen fällig: ${t.text}`), ...alarm('PT8H', `Heute fällig: ${t.text}`), 'END:VEVENT'); n++;
  }
  if (!n) return toast('Es gibt noch keine Prüfung und kein To-do mit Datum in der Zukunft.');
  out.push('END:VCALENDAR');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([out.join('\r\n')], { type: 'text/calendar' }));
  a.download = 'ibw-erinnerungen.ics'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast(`${n} ${n === 1 ? 'Termin' : 'Termine'} mit Erinnerung exportiert. Datei öffnen und zum Kalender hinzufügen.`);
}

/* ───────── Karteikarten ───────── */
function studyCards(note) {
  let queue = cardsOf(note.body).sort(() => Math.random() - .5), total = queue.length, known = 0, shown = false;
  const draw = () => {
    if (!queue.length) {
      dlg.innerHTML = `<div class="form cards"><h2>Geschafft</h2><p>Du hast alle ${total} Karten gewusst.</p><div class="form-actions"><span class="grow"></span><button type="button" class="btn primary" data-x>Schließen</button></div></div>`;
      $('[data-x]', dlg).onclick = () => dlg.close(); return;
    }
    const c = queue[0];
    dlg.innerHTML = `<div class="form cards"><p class="muted">${known} von ${total} gewusst</p><div class="bar"><i style="width:${known / total * 100}%"></i></div>
      <div class="card-face"><p class="q">${esc(c.q)}</p>${shown ? `<p class="a">${esc(c.a)}</p>` : ''}</div>
      <div class="form-actions"><button type="button" class="btn ghost" data-x>Beenden</button><span class="grow"></span>
      ${shown ? `<button type="button" class="btn" data-again>Nochmal</button><button type="button" class="btn primary" data-ok>Gewusst</button>` : `<button type="button" class="btn primary" data-show>Antwort zeigen</button>`}</div></div>`;
    $('[data-x]', dlg).onclick = () => dlg.close();
    const b = n => $(`[data-${n}]`, dlg);
    if (b('show')) { b('show').onclick = () => { shown = true; draw(); }; b('show').focus(); }
    if (b('ok')) { b('ok').onclick = () => { queue.shift(); known++; shown = false; draw(); }; b('ok').focus(); }
    if (b('again')) b('again').onclick = () => { queue.push(queue.shift()); shown = false; draw(); };
  };
  draw();
  if (!dlg.open) dlg.showModal();
}

/* ───────── Aktionen ───────── */
const byId = (list, id) => list.find(x => x.id === id);
const act = {
  sem(el) { state.settings.sem = +el.dataset.sem; save(); matchCache.clear(); const r = route(); if (r[0] === 'lernzettel' && r[1]) go('lernzettel'); else render(); },
  more() {
    openInfo(`<h2>Mehr</h2><p class="more-list">${['klausuren', 'module', 'einstellungen'].map(id => `<a class="btn" href="#/${id}" data-close>${icon(id)} ${NAV.find(n => n[0] === id)[1]}</a>`).join('')}</p>`);
  },
  ev(el) { const e = evIndex.get(el.dataset.id); if (e) eventInfo(e); },
  'event-new'() { eventForm(); },
  'cal-view'(el) { ui.calView = el.dataset.view; render(); },
  'cal-today'() { ui.calCursor = today(); render(); },
  'cal-step'(el) {
    const dir = +el.dataset.dir, c = ui.calCursor;
    ui.calCursor = ui.calView === 'month' ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : addDays(c, dir * (ui.calView === 'week' ? (narrow.matches ? 1 : 7) : 30));
    render();
  },
  'cal-goto'(el) { ui.calCursor = parseYmd(el.dataset.date); ui.calView = 'week'; render(); },
  'todo-toggle'(el) { const t = byId(state.todos, el.dataset.id); if (t) { t.done = !t.done; t.doneAt = Date.now(); save(); render(); } },
  'todo-edit'(el) { const t = byId(state.todos, el.dataset.id); if (t) todoForm(t); },
  'toggle-done'() { ui.showDone = !ui.showDone; render(); },
  'clear-done'() { if (confirm('Alle erledigten To-dos löschen?')) { state.todos = state.todos.filter(t => !t.done); save(); render(); } },
  'exam-new'(el) { examForm({ module: el.dataset.mod || (semMods(state.settings.sem)[0] || {}).id }); },
  'exam-edit'(el) { const x = byId(state.exams, el.dataset.id); if (x) examForm(x); },
  'mod-edit'(el) { moduleForm(modOf(el.dataset.id)); },
  'mod-new'() { moduleForm(); },
  'note-new'(el) {
    const T = window.NOTE_TEMPLATES;
    openForm({
      title: 'Neuer Lernzettel', submit: 'Anlegen',
      fields: [{ name: 'title', label: 'Titel', required: true, placeholder: 'z. B. Kapitel 3: Marketing-Mix' }, { name: 'tpl', label: 'Vorlage', type: 'select', value: 'zusammenfassung', options: Object.entries(T).map(([k, v]) => [k, v.label]) }],
      onSave: d => { const n = { id: uid(), module: el.dataset.mod, title: d.title.trim() || 'Ohne Titel', body: T[d.tpl].body, updated: Date.now() }; state.notes.push(n); save(); ui.noteMode = null; go(`lernzettel/${n.module}/${n.id}`); }
    });
  },
  'note-mode'(el) { ui.noteMode = el.dataset.mode; render(); },
  'note-del'(el) { if (confirm('Diesen Lernzettel löschen?')) { const n = byId(state.notes, el.dataset.id); state.notes = state.notes.filter(x => x !== n); save(); go('lernzettel/' + n.module); } },
  fmt(el) {
    const ta = $('#noteBody'); if (!ta) return;
    if (ui.noteMode === 'view') { ui.noteMode = 'edit'; render(); return act.fmt(el); }
    const s = el.dataset.s, a = ta.selectionStart, b = ta.selectionEnd, v = ta.value, sel = v.slice(a, b);
    let ins;
    if (s === '**' || s === '==') ins = s + (sel || 'Text') + s;
    else if (s === ' :: ') ins = (a && v[a - 1] !== '\n' ? '\n' : '') + (sel || 'Frage') + ' :: Antwort';
    else ins = (a && v[a - 1] !== '\n' ? '\n' : '') + s + sel;
    ta.setRangeText(ins, a, b, 'end'); ta.focus();
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  },
  cards(el) { const n = byId(state.notes, el.dataset.id); if (n) studyCards(n); },
  print() { window.print(); },
  remind() { exportReminders(); },
  'ics-clear'() { state.ics = ''; save(); loadLectures(); toast('Datei entfernt'); },
  'link-del'(el) { state.links.splice(+el.dataset.i, 1); save(); render(); },
  backup() {
    state.lastBackup = Date.now(); save();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }));
    a.download = `ibw-studium-sicherung-${ymd(new Date())}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Sicherung heruntergeladen'); render();
  },
  reset() { if (confirm('Wirklich alle To-dos, Noten, Prüfungen und Lernzettel in diesem Browser löschen? Das lässt sich nicht rückgängig machen.')) { state = defaults(); save(); applyTheme(); loadLectures(); toast('Alle Daten gelöscht'); } }
};

const chg = {
  'todo-filter'(el) { ui.todoFilter = el.value; render(); },
  'exam-reg'(el) { const x = byId(state.exams, el.dataset.id); if (x) { x.registered = el.checked; save(); } },
  'mod-status'(el) { setMod(el.dataset.id, { status: el.value }); render(); },
  'mod-grade'(el) {
    const g = gradeNum(el.value), patch = { grade: el.value.trim() };
    if (el.value.trim() && (g === null || g < 1 || g > 5)) { toast('Bitte eine Note zwischen 1,0 und 5,0 eingeben'); el.value = ''; patch.grade = ''; }
    else if (g !== null && g <= 4) patch.status = 'bestanden';
    setMod(el.dataset.id, patch); render();
  },
  focus(el) { state.settings.focus = el.value; save(); render(); },
  'set-name'(el) { state.settings.name = el.value.trim(); save(); },
  'set-sem'(el) { state.settings.sem = +el.value; save(); matchCache.clear(); render(); },
  'set-theme'(el) { state.settings.theme = el.value; save(); applyTheme(); },
  'ics-file'(el) {
    const f = el.files[0]; if (!f) return;
    f.text().then(t => {
      if (!/BEGIN:VCALENDAR/.test(t)) return toast('Das ist keine gültige Kalender-Datei (.ics).');
      state.ics = t; save(); loadLectures(); toast('Stundenplan geladen');
    });
  },
  restore(el) {
    const f = el.files[0]; if (!f) return;
    f.text().then(t => {
      try {
        const s = JSON.parse(t);
        if (!s || !Array.isArray(s.todos) || !Array.isArray(s.notes)) throw 0;
        if (!confirm('Die Sicherung ersetzt alle Daten in diesem Browser. Fortfahren?')) return;
        state = { ...defaults(), ...s, settings: { ...defaults().settings, ...(s.settings || {}) } };
        save(); applyTheme(); loadLectures(); toast('Sicherung eingespielt');
      } catch (e) { toast('Diese Datei ist keine Sicherung dieser Website.'); }
    });
  }
};

const inp = {
  'note-title'(el) { const n = byId(state.notes, el.dataset.id); if (n) { n.title = el.value; n.updated = Date.now(); save(); const h = $('#notePreview .print-only'); if (h) h.textContent = el.value; } },
  'note-body'(el) {
    const n = byId(state.notes, el.dataset.id); if (!n) return;
    n.body = el.value; n.updated = Date.now(); save();
    const p = $('#notePreview'); if (p) p.innerHTML = `<h1 class="print-only">${esc(n.title)}</h1>` + (md(n.body) || '<p class="muted">Die Vorschau erscheint hier.</p>');
    const c = $('#cardsBtn'), k = cardsOf(n.body).length; if (c) { c.textContent = `Karteikarten lernen (${k})`; c.disabled = !k; }
  },
  'note-search'(el) {
    ui.search = el.value;
    const q = ui.search.trim().toLowerCase(), box = $('#noteHits'); if (!box) return;
    const hits = q ? state.notes.filter(n => (n.title + ' ' + n.body).toLowerCase().includes(q)) : [];
    box.innerHTML = q ? (hits.length ? `<ul class="notes">${hits.map(n => noteCard(n, true)).join('')}</ul>` : `<p class="muted">Kein Lernzettel enthält „${esc(ui.search)}“.</p>`) : '';
  }
};

const sub = {
  'todo-quick'(d) { if (d.text.trim()) { state.todos.push({ id: uid(), text: d.text.trim(), module: '', due: '', prio: 'normal', done: false, created: Date.now() }); save(); } },
  'todo-add'(d) { if (d.text.trim()) { state.todos.push({ id: uid(), text: d.text.trim(), module: d.module, due: d.due, prio: 'normal', done: false, created: Date.now() }); save(); toast('To-do hinzugefügt'); } },
  'link-add'(d) { if (/^https?:\/\//i.test(d.url)) { state.links.push({ label: d.label.trim(), url: d.url.trim() }); save(); } else toast('Die Adresse muss mit https:// beginnen.'); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && act[el.dataset.act]) { e.preventDefault(); act[el.dataset.act](el); return; }
  if (e.target.closest('[data-close]') && dlg.open) dlg.close();
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
});
document.addEventListener('change', e => { const el = e.target.closest('[data-chg]'); if (el && chg[el.dataset.chg]) chg[el.dataset.chg](el); });
document.addEventListener('input', e => { const el = e.target.closest('[data-inp]'); if (el && inp[el.dataset.inp]) inp[el.dataset.inp](el); });
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-sub]'); if (!f) return;
  e.preventDefault();
  sub[f.dataset.sub](Object.fromEntries(new FormData(f)));
  const name = f.dataset.sub; render();
  const again = $(`[data-sub="${name}"] input`); if (again) again.focus();
});
window.addEventListener('hashchange', () => { if (dlg.open) dlg.close(); render(); main.focus({ preventScroll: true }); window.scrollTo(0, 0); });
narrow.addEventListener('change', render);
window.addEventListener('storage', e => { if (e.key === KEY && e.newValue) { try { state = { ...defaults(), ...JSON.parse(e.newValue) }; render(); } catch (x) { /* ignorieren */ } } });

applyTheme();
render();
loadLectures();
setInterval(() => { const v = route()[0]; if ((v === 'heute' || v === 'kalender') && !dlg.open && document.activeElement.tagName !== 'INPUT') render(); }, 5 * 60 * 1000);
})();
