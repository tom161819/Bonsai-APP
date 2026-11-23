'use strict';
/* Bonsai deník. Data se ukládají lokálně v prohlížeči (IndexedDB). */

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
/* Sezónní rádce: [název období, co je vhodné, čemu se vyhnout] pro leden až prosinec. */
const SEASON = [
  ['Zimní klid', ['Kontrolujte vlhkost substrátu v zimovišti, nesmí úplně vyschnout.', 'Naplánujte přesazování a objednejte substráty a misky.', 'V bezmrazých dnech lze drátovat jehličnany.'],
    ['Nepřesazujte, kořeny teď nerostou.', 'Nezalévejte zmrzlý substrát a nehnojte.']],
  ['Příprava na sezónu', ['Připravte a prosejte substráty.', 'Sledujte pupeny, ke konci měsíce začíná přesazování raných druhů.', 'Vhodná doba na zimní postřik proti přezimujícím škůdcům.'],
    ['Nepřenášejte stromy předčasně do tepla, vyraší příliš brzy.', 'Nehnojte.']],
  ['Hlavní čas přesazování', ['Listnáče přesazujte, jakmile nalévají pupeny.', 'Strukturální střih proveďte ještě před rašením.', 'Čerstvě přesazené stromy chraňte před mrazíky a větrem.'],
    ['Nehnojte čerstvě přesazené stromy.', 'Nepřesazujte stromy, které už mají rozvinuté listy.']],
  ['Rašení', ['Dokončete přesazování borovic a jalovců.', 'S hnojením začněte zhruba měsíc po přesazení.', 'Hlídejte pozdní mrazy, mladé výhony jsou citlivé.'],
    ['Nepřesazujte listnáče v plném listu.', 'Nedávejte čerstvě přesazené stromy na plné slunce a vítr.']],
  ['Růst naplno', ['Zaštipujte nové výhony listnáčů pro jemnější větvení.', 'Hnojte pravidelně.', 'Kontrolujte mšice a další škůdce na mladých výhonech.'],
    ['Nepřesazujte, na většinu druhů je už pozdě.', 'Nedefoliujte slabé nebo loni přesazené stromy.']],
  ['Formování přírůstků', ['Defoliace jen u zdravých a silných listnáčů.', 'U borovic je čas na práci se svíčkami.', 'Kontrolujte dráty, v plném růstu rychle zarůstají.'],
    ['Nepřesazujte.', 'Nedělejte velké zásahy na oslabených stromech.']],
  ['Horko', ['V horku zalévejte i dvakrát denně, ideálně ráno a večer.', 'Citlivé druhy přistiňte před poledním sluncem.', 'Při vysokých teplotách hnojení omezte.'],
    ['Nepřesazujte a nedělejte silný střih.', 'Nenechávejte misky na rozpálené dlažbě, kořeny se přehřejí.']],
  ['Pozdní léto', ['Zálivka zůstává prioritou.', 'Znovu zkontrolujte zarůstající dráty.', 'Koncem měsíce přejděte na hnojivo s nižším obsahem dusíku.'],
    ['Nestříhejte silně, nové výhony by do zimy nevyzrály.', 'Koncem měsíce už nehnojte dusíkem.']],
  ['Podzimní příprava', ['Podzimní hnojení posiluje stromy před zimou.', 'Dobrá doba na drátování jehličnanů.', 'U borovic vyberte pupeny a proředte přehuštěná místa.'],
    ['Nehnojte dusíkatým hnojivem.', 'Nedělejte silný střih listnáčů.']],
  ['Barvení a opad', ['U borovic vyčistěte staré jehličí.', 'Po opadu listí je dobře vidět struktura, vhodná doba na drátování listnáčů.', 'Připravte zimoviště.'],
    ['Většinu druhů už nepřesazujte.', 'Nepřestávejte zalévat, i strom bez listí potřebuje vlhký substrát.']],
  ['Zazimování', ['Po prvních mrazících přesuňte stromy do zimoviště.', 'Chraňte kořenový bal: zapusťte misky do země nebo zamulčujte.', 'Listnáče lze po opadu listí stříhat, větší rány zatřete.'],
    ['Nenechávejte venkovní druhy v teple domova, potřebují zimní klid.', 'Nehnojte.']],
  ['Zimní klid', ['Občas zkontrolujte vlhkost substrátu.', 'Vyčistěte a nabruste nářadí.', 'Projděte fotky z roku a naplánujte další sezónu.'],
    ['Nepřelévejte, v chladu substrát vysychá pomalu.', 'Nepřenášejte stromy do vytápěné místnosti.']],
];

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
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
  db: null, ok: true,
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
    } catch (e) { this.db = null; this.ok = false; return null; }
  },
  save() {
    if (cloud.user) return cloud.save(state);
    if (!this.db) return;
    try { this.db.transaction('kv', 'readwrite').objectStore('kv').put(state, 'state'); } catch (e) { this.ok = false; }
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
const MON = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];
function deadline(t) {
  if (!t.due) return null;
  const [y, m, d] = t.due.split('-').map(Number);
  return t.due.length === 7 ? new Date(y, m, 0) : new Date(y, m - 1, d);
}
/* Stav se vždy sděluje i slovem a značkou, ne jen barvou. */
function dueInfo(t) {
  if (!t.due) return { text: '', cls: '' };
  const diff = Math.round((deadline(t) - today()) / 864e5);
  if (diff < 0) return { text: t.due.length === 7 ? '▲ po termínu' : `▲ ${-diff} ${days(-diff)} po termínu`, cls: 'is-late' };
  if (t.due.length === 7) {
    const [y, m] = t.due.split('-').map(Number), n = today();
    return n.getFullYear() === y && n.getMonth() === m - 1 ? { text: '◆ tento měsíc', cls: 'is-soon' } : { text: '', cls: '' };
  }
  if (diff === 0) return { text: '◆ dnes', cls: 'is-soon' };
  if (diff === 1) return { text: '◆ zítra', cls: 'is-soon' };
  if (diff <= 14) return { text: `◆ za ${diff} ${days(diff)}`, cls: 'is-soon' };
  return { text: '', cls: '' };
}
const byDeadline = (a, b) => (deadline(a)?.getTime() ?? Infinity) - (deadline(b)?.getTime() ?? Infinity);
const tree = id => state.trees.find(t => t.id === id);
const speciesInUse = () => [...new Set(state.trees.map(t => t.species).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'cs'));
const tasksFor = t => state.tasks.filter(x => (x.scope.type === 'tree' && x.scope.value === t.id) || (x.scope.type === 'species' && x.scope.value === t.species));
function scopeTag(s) {
  if (s.type === 'tree') { const t = tree(s.value); return t ? `<a class="tag t" href="#strom-${t.id}" title="Úkol pro strom ${esc(t.name)}">${esc(t.name)}</a>` : '<span class="tag g">Smazaný strom</span>'; }
  if (s.type === 'species') return `<span class="tag s" title="Úkol pro všechny stromy druhu ${esc(s.value)}">${esc(s.value)}</span>`;
  return '<span class="tag g" title="Obecný úkol">Obecné</span>';
}
function whenCol(t) {
  const s = t.done && t.doneAt ? t.doneAt : t.due;
  if (!s) return '<span class="d word">—</span><span class="m">bez termínu</span>';
  const [y, m, d] = s.split('-').map(Number);
  return s.length === 7 ? `<span class="d word">${MONTHS[m - 1]}</span><span class="m">${y}</span>` : `<span class="d">${d}.</span><span class="m">${MON[m - 1]} ${y}</span>`;
}
function taskRow(t) {
  const d = t.done ? { text: '✓ hotovo', cls: 'is-done' } : dueInfo(t);
  return `<li class="entry ${d.cls}">
    <label class="tick" for="chk-${t.id}"><input type="checkbox" id="chk-${t.id}" data-change="toggle-task" data-id="${t.id}" ${t.done ? 'checked' : ''} aria-label="${t.done ? 'Vrátit mezi otevřené' : 'Označit jako hotové'}: ${esc(t.title)}"></label>
    <div class="when">${whenCol(t)}</div>
    <div class="what"><label for="chk-${t.id}">${esc(t.title)}</label>
      <div class="meta">${d.text ? `<span class="state">${d.text}</span>` : ''}${scopeTag(t.scope)}</div>
      ${t.note ? `<div class="memo">${esc(t.note)}</div>` : ''}</div>
    <button class="icon-btn" data-act="edit-task" data-id="${t.id}" aria-label="Upravit úkol ${esc(t.title)}" title="Upravit">⋯</button></li>`;
}
function taskList(tasks, emptyTitle, emptyText) {
  const open = tasks.filter(t => !t.done).sort(byDeadline);
  const done = tasks.filter(t => t.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
  return (open.length ? `<ul class="entries">${open.map(taskRow).join('')}</ul>` : `<div class="blank"><strong>${emptyTitle}</strong><span>${emptyText}</span></div>`) +
    (done.length ? `<details class="done-list"><summary>Splněné (${done.length})</summary><ul class="entries">${done.map(taskRow).join('')}</ul></details>` : '');
}

/* ---------- Obraz stromu: fotografie, nebo tušová kresba ---------- */
const POS = { top: '50% 10%', center: '50% 50%', bottom: '50% 90%' };
const illuCache = new Map();
function illustration(t) {
  const key = t.id + '|' + t.species;
  if (illuCache.has(key)) return illuCache.get(key);
  let seed = 7; for (const c of key) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const f = n => n.toFixed(1);
  const sp = (t.species || '').toLowerCase();
  const conifer = /borovic|jalovec|smrk|tis|modřín|jedle|cypři/.test(sp), maple = /javor/.test(sp);
  const lean = (rnd() - .5) * 30, n = 6, pts = [[200, 404]];
  for (let i = 1; i <= n; i++) { const p = pts[i - 1]; pts.push([p[0] + lean * (1 - i / n * 1.7) + (rnd() - .5) * 22, p[1] - 40 - rnd() * 6]); }
  let trunk = '', limbs = '', pads = '';
  const pad = (x, y, r) => { for (let k = 0; k < 6; k++) pads += `<ellipse cx="${f(x + (rnd() - .5) * r * 1.5)}" cy="${f(y + (rnd() - .65) * r * .6)}" rx="${f(r * (.5 + rnd() * .4))}" ry="${f(r * (conifer ? .26 : .42) * (.8 + rnd() * .4))}"/>`; };
  for (let i = 1; i <= n; i++) {
    const a = pts[i - 1], b = pts[i], w = 24 - (i - 1) * 3.6;
    trunk += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke-width="${f(w)}"/>`;
    if (i >= 2 && i < n) {
      const side = i % 2 ? 1 : -1, len = (104 - i * 11) * (.75 + rnd() * .4), ex = b[0] + side * len, ey = b[1] - 4 - rnd() * 16;
      limbs += `<path d="M${f(b[0])} ${f(b[1])}Q${f(b[0] + side * len * .5)} ${f(b[1] + 8)} ${f(ex)} ${f(ey)}" stroke-width="${f(Math.max(2.500, w * .34))}"/>`;
      pad(ex, ey, 44 - i * 3);
    }
  }
  pad(pts[n][0], pts[n][1] - 2, 40);
  const deep = rnd() > .5, ph = deep ? 34 : 24;
  const svg = `<svg class="ink" viewBox="0 0 400 460" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Kresba místo fotografie: ${esc(t.name || t.species || 'strom')}">
    <circle cx="${rnd() > .5 ? 292 : 108}" cy="${f(150 + rnd() * 40)}" r="74" fill="var(--clay-wash)"/>
    <line x1="36" y1="${404 + ph + 6.500}" x2="364" y2="${404 + ph + 6.500}" stroke="var(--rule)" stroke-width="1"/>
    <g fill="var(--clay)"><path d="M116 404h168l-${deep ? 10 : 16} ${ph}h-${deep ? 148 : 136}z"/><rect x="142" y="${404 + ph}" width="20" height="6"/><rect x="238" y="${404 + ph}" width="20" height="6"/></g>
    <g fill="none" stroke="var(--ink)" stroke-linecap="round">${trunk}${limbs}</g>
    <g fill="${maple ? 'var(--clay)' : 'var(--moss)'}" opacity="${conifer ? .62 : .5}">${pads}</g></svg>`;
  illuCache.set(key, svg); return svg;
}
const EMPTY_POT = `<svg class="ink" viewBox="0 0 400 460" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Kresba prázdné misky">
  <circle cx="290" cy="170" r="74" fill="var(--clay-wash)"/><line x1="36" y1="434.500" x2="364" y2="434.500" stroke="var(--rule)"/>
  <g fill="var(--clay)"><path d="M116 404h168l-16 24h-136z"/><rect x="142" y="428" width="20" height="6"/><rect x="238" y="428" width="20" height="6"/></g>
  <path d="M200 404v-34" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" fill="none"/>
  <g fill="var(--moss)" opacity=".6"><ellipse cx="188" cy="366" rx="14" ry="6" transform="rotate(-24 188 366)"/><ellipse cx="213" cy="362" rx="14" ry="6" transform="rotate(22 213 362)"/></g></svg>`;
const coverPhoto = t => t.photos.find(p => p.id === t.coverId) || [...t.photos].sort((a, b) => b.date.localeCompare(a.date))[0] || null;
function pic(t, p = coverPhoto(t), lazy = true) {
  return p && p.data ? `<img src="${p.data}" alt="${esc(p.caption || t.name)}" style="object-position:${POS[p.focus] || POS.center}" ${lazy ? 'loading="lazy"' : ''}>` : illustration(t) + '<span class="nophoto">bez fotografie</span>';
}
const catNo = t => 'N° ' + pad(state.trees.indexOf(t) + 1);

/* ---------- Ikony ---------- */
const ico = d => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.500" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON = {
  home: ico('<path d="M5 4h14v16H5zM9 4v16M12.500 9h3.500M12.500 13h3.500"/>'),
  tree: ico('<path d="M12 17v-5M7 17h10l-1 3H8zM12 12c-4 0-7-1.500-7-4.500S8 3 12 3s7 1.500 7 4.500S16 12 12 12z"/>'),
  map: ico('<path d="M12 21s6-5.500 6-10.500a6 6 0 0 0-12 0C6 15.500 12 21 12 21z"/><circle cx="12" cy="10.500" r="2"/>'),
};
const SEAL = `<svg class="seal" viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="3" fill="var(--clay)"/><g fill="none" stroke="var(--paper)" stroke-width="1.600" stroke-linecap="round"><path d="M13 19v-6c0-2 2-2.500 3.500-4"/><path d="M8 19h10"/><path d="M7 10.500h7M12.500 7h7"/></g></svg>`;

/* ---------- Vykreslení ---------- */
function route() {
  const h = location.hash.replace('#', '');
  if (h.startsWith('strom-')) return { view: 'tree', id: h.slice(6) };
  return { view: ['sbirka', 'yamadori'].includes(h) ? h : 'prehled' };
}
let filter = { q: '', species: '' };
function render() {
  if (cloud.client && !cloud.user) return;
  const r = route(), cur = v => (r.view === v || (v === 'sbirka' && r.view === 'tree')) ? 'aria-current="page"' : '';
  const body = r.view === 'tree' ? viewTree(r.id) : r.view === 'sbirka' ? viewCollection() : r.view === 'yamadori' ? viewYamadori() : viewDashboard();
  const link = (v, label, extra = '') => `<a href="#${v}" ${cur(v)}>${label}${extra}</a>`;
  $('#app').innerHTML = `<header class="top"><div class="top-in gut">
      <a class="brand" href="#prehled" aria-label="Bonsai deník, přehled">${SEAL}${r.view === 'prehled' ? '' : '<span>Bonsai deník</span>'}</a>
      <nav class="links" aria-label="Hlavní navigace">${link('prehled', ICON.home + '<span>Přehled</span>')}${link('sbirka', ICON.tree + '<span>Moje sbírka</span>')}${link('yamadori', ICON.map + '<span>Yamadori</span>', '<span class="soon-tag">ve vývoji</span>')}</nav>
      <span class="util-wrap">${cloud.user ? '<button class="sync" id="sync" data-act="retry-sync"></button>' : ''}<button class="util" data-act="settings">${cloud.user ? 'Účet a záloha' : 'Záloha a data'}</button></span></div></header>
    <main class="gut"><div class="wrap ${r.view === 'prehled' ? 'dash' : ''}">${body}</div></main>
    <nav class="tabs" aria-label="Hlavní navigace">${link('prehled', ICON.home + '<span>Přehled</span>')}${link('sbirka', ICON.tree + '<span>Sbírka</span>')}${link('yamadori', ICON.map + '<span>Yamadori</span>')}</nav>`;
  paintSync();
}
const strips = () => (pendingLocal ? `<div class="note-strip strip-wrap"><span>V tomto prohlížeči je uložený deník z dřívějška (${pendingLocal.trees.length} ${plural(pendingLocal.trees.length, 'strom', 'stromy', 'stromů')}, ${pendingLocal.tasks.length} ${plural(pendingLocal.tasks.length, 'úkol', 'úkoly', 'úkolů')}). Chcete ho přenést do účtu?</span><span class="btns"><button class="btn small primary" data-act="adopt-local">Přenést do účtu</button><button class="btn small quiet" data-act="skip-local">Nepřenášet</button></span></div>` : '') +
  (store.ok || cloud.user ? '' : '<div class="note-strip warn strip-wrap" role="alert"><span>Tento prohlížeč nepovolil ukládání. Změny vydrží jen do zavření stránky, proto si stáhněte zálohu.</span><button class="btn small quiet" data-act="settings">Záloha a data</button></div>') +
  (state.demo && !cloud.user ? '<div class="note-strip strip-wrap"><span>Deník je předvyplněný ukázkovými stromy a úkoly, abyste viděli, jak vypadá zaplněný.</span><button class="btn small quiet" data-act="clear-demo">Smazat ukázku a začít</button></div>' : '');

/* Sezónní panel: okno čtyř měsíců, které lze šipkami posouvat o měsíc dřív nebo později. */
let seasonOff = 0, seasonBusy = false;
const SEASON_MIN = -5, SEASON_MAX = 6;
function monthHtml(rel) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + rel);
  const m = d.getMonth(), [title, good, bad] = SEASON[m];
  const label = rel === 0 ? 'právě teď' : rel === -1 ? 'minulý měsíc' : rel === 1 ? 'příští měsíc' : rel > 1 ? `za ${rel} ${rel < 5 ? 'měsíce' : 'měsíců'}` : `před ${-rel} měsíci`;
  return `<section class="month ${rel === 0 ? 'now' : rel < 0 ? 'past' : ''}" ${rel === 0 ? 'aria-current="true"' : ''}>
    <p class="eyebrow"><span class="mname">${MONTHS[m]} ${d.getFullYear()}</span><span class="rel">${label}</span></p><h3>${title}</h3>
    <p class="kind">Vhodné</p><ul class="good">${good.map(x => `<li>${x}</li>`).join('')}</ul>
    <p class="kind">Nevhodné</p><ul class="bad">${bad.map(x => `<li>${x}</li>`).join('')}</ul></section>`;
}
const CHEV = up => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${up ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}"/></svg>`;
function seasonHtml() {
  return `<aside class="season" aria-label="Sezónní rádce"><div class="sec-head"><h2>Sezóna</h2><span class="side"><button class="btn small quiet" id="season-today" data-act="season-today" ${seasonOff ? '' : 'hidden'}>Zpět na dnešek</button><span id="season-hint" ${seasonOff ? 'hidden' : ''}>co dělat a čemu se vyhnout</span></span></div>
    <button class="season-arrow" id="season-up" data-act="season-shift" data-dir="-1" aria-label="O měsíc dřív" title="O měsíc dřív" ${seasonOff <= SEASON_MIN ? 'disabled' : ''}>${CHEV(true)}</button>
    <div class="season-view" id="season-view" aria-live="polite"><div class="season-track" id="season-track">${[-1, 0, 1, 2].map(i => monthHtml(seasonOff + i)).join('')}</div></div>
    <button class="season-arrow" id="season-down" data-act="season-shift" data-dir="1" aria-label="O měsíc později" title="O měsíc později" ${seasonOff >= SEASON_MAX ? 'disabled' : ''}>${CHEV(false)}</button></aside>`;
}
function paintSeasonCtl() {
  $('#season-up').disabled = seasonOff <= SEASON_MIN; $('#season-down').disabled = seasonOff >= SEASON_MAX;
  $('#season-today').hidden = !seasonOff; $('#season-hint').hidden = !!seasonOff;
}
function seasonShift(dir) {
  const next = seasonOff + dir, view = $('#season-view'), track = $('#season-track');
  if (seasonBusy || next < SEASON_MIN || next > SEASON_MAX) return;
  seasonOff = next; paintSeasonCtl();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { track.innerHTML = [-1, 0, 1, 2].map(i => monthHtml(seasonOff + i)).join(''); return; }
  seasonBusy = true;
  const GAP = 12, EASE = '.5s cubic-bezier(.22, .8, .24, 1)';
  view.style.height = view.offsetHeight + 'px';
  track.insertAdjacentHTML(dir > 0 ? 'beforeend' : 'afterbegin', monthHtml(seasonOff + (dir > 0 ? 2 : -1)));
  const kids = track.children, comes = dir > 0 ? kids[kids.length - 1] : kids[0], goes = dir > 0 ? kids[0] : kids[kids.length - 1];
  const dIn = comes.offsetHeight + GAP, dOut = goes.offsetHeight + GAP;
  comes.classList.add('entering');
  if (dir < 0) { track.style.transition = 'none'; track.style.transform = `translateY(${-dIn}px)`; }
  track.getBoundingClientRect();
  track.style.transition = 'transform ' + EASE; view.style.transition = 'height ' + EASE;
  track.style.transform = dir > 0 ? `translateY(${-dOut}px)` : 'translateY(0)';
  view.style.height = (track.offsetHeight - dOut) + 'px';
  goes.classList.add('leaving'); comes.classList.remove('entering');
  setTimeout(() => {
    goes.remove(); track.style.transition = 'none'; track.style.transform = ''; view.style.transition = ''; view.style.height = '';
    seasonBusy = false;
  }, 520);
}
function viewDashboard() {
  const n = new Date(), open = state.tasks.filter(t => !t.done), late = open.filter(t => dueInfo(t).cls === 'is-late').length;
  return `<div class="dash-main">
      <header class="lead-text"><div><p class="eyebrow">${DAYS[n.getDay()]} ${n.getDate()}. ${MONTHS_GEN[n.getMonth()]} ${n.getFullYear()}</p><h1 class="display">Bonsai deník</h1>
        <p class="summary"><strong>${state.trees.length}</strong> ${plural(state.trees.length, 'strom', 'stromy', 'stromů')} ve sbírce, <strong>${open.length}</strong> ${plural(open.length, 'otevřený úkol', 'otevřené úkoly', 'otevřených úkolů')}${late ? `, z toho <strong>${late} po termínu</strong>` : ''}.</p></div>
        <button class="btn primary" data-act="new-task"><span class="plus">+</span> Přidat úkol</button></header>
      <section class="diary frame"><div class="sec-head"><h2>Nejbližší úkoly</h2><span class="side">řazeno podle termínu</span></div>
        ${taskList(state.tasks, 'Diář je prázdný.', 'Zapište první úkol tlačítkem Přidat úkol, třeba přesazení na jaře.')}</section>
      ${strips()}
      <section class="catalog-sec"><div class="sec-head"><h2>Sbírka</h2><span class="side"><a href="#sbirka">Celý katalog →</a></span></div>
        ${state.trees.length ? `<div class="catalog compact" style="padding-top:18px">${state.trees.slice(0, 12).map(t => item(t, true)).join('')}</div>`
        : `<div class="blank"><strong>Zatím bez stromů.</strong><span>První strom přidáte v sekci Moje sbírka.</span><a class="btn small" href="#sbirka">Otevřít sbírku</a></div>`}</section>
    </div>
    ${seasonHtml()}`;
}

function item(t, compact) {
  const open = tasksFor(t).filter(x => !x.done).length, counts = [open ? `${open} ${plural(open, 'úkol', 'úkoly', 'úkolů')}` : '', t.photos.length ? `${t.photos.length} ${plural(t.photos.length, 'fotografie', 'fotografie', 'fotografií')}` : ''].filter(Boolean).join(' · ');
  return `<a class="item" href="#strom-${t.id}"><span class="plate">${pic(t)}</span>
    <span class="line"><span class="no">${catNo(t)}</span><h3>${esc(t.name)}</h3></span>
    <span class="sub">${esc(t.species || 'Druh neuveden')}</span>${!compact && counts ? `<span class="counts">${counts}</span>` : ''}</a>`;
}
function catalogHtml() {
  const q = filter.q.toLowerCase();
  const list = state.trees.filter(t => (!filter.species || t.species === filter.species) && (!q || (t.name + ' ' + t.species).toLowerCase().includes(q)));
  return list.length ? `<div class="catalog">${list.map(t => item(t)).join('')}</div>`
    : `<div class="blank"><strong>Nic nenalezeno.</strong><span>Hledání ani filtru neodpovídá žádný strom. Zkuste jiný název nebo druh.</span><button class="btn small" data-act="reset-filter">Zrušit filtr</button></div>`;
}
function viewCollection() {
  const sp = speciesInUse();
  if (!state.trees.length) return `<header class="page-head"><div><p class="eyebrow">Katalog</p><h1>Moje sbírka</h1></div></header>
    <div class="empty-shelf"><span class="plate">${EMPTY_POT}</span><div class="txt"><h2>Sbírka čeká na první strom</h2>
      <p class="muted">Každý strom dostane vlastní stránku s fotografiemi, poznámkami, úkoly a deníkem péče. Stačí název a druh, zbytek doplníte časem.</p>
      <button class="btn primary" data-act="new-tree"><span class="plus">+</span> Přidat první strom</button></div></div>`;
  return `<header class="page-head"><div><p class="eyebrow">Katalog · ${state.trees.length} ${plural(state.trees.length, 'strom', 'stromy', 'stromů')} · ${sp.length} ${plural(sp.length, 'druh', 'druhy', 'druhů')}</p><h1>Moje sbírka</h1></div>
      <button class="btn primary" data-act="new-tree"><span class="plus">+</span> Přidat strom</button></header>
    <div class="filters"><input type="search" id="flt-q" placeholder="Hledat podle názvu nebo druhu" value="${esc(filter.q)}" data-input="filter-q" aria-label="Hledat ve sbírce">
      <select id="flt-species" data-change="filter-species" aria-label="Filtr podle druhu"><option value="">Všechny druhy</option>${sp.map(s => `<option ${s === filter.species ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
    <div id="cards">${catalogHtml()}</div>`;
}

function viewTree(id) {
  const t = tree(id);
  if (!t) return `<a class="back" href="#sbirka">← Moje sbírka</a><div class="blank"><strong>Tato stránka v deníku není.</strong><span>Strom byl nejspíš smazán nebo odkaz neplatí.</span><a class="btn small" href="#sbirka">Zpět do sbírky</a></div>`;
  const photos = [...t.photos].sort((a, b) => b.date.localeCompare(a.date));
  const log = [...t.log].sort((a, b) => b.date.localeCompare(a.date));
  const fact = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
  return `<a class="back" href="#sbirka">← Moje sbírka</a>
    <article class="leaf"><div class="plate">${pic(t, coverPhoto(t), false)}</div>
      <div class="leaf-text"><header><p class="eyebrow">${catNo(t)} · ${esc(t.species || 'Druh neuveden')}</p><h1>${esc(t.name)}</h1></header>
        ${t.style || t.acquired || t.origin || t.pot ? `<dl class="facts">${fact('Styl', t.style)}${fact('Ve sbírce od', t.acquired)}${fact('Původ', t.origin)}${fact('Miska', t.pot)}</dl>` : ''}
        <div class="stack"><h2 class="notes-h">Pěstitelské poznámky</h2>
          ${t.notes ? `<p class="notes">${esc(t.notes)}</p>` : '<p class="muted">Zatím prázdné. Zapište si, co na stromě pozorujete a kam ho chcete vést.</p>'}</div>
        <div class="btns"><button class="btn" data-act="edit-tree" data-id="${t.id}">Upravit údaje a poznámky</button><button class="btn danger" data-act="del-tree" data-id="${t.id}">Smazat strom</button></div></div></article>
    <div class="spread even">
      <section><div class="sec-head"><h2>Úkoly</h2><button class="btn small primary" data-act="new-task" data-tree="${t.id}"><span class="plus">+</span> Přidat úkol</button></div>
        ${taskList(tasksFor(t), 'Nic naplánováno.', 'Úkol přidaný odsud dostane štítek tohoto stromu.')}</section>
      <section><div class="sec-head"><h2>Deník péče</h2><button class="btn small" data-act="new-log" data-id="${t.id}"><span class="plus">+</span> Záznam</button></div>
        ${log.length ? `<ul class="log">${log.map(l => `<li><time datetime="${l.date}">${fmtDate(l.date)}</time><div><div class="kind">${esc(l.type)}</div>${l.note ? `<div class="memo">${esc(l.note)}</div>` : ''}</div>
          <button class="icon-btn" data-act="del-log" data-id="${t.id}" data-log="${l.id}" aria-label="Smazat záznam ${esc(l.type)}" title="Smazat">×</button></li>`).join('')}</ul>`
        : '<div class="blank"><strong>Deník je zatím čistý.</strong><span>Zapisujte přesazení, drátování nebo střih. Splněné úkoly se sem zapisují samy.</span></div>'}</section>
    </div>
    <section><div class="sec-head"><h2>Fotografie</h2><button class="btn small" data-act="pick-photos"><span class="plus">+</span> Přidat fotografie</button>
      <input type="file" id="photo-input" accept="image/*" multiple hidden data-change="add-photos" data-id="${t.id}"></div>
      ${photos.length ? `<div class="shots">${photos.map(p => `<button class="shot" data-act="open-photo" data-id="${t.id}" data-photo="${p.id}" aria-label="Otevřít fotografii z ${fmtDate(p.date)}"><span class="plate">${pic(t, p)}</span><span class="cap">${fmtDate(p.date)}${p.caption ? ' · ' + esc(p.caption) : ''}</span></button>`).join('')}</div>`
      : '<div class="blank"><strong>Zatím bez fotografie.</strong><span>Foťte strom ve stejném světle a ze stejného úhlu, nejlépe proti klidnému pozadí. Za pár let uvidíte jeho vývoj.</span></div>'}</section>`;
}

function contours() {
  let out = '';
  for (const [cx, cy, c] of [[170, 150, 1], [470, 210, 2.200], [690, 70, 4]]) for (let k = 1; k <= 8; k++) {
    let d = '';
    for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, r = k * 27 * (1 + .13 * Math.sin(3 * a + c + k * .3) + .08 * Math.cos(5 * a + c * 2));
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r * 1.250).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`; }
    out += `<path d="${d}Z" stroke-width="${k % 4 === 0 ? 1.600 : .8}"/>`;
  }
  const mark = (x, y) => `<g transform="translate(${x} ${y})"><circle r="9" fill="var(--paper)" stroke="var(--clay)" stroke-width="1.500"/><path d="M-4 0h8M0-4v8" stroke="var(--clay)" stroke-width="1.500"/></g>`;
  return `<svg viewBox="0 0 800 340" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="none" stroke="var(--rule)">${out}</g>
    <path d="M40 300C180 250 260 300 380 240S560 150 760 170" fill="none" stroke="var(--ink-2)" stroke-width="1.200" stroke-dasharray="1 7" stroke-linecap="round"/>${mark(205, 128)}${mark(486, 196)}${mark(640, 96)}</svg>`;
}
function viewYamadori() {
  const finds = [
    ['Borovice na skalní hraně', 'Borovice lesní', '49.5632 N · 15.9412 E', 'Kmen asi 8 cm, výrazný pohyb. Na jaře podkopat kořeny z jedné strany.', 'jaro 2028'],
    ['Habr u staré meze', 'Habr obecný', '49.7108 N · 16.2650 E', 'Okousaný zvěří, hustý spodek. Domluvit souhlas vlastníka pozemku.', 'březen 2027'],
    ['Modřín v lomu', 'Modřín opadavý', '50.0871 N · 17.1933 E', 'Roste v puklině, kořeny mělko. Ověřit, jestli půjde vyjmout s balem.', 'zatím neurčeno'],
  ];
  return `<header class="page-head"><div><p class="eyebrow">Terénní zápisník</p><h1>Yamadori</h1></div><span class="stamp">ve vývoji</span></header>
    <div class="field-map">${contours()}<div class="msg"><h2>Mapa je ve vývoji</h2>
      <p>Tady bude mapa vašich soukromých bodů nálezů: stromy vyhlédnuté v přírodě, které čekají na vyzvednutí. Body uvidíte jen vy.</p></div></div>
    <section><div class="sec-head"><h2>Jak bude vypadat zápis nálezu</h2><span class="side">ukázka, ne vaše data</span></div>
      <div class="finds">${finds.map(([name, sp, co, note, pick], i) => `<article class="find"><span class="plate">${illustration({ id: 'yama' + i, name, species: sp })}</span>
        <div><p class="eyebrow">${sp}</p><h3>${name}</h3></div><p class="coord">${co}</p><p class="hand">${note}</p>
        <div class="pick"><span>Vyzvednutí</span><span>${pick}</span></div></article>`).join('')}</div></section>
    <section><div class="sec-head"><h2>Co se chystá</h2></div>
      <ol class="plan-list"><li>Mapa (Mapy.cz nebo Google Maps) s body nálezů, které přidáte kliknutím nebo z aktuální polohy v terénu.</li>
        <li>U každého bodu fotografie, druh stromu a upravitelné poznámky.</li><li>Termín vyzvednutí, který se propíše mezi úkoly v diáři.</li>
        <li>Po vyzvednutí převod bodu na stránku stromu ve sbírce.</li></ol></section>`;
}

/* ---------- Dialogy ---------- */
const dlg = () => $('#dlg');
function openDialog(html, { wide = false, onSubmit } = {}) {
  const d = dlg(); d.className = wide ? 'wide' : ''; d.innerHTML = html; d._submit = onSubmit;
  if (!d.open) d.showModal();
}
function closeDialog() { const d = dlg(); if (d.open) d.close(); d.innerHTML = ''; }
const head = title => `<div class="dlg-head"><h2>${title}</h2><button type="button" class="icon-btn" data-act="close" aria-label="Zavřít">×</button></div>`;
function confirmBox(title, text, yesLabel, onYes) {
  openDialog(`<form class="dlg" novalidate>${head(title)}<p>${text}</p><div class="dlg-foot"><button type="button" class="btn quiet" data-act="close">Ponechat</button><button class="btn primary">${yesLabel}</button></div></form>`,
    { onSubmit: () => { closeDialog(); onYes(); } });
}
let toastTimer;
function toast(msg, bad) { const el = $('#toast'); el.textContent = msg; el.className = bad ? 'bad' : ''; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, bad ? 4500 : 2200); }
const opts = (list, sel) => list.map(x => `<option ${x === sel ? 'selected' : ''}>${esc(x)}</option>`).join('');
const F = (id, label, control) => `<div class="field"><label for="${id}">${label}</label>${control}<p class="err" id="e-${id}" role="alert" hidden></p></div>`;
function fail(id, msg) { const el = $('#' + id), e = $('#e-' + id); el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', 'e-' + id); e.textContent = msg; e.hidden = false; el.focus(); }
function clearErr(el) { if (el.getAttribute('aria-invalid')) { el.removeAttribute('aria-invalid'); const e = $('#e-' + el.id); if (e) e.hidden = true; } }

function taskDialog(task, presetTree) {
  const t = task || { title: '', due: '', scope: presetTree ? { type: 'tree', value: presetTree } : { type: 'general' }, note: '' };
  const prec = task ? (!t.due ? 'none' : t.due.length === 7 ? 'month' : 'day') : (presetTree ? 'month' : 'day');
  const n = today(), [my, mm] = t.due && t.due.length === 7 ? t.due.split('-').map(Number) : [n.getFullYear(), n.getMonth() + 1];
  const sp = speciesInUse(), noTrees = !state.trees.length;
  openDialog(`<form class="dlg" novalidate>${head(task ? 'Upravit úkol' : 'Nový úkol')}
    ${F('tk-title', 'Co je potřeba udělat', `<input type="text" id="tk-title" maxlength="120" list="tk-hints" value="${esc(t.title)}" placeholder="např. Přesadit" autocomplete="off">`)}
    <datalist id="tk-hints">${TASK_HINTS.map(h => `<option value="${h}">`).join('')}</datalist>
    <fieldset class="field"><legend>Termín</legend><div class="stack"><div class="seg">
      <label><input type="radio" name="prec" id="tk-prec-day" value="day" ${prec === 'day' ? 'checked' : ''}>Konkrétní den</label>
      <label><input type="radio" name="prec" id="tk-prec-month" value="month" ${prec === 'month' ? 'checked' : ''}>Celý měsíc</label>
      <label><input type="radio" name="prec" id="tk-prec-none" value="none" ${prec === 'none' ? 'checked' : ''}>Bez termínu</label></div>
      <input type="date" id="tk-date" aria-label="Datum" value="${t.due.length === 10 ? t.due : iso(n)}" ${prec === 'day' ? '' : 'hidden'}><p class="err" id="e-tk-date" role="alert" hidden></p>
      <div class="row2" id="tk-monthrow" ${prec === 'month' ? '' : 'hidden'}><select id="tk-month" aria-label="Měsíc">${MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === mm ? 'selected' : ''}>${m}</option>`).join('')}</select>
        <input type="number" id="tk-year" aria-label="Rok" inputmode="numeric" value="${my}"></div><p class="err" id="e-tk-year" role="alert" hidden></p></div></fieldset>
    <fieldset class="field"><legend>Štítek: čeho se úkol týká</legend><div class="stack">
      <select id="tk-scope" aria-label="Typ štítku"><option value="general" ${t.scope.type === 'general' ? 'selected' : ''}>Obecný úkol</option>
        <option value="tree" ${t.scope.type === 'tree' ? 'selected' : ''} ${noTrees ? 'disabled' : ''}>Konkrétní strom</option>
        <option value="species" ${t.scope.type === 'species' ? 'selected' : ''} ${noTrees ? 'disabled' : ''}>Všechny stromy jednoho druhu</option></select>
      <select id="tk-tree" aria-label="Strom" ${t.scope.type === 'tree' ? '' : 'hidden'}>${state.trees.map(x => `<option value="${x.id}" ${x.id === t.scope.value ? 'selected' : ''}>${esc(x.name)} (${esc(x.species)})</option>`).join('')}</select>
      <select id="tk-species" aria-label="Druh" ${t.scope.type === 'species' ? '' : 'hidden'}>${opts(sp, t.scope.value)}</select>
      ${noTrees ? '<p class="help">Štítek stromu nebo druhu půjde zvolit, jakmile bude ve sbírce první strom.</p>' : ''}</div></fieldset>
    ${F('tk-note', 'Poznámka (nepovinná)', `<input type="text" id="tk-note" maxlength="200" value="${esc(t.note)}">`)}
    <div class="dlg-foot">${task ? `<button type="button" class="btn danger left" data-act="del-task" data-id="${task.id}">Smazat úkol</button>` : ''}
      <button type="button" class="btn quiet" data-act="close">Zrušit</button><button class="btn primary">${task ? 'Uložit úkol' : 'Přidat úkol'}</button></div></form>`, {
    onSubmit() {
      const p = $('input[name="prec"]:checked', dlg()).value, sc = $('#tk-scope').value, title = $('#tk-title').value.trim(), yr = Number($('#tk-year').value);
      if (!title) return fail('tk-title', 'Napište, co je potřeba udělat.');
      if (p === 'day' && !$('#tk-date').value) return fail('tk-date', 'Vyberte den, nebo zvolte termín na celý měsíc.');
      if (p === 'month' && !(yr >= 2000 && yr <= 2100)) return fail('tk-year', 'Zadejte rok mezi 2000 a 2100.');
      const due = p === 'day' ? $('#tk-date').value : p === 'month' ? `${yr}-${pad($('#tk-month').value)}` : '';
      const data = { title, due, note: $('#tk-note').value.trim(),
        scope: sc === 'tree' ? { type: 'tree', value: $('#tk-tree').value } : sc === 'species' ? { type: 'species', value: $('#tk-species').value } : { type: 'general' } };
      if (task) Object.assign(task, data); else state.tasks.push({ id: uid(), done: false, doneAt: null, logId: null, ...data });
      closeDialog(); commit(task ? 'Úkol uložen' : 'Úkol přidán');
    },
  });
}

function treeDialog(t) {
  const v = t || { name: '', species: '', style: '', acquired: '', origin: '', pot: '', notes: '' };
  const tx = (id, label, val, extra = '') => F('tr-' + id, label, `<input type="text" id="tr-${id}" maxlength="80" value="${esc(val)}" autocomplete="off" ${extra}>`);
  openDialog(`<form class="dlg" novalidate>${head(t ? 'Upravit strom' : 'Nový strom')}
    <div class="row2">${tx('name', 'Název', v.name, 'placeholder="např. Borovice č. 2"')}${tx('species', 'Druh', v.species, 'list="tr-species-list" placeholder="např. Borovice lesní"')}</div>
    <datalist id="tr-species-list">${[...new Set([...speciesInUse(), ...SPECIES])].map(s => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="row2">${tx('style', 'Styl', v.style, 'list="tr-style-list"')}${F('tr-acquired', 'Ve sbírce od roku', `<input type="number" id="tr-acquired" inputmode="numeric" value="${esc(v.acquired)}">`)}</div>
    <datalist id="tr-style-list">${STYLES.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
    <div class="row2">${tx('origin', 'Původ', v.origin, 'placeholder="yamadori, školka, semenáč"')}${tx('pot', 'Miska', v.pot)}</div>
    ${t ? '' : F('tr-photo', 'Fotografie (nepovinná)', '<input type="file" id="tr-photo" accept="image/*">')}
    ${F('tr-notes', 'Pěstitelské poznámky', `<textarea id="tr-notes" maxlength="2000">${esc(v.notes)}</textarea>`)}
    <div class="dlg-foot"><button type="button" class="btn quiet" data-act="close">Zrušit</button><button class="btn primary">${t ? 'Uložit strom' : 'Přidat strom'}</button></div></form>`, {
    async onSubmit() {
      const g = id => $('#tr-' + id).value.trim(), old = t && t.species;
      const data = { name: g('name'), species: g('species'), style: g('style'), acquired: g('acquired'), origin: g('origin'), pot: g('pot'), notes: g('notes') };
      if (!data.name) return fail('tr-name', 'Dejte stromu název, podle kterého ho poznáte.');
      if (!data.species) return fail('tr-species', 'Doplňte druh. Podle něj fungují druhové štítky úkolů.');
      if (data.acquired && !(data.acquired >= 1900 && data.acquired <= 2100)) return fail('tr-acquired', 'Zadejte rok mezi 1900 a 2100, nebo pole nechte prázdné.');
      if (t) { closeDialog(); Object.assign(t, data); if (old !== data.species) illuCache.delete(t.id + '|' + old); return commit('Strom uložen'); }
      const nt = { id: uid(), photos: [], log: [], coverId: null, ...data }, file = $('#tr-photo').files[0];
      if (file) {
        try { nt.photos.push({ id: uid(), data: await fileToDataURL(file), date: iso(new Date(file.lastModified || Date.now())), caption: '' }); }
        catch (e) { return fail('tr-photo', 'Soubor se nepodařilo načíst jako obrázek. Zkuste JPG nebo PNG.'); }
      }
      closeDialog(); state.trees.push(nt); store.save(); toast('Strom přidán do sbírky'); location.hash = 'strom-' + nt.id;
    },
  });
}

function logDialog(t) {
  openDialog(`<form class="dlg" novalidate>${head('Záznam do deníku')}
    <div class="row2">${F('lg-type', 'Co se dělalo', `<select id="lg-type">${opts(LOG_TYPES)}</select>`)}${F('lg-date', 'Kdy', `<input type="date" id="lg-date" value="${iso(today())}">`)}</div>
    ${F('lg-note', 'Poznámka (nepovinná)', '<input type="text" id="lg-note" maxlength="200" placeholder="např. složení substrátu">')}
    <div class="dlg-foot"><button type="button" class="btn quiet" data-act="close">Zrušit</button><button class="btn primary">Zapsat do deníku</button></div></form>`, {
    onSubmit() {
      if (!$('#lg-date').value) return fail('lg-date', 'Vyberte den, kdy jste na stromě pracovali.');
      t.log.push({ id: uid(), type: $('#lg-type').value, date: $('#lg-date').value, note: $('#lg-note').value.trim() }); closeDialog(); commit('Zapsáno do deníku');
    },
  });
}

function photoDialog(t, p) {
  const fo = p.focus || 'center';
  openDialog(`<form class="dlg light" novalidate>${head(esc(t.name))}<img src="${p.data}" alt="${esc(p.caption || t.name)}">
    <div class="row2">${F('ph-caption', 'Popisek', `<input type="text" id="ph-caption" maxlength="80" value="${esc(p.caption)}" placeholder="např. po jarním střihu">`)}
      ${F('ph-date', 'Datum pořízení', `<input type="date" id="ph-date" value="${p.date}">`)}</div>
    ${F('ph-focus', 'Výřez v katalogu', `<select id="ph-focus"><option value="top" ${fo === 'top' ? 'selected' : ''}>Koruna (horní část snímku)</option><option value="center" ${fo === 'center' ? 'selected' : ''}>Střed snímku</option><option value="bottom" ${fo === 'bottom' ? 'selected' : ''}>Miska a pata kmene (spodní část)</option></select>`)}
    <div class="dlg-foot"><button type="button" class="btn danger left" data-act="del-photo" data-id="${t.id}" data-photo="${p.id}">Smazat fotografii</button>
      <button type="button" class="btn quiet" data-act="set-cover" data-id="${t.id}" data-photo="${p.id}">Nastavit jako titulní</button><button class="btn primary">Uložit</button></div></form>`, {
    wide: true, onSubmit() {
      if (!$('#ph-date').value) return fail('ph-date', 'Doplňte datum pořízení, fotografie se podle něj řadí.');
      p.caption = $('#ph-caption').value.trim(); p.date = $('#ph-date').value; p.focus = $('#ph-focus').value; closeDialog(); commit('Fotografie uložena');
    },
  });
}

function settingsDialog() {
  const acct = cloud.user;
  openDialog(`<div class="dlg">${head(acct ? 'Účet a záloha' : 'Záloha a data')}
    ${acct ? `<div class="stack"><p class="eyebrow">Přihlášený účet</p><p style="overflow-wrap:anywhere">${esc(acct.email)}</p>
      <div class="btns"><button class="btn" data-act="sign-out">Odhlásit se</button><button class="btn quiet" data-act="change-pass">Změnit heslo</button></div></div>
      <p class="help" style="border-top:1px solid var(--rule);padding-top:18px">Deník se ukládá na server k vašemu účtu a vidíte ho jen vy. Zálohu do souboru si můžete stáhnout kdykoli.</p>`
    : '<p class="help">Deník je uložený jen v tomto prohlížeči. Zálohu si stahujte pravidelně, hlavně před výměnou telefonu nebo počítače.</p>'}
    <div class="btns"><button class="btn" data-act="export">Stáhnout zálohu</button><button class="btn" data-act="pick-import">Obnovit ze zálohy</button>
      <input type="file" id="import-input" accept="application/json,.json" hidden data-change="import"></div>
    <div class="btns" style="border-top:1px solid var(--rule);padding-top:18px">${acct ? '' : '<button class="btn quiet" data-act="load-demo">Načíst ukázková data</button>'}<button class="btn danger" data-act="wipe">Smazat všechna data</button></div></div>`);
}

/* ---------- Účet ---------- */
let pendingLocal = null, gate = { mode: 'in', note: '' };
const SYNC_TEXT = { saving: 'Ukládám…', saved: 'Uloženo', error: 'Neuloženo, zkusit znovu' };
function paintSync() { const el = $('#sync'); if (el) { el.textContent = SYNC_TEXT[cloud.status]; el.className = 'sync ' + cloud.status; el.disabled = cloud.status !== 'error'; } }
function authMsg(e) {
  const m = (e && (e.code || '') + ' ' + (e.message || '')).toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid_credentials')) return 'E-mail nebo heslo nesedí. Zkuste to znovu, nebo si heslo obnovte.';
  if (m.includes('not confirmed')) return 'E-mail ještě není potvrzený. Klikněte na odkaz ve zprávě, kterou jsme vám poslali.';
  if (m.includes('already registered') || m.includes('user_already_exists')) return 'Účet s tímto e-mailem už existuje. Přihlaste se, nebo si obnovte heslo.';
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Příliš mnoho pokusů za sebou. Počkejte chvíli a zkuste to znovu.';
  if (m.includes('weak') || m.includes('at least')) return 'Heslo je příliš slabé. Použijte aspoň 8 znaků.';
  if (m.includes('different from the old') || m.includes('same_password')) return 'Nové heslo musí být jiné než dosavadní.';
  if (m.includes('fetch') || m.includes('network')) return 'Server je nedostupný. Zkontrolujte připojení k internetu a zkuste to znovu.';
  return 'Nepodařilo se to. Zkuste to prosím za chvíli znovu.';
}
function renderGate() {
  const g = gate, title = { in: 'Přihlášení', up: 'Nový účet', reset: 'Obnova hesla' }[g.mode];
  $('#app').innerHTML = `<main class="gate gut"><div class="gate-in">
    <div class="gate-lead">${SEAL}<h1 class="display">Bonsai deník</h1>
      <p class="summary">Osobní deník pěstitele: sbírka stromů, úkoly podle termínu, fotografie vývoje a poznámky. Svůj deník vidíte jen vy.</p></div>
    <form class="gate-form" id="gate-form" novalidate><h2>${title}</h2>
      ${g.note ? `<p class="gate-note" role="status">${g.note}</p>` : ''}
      ${F('au-email', 'E-mail', `<input type="text" inputmode="email" id="au-email" autocomplete="email" autocapitalize="none" spellcheck="false" value="${esc(g.email || '')}">`)}
      ${g.mode === 'reset' ? '' : F('au-pass', g.mode === 'up' ? 'Heslo (aspoň 8 znaků)' : 'Heslo', `<input type="password" id="au-pass" autocomplete="${g.mode === 'up' ? 'new-password' : 'current-password'}">`)}
      <p class="err" id="e-gate" role="alert" hidden></p>
      <button class="btn primary" id="au-submit">${{ in: 'Přihlásit se', up: 'Založit účet', reset: 'Poslat odkaz pro obnovu' }[g.mode]}</button>
      <div class="gate-links">${g.mode === 'in' ? '<button type="button" data-act="gate-mode" data-mode="up">Založit nový účet</button><button type="button" data-act="gate-mode" data-mode="reset">Zapomenuté heslo</button>'
        : '<button type="button" data-act="gate-mode" data-mode="in">Zpět na přihlášení</button>'}</div></form></div></main>`;
}
async function gateSubmit() {
  const email = $('#au-email').value.trim(), pass = $('#au-pass') ? $('#au-pass').value : '', here = location.origin + location.pathname, auth = cloud.client.auth;
  $('#e-gate').hidden = true;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail('au-email', 'Zadejte e-mail ve tvaru jmeno@domena.cz.');
  if (gate.mode === 'in' && !pass) return fail('au-pass', 'Zadejte heslo.');
  if (gate.mode === 'up' && pass.length < 8) return fail('au-pass', 'Heslo musí mít aspoň 8 znaků.');
  const btn = $('#au-submit'); btn.disabled = true; gate.email = email;
  let res;
  try {
    res = gate.mode === 'in' ? await auth.signInWithPassword({ email, password: pass })
      : gate.mode === 'up' ? await auth.signUp({ email, password: pass, options: { emailRedirectTo: here } })
      : await auth.resetPasswordForEmail(email, { redirectTo: here });
  } catch (e) { res = { error: e }; }
  if (res.error) { btn.disabled = false; const el = $('#e-gate'); el.textContent = authMsg(res.error); el.hidden = false; return; }
  if (gate.mode === 'up' && !res.data.session) { gate = { mode: 'in', email, note: 'Účet je založený. Poslali jsme vám e-mail s potvrzovacím odkazem, po kliknutí se můžete přihlásit.' }; renderGate(); }
  if (gate.mode === 'reset') { gate = { mode: 'in', email, note: 'Pokud účet s tímto e-mailem existuje, přišel na něj odkaz pro nastavení nového hesla.' }; renderGate(); }
}
function passwordDialog(title) {
  openDialog(`<form class="dlg" novalidate>${head(title)}${F('np-pass', 'Nové heslo (aspoň 8 znaků)', '<input type="password" id="np-pass" autocomplete="new-password">')}
    <div class="dlg-foot"><button type="button" class="btn quiet" data-act="close">Zrušit</button><button class="btn primary">Uložit heslo</button></div></form>`, {
    async onSubmit() {
      const p = $('#np-pass').value;
      if (p.length < 8) return fail('np-pass', 'Heslo musí mít aspoň 8 znaků.');
      const { error } = await cloud.client.auth.updateUser({ password: p });
      if (error) return fail('np-pass', authMsg(error));
      closeDialog(); toast('Heslo změněno');
    },
  });
}
/* Místní data dostanou při přenosu do účtu nová jedinečná id. */
function reid(s) {
  const map = new Map(), n = id => { if (!map.has(id)) map.set(id, uid()); return map.get(id); };
  const trees = s.trees.map(t => ({ ...t, id: n(t.id), coverId: t.coverId ? n(t.coverId) : null,
    photos: (t.photos || []).filter(p => String(p.data).startsWith('data:')).map(p => ({ ...p, id: n(p.id), path: undefined })),
    log: (t.log || []).map(l => ({ ...l, id: n(l.id) })) }));
  const tasks = s.tasks.map(t => ({ ...t, id: n(t.id), logId: t.logId ? n(t.logId) : null, scope: t.scope.type === 'tree' ? { type: 'tree', value: n(t.scope.value) } : t.scope }));
  return { trees, tasks, demo: false };
}
async function enter() {
  $('#app').innerHTML = '<main class="gate gut"><p class="eyebrow" role="status">Otevírám deník…</p></main>';
  try {
    state = await cloud.load();
    const local = await store.load();
    pendingLocal = local && !local.demo && Array.isArray(local.trees) && Array.isArray(local.tasks) && (local.trees.length || local.tasks.length) && !state.trees.length && !state.tasks.length
      && !localSkipped() ? local : null;
    render();
  } catch (e) {
    $('#app').innerHTML = `<main class="gate gut"><div class="blank" role="alert"><strong>Deník se nepodařilo načíst.</strong><span>${authMsg(e)}</span>
      <span class="btns"><button class="btn primary" data-act="reload">Zkusit znovu</button><button class="btn quiet" data-act="sign-out">Odhlásit se</button></span></div></main>`;
  }
}
const localSkipped = () => { try { return localStorage.getItem('bonsai-skip-local') === cloud.user.id; } catch (e) { return false; } };

async function fileToDataURL(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', .84);
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- Akce ---------- */
const actions = {
  close: closeDialog,
  'season-shift': el => seasonShift(Number(el.dataset.dir)),
  'season-today': () => { seasonOff = 0; const el = $('.season'); if (el) el.outerHTML = seasonHtml(); },
  'gate-mode': el => { gate = { mode: el.dataset.mode, email: $('#au-email') ? $('#au-email').value.trim() : '', note: '' }; renderGate(); },
  'sign-out': async () => { closeDialog(); await cloud.client.auth.signOut(); },
  'change-pass': () => passwordDialog('Změna hesla'),
  reload: () => enter(),
  'retry-sync': () => cloud.save(state),
  'adopt-local': () => { state = reid(pendingLocal); pendingLocal = null; commit('Deník se přenáší do účtu'); },
  'skip-local': () => { try { localStorage.setItem('bonsai-skip-local', cloud.user.id); } catch (e) { /* jen pohodlí */ } pendingLocal = null; render(); },
  'pick-photos': () => $('#photo-input').click(),
  'pick-import': () => $('#import-input').click(),
  'reset-filter': () => { filter = { q: '', species: '' }; render(); },
  settings: settingsDialog,
  'new-task': el => taskDialog(null, el.dataset.tree),
  'edit-task': el => taskDialog(state.tasks.find(t => t.id === el.dataset.id)),
  'del-task': el => { state.tasks = state.tasks.filter(t => t.id !== el.dataset.id); closeDialog(); commit('Úkol smazán'); },
  'new-tree': () => treeDialog(),
  'edit-tree': el => treeDialog(tree(el.dataset.id)),
  'del-tree': el => { const t = tree(el.dataset.id); confirmBox('Smazat strom?', `Strom „${esc(t.name)}“ zmizí ze sbírky i s fotografiemi, deníkem a svými úkoly. Tento krok nejde vrátit.`, 'Smazat strom', () => {
    state.trees = state.trees.filter(x => x.id !== t.id); state.tasks = state.tasks.filter(x => !(x.scope.type === 'tree' && x.scope.value === t.id));
    store.save(); toast('Strom smazán'); location.hash = 'sbirka'; }); },
  'new-log': el => logDialog(tree(el.dataset.id)),
  'del-log': el => { const t = tree(el.dataset.id); t.log = t.log.filter(l => l.id !== el.dataset.log); commit('Záznam smazán'); },
  'open-photo': el => { const t = tree(el.dataset.id); photoDialog(t, t.photos.find(p => p.id === el.dataset.photo)); },
  'del-photo': el => { const t = tree(el.dataset.id); t.photos = t.photos.filter(p => p.id !== el.dataset.photo); if (t.coverId === el.dataset.photo) t.coverId = null; closeDialog(); commit('Fotka smazána'); },
  'set-cover': el => { tree(el.dataset.id).coverId = el.dataset.photo; closeDialog(); commit('Titulní fotka nastavena'); },
  'clear-demo': () => confirmBox('Smazat ukázku?', 'Ukázkové stromy a úkoly zmizí a deník bude prázdný, připravený na vaši sbírku.', 'Smazat ukázku', () => { state = { trees: [], tasks: [], demo: false }; commit('Ukázka smazána'); }),
  wipe: () => confirmBox('Smazat všechna data?', 'Zmizí všechny stromy, fotografie i úkoly. Tento krok nejde vrátit, proto si nejdřív stáhněte zálohu.', 'Smazat vše', () => { state = { trees: [], tasks: [], demo: false }; commit('Data smazána'); }),
  'load-demo': () => confirmBox('Načíst ukázku?', 'Současný obsah deníku se nahradí ukázkovými stromy a úkoly.', 'Načíst ukázku', () => { state = demoState(); commit('Ukázková data načtena'); }),
  export: async () => {
    const copy = JSON.parse(JSON.stringify(state));
    try {
      for (const t of copy.trees) for (const p of t.photos) if (p.data && !p.data.startsWith('data:')) {
        const blob = await (await fetch(p.data)).blob();
        p.data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); });
      }
    } catch (e) { return toast('Fotografie se nepodařilo stáhnout do zálohy. Zkontrolujte připojení a zkuste to znovu.', true); }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(copy)], { type: 'application/json' }));
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
    toast('Zpracovávám fotografie…'); let ok = 0;
    for (const f of files) { try { t.photos.push({ id: uid(), data: await fileToDataURL(f), date: iso(new Date(f.lastModified || Date.now())), caption: '' }); ok++; } catch (e) { /* nečitelný soubor přeskočíme */ } }
    store.save(); render(); ok ? toast(`Přidáno: ${ok} ${plural(ok, 'fotografie', 'fotografie', 'fotografií')}`) : toast('Soubor se nepodařilo načíst jako obrázek. Zkuste JPG nebo PNG.', true);
  },
  import: async el => {
    try {
      const data = JSON.parse(await el.files[0].text());
      if (!Array.isArray(data.trees) || !Array.isArray(data.tasks)) throw new Error('format');
      state = cloud.user ? reid(data) : { trees: data.trees, tasks: data.tasks, demo: !!data.demo }; closeDialog(); commit('Záloha obnovena');
    } catch (e) { toast('Tento soubor není záloha Bonsai deníku. Vyberte soubor bonsai-zaloha….json.', true); }
  },
};

document.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && actions[el.dataset.act]) { e.preventDefault(); actions[el.dataset.act](el); } });
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]'); if (el && changes[el.dataset.change]) return changes[el.dataset.change](el);
  if (e.target.name === 'prec') { $('#tk-date').hidden = e.target.value !== 'day'; $('#tk-monthrow').hidden = e.target.value !== 'month'; }
  if (e.target.id === 'tk-scope') { $('#tk-tree').hidden = e.target.value !== 'tree'; $('#tk-species').hidden = e.target.value !== 'species'; }
});
document.addEventListener('input', e => {
  clearErr(e.target);
  if (e.target.dataset.input === 'filter-q') { filter.q = e.target.value; $('#cards').innerHTML = catalogHtml(); }
});
document.addEventListener('submit', e => { e.preventDefault(); if (e.target.id === 'gate-form') return gateSubmit(); const d = dlg(); if (d.contains(e.target) && d._submit) d._submit(); });
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

(async function start() {
  if (!cloud.client) {
    const saved = await store.load();
    if (saved && Array.isArray(saved.trees) && Array.isArray(saved.tasks)) state = saved;
    else { state = demoState(); store.save(); }
    return render();
  }
  cloud.onStatus = (status) => { paintSync(); if (status === 'error') toast('Změny se nepodařilo uložit na server. Zkontrolujte připojení.', true); };
  window.addEventListener('beforeunload', e => { if (cloud.user && cloud.status !== 'saved') e.preventDefault(); });
  cloud.client.auth.onAuthStateChange((event, session) => setTimeout(async () => {
    if (!session) { cloud.user = null; state = { trees: [], tasks: [], demo: false }; closeDialog(); return renderGate(); }
    const fresh = !cloud.user || cloud.user.id !== session.user.id;
    cloud.user = session.user;
    if (fresh) await enter();
    if (event === 'PASSWORD_RECOVERY') passwordDialog('Nastavte si nové heslo');
  }, 0));
})();
