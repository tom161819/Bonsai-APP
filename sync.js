'use strict';
/* Bonsai deník: účet a ukládání na server (Supabase).
   Klíč níže je veřejný (publishable) a smí být v kódu. Přístup k datům hlídá Row Level Security v databázi.
   Bez knihovny Supabase (např. v náhledu) zůstává aplikace v místním režimu a ukládá jen do prohlížeče. */
const SB_URL = 'https://uhyhjpinxsjqfrzgqauu.supabase.co';
const SB_KEY = 'sb_publishable_ll9MtWQsaU1UofjxYAeXAA_kMCY-F5N';
const TABLES = ['trees', 'photos', 'care_log', 'tasks'];

const cloud = {
  client: window.supabase ? window.supabase.createClient(SB_URL, SB_KEY) : null,
  user: null,
  snap: null,
  status: 'saved',
  extraPhoto: false, // true, když databáze už má sloupec pro období fotografie
  extra: false, // true, když databáze už má sloupce pro kategorii a opakování
  onStatus() {},
  _chain: Promise.resolve(),
  _pending: false,
  _state: null,

  set(status, err) { this.status = status; this.onStatus(status, err); },

  rows(state) {
    return {
      trees: state.trees.map(t => ({ id: t.id, name: t.name, species: t.species || '', style: t.style || '', acquired: String(t.acquired ?? ''),
        origin: t.origin || '', pot: t.pot || '', notes: t.notes || '', cover_id: t.coverId || null })),
      photos: state.trees.flatMap(t => t.photos.filter(p => p.path).map(p => ({ id: p.id, tree_id: t.id, path: p.path, taken_on: p.date, caption: p.caption || '', focus: p.focus || 'center', ...(this.extraPhoto ? { season: p.season || '' } : {}) }))),
      care_log: state.trees.flatMap(t => t.log.map(l => ({ id: l.id, tree_id: t.id, type: l.type, done_on: l.date, note: l.note || '' }))),
      tasks: state.tasks.map(t => ({ id: t.id, title: t.title, due: t.due || '', scope_type: t.scope.type, scope_value: t.scope.value || '', note: t.note || '',
        done: !!t.done, done_at: t.doneAt || null, log_id: t.logId || null,
        ...(this.extra ? { category: t.category || '', repeat: t.repeat || '', next_id: t.nextId || null } : {}) })),
    };
  },
  index(rows) { const o = {}; for (const k of TABLES) o[k] = new Map(rows[k].map(r => [r.id, JSON.stringify(r)])); return o; },

  async load() {
    const c = this.client;
    const res = await Promise.all(TABLES.map(n => c.from(n).select('*').order('created_at')));
    for (const r of res) if (r.error) throw r.error;
    const [tr, ph, lg, tk] = res.map(r => r.data);
    this.extraPhoto = !(await c.from('photos').select('season').limit(1)).error;
    this.extra = !(await c.from('tasks').select('category,repeat,next_id').limit(1)).error;
    const urls = new Map();
    if (ph.length) {
      const { data, error } = await c.storage.from('photos').createSignedUrls(ph.map(p => p.path), 86400);
      if (error) throw error;
      for (const s of data) if (s.signedUrl) urls.set(s.path, s.signedUrl);
    }
    const state = {
      demo: false,
      trees: tr.map(t => ({ id: t.id, name: t.name, species: t.species, style: t.style, acquired: t.acquired, origin: t.origin, pot: t.pot, notes: t.notes, coverId: t.cover_id,
        photos: ph.filter(p => p.tree_id === t.id).map(p => ({ id: p.id, path: p.path, data: urls.get(p.path) || '', date: p.taken_on, caption: p.caption, focus: p.focus, season: p.season || '' })),
        log: lg.filter(l => l.tree_id === t.id).map(l => ({ id: l.id, type: l.type, date: l.done_on, note: l.note })) })),
      tasks: tk.map(t => ({ id: t.id, title: t.title, due: t.due, scope: t.scope_type === 'general' ? { type: 'general' } : { type: t.scope_type, value: t.scope_value },
        note: t.note, done: t.done, doneAt: t.done_at, logId: t.log_id, category: t.category || '', repeat: t.repeat || '', nextId: t.next_id || null })),
    };
    this.snap = this.index(this.rows(state));
    this.set('saved');
    return state;
  },

  /* Uloží rozdíl mezi stavem v aplikaci a posledním stavem na serveru. Volání se řadí za sebe a slučují. */
  save(state) {
    this._state = state;
    if (this._pending) return;
    this._pending = true;
    this._chain = this._chain.then(() => { this._pending = false; return this._sync(this._state); });
  },
  async _sync(state) {
    this.set('saving');
    try {
      const c = this.client, uid = this.user.id;
      for (const t of state.trees) for (const p of t.photos) {
        if (p.path || !String(p.data).startsWith('data:')) continue;
        const blob = await (await fetch(p.data)).blob(), path = `${uid}/${p.id}.jpg`;
        const { error } = await c.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
        if (error) throw error;
        p.path = path;
      }
      const rows = this.rows(state), next = this.index(rows);
      for (const tbl of TABLES) {
        const changed = rows[tbl].filter(r => this.snap[tbl].get(r.id) !== next[tbl].get(r.id));
        if (changed.length) { const { error } = await c.from(tbl).upsert(changed); if (error) throw error; }
      }
      for (const tbl of ['tasks', 'care_log', 'photos', 'trees']) {
        const gone = [...this.snap[tbl].keys()].filter(id => !next[tbl].has(id));
        if (!gone.length) continue;
        if (tbl === 'photos') await c.storage.from('photos').remove(gone.map(id => JSON.parse(this.snap.photos.get(id)).path));
        const { error } = await c.from(tbl).delete().in('id', gone);
        if (error) throw error;
      }
      this.snap = next;
      this.set('saved');
    } catch (e) { this.set('error', e); }
  },
};
