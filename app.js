'use strict';
/* Bonsai APP – prototyp. Data se ukládají lokálně v prohlížeči (IndexedDB). */

const MONTHS = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const MONTHS_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
const DAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
const SPECIES = ['Borovice lesní', 'Borovice kleč', 'Borovice černá', 'Borovice Thunbergova', 'Jalovec čínský', 'Jalovec obecný', 'Smrk ztepilý',
  'Modřín opadavý', 'Tis červený', 'Javor dlanitolistý', 'Javor babyka', 'Habr obecný', 'Buk lesní', 'Dub letní', 'Lípa srdčitá',
  'Jilm drobnolistý', 'Hloh obecný', 'Trnka obecná', 'Jabloň', 'Azalka Satsuki', 'Fíkus'];
const STYLES = ['Chokkan (formální vzpřímený)', 'Moyogi (volně vzpřímený)', 'Shakan (nakloněný)', 'Kengai (kaskáda)', 'Han-kengai (polokaskáda)',
  'Bunjin (literátský)', 'Fukinagashi (ve větru)', 'Hokidachi (koště)', 'Sokan (dvojkmen)', 'Kabudachi (vícekmen)', 'Yose-ue (lesík)', 'Ishizuki (na kameni)'];
const TASK_HINTS = ['Přesadit', 'Drátovat', 'Odstranit drát', 'Strukturální střih', 'Udržovací střih', 'Hnojit', 'Zimní postřik', 'Defoliace',
  'Lámání svíček', 'Čištění starého jehličí', 'Přesunout do zimoviště', 'Vyfotit'];
const LOG_TYPES = ['Přesazení', 'Drátování', 'Odstranění drátu', 'Střih', 'Hnojení', 'Postřik', 'Poznámka'];
const SEASON = [
  ['Zimní klid', ['Kontrolujte vlhkost substrátu v zimovišti, nesmí úplně vyschnout.', 'Naplánujte přesazování a objednejte substráty a misky.', 'V bezmrazých dnech lze drátovat jehličnany.']],
  ['Příprava na sezónu', ['Připravte a prosejte substráty.', 'Sledujte pupeny, ke konci měsíce začíná přesazování raných druhů.', 'Vhodná doba na zimní postřik proti přezimujícím škůdcům.']],
  ['Hlavní čas přesazování', ['Listnáče přesazujte, jakmile nalévají pupeny.', 'Strukturální střih proveďte ještě před rašením.', 'Čerstvě přesazené stromy chraňte před mrazíky a větrem.']],
  ['Rašení', ['Dokončete přesazování borovic a jalovců.', 'S hnojením začněte zhruba měsíc po přesazení.', 'Pozor na pozdní mrazy, mladé výhony jsou citlivé.']],
  ['Růst naplno', ['Zaštipujte nové výhony listnáčů pro jemnější větvení.', 'Hnojte pravidelně.', 'Kontrolujte mšice a další škůdce na mladých výhonech.']],
  ['Formování přírůstků', ['Defoliace jen u zdravých a silných listnáčů.', 'U borovic je čas na práci se svíčkami.', 'Kontrolujte dráty, v plném růstu rychle zarůstají.']],
  ['Horko', ['V horku zalévejte i dvakrát denně, ideálně ráno a večer.', 'Citlivé druhy přistiňte před poledním sluncem.', 'Při vysokých teplotách hnojení omezte.']],
  ['Pozdní léto', ['Zálivka zůstává prioritou.', 'Znovu zkontrolujte zarůstající dráty.', 'Koncem měsíce přejděte na hnojivo s nižším obsahem dusíku.']],
  ['Podzimní příprava', ['Podzimní hnojení posiluje stromy před zimou.', 'Dobrá doba na drátování jehličnanů.', 'U borovic vyberte pupeny a proředte přehuštěná místa.']],
  ['Barvení a opad', ['U borovic vyčistěte staré jehličí.', 'Po opadu listí je dobře vidět struktura, vhodná doba na drátování listnáčů.', 'Připravte zimoviště.']],
  ['Zazimování', ['Po prvních mrazících přesuňte stromy do zimoviště.', 'Chraňte kořenový bal: zapusťte misky do země nebo zamulčujte.', 'Listnáče lze po opadu listí stříhat, větší rány zatřete.']],
  ['Zimní klid', ['Občas zkontrolujte vlhkost substrátu.', 'Vyčistěte a nabruste nářadí.', 'Projděte fotky z roku a naplánujte další sezónu.']],
];

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addDays = n => { const d = today(); d.setDate(d.getDate() + n); return d; };
const fmtDate = s => { const [y, m, d] = s.split('-').map(Number); return `${d}. ${m}. ${y}`; };
const days = n => n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní';
const plural = (n, one, few, many) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;

let state = { trees: [], tasks: [], demo: false };

/* ---------- Úložiště ---------- */
const store = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('bonsai-app', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  },
  async load() {
    try {
      this.db = await this.open();
      return await new Promise((res, rej) => {
        const q = this.db.transaction('kv').objectStore('kv').get('state');
        q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
      });
    } catch (e) { this.db = null; return null; }
  },
  save() {
    if (!this.db) return;
    try { this.db.transaction('kv', 'readwrite').objectStore('kv').put(state, 'state'); } catch (e) { /* bez úložiště běží dál v paměti */ }
  },
};
function commit(msg) { store.save(); render(); if (msg) toast(msg); }

