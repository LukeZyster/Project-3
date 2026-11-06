// StudentMarket data layer.
// One API (window.SM) backed by Supabase when configured, or by this browser's
// localStorage in demo mode. Every page talks to SM, never to Supabase directly.
(function () {
  const cfg = window.SM_CONFIG || {};
  const hasSupabase = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase && window.supabase.createClient);

  const CATEGORIES = ['Books', 'Electronics', 'Res essentials', 'Furniture', 'Clothing', 'Other'];
  const CONDITIONS = ['New', 'Like new', 'Good', 'Used', 'Needs love'];
  const EMAIL_RE = /@(mycput|cput)\.ac\.za$/i;
  const STAFF_RE = /@cput\.ac\.za$/i;
  const EMAIL_ERROR = 'Use your CPUT email — @mycput.ac.za for students or @cput.ac.za for staff.';

  // Mirrors public.prohibited_terms in supabase/schema.sql (the database has the final say).
  const DEFAULT_TERMS = [
    ['alcohol','Alcohol'],['beer','Alcohol'],['wine','Alcohol'],['vodka','Alcohol'],['whisky','Alcohol'],['whiskey','Alcohol'],['gin','Alcohol'],['rum','Alcohol'],['brandy','Alcohol'],['tequila','Alcohol'],['liquor','Alcohol'],['cider','Alcohol'],['champagne','Alcohol'],['booze','Alcohol'],['jagermeister','Alcohol'],
    ['weed','Drugs'],['dagga','Drugs'],['cannabis','Drugs'],['marijuana','Drugs'],['thc','Drugs'],['cbd','Drugs'],['edibles','Drugs'],['kush','Drugs'],['bong','Drugs'],['cocaine','Drugs'],['mdma','Drugs'],['ecstasy','Drugs'],['lsd','Drugs'],['shrooms','Drugs'],['meth','Drugs'],['tik','Drugs'],['mandrax','Drugs'],['heroin','Drugs'],['nyaope','Drugs'],
    ['xanax','Prescription medication'],['codeine','Prescription medication'],['ritalin','Prescription medication'],['concerta','Prescription medication'],['steroids','Prescription medication'],['prescription meds','Prescription medication'],
    ['vape','Tobacco & vaping'],['vapes','Tobacco & vaping'],['vaping','Tobacco & vaping'],['e-cigarette','Tobacco & vaping'],['cigarette','Tobacco & vaping'],['cigarettes','Tobacco & vaping'],['tobacco','Tobacco & vaping'],['hookah','Tobacco & vaping'],['hubbly','Tobacco & vaping'],['nicotine','Tobacco & vaping'],['snus','Tobacco & vaping'],
    ['sex toy','Adult content'],['sex toys','Adult content'],['dildo','Adult content'],['vibrator','Adult content'],['porn','Adult content'],['adult toy','Adult content'],['fleshlight','Adult content'],['escort','Adult content'],['nudes','Adult content'],
    ['firearm','Weapons'],['handgun','Weapons'],['pistol','Weapons'],['rifle','Weapons'],['ammo','Weapons'],['ammunition','Weapons'],['taser','Weapons'],['knuckle duster','Weapons'],
    ['fake id','Fraud'],['counterfeit','Fraud'],['stolen','Fraud'],['exam answers','Academic dishonesty'],['assignment writing','Academic dishonesty'],['essay writing','Academic dishonesty']
  ].map(([term, reason]) => ({ term, reason }));
  let TERMS = DEFAULT_TERMS.slice();
  const escRe = t => t.split('').map(c => /[a-z0-9 ]/i.test(c) ? c : '\\' + c).join('');
  function findProhibited(text) {
    const t = ' ' + String(text || '').toLowerCase().replace(/[^a-z0-9\- ]+/g, ' ') + ' ';
    const hit = TERMS.slice().sort((a, b) => b.term.length - a.term.length).find(x => new RegExp('(^|[^a-z0-9])' + escRe(x.term) + '($|[^a-z0-9])').test(t));
    return hit || null;
  }
  function assertAllowed(data) {
    const hit = findProhibited((data.title || '') + ' ' + (data.description || ''));
    if (hit) throw new Error('"' + hit.term + '" can\'t be sold on StudentMarket (' + hit.reason.toLowerCase() + '). Remove it from your listing.');
  }
  function assertEmail(email) { if (!EMAIL_RE.test(String(email || '').trim())) throw new Error(EMAIL_ERROR); }

  const MERCH = [
    { id: 1, name: 'Campus Hoodie', price: 499.99, category: 'Clothing', image_url: 'assets/images/merch/varsity-hoodie.jpg', description: 'Heavyweight fleece for 8am lectures and late library nights.', stock: 25 },
    { id: 2, name: 'Student Tee', price: 199.99, category: 'Clothing', image_url: 'assets/images/merch/student-tee.jpg', description: 'Soft cotton tee in campus red. Survives res laundry.', stock: 25 },
    { id: 3, name: 'Varsity Mug', price: 89.99, category: 'Drinkware', image_url: 'assets/images/merch/varsity-mug.jpg', description: '350ml of coffee, the unofficial study partner.', stock: 25 },
    { id: 4, name: 'Notebook', price: 59.99, category: 'Stationery', image_url: 'assets/images/merch/notebook.jpg', description: 'A5, dotted pages, lies flat. Good for lecture notes.', stock: 25 },
    { id: 5, name: 'Snapback Cap', price: 149.99, category: 'Clothing', image_url: 'assets/images/merch/cap.jpg', description: 'Navy snapback with the varsity B. One size.', stock: 25 }
  ];

  // ------------------------------------------------------------------
  // Demo adapter (localStorage)
  // ------------------------------------------------------------------
  const K = { reports: 'sm_demo_reports', terms: 'sm_demo_terms', users: 'sm_demo_users', session: 'sm_demo_session', listings: 'sm_demo_listings', saved: 'sm_demo_saved', messages: 'sm_demo_messages', notes: 'sm_demo_notifications', orders: 'sm_demo_orders' };
  const read = (k, f) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch (e) { return f; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2));
  const daysAgo = d => new Date(Date.now() - d * 864e5).toISOString();
  const listeners = new Set();
  const emit = () => listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });

  const DEMO_SELLERS = [
    { id: 'seller-mila', full_name: 'Mila K.', campus: 'District Six' },
    { id: 'seller-jayden', full_name: 'Jayden M.', campus: 'Bellville' },
    { id: 'seller-anele', full_name: 'Anele N.', campus: 'District Six' },
    { id: 'seller-rene', full_name: 'Rene V.', campus: 'Mowbray' }
  ];
  function demoSeed() {
    const us = read(K.users, []);
    if (!us.some(u => u.profile.id === 'seller-mila')) { write(K.users, us.concat(DEMO_SELLERS.map(p => ({ email: null, hash: null, profile: Object.assign({ role: 'student', account_status: 'active', created_at: daysAgo(30) }, p) })))); }
    if (read(K.listings, null)) return;
    const L = (title, category, price, condition, seller, d, extra) => Object.assign({ id: uid(), title, category, price, condition, seller_id: seller, campus: DEMO_SELLERS.find(s => s.id === seller).campus, pickup_spot: '', open_to_swap: false, image_url: null, status: 'available', description: '', created_at: daysAgo(d) }, extra || {});
    write(K.listings, [
      L('Intro to Economics (Mohr, 9th ed.)', 'Books', 180, 'Good', 'seller-mila', 0.2, { description: 'Light pencil highlighting in ch. 1-4, otherwise clean. Used for ECO1. Happy to throw in my summary notes.', pickup_spot: 'Library entrance', open_to_swap: true }),
      L('Bar fridge, 46L', 'Res essentials', 1200, 'Good', 'seller-jayden', 1, { description: 'Defy bar fridge, cold and quiet. Moving out of res so it needs a new home before end of term.', pickup_spot: 'Res parking, after 4pm' }),
      L('Foldable study desk', 'Furniture', 750, 'Used', 'seller-anele', 2, { description: 'Fits a res room. A couple of scratches on top, legs solid. You collect.', pickup_spot: 'Main gate' }),
      L('Logitech wireless mouse', 'Electronics', 220, 'Like new', 'seller-rene', 3, { description: 'M185, barely used, receiver included. Battery still going.', pickup_spot: 'Student centre', open_to_swap: true }),
      L('First-year physics notes bundle', 'Books', 100, 'Good', 'seller-mila', 4, { description: 'Printed and bound notes + past papers with memos for PHY1.', pickup_spot: 'Library entrance' }),
      L('Kettle, 1.7L', 'Res essentials', 260, 'Good', 'seller-jayden', 5, { description: 'Russell Hobbs, descaled last week. Boils fast.', pickup_spot: 'Res parking' }),
      L('Campus hoodie, size M', 'Clothing', 280, 'Like new', 'seller-anele', 6, { description: 'Bought the wrong size from the store, worn twice.', image_url: 'assets/images/merch/varsity-hoodie.jpg', open_to_swap: true }),
      L('Casio fx-991ZA Plus', 'Electronics', 320, 'Good', 'seller-rene', 7, { description: 'Exam-approved calculator. Cover included.', pickup_spot: 'Engineering block' })
    ]);
  }

  async function sha(s) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  const demoProfiles = () => read(K.users, []).map(u => u.profile);
  const demoProfile = id => demoProfiles().find(p => p.id === id) || { id, full_name: 'Student', campus: '' };
  const demoMe = () => { const id = read(K.session, null); return id ? read(K.users, []).find(u => u.profile.id === id) || null : null; };
  const demoNotify = (user_id, kind, title, body, link) => {
    const n = read(K.notes, []);
    n.unshift({ id: uid(), user_id, kind, title, body, link, is_read: false, created_at: new Date().toISOString() });
    write(K.notes, n);
  };
  const withSeller = l => Object.assign({}, l, { seller: demoProfile(l.seller_id) });

  const demo = {
    mode: 'demo',
    async currentUser() { const u = demoMe(); return u ? { id: u.profile.id, email: u.email } : null; },
    async signUp({ name, email, password, campus }) {
      assertEmail(email);
      const users = read(K.users, []);
      email = email.toLowerCase().trim();
      if (users.some(u => u.email === email)) throw new Error('An account with that email already exists. Try signing in.');
      const profile = { id: uid(), full_name: name, campus: campus || '', course: '', year_of_study: '', bio: '', avatar_url: null, role: STAFF_RE.test(email) ? 'admin' : 'student', account_status: 'active', created_at: new Date().toISOString() };
      users.push({ email, hash: await sha(password), profile });
      write(K.users, users); write(K.session, profile.id); emit();
      return { needsConfirmation: false };
    },
    async signIn({ email, password }) {
      assertEmail(email);
      const u = read(K.users, []).find(x => x.email === email.toLowerCase().trim());
      if (!u || u.hash !== await sha(password)) throw new Error('That email and password don\'t match.');
      write(K.session, u.profile.id); emit();
    },
    async signOut() { localStorage.removeItem(K.session); emit(); },
    async getProfile(id) { const me = demoMe(); if (!id && me) return me.profile; return demoProfile(id); },
    async updateProfile(patch) {
      const users = read(K.users, []); const me = demoMe(); if (!me) throw new Error('Please sign in.');
      const u = users.find(x => x.profile.id === me.profile.id); Object.assign(u.profile, patch); write(K.users, users); emit(); return u.profile;
    },
    async uploadImage(file) {
      if (file.size > 1.5e6) throw new Error('In demo mode photos must be under 1.5MB. Connect Supabase for full-size uploads.');
      return await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
    },
    async init() { demoSeed(); const t = read(K.terms, null); if (t) TERMS = t; },
    async listListings() { demoSeed(); return read(K.listings, []).filter(l => l.status !== 'archived').map(withSeller).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async myListings() { const me = demoMe(); if (!me) return []; demoSeed(); return read(K.listings, []).filter(l => l.seller_id === me.profile.id).map(withSeller).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async getListing(id) { demoSeed(); const l = read(K.listings, []).find(x => x.id === id); return l ? withSeller(l) : null; },
    async createListing(data) {
      const me = demoMe(); if (!me) throw new Error('Please sign in to sell.');
      if ((me.profile.account_status || 'active') !== 'active') throw new Error('Your account can\'t list items right now. Contact a StudentMarket admin.');
      assertAllowed(data);
      demoSeed(); const all = read(K.listings, []); const l = Object.assign({ id: uid(), seller_id: me.profile.id, status: 'available', created_at: new Date().toISOString() }, data);
      all.push(l); write(K.listings, all); emit(); return withSeller(l);
    },
    async updateListing(id, patch) { if (patch.title || patch.description) assertAllowed(patch); const all = read(K.listings, []); const l = all.find(x => x.id === id); if (!l) throw new Error('Listing not found'); Object.assign(l, patch); write(K.listings, all); emit(); return l; },
    async deleteListing(id) { write(K.listings, read(K.listings, []).filter(x => x.id !== id)); emit(); },
    async savedIds() { const me = demoMe(); if (!me) return []; return read(K.saved, []).filter(s => s.user_id === me.profile.id).map(s => s.listing_id); },
    async toggleSaved(listingId) {
      const me = demoMe(); if (!me) throw new Error('Sign in to save items.');
      let s = read(K.saved, []); const has = s.some(x => x.user_id === me.profile.id && x.listing_id === listingId);
      if (has) s = s.filter(x => !(x.user_id === me.profile.id && x.listing_id === listingId));
      else {
        s.push({ user_id: me.profile.id, listing_id: listingId });
        const l = read(K.listings, []).find(x => x.id === listingId);
        if (l && l.seller_id !== me.profile.id) demoNotify(l.seller_id, 'saved', 'Someone saved your listing', '"' + l.title + '" is on a student\'s shortlist.', 'marketplace.html?item=' + l.id);
      }
      write(K.saved, s); emit(); return !has;
    },
    async messages() {
      const me = demoMe(); if (!me) return [];
      const listings = read(K.listings, []);
      return read(K.messages, []).filter(m => m.sender_id === me.profile.id || m.recipient_id === me.profile.id).map(m => Object.assign({}, m, { sender: demoProfile(m.sender_id), recipient: demoProfile(m.recipient_id), listing: listings.find(l => l.id === m.listing_id) || null }));
    },
    async sendMessage({ to, listingId, body }) {
      const me = demoMe(); if (!me) throw new Error('Sign in to send messages.');
      const m = { id: uid(), sender_id: me.profile.id, recipient_id: to, listing_id: listingId || null, body, read_at: null, created_at: new Date().toISOString() };
      const all = read(K.messages, []); all.push(m); write(K.messages, all);
      const l = read(K.listings, []).find(x => x.id === listingId);
      demoNotify(to, 'message', me.profile.full_name + ' sent you a message', (l ? 'About "' + l.title + '": ' : '') + body.slice(0, 120), 'chat.html?with=' + me.profile.id);
      emit(); return m;
    },
    async markThreadRead(otherId) { const me = demoMe(); if (!me) return; const all = read(K.messages, []); all.forEach(m => { if (m.recipient_id === me.profile.id && m.sender_id === otherId && !m.read_at) m.read_at = new Date().toISOString(); }); write(K.messages, all); },
    async notifications() { const me = demoMe(); if (!me) return []; return read(K.notes, []).filter(n => n.user_id === me.profile.id); },
    async markNotification(id, isRead) { const n = read(K.notes, []); const x = n.find(v => v.id === id); if (x) x.is_read = isRead; write(K.notes, n); emit(); },
    async markAllNotificationsRead() { const me = demoMe(); const n = read(K.notes, []); n.forEach(v => { if (me && v.user_id === me.profile.id) v.is_read = true; }); write(K.notes, n); emit(); },
    async deleteNotification(id) { write(K.notes, read(K.notes, []).filter(v => v.id !== id)); emit(); },
    async clearNotifications() { const me = demoMe(); write(K.notes, read(K.notes, []).filter(v => !me || v.user_id !== me.profile.id)); emit(); },
    async merch() { return MERCH.slice(); },
    async placeOrder(items, total) {
      const me = demoMe(); if (!me) throw new Error('Sign in to check out.');
      const o = { id: uid(), user_id: me.profile.id, items, total, status: 'placed', created_at: new Date().toISOString() };
      const all = read(K.orders, []); all.unshift(o); write(K.orders, all);
      demoNotify(me.profile.id, 'order', 'Order confirmed', 'Your merch order (R' + total.toFixed(2) + ') is ready for collection at the campus store.', 'profile.html#orders');
      emit(); return o;
    },
    async orders() { const me = demoMe(); if (!me) return []; return read(K.orders, []).filter(o => o.user_id === me.profile.id); },
    // ---- moderation ----
    async reportListing(listingId, reason) {
      const me = demoMe(); if (!me) throw new Error('Sign in to report a listing.');
      const r = read(K.reports, []); r.unshift({ id: uid(), listing_id: listingId, reporter_id: me.profile.id, reason, status: 'open', created_at: new Date().toISOString() }); write(K.reports, r); emit();
    },
    async adminUsers() {
      const all = read(K.listings, []);
      return read(K.users, []).map(u => Object.assign({}, u.profile, { email: u.email, listings: all.filter(l => l.seller_id === u.profile.id).length })).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    },
    async adminSetRole(id, role) {
      const me = demoMe(); if (!me || me.profile.role !== 'admin') throw new Error('Admins only.');
      if (id === me.profile.id) throw new Error('You can\'t change your own role.');
      const users = read(K.users, []); const u = users.find(x => x.profile.id === id); u.profile.role = role; write(K.users, users);
      demoNotify(id, 'info', role === 'admin' ? 'You\'re now a StudentMarket admin' : 'Your admin access was removed', role === 'admin' ? 'You can now moderate users and listings from the admin dashboard.' : 'Your account is now a regular student account.', role === 'admin' ? 'admin.html' : 'profile.html');
      emit();
    },
    async adminSetStatus(id, status, reason) {
      const me = demoMe(); if (!me || me.profile.role !== 'admin') throw new Error('Admins only.');
      if (id === me.profile.id) throw new Error('You can\'t change your own account status.');
      const users = read(K.users, []); const u = users.find(x => x.profile.id === id); u.profile.account_status = status; u.profile.status_reason = reason || null; write(K.users, users);
      if (status === 'banned') { const all = read(K.listings, []); all.forEach(l => { if (l.seller_id === id && l.status === 'available') l.status = 'archived'; }); write(K.listings, all); }
      demoNotify(id, 'info', status === 'active' ? 'Your account is back in good standing' : status === 'restricted' ? 'Your account has been restricted' : 'Your account has been banned', reason || '', 'profile.html');
      emit();
    },
    async adminListings() { demoSeed(); return read(K.listings, []).map(withSeller).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async adminRemoveListing(id, reason) {
      const all = read(K.listings, []); const l = all.find(x => x.id === id); if (!l) return;
      write(K.listings, all.filter(x => x.id !== id));
      const r = read(K.reports, []); r.forEach(x => { if (x.listing_id === id && x.status === 'open') x.status = 'resolved'; }); write(K.reports, r);
      demoNotify(l.seller_id, 'info', 'A listing was removed by an admin', '"' + l.title + '" was removed' + (reason ? ': ' + reason : '.'), 'profile.html');
      emit();
    },
    async adminReports() {
      const all = read(K.listings, []);
      return read(K.reports, []).map(r => Object.assign({}, r, { listing: all.find(l => l.id === r.listing_id) || null, reporter: demoProfile(r.reporter_id) }));
    },
    async adminResolveReport(id, status) { const r = read(K.reports, []); const x = r.find(v => v.id === id); if (x) x.status = status; write(K.reports, r); emit(); },
    async prohibitedTerms() { return TERMS.slice().sort((a, b) => a.term.localeCompare(b.term)); },
    async addProhibitedTerm(term, reason) { term = String(term).toLowerCase().trim(); if (term.length < 2) throw new Error('Too short.'); if (!TERMS.some(t => t.term === term)) TERMS.push({ term, reason: reason || 'Not allowed on StudentMarket' }); write(K.terms, TERMS); },
    async removeProhibitedTerm(term) { TERMS = TERMS.filter(t => t.term !== term); write(K.terms, TERMS); },
    subscribe(fn) { listeners.add(fn); const h = e => { if (e.key && e.key.startsWith('sm_demo_')) fn(); }; window.addEventListener('storage', h); return () => { listeners.delete(fn); window.removeEventListener('storage', h); }; }
  };

  // ------------------------------------------------------------------
  // Supabase adapter — matches the team's tables:
  // profiles, marketplace_listings, marketplace_categories, marketplace_favorites,
  // notifications, merch_items (+ messages and orders from supabase/schema.sql)
  // ------------------------------------------------------------------
  function makeSupabase() {
    const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
    const friendly = e => {
      const m = (e && e.message) || String(e);
      if (/Invalid login credentials/i.test(m)) return 'That email and password don\'t match.';
      if (/Email not confirmed/i.test(m)) return 'Please confirm your email first — check your inbox for the link.';
      if (/User already registered/i.test(m)) return 'An account with that email already exists. Try signing in.';
      if (/Database error saving new user/i.test(m)) return 'Sign-up failed while creating your profile. Run supabase/schema.sql in the Supabase SQL editor, then try again.';
      if (/relation .* does not exist|Could not find the table|schema cache|column .* does not exist/i.test(m)) return 'The database is missing a table or column. Run supabase/schema.sql in the Supabase SQL editor.';
      if (/Bucket not found/i.test(m)) return 'The photo bucket is missing. Run supabase/schema.sql in the Supabase SQL editor.';
      if (/CPUT_EMAIL_ONLY|enforce_cput_email/i.test(m)) return EMAIL_ERROR;
      const tagged = m.match(/(PROHIBITED_ITEM|ACCOUNT_LIMITED|ACCOUNT_BANNED|ADMIN_ONLY):\s*(.*)/);
      if (tagged) return tagged[2];
      if (/row-level security|violates row-level/i.test(m)) return 'You don\'t have permission to do that. Are you signed in?';
      if (/Failed to fetch|NetworkError/i.test(m)) return 'Can\'t reach the server. Check your connection and try again.';
      return m;
    };
    const ok = ({ data, error }) => { if (error) throw new Error(friendly(error)); return data; };
    const missingColumn = e => /column|schema cache/i.test((e && e.message) || '');

    let cachedUser;
    const me = async () => {
      if (cachedUser !== undefined) return cachedUser;
      const { data } = await sb.auth.getSession();
      cachedUser = data.session ? { id: data.session.user.id, email: data.session.user.email } : null;
      return cachedUser;
    };
    const requireMe = async msg => { const u = await me(); if (!u) throw new Error(msg || 'Please sign in first.'); return u; };
    const subs = new Set();
    const fire = () => subs.forEach(fn => { try { fn(); } catch (e) { console.error(e); } });
    sb.auth.onAuthStateChange((evt, session) => {
      cachedUser = session ? { id: session.user.id, email: session.user.email } : null;
      if (evt === 'SIGNED_IN' || evt === 'SIGNED_OUT') fire();
    });

    // categories live in their own table; keep a name <-> id map
    let cats = null;
    const loadCats = async () => {
      if (cats) return cats;
      const { data, error } = await sb.from('marketplace_categories').select('id, name');
      cats = error ? [] : data;
      return cats;
    };
    const catId = async name => { const c = (await loadCats()).find(x => x.name === name); return c ? c.id : null; };

    const normProfile = p => p ? Object.assign({}, p, { full_name: p.full_name || p.username || 'Student', campus: p.campus || p.location || '', role: p.role || 'student', account_status: p.account_status || 'active' }) : { full_name: 'Student', campus: '', role: 'student', account_status: 'active' };
    const toStatus = s => s === 'active' ? 'available' : (s || 'available');
    const fromStatus = s => s === 'available' ? 'active' : s;
    const normListing = l => {
      if (!l) return null;
      const seller = normProfile(l.seller);
      return Object.assign({}, l, {
        category: (l.category && l.category.name) || 'Other',
        condition: l.condition || 'Good',
        campus: l.campus || seller.campus || '',
        pickup_spot: l.pickup_spot || '',
        open_to_swap: !!l.open_to_swap,
        status: toStatus(l.status),
        seller
      });
    };
    const LISTING_SELECT = '*, category:marketplace_categories(name), seller:profiles!marketplace_listings_seller_id_fkey(*)';

    const noteKind = n => /chat\.html/.test(n.link_url || '') ? 'message' : /#orders/.test(n.link_url || '') ? 'order' : /item=/.test(n.link_url || '') ? 'saved' : 'info';
    const normNote = n => Object.assign({}, n, { body: n.message || '', link: n.link_url || null, kind: noteKind(n) });

    let channel = null;

    return {
      mode: 'supabase',
      client: sb,
      currentUser: me,
      async init() {
        sb.from('prohibited_terms').select('term, reason').then(({ data }) => { if (data && data.length) TERMS = data; });
        const c = await loadCats();
        if (c.length) {
          const order = ['Books', 'Electronics', 'Res essentials', 'Furniture', 'Clothing', 'Other'];
          api.CATEGORIES = c.map(x => x.name).sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
        }
      },
      async signUp({ name, email, password, campus }) {
        assertEmail(email);
        const redirect = location.href.replace(/[^/]*$/, '') + 'login.html';
        const data = ok(await sb.auth.signUp({ email, password, options: { data: { full_name: name, campus: campus || '', username: email.split('@')[0] }, emailRedirectTo: redirect } }));
        if (data.user && data.user.identities && data.user.identities.length === 0) throw new Error('An account with that email already exists. Try signing in.');
        cachedUser = data.session ? { id: data.user.id, email: data.user.email } : null;
        return { needsConfirmation: !data.session };
      },
      async signIn({ email, password }) { assertEmail(email); const d = ok(await sb.auth.signInWithPassword({ email, password })); cachedUser = { id: d.user.id, email: d.user.email }; },
      async signOut() { await sb.auth.signOut(); cachedUser = null; },
      async getProfile(id) {
        if (!id) { const u = await me(); if (!u) return null; id = u.id; }
        return normProfile(ok(await sb.from('profiles').select('*').eq('id', id).maybeSingle()) || { id });
      },
      async updateProfile(patch) {
        const u = await requireMe();
        let res = await sb.from('profiles').update(patch).eq('id', u.id).select().maybeSingle();
        if (res.error && missingColumn(res.error)) {
          const base = {}; ['full_name', 'bio', 'avatar_url'].forEach(k => { if (k in patch) base[k] = patch[k]; });
          if ('campus' in patch) base.location = patch.campus;
          res = await sb.from('profiles').update(base).eq('id', u.id).select().maybeSingle();
        }
        return normProfile(ok(res));
      },
      async uploadImage(file) {
        const u = await requireMe('Sign in to upload photos.');
        if (file.size > 6e6) throw new Error('Photos must be under 6MB.');
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const path = u.id + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        ok(await sb.storage.from('listing-images').upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type }));
        return sb.storage.from('listing-images').getPublicUrl(path).data.publicUrl;
      },
      async listListings() {
        return ok(await sb.from('marketplace_listings').select(LISTING_SELECT).neq('status', 'archived').order('created_at', { ascending: false }).limit(300)).map(normListing).filter(l => l.seller.account_status !== 'banned');
      },
      async myListings() {
        const u = await me(); if (!u) return [];
        return ok(await sb.from('marketplace_listings').select(LISTING_SELECT).eq('seller_id', u.id).order('created_at', { ascending: false })).map(normListing);
      },
      async getListing(id) { return normListing(ok(await sb.from('marketplace_listings').select(LISTING_SELECT).eq('id', id).maybeSingle())); },
      async createListing(data) {
        const u = await requireMe('Please sign in to sell.');
        assertAllowed(data);
        const row = {
          seller_id: u.id, title: data.title, description: data.description, price: data.price,
          image_url: data.image_url || null, status: 'active', category_id: await catId(data.category),
          condition: data.condition, campus: data.campus, pickup_spot: data.pickup_spot, open_to_swap: !!data.open_to_swap
        };
        let res = await sb.from('marketplace_listings').insert(row).select(LISTING_SELECT).single();
        if (res.error && missingColumn(res.error)) {
          ['condition', 'campus', 'pickup_spot', 'open_to_swap'].forEach(k => delete row[k]);
          res = await sb.from('marketplace_listings').insert(row).select(LISTING_SELECT).single();
        }
        return normListing(ok(res));
      },
      async updateListing(id, patch) {
        if (patch.title || patch.description) assertAllowed(patch);
        const p = Object.assign({}, patch);
        if (p.status) p.status = fromStatus(p.status);
        if (p.category) { p.category_id = await catId(p.category); delete p.category; }
        return normListing(ok(await sb.from('marketplace_listings').update(p).eq('id', id).select(LISTING_SELECT).single()));
      },
      async deleteListing(id) { ok(await sb.from('marketplace_listings').delete().eq('id', id)); },
      async savedIds() { const u = await me(); if (!u) return []; return ok(await sb.from('marketplace_favorites').select('listing_id').eq('user_id', u.id)).map(r => r.listing_id); },
      async toggleSaved(listingId) {
        const u = await requireMe('Sign in to save items.');
        const existing = ok(await sb.from('marketplace_favorites').select('listing_id').eq('user_id', u.id).eq('listing_id', listingId));
        if (existing.length) { ok(await sb.from('marketplace_favorites').delete().eq('user_id', u.id).eq('listing_id', listingId)); return false; }
        ok(await sb.from('marketplace_favorites').insert({ user_id: u.id, listing_id: listingId })); return true;
      },
      async messages() {
        const u = await me(); if (!u) return [];
        const { data, error } = await sb.from('messages')
          .select('*, sender:profiles!messages_sender_id_fkey(*), recipient:profiles!messages_recipient_id_fkey(*), listing:marketplace_listings(id, title, price, image_url, status)')
          .or('sender_id.eq.' + u.id + ',recipient_id.eq.' + u.id)
          .order('created_at', { ascending: true }).limit(1000);
        if (error) { if (/does not exist|Could not find/i.test(error.message)) { console.warn('messages table missing — run supabase/schema.sql'); return []; } throw new Error(friendly(error)); }
        return data.map(m => Object.assign({}, m, { sender: normProfile(m.sender), recipient: normProfile(m.recipient) }));
      },
      async sendMessage({ to, listingId, body }) {
        const u = await requireMe('Sign in to send messages.');
        return ok(await sb.from('messages').insert({ sender_id: u.id, recipient_id: to, listing_id: listingId || null, body }).select().single());
      },
      async markThreadRead(otherId) {
        const u = await me(); if (!u) return;
        await sb.from('messages').update({ read_at: new Date().toISOString() }).eq('recipient_id', u.id).eq('sender_id', otherId).is('read_at', null);
      },
      async notifications() {
        const u = await me(); if (!u) return [];
        return ok(await sb.from('notifications').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).limit(100)).map(normNote);
      },
      async markNotification(id, isRead) { ok(await sb.from('notifications').update({ is_read: isRead }).eq('id', id)); },
      async markAllNotificationsRead() { const u = await requireMe(); ok(await sb.from('notifications').update({ is_read: true }).eq('user_id', u.id).eq('is_read', false)); },
      async deleteNotification(id) { ok(await sb.from('notifications').delete().eq('id', id)); },
      async clearNotifications() { const u = await requireMe(); ok(await sb.from('notifications').delete().eq('user_id', u.id)); },
      async merch() {
        const { data, error } = await sb.from('merch_items').select('*').order('id');
        if (error || !data || !data.length) return MERCH.slice();
        return data.map(m => Object.assign({}, m, {
          price: Number(m.price),
          category: m.category || 'Merch',
          image_url: m.image_url || 'assets/images/merch/varsity-hoodie.jpg',
          description: m.description || '',
          sizes: m.sizes ? String(m.sizes).split(',').map(x => x.trim()).filter(Boolean) : [],
          colors: m.colors ? String(m.colors).split(',').map(x => x.trim()).filter(Boolean) : []
        }));
      },
      async placeOrder(items, total) { const u = await requireMe('Sign in to check out.'); return ok(await sb.from('orders').insert({ user_id: u.id, items, total }).select().single()); },
      async orders() {
        const u = await me(); if (!u) return [];
        const { data, error } = await sb.from('orders').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
        if (error) { console.warn(error.message); return []; }
        return data;
      },
      // ---- moderation ----
      async reportListing(listingId, reason) { const u = await requireMe('Sign in to report a listing.'); ok(await sb.from('listing_reports').insert({ listing_id: listingId, reporter_id: u.id, reason })); },
      async adminUsers() { return ok(await sb.rpc('admin_list_users')).map(normProfile); },
      async adminSetRole(id, role) { ok(await sb.rpc('admin_set_role', { target: id, new_role: role })); },
      async adminSetStatus(id, status, reason) { ok(await sb.rpc('admin_set_status', { target: id, new_status: status, reason: reason || null })); },
      async adminListings() { return ok(await sb.from('marketplace_listings').select(LISTING_SELECT).order('created_at', { ascending: false }).limit(500)).map(normListing); },
      async adminRemoveListing(id, reason) { ok(await sb.rpc('admin_remove_listing', { target: id, reason: reason || null })); },
      async adminReports() {
        return ok(await sb.from('listing_reports').select('*, listing:marketplace_listings(id, title, price, image_url, seller_id), reporter:profiles!listing_reports_reporter_id_fkey(*)').order('created_at', { ascending: false }).limit(200))
          .map(r => Object.assign({}, r, { reporter: normProfile(r.reporter) }));
      },
      async adminResolveReport(id, status) { ok(await sb.from('listing_reports').update({ status }).eq('id', id)); },
      async prohibitedTerms() { const d = ok(await sb.from('prohibited_terms').select('term, reason').order('term')); TERMS = d.length ? d : TERMS; return d; },
      async addProhibitedTerm(term, reason) { term = String(term).toLowerCase().trim(); ok(await sb.from('prohibited_terms').upsert({ term, reason: reason || 'Not allowed on StudentMarket' })); TERMS.push({ term, reason }); },
      async removeProhibitedTerm(term) { ok(await sb.from('prohibited_terms').delete().eq('term', term)); TERMS = TERMS.filter(t => t.term !== term); },
      subscribe(fn) {
        subs.add(fn);
        me().then(u => {
          if (!u || channel) return;
          channel = sb.channel('sm-live-' + u.id)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: 'recipient_id=eq.' + u.id }, fire)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + u.id }, fire)
            .subscribe();
        });
        return () => subs.delete(fn);
      }
    };
  }

  let api;
  try { api = hasSupabase ? makeSupabase() : demo; }
  catch (e) { console.error('Supabase failed to start, using demo mode', e); api = demo; }

  api.CATEGORIES = CATEGORIES.slice();
  api.EMAIL_RE = EMAIL_RE;
  api.EMAIL_ERROR = EMAIL_ERROR;
  api.isStaffEmail = e => STAFF_RE.test(String(e || ''));
  api.findProhibited = findProhibited;
  api.CONDITIONS = CONDITIONS;
  api.ready = Promise.resolve().then(() => api.init()).catch(e => console.warn('SM init:', e.message));
  window.SM = api;
})();