/* ---------- Ukázková data ---------- */
function demoState() {
  const t = [
    { id: uid(), name: 'Borovice č. 2', species: 'Borovice lesní', style: STYLES[1], acquired: 2019, origin: 'Yamadori, Vysočina', pot: 'Neglazovaná oválná, 38 cm', notes: 'Silný spodní kmen, vrchol je potřeba ještě zahustit.\nPřesazena naposledy na jaře 2024.' },
    { id: uid(), name: 'Javor u branky', species: 'Javor dlanitolistý', style: STYLES[7], acquired: 2021, origin: 'Zahradnictví', pot: 'Modrá glazura, 30 cm', notes: 'Na podzim krásně barví. Hlídat úpal listů v létě.' },
    { id: uid(), name: 'Jalovec Itoigawa', species: 'Jalovec čínský', style: STYLES[2], acquired: 2022, origin: 'Bonsai školka', pot: 'Tokoname, 26 cm', notes: 'Na jaře 2026 nadrátován celý strom.' },
    { id: uid(), name: 'Habr z lesa', species: 'Habr obecný', style: STYLES[1], acquired: 2020, origin: 'Yamadori', pot: 'Pěstební nádoba', notes: '' },
    { id: uid(), name: 'Borovice č. 1', species: 'Borovice lesní', style: STYLES[5], acquired: 2018, origin: 'Yamadori, Jeseníky', pot: 'Kulatá neglazovaná, 22 cm', notes: 'Tenký elegantní kmen, minimum větví.' },
  ].map(x => ({ ...x, photos: [], log: [], coverId: null }));
  t[0].log.push({ id: uid(), type: 'Přesazení', date: '2024-03-16', note: 'Akadama, pemza, láva 1:1:1' }, { id: uid(), type: 'Drátování', date: iso(addDays(-40)), note: 'Hlavní větve, měděný drát' });
  t[2].log.push({ id: uid(), type: 'Drátování', date: '2026-04-11', note: 'Celý strom' });
  t[1].log.push({ id: uid(), type: 'Střih', date: iso(addDays(-12)), note: 'Po opadu listí, rány zatřeny' });
  const now = today(), ym = (add) => { const d = new Date(now.getFullYear(), now.getMonth() + add, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
  const tasks = [
    { title: 'Odstranit drát, začíná zarůstat', due: iso(addDays(-3)), scope: { type: 'tree', value: t[2].id }, note: '' },
    { title: 'Přesunout stromy do zimoviště', due: iso(addDays(5)), scope: { type: 'general' }, note: 'Po prvních mrazících' },
    { title: 'Zimní postřik', due: iso(addDays(20)), scope: { type: 'species', value: 'Borovice lesní' }, note: '' },
    { title: 'Objednat akadamu a pemzu', due: ym(2), scope: { type: 'general' }, note: '' },
    { title: 'Přesadit', due: ym(3), scope: { type: 'tree', value: t[0].id }, note: 'Připravit větší misku' },
    { title: 'Strukturální střih', due: ym(4), scope: { type: 'tree', value: t[1].id }, note: '' },
  ].map(x => ({ id: uid(), done: false, doneAt: null, logId: null, ...x }));
  tasks.push({ id: uid(), title: 'Vyčistit staré jehličí', due: iso(addDays(-20)), scope: { type: 'species', value: 'Borovice lesní' }, note: '', done: true, doneAt: iso(addDays(-22)), logId: null });
  return { trees: t, tasks, demo: true };
}

/* ---------- Pomocné funkce pro úkoly ---------- */
function deadline(t) {
  if (!t.due) return null;
  const [y, m, d] = t.due.split('-').map(Number);
  return t.due.length === 7 ? new Date(y, m, 0) : new Date(y, m - 1, d);
}
function dueInfo(t) {
  if (!t.due) return { label: 'bez termínu', cls: '' };
  const diff = Math.round((deadline(t) - today()) / 864e5);
  if (t.due.length === 7) {
    const [y, m] = t.due.split('-').map(Number), label = `${MONTHS[m - 1]} ${y}`, n = today();
    if (diff < 0) return { label: `${label} · po termínu`, cls: 'late' };
    if (n.getFullYear() === y && n.getMonth() === m - 1) return { label: `${label} · tento měsíc`, cls: 'soon' };
    return { label, cls: '' };
  }
  const label = fmtDate(t.due);
  if (diff < 0) return { label: `${label} · ${-diff} ${days(-diff)} po termínu`, cls: 'late' };
  if (diff === 0) return { label: `${label} · dnes`, cls: 'soon' };
  if (diff === 1) return { label: `${label} · zítra`, cls: 'soon' };
  if (diff <= 14) return { label: `${label} · za ${diff} ${days(diff)}`, cls: 'soon' };
  return { label, cls: '' };
}
const byDeadline = (a, b) => (deadline(a)?.getTime() ?? Infinity) - (deadline(b)?.getTime() ?? Infinity);
const tree = id => state.trees.find(t => t.id === id);
const speciesInUse = () => [...new Set(state.trees.map(t => t.species).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));
function scopeChip(s) {
  if (s.type === 'tree') { const t = tree(s.value); return t ? `<a class="chip tree" href="#strom-${t.id}">${esc(t.name)}</a>` : '<span class="chip">Smazaný strom</span>'; }
  if (s.type === 'species') return `<span class="chip species">Všechny: ${esc(s.value)}</span>`;
  return '<span class="chip">Obecné</span>';
}
function taskRow(t) {
  const d = dueInfo(t);
  return `<li class="task ${t.done ? 'done' : d.cls}">
    <input type="checkbox" id="chk-${t.id}" data-change="toggle-task" data-id="${t.id}" ${t.done ? 'checked' : ''}>
    <div class="task-main"><label for="chk-${t.id}">${esc(t.title)}</label>
      <div class="task-meta"><span class="due">${t.done && t.doneAt ? 'hotovo ' + fmtDate(t.doneAt) : d.label}</span>${scopeChip(t.scope)}</div>
      ${t.note ? `<div class="task-note">${esc(t.note)}</div>` : ''}</div>
    <button class="icon-btn" data-act="edit-task" data-id="${t.id}" aria-label="Upravit úkol" title="Upravit">⋯</button></li>`;
}
function taskList(tasks, emptyText) {
  const open = tasks.filter(t => !t.done).sort(byDeadline);
  const done = tasks.filter(t => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
  return (open.length ? `<ul class="tasks">${open.map(taskRow).join('')}</ul>` : `<p class="empty">${emptyText}</p>`) +
    (done.length ? `<details class="done-list"><summary>Hotovo (${done.length})</summary><ul class="tasks">${done.map(taskRow).join('')}</ul></details>` : '');
}

/* ---------- Ilustrace stromu (když chybí fotka) ---------- */
const illuCache = new Map();
function illustration(t) {
  const key = t.id + '|' + t.species;
  if (illuCache.has(key)) return illuCache.get(key);
  let seed = 0; for (const c of key) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const sp = (t.species || '').toLowerCase();
  const conifer = /borovic|jalovec|smrk|tis|modřín|jedle|cypři/.test(sp);
  const leaf = /javor/.test(sp) ? ['#C8553A', '#E08A4A'] : conifer ? ['#2F6B4A', '#4C8A62'] : ['#5C9A55', '#86B86B'];
  const c = document.createElement('canvas'); c.width = c.height = 400;
  const g = c.getContext('2d');
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = '#5E6F7C'; g.beginPath(); g.roundRect(118, 322, 164, 34, 7); g.fill();
  g.fillRect(138, 356, 22, 8); g.fillRect(240, 356, 22, 8);
  g.fillStyle = '#7C8C6A'; g.beginPath(); g.ellipse(200, 322, 74, 7, 0, 0, Math.PI * 2); g.fill();
  const lean = (rnd() - .5) * 26, pts = [[200, 322]], n = 5 + Math.floor(rnd() * 2);
  for (let i = 1; i <= n; i++) { const p = pts[i - 1]; pts.push([p[0] + lean * (i < 3 ? 1 : -.6) + (rnd() - .5) * 34, p[1] - (232 / n)]); }
  const pads = [];
  g.strokeStyle = '#7A5B46';
  for (let i = 1; i <= n; i++) {
    const a = pts[i - 1], b = pts[i], w = 26 - (i - 1) * (20 / n);
    g.lineWidth = w; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    if (i >= 2 && i < n) {
      const side = i % 2 ? 1 : -1, len = (95 - i * 9) * (.7 + rnd() * .5), ex = b[0] + side * len, ey = b[1] - 6 - rnd() * 18;
      g.lineWidth = Math.max(3, w * .4); g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo(b[0] + side * len * .5, b[1] + 6, ex, ey); g.stroke();
      pads.push([ex, ey, 40 - i * 3]);
    }
  }
  pads.push([pts[n][0], pts[n][1] - 4, 38]);
  for (const [x, y, r] of pads) for (let k = 0; k < 7; k++) {
    g.fillStyle = leaf[k % 2]; g.globalAlpha = .9;
    g.beginPath(); g.ellipse(x + (rnd() - .5) * r * 1.5, y + (rnd() - .6) * r * .7, r * (.5 + rnd() * .4), r * (conifer ? .3 : .45) * (.8 + rnd() * .4), 0, 0, Math.PI * 2); g.fill();
  }
  const url = c.toDataURL('image/png'); illuCache.set(key, url); return url;
}
function cover(t) {
  const p = t.photos.find(p => p.id === t.coverId) || [...t.photos].sort((a, b) => b.date.localeCompare(a.date))[0];
  return p ? p.data : illustration(t);
}

/* ---------- Ikony ---------- */
const ico = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: ico('<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
  tree: ico('<path d="M12 21v-8M7 21h10M12 13c-4 0-7-2-7-5s3-5 7-5 7 2 7 5-3 5-7 5z"/>'),
  map: ico('<path d="M12 21s6-5.5 6-10.5a6 6 0 0 0-12 0C6 15.500 12 21 12 21z"/><circle cx="12" cy="10.500" r="2"/>'),
  cog: ico('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M5.600 18.400l2.100-2.100M16.300 7.700l2.100-2.100"/>'),
};

/* ---------- Vykreslení ---------- */
function route() {
  const h = location.hash.replace('#', '');
  if (h.startsWith('strom-')) return { view: 'tree', id: h.slice(6) };
  return { view: ['sbirka', 'yamadori'].includes(h) ? h : 'prehled' };
}
let filter = { q: '', species: '' };
function render() {
  const r = route(), cur = v => (r.view === v || (v === 'sbirka' && r.view === 'tree')) ? 'aria-current="page"' : '';
  const body = r.view === 'tree' ? viewTree(r.id) : r.view === 'sbirka' ? viewCollection() : r.view === 'yamadori' ? viewYamadori() : viewDashboard();
  $('#app').innerHTML = `<div class="shell">
    <aside class="side"><div class="brand">${ICON.tree}<span>Bonsai APP</span></div>
      <nav class="nav" aria-label="Hlavní navigace">
        <a href="#prehled" ${cur('prehled')}>${ICON.home}<span>Přehled</span></a>
        <a href="#sbirka" ${cur('sbirka')}>${ICON.tree}<span>Moje sbírka</span></a>
        <a href="#yamadori" ${cur('yamadori')}>${ICON.map}<span>Yamadori</span><span class="tag-dev">vývoj</span></a>
        <span class="spacer"></span>
        <button data-act="settings">${ICON.cog}<span>Záloha</span></button>
      </nav></aside>
    <main><div class="wrap">${body}</div></main></div>`;
}

function viewDashboard() {
  const n = new Date(), open = state.tasks.filter(t => !t.done), late = open.filter(t => dueInfo(t).cls === 'late').length;
  const [sTitle, sTips] = SEASON[n.getMonth()];
  const shots = state.trees.flatMap(t => t.photos.length
    ? t.photos.map(p => ({ src: p.data, date: p.date, t, illu: false }))
    : [{ src: illustration(t), date: '', t, illu: true }]).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  return `<header class="page-head"><div><p class="eyebrow">${DAYS[n.getDay()]} ${n.getDate()}. ${MONTHS_GEN[n.getMonth()]} ${n.getFullYear()}</p><h1>Přehled</h1>
      <p class="summary"><strong>${state.trees.length}</strong> ${plural(state.trees.length, 'strom', 'stromy', 'stromů')} ve sbírce · <strong>${open.length}</strong> ${plural(open.length, 'otevřený úkol', 'otevřené úkoly', 'otevřených úkolů')}${late ? ` · <strong class="late">${late} po termínu</strong>` : ''}</p></div>
      <button class="btn primary" data-act="new-task">+ Přidat úkol</button></header>
    ${state.demo ? `<div class="banner"><span>Vidíte ukázková data, aby bylo jasné, jak aplikace vypadá naplněná.</span><button class="btn small" data-act="clear-demo">Smazat ukázku a začít</button></div>` : ''}
    <div class="dash-grid">
      <section class="panel"><div class="sec-head"><h2>Úkoly</h2><span class="muted">podle nejbližšího termínu</span></div>
        ${taskList(state.tasks, 'Žádné otevřené úkoly. Přidejte první tlačítkem nahoře.')}</section>
      <section class="panel season"><p class="eyebrow">${MONTHS[n.getMonth()]} · sezónní tipy</p><h2>${sTitle}</h2>
        <ul>${sTips.map(x => `<li>${x}</li>`).join('')}</ul></section>
    </div>
    <section><div class="sec-head"><h2>Galerie</h2><a class="btn small ghost" href="#sbirka">Celá sbírka →</a></div>
      ${shots.length ? `<div class="gallery">${shots.map(s => `<a class="shot ${s.illu ? 'illu' : ''}" href="#strom-${s.t.id}"><img src="${s.src}" alt="${esc(s.t.name)}" loading="lazy"><span class="cap">${esc(s.t.name)}</span></a>`).join('')}</div>`
      : '<p class="empty">Zatím žádné stromy. Přidejte první v sekci Moje sbírka.</p>'}</section>`;
}

function viewCollection() {
  const q = filter.q.toLowerCase();
  const list = state.trees.filter(t => (!filter.species || t.species === filter.species) && (!q || (t.name + ' ' + t.species).toLowerCase().includes(q)));
  return `<header class="page-head"><div><h1>Moje sbírka</h1><p class="summary">${state.trees.length} ${plural(state.trees.length, 'strom', 'stromy', 'stromů')} · ${speciesInUse().length} ${plural(speciesInUse().length, 'druh', 'druhy', 'druhů')}</p></div>
      <button class="btn primary" data-act="new-tree">+ Přidat strom</button></header>
    <div class="filters"><input type="search" id="flt-q" placeholder="Hledat podle názvu nebo druhu" value="${esc(filter.q)}" data-input="filter-q" aria-label="Hledat">
      <select id="flt-species" data-change="filter-species" aria-label="Filtr podle druhu"><option value="">Všechny druhy</option>${speciesInUse().map(s => `<option ${s === filter.species ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
    <div id="cards">${cardsHtml(list)}</div>`;
}
function cardsHtml(list) {
  if (!list.length) return `<p class="empty">${state.trees.length ? 'Filtru neodpovídá žádný strom.' : 'Sbírka je prázdná. Přidejte svůj první strom.'}</p>`;
  return `<div class="cards">${list.map(t => {
    const open = tasksFor(t).filter(x => !x.done).length;
    return `<a class="card" href="#strom-${t.id}"><div class="pic"><img src="${cover(t)}" alt="" loading="lazy"></div>
      <div class="body"><h3>${esc(t.name)}</h3><span class="sub">${esc(t.species || 'Druh neuveden')}${t.acquired ? ` · od ${esc(t.acquired)}` : ''}</span>
      <div class="foot">${open ? `<span class="chip tree">${open} ${plural(open, 'úkol', 'úkoly', 'úkolů')}</span>` : ''}${t.photos.length ? `<span class="chip">${t.photos.length} ${plural(t.photos.length, 'fotka', 'fotky', 'fotek')}</span>` : ''}</div></div></a>`;
  }).join('')}</div>`;
}
const tasksFor = t => state.tasks.filter(x => (x.scope.type === 'tree' && x.scope.value === t.id) || (x.scope.type === 'species' && x.scope.value === t.species));

function viewTree(id) {
  const t = tree(id);
  if (!t) return `<a class="back" href="#sbirka">← Moje sbírka</a><p class="empty">Tento strom ve sbírce není.</p>`;
  const photos = [...t.photos].sort((a, b) => b.date.localeCompare(a.date));
  const log = [...t.log].sort((a, b) => b.date.localeCompare(a.date));
  const fact = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
  return `<a class="back" href="#sbirka">← Moje sbírka</a>
    <section class="tree-hero"><div class="pic"><img src="${cover(t)}" alt="${esc(t.name)}"></div>
      <div class="tree-info"><div><p class="eyebrow">${esc(t.species || 'Druh neuveden')}</p><h1>${esc(t.name)}</h1></div>
        <dl class="facts">${fact('Styl', t.style)}${fact('Ve sbírce od', t.acquired)}${fact('Původ', t.origin)}${fact('Miska', t.pot)}</dl>
        ${t.notes ? `<p class="notes">${esc(t.notes)}</p>` : ''}
        <div class="btns"><button class="btn" data-act="edit-tree" data-id="${t.id}">Upravit údaje</button><button class="btn danger" data-act="del-tree" data-id="${t.id}">Smazat strom</button></div></div></section>
    <div class="cols">
      <section class="panel"><div class="sec-head"><h2>Úkoly</h2><button class="btn small primary" data-act="new-task" data-tree="${t.id}">+ Přidat úkol</button></div>
        ${taskList(tasksFor(t), 'Pro tento strom není naplánováno nic.')}</section>
      <section class="panel"><div class="sec-head"><h2>Deník péče</h2><button class="btn small" data-act="new-log" data-id="${t.id}">+ Záznam</button></div>
        ${log.length ? `<ul class="log">${log.map(l => `<li><time>${fmtDate(l.date)}</time><div><div class="what">${esc(l.type)}</div>${l.note ? `<div class="note">${esc(l.note)}</div>` : ''}</div>
          <button class="icon-btn" data-act="del-log" data-id="${t.id}" data-log="${l.id}" aria-label="Smazat záznam" title="Smazat">×</button></li>`).join('')}</ul>`
        : '<p class="empty">Zatím žádné záznamy. Splněné úkoly se sem zapisují samy.</p>'}</section>
    </div>
    <section><div class="sec-head"><h2>Fotky a vývoj</h2><label class="btn small">+ Přidat fotky<input type="file" id="photo-input" accept="image/*" multiple hidden data-change="add-photos" data-id="${t.id}"></label></div>
      ${photos.length ? `<div class="gallery">${photos.map(p => `<button class="shot" data-act="open-photo" data-id="${t.id}" data-photo="${p.id}"><img src="${p.data}" alt="${esc(p.caption || t.name)}" loading="lazy"><span class="cap">${fmtDate(p.date)}${p.caption ? ' · ' + esc(p.caption) : ''}</span></button>`).join('')}</div>`
      : '<p class="empty">Bez fotek. Foťte strom pravidelně ze stejného úhlu, za pár let uvidíte vývoj.</p>'}</section>`;
}

function viewYamadori() {
  return `<header class="page-head"><div><span class="dev-badge">Ve vývoji</span><h1>Yamadori</h1>
      <p class="summary">Mapa míst, kde na vás v přírodě čekají vyhlédnuté stromy. Tato sekce se teprve připravuje, níže je plán.</p></div></header>
    <div class="yama">
      <div class="mapmock"><span class="veil">Náhled, mapa zatím není funkční</span>
        <svg viewBox="0 0 600 380" role="img" aria-label="Ilustrační náhled mapy s vyznačenými body">
          <g fill="none" stroke="var(--line)" stroke-width="1.500">
            <path d="M-20 300C80 240 150 330 260 280S430 200 620 250"/><path d="M-20 250C90 190 170 280 270 230S440 150 620 200"/>
            <path d="M-20 200C100 140 190 230 280 180S450 100 620 150"/><path d="M-20 150C110 90 210 180 290 130S460 50 620 100"/>
            <path d="M-20 100C120 40 230 130 300 80S470 0 620 50"/><ellipse cx="420" cy="120" rx="70" ry="38"/><ellipse cx="420" cy="120" rx="40" ry="20"/>
          </g>
          <path d="M-10 340C120 320 200 360 330 330S500 300 610 320" fill="none" stroke="var(--muted)" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
          <g fill="var(--accent)" stroke="var(--raised)" stroke-width="2">
            <path d="M150 190c0-14 22-14 22 0 0 9-11 20-11 20s-11-11-11-20z"/><path d="M409 105c0-14 22-14 22 0 0 9-11 20-11 20s-11-11-11-20z"/>
          </g>
          <path d="M290 262c0-14 22-14 22 0 0 9-11 20-11 20s-11-11-11-20z" fill="var(--warn)" stroke="var(--raised)" stroke-width="2"/>
        </svg></div>
      <section class="panel"><h2>Co tu bude</h2>
        <ul class="plan"><li>Mapa (Mapy.cz nebo Google Maps) s body, kde jste našli yamadori.</li><li>Přidání bodu kliknutím do mapy nebo z aktuální polohy v terénu.</li>
          <li>Ke každému bodu fotky, druh a základní informace o stromu.</li><li>Upravitelné poznámky: plán vyzvednutí, povolení vlastníka, příprava kořenů.</li>
          <li>Po vyzvednutí převod bodu jedním klikem na kartu stromu ve sbírce.</li></ul></section>
    </div>
    <section><div class="sec-head"><h2>Jak bude vypadat záznam</h2><span class="muted">ukázka</span></div>
      <div class="panel spot"><div class="row"><h3>Borovice na skalní hraně</h3><span class="chip species">Borovice lesní</span><span class="chip">Vyhlédnuto</span></div>
        <p class="muted">49.5632 N, 15.9412 E · nalezeno 14. 9. 2026</p>
        <p>Kmen asi 8 cm, výrazný pohyb. Na jaře 2027 podkopat kořeny z jedné strany, vyzvednutí plánuji na jaro 2028. Domluvit souhlas vlastníka pozemku.</p></div></section>`;
}

/* ---------- Dialogy ---------- */
const dlg = () => $('#dlg');
function openDialog(html, { wide = false, onSubmit } = {}) {
  const d = dlg(); d.className = wide ? 'wide' : ''; d.innerHTML = html; d._submit = onSubmit;
  if (!d.open) d.showModal();
}
function closeDialog() { const d = dlg(); if (d.open) d.close(); d.innerHTML = ''; }
const head = title => `<div class="dlg-head"><h2>${title}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Zavřít">×</button></div>`;
function confirmBox(text, yesLabel, onYes) {
  openDialog(`<form class="dlg" method="dialog">${head('Opravdu?')}<p>${text}</p><div class="dlg-foot"><button type="button" class="btn" data-act="close">Zrušit</button><button class="btn primary">${yesLabel}</button></div></form>`,
    { onSubmit: () => { closeDialog(); onYes(); } });
}
let toastTimer;
function toast(msg) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2200); }
const opts = (list, sel) => list.map(x => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');

function taskDialog(task, presetTree) {
  const t = task || { title: '', due: '', scope: presetTree ? { type: 'tree', value: presetTree } : { type: 'general' }, note: '' };
  const prec = task ? (!t.due ? 'none' : t.due.length === 7 ? 'month' : 'day') : (presetTree ? 'month' : 'day');
  const n = today(), [my, mm] = t.due && t.due.length === 7 ? t.due.split('-').map(Number) : [n.getFullYear(), n.getMonth() + 1];
  const sp = speciesInUse(), noTrees = !state.trees.length;
  openDialog(`<form class="dlg">${head(task ? 'Upravit úkol' : 'Nový úkol')}
    <label class="field"><span>Co je potřeba udělat</span><input type="text" id="tk-title" required maxlength="120" list="tk-hints" value="${esc(t.title)}" placeholder="např. Přesadit" autocomplete="off"></label>
    <datalist id="tk-hints">${TASK_HINTS.map(h => `<option value="${h}">`).join('')}</datalist>
    <fieldset><legend>Termín</legend><div class="seg">
      <label><input type="radio" name="prec" id="tk-prec-day" value="day" ${prec === 'day' ? 'checked' : ''}>Konkrétní den</label>
      <label><input type="radio" name="prec" id="tk-prec-month" value="month" ${prec === 'month' ? 'checked' : ''}>Jen měsíc</label>
      <label><input type="radio" name="prec" id="tk-prec-none" value="none" ${prec === 'none' ? 'checked' : ''}>Bez termínu</label></div>
      <input type="date" id="tk-date" aria-label="Datum" value="${t.due.length === 10 ? t.due : iso(n)}" ${prec === 'day' ? '' : 'hidden'}>
      <div class="row2" id="tk-monthrow" ${prec === 'month' ? '' : 'hidden'}><select id="tk-month" aria-label="Měsíc">${MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === mm ? 'selected' : ''}>${m}</option>`).join('')}</select>
        <input type="number" id="tk-year" aria-label="Rok" min="2000" max="2100" value="${my}"></div></fieldset>
    <fieldset><legend>Štítek: čeho se úkol týká</legend>
      <select id="tk-scope" aria-label="Štítek"><option value="general" ${t.scope.type === 'general' ? 'selected' : ''}>Obecný úkol</option>
        <option value="tree" ${t.scope.type === 'tree' ? 'selected' : ''} ${noTrees ? 'disabled' : ''}>Konkrétní strom</option>
        <option value="species" ${t.scope.type === 'species' ? 'selected' : ''} ${noTrees ? 'disabled' : ''}>Všechny stromy jednoho druhu</option></select>
      <select id="tk-tree" aria-label="Strom" ${t.scope.type === 'tree' ? '' : 'hidden'}>${state.trees.map(x => `<option value="${x.id}" ${x.id === t.scope.value ? 'selected' : ''}>${esc(x.name)} (${esc(x.species)})</option>`).join('')}</select>
      <select id="tk-species" aria-label="Druh" ${t.scope.type === 'species' ? '' : 'hidden'}>${opts(sp, t.scope.value)}</select></fieldset>
    <label class="field"><span>Poznámka (nepovinná)</span><input type="text" id="tk-note" maxlength="200" value="${esc(t.note)}"></label>
    <div class="dlg-foot">${task ? `<button type="button" class="btn danger left" data-act="del-task" data-id="${task.id}">Smazat</button>` : ''}
      <button type="button" class="btn" data-act="close">Zrušit</button><button class="btn primary">${task ? 'Uložit' : 'Přidat úkol'}</button></div></form>`, {
    onSubmit() {
      const p = $('input[name="prec"]:checked', dlg()).value, sc = $('#tk-scope').value;
      const due = p === 'day' ? $('#tk-date').value : p === 'month' ? `${$('#tk-year').value}-${pad($('#tk-month').value)}` : '';
      const data = { title: $('#tk-title').value.trim(), due, note: $('#tk-note').value.trim(),
        scope: sc === 'tree' ? { type: 'tree', value: $('#tk-tree').value } : sc === 'species' ? { type: 'species', value: $('#tk-species').value } : { type: 'general' } };
      if (!data.title) return;
      if (task) Object.assign(task, data); else state.tasks.push({ id: uid(), done: false, doneAt: null, logId: null, ...data });
      closeDialog(); commit(task ? 'Úkol uložen' : 'Úkol přidán');
    },
  });
}

function treeDialog(t) {
  const v = t || { name: '', species: '', style: '', acquired: '', origin: '', pot: '', notes: '' };
  openDialog(`<form class="dlg">${head(t ? 'Upravit strom' : 'Nový strom')}
    <div class="row2"><label class="field"><span>Název</span><input type="text" id="tr-name" required maxlength="60" value="${esc(v.name)}" placeholder="např. Borovice č. 2" autocomplete="off"></label>
      <label class="field"><span>Druh</span><input type="text" id="tr-species" required maxlength="60" list="tr-species-list" value="${esc(v.species)}" placeholder="např. Borovice lesní" autocomplete="off"></label></div>
    <datalist id="tr-species-list">${[...new Set([...speciesInUse(), ...SPECIES])].map(s => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="row2"><label class="field"><span>Styl</span><input type="text" id="tr-style" maxlength="60" list="tr-style-list" value="${esc(v.style)}" autocomplete="off"></label>
      <label class="field"><span>Ve sbírce od roku</span><input type="number" id="tr-acquired" min="1900" max="2100" value="${esc(v.acquired)}"></label></div>
    <datalist id="tr-style-list">${STYLES.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="row2"><label class="field"><span>Původ</span><input type="text" id="tr-origin" maxlength="80" value="${esc(v.origin)}" placeholder="yamadori, školka, semenáč…"></label>
      <label class="field"><span>Miska</span><input type="text" id="tr-pot" maxlength="80" value="${esc(v.pot)}"></label></div>
    <label class="field"><span>Poznámky</span><textarea id="tr-notes" maxlength="2000">${esc(v.notes)}</textarea></label>
    <div class="dlg-foot"><button type="button" class="btn" data-act="close">Zrušit</button><button class="btn primary">${t ? 'Uložit' : 'Přidat strom'}</button></div></form>`, {
    onSubmit() {
      const g = id => $('#tr-' + id).value.trim(), old = t && t.species;
      const data = { name: g('name'), species: g('species'), style: g('style'), acquired: g('acquired'), origin: g('origin'), pot: g('pot'), notes: g('notes') };
      if (!data.name) return;
      closeDialog();
      if (t) { Object.assign(t, data); if (old !== data.species) illuCache.delete(t.id + '|' + old); commit('Uloženo'); }
      else { const nt = { id: uid(), photos: [], log: [], coverId: null, ...data }; state.trees.push(nt); store.save(); toast('Strom přidán'); location.hash = 'strom-' + nt.id; }
    },
  });
}

function logDialog(t) {
  openDialog(`<form class="dlg">${head('Záznam do deníku')}
    <div class="row2"><label class="field"><span>Co se dělalo</span><select id="lg-type">${opts(LOG_TYPES)}</select></label>
      <label class="field"><span>Kdy</span><input type="date" id="lg-date" required value="${iso(today())}"></label></div>
    <label class="field"><span>Poznámka (nepovinná)</span><input type="text" id="lg-note" maxlength="200" placeholder="např. složení substrátu"></label>
    <div class="dlg-foot"><button type="button" class="btn" data-act="close">Zrušit</button><button class="btn primary">Zapsat</button></div></form>`, {
    onSubmit() { t.log.push({ id: uid(), type: $('#lg-type').value, date: $('#lg-date').value, note: $('#lg-note').value.trim() }); closeDialog(); commit('Zapsáno'); },
  });
}

function photoDialog(t, p) {
  openDialog(`<form class="dlg light">${head(esc(t.name))}<img src="${p.data}" alt="${esc(p.caption || t.name)}">
    <div class="row2"><label class="field"><span>Popisek</span><input type="text" id="ph-caption" maxlength="80" value="${esc(p.caption)}" placeholder="např. po jarním střihu"></label>
      <label class="field"><span>Datum pořízení</span><input type="date" id="ph-date" required value="${p.date}"></label></div>
    <div class="dlg-foot"><button type="button" class="btn danger left" data-act="del-photo" data-id="${t.id}" data-photo="${p.id}">Smazat</button>
      <button type="button" class="btn" data-act="set-cover" data-id="${t.id}" data-photo="${p.id}">Nastavit jako titulní</button><button class="btn primary">Uložit</button></div></form>`, {
    wide: true, onSubmit() { p.caption = $('#ph-caption').value.trim(); p.date = $('#ph-date').value; closeDialog(); commit('Uloženo'); },
  });
}

function settingsDialog() {
  openDialog(`<div class="dlg">${head('Záloha a data')}
    <p class="muted">Všechna data jsou uložena jen v tomto prohlížeči. Zálohu si stahujte pravidelně, hlavně před výměnou telefonu nebo počítače.</p>
    <div class="btns"><button class="btn" data-act="export">Stáhnout zálohu (JSON)</button>
      <label class="btn">Obnovit ze zálohy<input type="file" id="import-input" accept="application/json,.json" hidden data-change="import"></label></div>
    <div class="btns"><button class="btn danger" data-act="wipe">Smazat všechna data</button><button class="btn" data-act="load-demo">Načíst ukázková data</button></div></div>`);
}

async function fileToDataURL(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const k = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .82);
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- Akce ---------- */
const actions = {
  close: closeDialog,
  settings: settingsDialog,
  'new-task': el => taskDialog(null, el.dataset.tree),
  'edit-task': el => taskDialog(state.tasks.find(t => t.id === el.dataset.id)),
  'del-task': el => { state.tasks = state.tasks.filter(t => t.id !== el.dataset.id); closeDialog(); commit('Úkol smazán'); },
  'new-tree': () => treeDialog(),
  'edit-tree': el => treeDialog(tree(el.dataset.id)),
  'del-tree': el => { const t = tree(el.dataset.id); confirmBox(`Smazat strom „${esc(t.name)}“ včetně fotek, deníku a jeho úkolů? Tento krok nejde vrátit.`, 'Smazat strom', () => {
    state.trees = state.trees.filter(x => x.id !== t.id); state.tasks = state.tasks.filter(x => !(x.scope.type === 'tree' && x.scope.value === t.id));
    store.save(); toast('Strom smazán'); location.hash = 'sbirka'; }); },
  'new-log': el => logDialog(tree(el.dataset.id)),
  'del-log': el => { const t = tree(el.dataset.id); t.log = t.log.filter(l => l.id !== el.dataset.log); commit('Záznam smazán'); },
  'open-photo': el => { const t = tree(el.dataset.id); photoDialog(t, t.photos.find(p => p.id === el.dataset.photo)); },
  'del-photo': el => { const t = tree(el.dataset.id); t.photos = t.photos.filter(p => p.id !== el.dataset.photo); if (t.coverId === el.dataset.photo) t.coverId = null; closeDialog(); commit('Fotka smazána'); },
  'set-cover': el => { tree(el.dataset.id).coverId = el.dataset.photo; closeDialog(); commit('Titulní fotka nastavena'); },
  'clear-demo': () => confirmBox('Smazat ukázkové stromy a úkoly a začít s prázdnou aplikací?', 'Smazat ukázku', () => { state = { trees: [], tasks: [], demo: false }; commit('Ukázka smazána'); }),
  wipe: () => confirmBox('Smazat všechny stromy, fotky a úkoly? Tento krok nejde vrátit.', 'Smazat vše', () => { state = { trees: [], tasks: [], demo: false }; commit('Data smazána'); }),
  'load-demo': () => confirmBox('Nahradit současná data ukázkovými?', 'Načíst ukázku', () => { state = demoState(); commit('Ukázková data načtena'); }),
  export: () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' }));
    a.download = `bonsai-zaloha-${iso(today())}.json`; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000); toast('Záloha připravena ke stažení');
  },
};
const changes = {
  'toggle-task': el => {
    const t = state.tasks.find(x => x.id === el.dataset.id); if (!t) return;
    t.done = el.checked; t.doneAt = t.done ? iso(today()) : null;
    const tr = t.scope.type === 'tree' ? tree(t.scope.value) : null;
    if (tr && t.done) { t.logId = uid(); tr.log.push({ id: t.logId, type: t.title, date: t.doneAt, note: 'Splněný úkol' }); }
    if (tr && !t.done && t.logId) { tr.log = tr.log.filter(l => l.id !== t.logId); t.logId = null; }
    commit(t.done ? 'Hotovo' : 'Úkol vrácen mezi otevřené');
  },
  'filter-species': el => { filter.species = el.value; render(); },
  'add-photos': async el => {
    const t = tree(el.dataset.id), files = [...el.files]; if (!files.length) return;
    toast('Zpracovávám fotky…'); let ok = 0;
    for (const f of files) { try { t.photos.push({ id: uid(), data: await fileToDataURL(f), date: iso(new Date(f.lastModified || Date.now())), caption: '' }); ok++; } catch (e) { /* nečitelný soubor přeskočíme */ } }
    commit(ok ? `Přidáno: ${ok} ${plural(ok, 'fotka', 'fotky', 'fotek')}` : 'Soubor se nepodařilo načíst jako obrázek');
  },
  import: async el => {
    try {
      const data = JSON.parse(await el.files[0].text());
      if (!Array.isArray(data.trees) || !Array.isArray(data.tasks)) throw new Error('format');
      state = { trees: data.trees, tasks: data.tasks, demo: !!data.demo }; closeDialog(); commit('Záloha obnovena');
    } catch (e) { toast('Soubor není platná záloha Bonsai APP'); }
  },
};

document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && actions[el.dataset.act]) { e.preventDefault(); actions[el.dataset.act](el); } });
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]'); if (el && changes[el.dataset.change]) return changes[el.dataset.change](el);
  if (e.target.name === 'prec') { $('#tk-date').hidden = e.target.value !== 'day'; $('#tk-monthrow').hidden = e.target.value !== 'month'; }
  if (e.target.id === 'tk-scope') { $('#tk-tree').hidden = e.target.value !== 'tree'; $('#tk-species').hidden = e.target.value !== 'species'; }
});
document.addEventListener('input', e => {
  if (e.target.dataset.input === 'filter-q') {
    filter.q = e.target.value; const q = filter.q.toLowerCase();
    $('#cards').innerHTML = cardsHtml(state.trees.filter(t => (!filter.species || t.species === filter.species) && (!q || (t.name + ' ' + t.species).toLowerCase().includes(q))));
  }
});
document.addEventListener('submit', e => { e.preventDefault(); const d = dlg(); if (d.contains(e.target) && d._submit) d._submit(); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

(async function start() {
  const saved = await store.load();
  if (saved && Array.isArray(saved.trees) && Array.isArray(saved.tasks)) state = saved;
  else { state = demoState(); store.save(); }
  render();
})();
