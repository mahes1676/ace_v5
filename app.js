  'use strict';

  // ══════════════════════════════════════════════════════════════
  // CORE UTILITIES (M8.2 + M8.5)
  // ══════════════════════════════════════════════════════════════

  function setEl(id,val){ const e=document.getElementById(id); if(e) e.textContent=val; }
  function getEl(id){ return document.getElementById(id); }
  function show(id){ getEl(id)?.classList.remove('hidden'); }
  function hide(id){ getEl(id)?.classList.add('hidden'); }

  // M8.4 — Empty state
  function emptyState(msg,icon='📭'){
    return `<div class="dash-empty"><div style="font-size:2rem;margin-bottom:var(--space-3);">${icon}</div>${msg}</div>`;
  }

  // M8.3 — Loading state
  function showLoading(id,msg='Loading…'){
    const e=getEl(id);
    if(e) e.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;gap:var(--space-3);padding:var(--space-10);color:var(--text-muted);"><div class="loading-spinner"></div><span class="font-mono" style="font-size:var(--text-sm);">${msg}</span></div>`;
  }

  // M8.5 — Safe render wrapper
  function safeRender(fn, fallbackId){
    try { fn(); }
    catch(e){
      console.error('[ACE]',e);
      const el=getEl(fallbackId);
      if(el) el.innerHTML=`<div class="dash-empty" style="color:var(--error);">⚠ Something went wrong. Please refresh.</div>`;
    }
  }

  // M8.6 — Toast
  function showToast(msg,type='success'){
    let c=document.querySelector('.toast-container');
    if(!c){ c=document.createElement('div'); c.className='toast-container'; document.body.appendChild(c); }
    const icons={success:'✓',error:'✕',warning:'⚠'};
    const cols={success:'var(--success)',error:'var(--error)',warning:'var(--warning)'};
    const t=document.createElement('div');
    t.className=`toast toast-${type}`;
    t.innerHTML=`<span style="font-weight:700;color:${cols[type]}">${icons[type]}</span><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(()=>{ t.style.cssText='opacity:0;transform:translateY(8px);transition:all 300ms ease;'; setTimeout(()=>t.remove(),300); },3500);
  }

  // Shared wing helpers
  function wingBadgeSmall(wing){
    if(wing==='AI')               return `<span class="badge badge-ai"    style="font-size:10px;">⚡ AI</span>`;
    if(wing==='Cybersecurity')    return `<span class="badge badge-cyber"  style="font-size:10px;">🔐 Cyber</span>`;
    if(wing==='Embedded Systems') return `<span class="badge badge-embedded" style="font-size:10px;">🔧 Embedded</span>`;
    return `<span class="badge badge-neutral" style="font-size:10px;">${wing||'All'}</span>`;
  }

  function goBackToDash(){
    const s=getSession();
    navigate(s ? getDashboardRoute(s.role) : 'login');
  }

  // ══════════════════════════════════════════════════════════════
  // M1 — SPA ROUTER
  // ══════════════════════════════════════════════════════════════

  const ROUTES=['design-system','home','login','register','member','winglead','studentlead','corelead','inventory','minutes'];
  const PROTECTED=['member','winglead','studentlead','corelead','inventory','minutes'];

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 9 — Cross-file navigation
  // ══════════════════════════════════════════════════════════════
  // index.html, login.html, and register.html are now standalone files.
  // Everything else (member, winglead, studentlead, corelead, inventory,
  // minutes, design-system) still lives together as hash-routed sections
  // inside dashboard.html, exactly as before.
  // STANDALONE_PAGES maps a route name to its real filename.
  const STANDALONE_PAGES={home:'index.html',login:'login.html',register:'register.html'};
  // The current file, detected from the URL path, so navigate() knows
  // whether a requested page is "already here" (just toggle visibility)
  // or "somewhere else" (do a real page load).
  function currentFile(){
    const p=window.location.pathname.split('/').pop();
    return p===''?'index.html':p; // a bare "/" is served by GitHub Pages as index.html
  }
  function isStandalonePage(page){ return Object.prototype.hasOwnProperty.call(STANDALONE_PAGES,page); }
  // Checks an actual filename (e.g. "index.html") against the VALUES of
  // STANDALONE_PAGES — not a guessed route key. This is what handleRoute()
  // must use, since stripping ".html" off "index.html" gives "index", which
  // is not a key in STANDALONE_PAGES (the key is "home").
  function isStandaloneFile(file){ return Object.values(STANDALONE_PAGES).includes(file); }

  function navigate(page){
    if(typeof guardRoute==='function' && !guardRoute(page)) return;

    // Milestone 9: if the target page now lives in its own file, and we're
    // not already in that file, do a real page load instead of toggling a
    // hidden div. (sessionStorage/notificationStore already used elsewhere
    // for state, so this round-trip doesn't lose anything important.)
    if(isStandalonePage(page) && currentFile()!==STANDALONE_PAGES[page]){
      window.location.href=STANDALONE_PAGES[page];
      return;
    }
    // Going from a standalone page (home/login/register) to a protected
    // dashboard page now means: load dashboard.html and let it pick up the
    // hash on arrival.
    if(!isStandalonePage(page) && !document.querySelector(`[data-page="${page}"]`)){
      window.location.href=`dashboard.html#${page}`;
      return;
    }

    document.querySelectorAll('[data-page]').forEach(el=>el.classList.remove('page-active'));
    const target=document.querySelector(`[data-page="${page}"]`);
    if(target){ target.classList.add('page-active'); window.location.hash=page; window.scrollTo({top:0,behavior:'instant'}); }
    closeMobileMenu();
    updateNavActiveState(page);
    const s=getSession();
    switch(page){
      case 'home':       triggerHomeAnimations(); setTimeout(()=>initScrollReveal(),200); break;
      case 'member':     safeRender(()=>populateMemberDashboard(s),'member-tab-overview'); break;
      case 'winglead':   safeRender(()=>populateWlDashboard(s),'wl-tab-overview'); break;
      case 'corelead':   safeRender(()=>populateClDashboard(s),'cl-tab-overview'); break;
      case 'studentlead':safeRender(()=>populateSlDashboard(s),'sl-tab-overview'); updateApprovalBadge(); break;
      case 'inventory':  setTimeout(()=>safeRender(populateInvSidebar,'inv-tab-overview'),50); break;
      case 'minutes':    setTimeout(()=>safeRender(populateMinSidebar,'min-list-container'),50); break;
    }
    if(PROTECTED.includes(page)) updateNavbarForAuth();
  }

  function handleRoute(){
    // On a standalone page (home/login/register), there is no in-page
    // routing to do — the file itself IS the route.
    if(isStandaloneFile(currentFile())) return;
    const hash=window.location.hash.replace('#','')||'';
    const requested=ROUTES.includes(hash)&&!isStandalonePage(hash)?hash:null;
    if(requested){ navigate(requested); return; }
    // No valid hash on dashboard.html — send logged-in users to their own
    // dashboard, everyone else to Login (guardRoute will redirect further
    // if they're not allowed wherever they end up).
    const s=getSession();
    navigate(s?getDashboardRoute(s.role):'login');
  }

  window.addEventListener('hashchange',handleRoute);

  // ── Navbar scroll
  window.addEventListener('scroll',()=>{
    getEl('navbar')?.classList.toggle('scrolled',window.scrollY>20);
  },{passive:true});

  function updateNavActiveState(page){
    document.querySelectorAll('.navbar-link,.mobile-nav-link').forEach(el=>el.classList.remove('active'));
  }

  // ── Wings dropdown
  function toggleWingsDropdown(){ getEl('wingsBtn')?.classList.toggle('open'); }

  document.addEventListener('click',e=>{
    const wb=getEl('wingsBtn'); if(wb&&!wb.contains(e.target)) wb.classList.remove('open');
    const up=getEl('navbar-user-pill'); if(up&&!up.contains(e.target)) up.classList.remove('open');
  });

  // ── Mobile menu
  function toggleMobileMenu(){
    getEl('mobileMenu')?.classList.toggle('open');
    getEl('hamburger')?.classList.toggle('open');
    document.body.style.overflow=getEl('mobileMenu')?.classList.contains('open')?'hidden':'';
  }
  function closeMobileMenu(){
    getEl('mobileMenu')?.classList.remove('open');
    getEl('hamburger')?.classList.remove('open');
    document.body.style.overflow='';
  }
  function scrollToSection(id){
    // Milestone 9: home's sections (about, wings, structure, team, events)
    // only exist inside index.html now. If we're not already there, do a
    // real navigation with a hash anchor and let the browser handle the
    // scroll on load; otherwise just scroll in place as before.
    if(currentFile()!=='index.html'){
      window.location.href=`index.html#${id}`;
      closeMobileMenu();
      return;
    }
    getEl(id)?.scrollIntoView({behavior:'smooth',block:'start'});
    closeMobileMenu();
  }
  // If we just landed on index.html via a #section anchor (from another
  // page's navbar/footer link), scroll to it after the page settles.
  window.addEventListener('load',()=>{
    if(currentFile()==='index.html' && window.location.hash){
      const id=window.location.hash.replace('#','');
      setTimeout(()=>getEl(id)?.scrollIntoView({behavior:'smooth',block:'start'}),300);
    }
  });
  window.addEventListener('resize',()=>{ if(window.innerWidth>768) closeMobileMenu(); });

  // ══════════════════════════════════════════════════════════════
  // M3 — AUTH & SESSION
  // ══════════════════════════════════════════════════════════════

  const ROLES={
    STUDENT_LEAD:'studentlead',
    WING_LEAD_AI:'winglead_ai',
    WING_LEAD_CYBER:'winglead_cyber',
    WING_LEAD_EMBEDDED:'winglead_embedded',
    CORE_LEAD_TECH:'corelead_tech',
    CORE_LEAD_OUTREACH:'corelead_outreach',
    CORE_LEAD_LABS:'corelead_labs',
    CORE_LEAD_RESEARCH:'corelead_research',
    MEMBER:'member',
  };

  // Demo accounts removed — real accounts now live in Firebase Auth +
  // the Firestore 'users' collection. This stays empty as a safety net;
  // it's overwritten automatically with real profiles once Firebase loads.
  const USER_STORE=[];

  let _session=null;

  function getSession(){
    if(_session) return _session;
    try{
      const raw=sessionStorage.getItem('ace_session')||localStorage.getItem('ace_session');
      if(raw){_session=JSON.parse(raw);return _session;}
    }catch(e){}
    return null;
  }

  function setSession(user,remember){
    const s={id:user.id,email:user.email,name:user.name,role:user.role,memberId:user.memberId,wing:user.wing,loginTime:Date.now()};
    _session=s;
    try{sessionStorage.setItem('ace_session',JSON.stringify(s));}catch(e){}
    if(remember){try{localStorage.setItem('ace_session',JSON.stringify(s));}catch(e){}}
    return s;
  }

  function clearSession(){
    _session=null;
    try{sessionStorage.removeItem('ace_session');localStorage.removeItem('ace_session');}catch(e){}
  }

  // Restore from localStorage on load
  (function(){
    try{
      const raw=localStorage.getItem('ace_session');
      if(raw&&!_session){_session=JSON.parse(raw);sessionStorage.setItem('ace_session',raw);}
    }catch(e){}
  })();

  function getDashboardRoute(role){
    if(role===ROLES.STUDENT_LEAD) return 'studentlead';
    if([ROLES.WING_LEAD_AI,ROLES.WING_LEAD_CYBER,ROLES.WING_LEAD_EMBEDDED].includes(role)) return 'winglead';
    if([ROLES.CORE_LEAD_TECH,ROLES.CORE_LEAD_OUTREACH,ROLES.CORE_LEAD_LABS,ROLES.CORE_LEAD_RESEARCH].includes(role)) return 'corelead';
    return 'member';
  }

  function guardRoute(page){
    if(!PROTECTED.includes(page)) return true;
    const s=getSession();
    if(!s){sessionStorage.setItem('ace_redirect',page);navigate('login');return false;}
    if(['inventory','minutes'].includes(page)){if(s.role===ROLES.MEMBER){navigate('member');return false;}return true;}
    if(page!==getDashboardRoute(s.role)){navigate(getDashboardRoute(s.role));return false;}
    return true;
  }

  function getRoleLabel(role){
    return{
      [ROLES.STUDENT_LEAD]:'Student Lead',
      [ROLES.WING_LEAD_AI]:'AI Wing Lead',
      [ROLES.WING_LEAD_CYBER]:'Cyber Wing Lead',
      [ROLES.WING_LEAD_EMBEDDED]:'Embedded Wing Lead',
      [ROLES.CORE_LEAD_TECH]:'Core Lead — Tech',
      [ROLES.CORE_LEAD_OUTREACH]:'Core Lead — Outreach',
      [ROLES.CORE_LEAD_LABS]:'Core Lead — Lab & CTFs',
      [ROLES.CORE_LEAD_RESEARCH]:'Core Lead — Research',
      [ROLES.MEMBER]:'Member',
    }[role]||'Member';
  }

  function getAvatarColor(role){
    if(role===ROLES.WING_LEAD_CYBER)    return{bg:'var(--cyber-purple-dim)',text:'var(--cyber-purple)'};
    if(role===ROLES.WING_LEAD_EMBEDDED) return{bg:'var(--embedded-green-dim)',text:'var(--embedded-green)'};
    if(role===ROLES.MEMBER)             return{bg:'rgba(255,255,255,0.06)',text:'var(--text-secondary)'};
    if([ROLES.CORE_LEAD_TECH,ROLES.CORE_LEAD_OUTREACH,ROLES.CORE_LEAD_LABS,ROLES.CORE_LEAD_RESEARCH].includes(role))
                                        return{bg:'rgba(245,158,11,0.12)',text:'rgb(245,158,11)'};
    return{bg:'var(--ai-cyan-dim)',text:'var(--ai-cyan)'};
  }

  // M3.2 — Login
  async function handleLogin(){
    const email=getEl('login-email')?.value.trim().toLowerCase();
    const pw=getEl('login-pw')?.value;
    const remember=getEl('login-remember')?.checked;
    const btn=getEl('login-btn');
    hide('login-error');
    if(!email||!pw){showLoginError('Please enter your email and password.');return;}
    if(btn){btn.textContent='Signing in…';btn.disabled=true;}

    let user=null;
    try{
      if(window.ACE_FIREBASE_LIVE){
        // Firebase Auth verifies the password; the matching profile
        // (role, wing, name, memberId) lives in the 'users' Firestore collection.
        await window.ACEDB.login(email,pw);
        const profiles=await window.ACEDB.getWhere('users','email','==',email);
        user=profiles[0]||null;
        if(!user){
          showLoginError('Signed in, but no profile found for this account. Contact a Student Lead.');
          if(btn){btn.innerHTML='Sign In →';btn.disabled=false;}
          return;
        }
      } else {
        // Demo / offline mode — falls back to the in-memory USER_STORE.
        await new Promise(r=>setTimeout(r,500));
        user=USER_STORE.find(u=>u.email===email&&u.password===pw)||null;
      }
    }catch(err){
      showLoginError(window.ACE_FIREBASE_LIVE?'Invalid email or password.':'Something went wrong. Try a demo credential.');
      if(btn){btn.innerHTML='Sign In →';btn.disabled=false;}
      return;
    }

    if(!user){
      showLoginError('Invalid email or password. Try a demo credential.');
      if(btn){btn.innerHTML='Sign In →';btn.disabled=false;}
      return;
    }
    setSession(user,remember);
    updateNavbarForAuth();
    refreshNotifUI();
    const redirect=sessionStorage.getItem('ace_redirect')||getDashboardRoute(user.role);
    sessionStorage.removeItem('ace_redirect');
    if(getEl('login-email'))getEl('login-email').value='';
    if(getEl('login-pw'))getEl('login-pw').value='';
    if(btn){btn.innerHTML='Sign In →';btn.disabled=false;}
    navigate(redirect);
    showToast(`Welcome back, ${user.name.split(' ')[0]}! 👋`,'success');
  }

  function showLoginError(msg){
    const m=getEl('login-error-msg');if(m)m.textContent=msg;
    show('login-error');
  }

  // M3.7 — Logout
  function handleLogout(){
    const name=getSession()?.name?.split(' ')[0]||'';
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.logout().catch(()=>{});
    clearSession();updateNavbarForAuth();refreshNotifUI();navigate('home');
    showToast(`Signed out. See you soon${name?', '+name:''}!`,'success');
  }

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 7 — One-time Firebase seeding helper
  // ══════════════════════════════════════════════════════════════
  // Run once from the browser console after connecting Firebase, to copy
  // the demo accounts into your real Firestore project as user profiles.
  // Example: open console → seedFirebaseUsers()
  window.seedFirebaseUsers=async function(){
    if(!window.ACE_FIREBASE_LIVE){console.warn('Connect Firebase first — see the 🔥 config placeholder in index.html.');return;}
    for(const u of USER_STORE){
      // NOTE: this only creates the Firestore profile doc (role, wing, name, memberId).
      // You must also create each user's Auth login (email/password) once,
      // either via window.ACEDB.register(email,password) or the Firebase Console.
      await window.ACEDB.set('users',u.id,{email:u.email,name:u.name,role:u.role,memberId:u.memberId,wing:u.wing});
    }
    console.log(`[seed] ${USER_STORE.length} user profiles copied to Firestore 'users' collection.`);
  };

  function togglePassword(){
    const inp=getEl('login-pw');const s=getEl('pw-eye-show');const h=getEl('pw-eye-hide');
    if(!inp)return;
    const hidden=inp.type==='password';
    inp.type=hidden?'text':'password';
    if(s)s.style.display=hidden?'none':'inline';
    if(h)h.style.display=hidden?'inline':'none';
  }

  // fillDemo() removed — the demo-credentials login panel was taken out
  // once real Firebase accounts were set up.

  function showForgot() {show('forgot-modal');}
  function hideForgot() {hide('forgot-modal');}
  function submitForgot(){
    const e=getEl('forgot-email')?.value.trim();if(!e)return;
    hideForgot();if(getEl('forgot-email'))getEl('forgot-email').value='';
    showToast('Reset request sent! Your Wing Lead will update your access.','success');
  }

  // M3.6 — Navbar auth state
  function updateNavbarForAuth(){
    const s=getSession();const right=document.querySelector('.navbar-right');if(!right)return;
    right.querySelector('.navbar-user-pill')?.remove();
    if(s){
      right.querySelector('.navbar-login-btn')?.remove();
      right.querySelector('.navbar-join-btn')?.remove();
      const ini=s.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
      const col=getAvatarColor(s.role);
      const dash=getDashboardRoute(s.role);
      const isLead=['winglead','studentlead','corelead'].includes(dash);
      const pill=document.createElement('div');
      pill.className='navbar-user-pill';pill.id='navbar-user-pill';
      pill.innerHTML=`
        <div class="navbar-user-avatar" style="background:${col.bg};color:${col.text};">${ini}</div>
        <span class="navbar-user-name">${s.name.split(' ')[0]}</span>
        <svg class="navbar-user-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <div class="navbar-user-dropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">${s.name}</div>
            <div class="user-dropdown-role">${getRoleLabel(s.role)}</div>
          </div>
          <div class="user-dropdown-item" onclick="navigate('${dash}')">📊 My Dashboard</div>
          ${isLead?`<div class="user-dropdown-item" onclick="navigate('inventory')">📦 Inventory</div><div class="user-dropdown-item" onclick="navigate('minutes')">📝 Meeting Minutes</div>`:''}
          <div class="user-dropdown-item" onclick="navigate('home')">🏠 Homepage</div>
          <div class="user-dropdown-item logout" onclick="handleLogout()">🚪 Sign Out</div>
        </div>`;
      pill.addEventListener('click',e=>{e.stopPropagation();pill.classList.toggle('open');});
      right.insertBefore(pill,right.querySelector('.navbar-hamburger'));
    } else {
      if(!right.querySelector('.navbar-login-btn')){
        const lb=document.createElement('button');lb.className='navbar-login-btn';lb.textContent='Member Login';lb.onclick=()=>navigate('login');
        right.insertBefore(lb,right.querySelector('.navbar-hamburger'));
      }
      if(!right.querySelector('.navbar-join-btn')){
        const jb=document.createElement('button');jb.className='navbar-join-btn';
        jb.innerHTML='Join ACE <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        jb.onclick=()=>navigate('register');
        right.insertBefore(jb,right.querySelector('.navbar-hamburger'));
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // M2 — MEMBER REGISTRATION
  // ══════════════════════════════════════════════════════════════

  const memberDB=[];window.memberDB=memberDB;

  // ── Milestone 4 — Registration Notification Flow (data/logic layer) ──
  // Maps a wing name to the Wing Lead role that should see its applications.
  function getWingLeadRoleForWing(wing){
    if(wing==='AI') return ROLES.WING_LEAD_AI;
    if(wing==='Cybersecurity') return ROLES.WING_LEAD_CYBER;
    if(wing==='Embedded Systems') return ROLES.WING_LEAD_EMBEDDED;
    return null;
  }

  // Returns pending applications visible to a given session.
  // Student Lead sees ALL pending applications (final approval authority).
  // Wing Leads see only pending applications for their own wing (view-only).
  function getPendingApplicationsForRole(session){
    if(!session) return [];
    const pending=(memberDB||[]).filter(m=>m.status==='pending');
    if(session.role===ROLES.STUDENT_LEAD) return pending;
    const wlRole=getWingLeadRoleForWing(session.wing);
    if([ROLES.WING_LEAD_AI,ROLES.WING_LEAD_CYBER,ROLES.WING_LEAD_EMBEDDED].includes(session.role)){
      return pending.filter(m=>m.wing===session.wing);
    }
    return [];
  }

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 6 — ROLE-BASED NOTIFICATION SYSTEM
  // ══════════════════════════════════════════════════════════════
  // Each notification: {id, icon, title, message, target:{roles?:[], userId?:, wing?:}, link, read, createdAt}
  // target.roles    -> visible to sessions whose role is in this list
  // target.wing     -> (combined with roles) only for that wing's lead/members
  // target.userId   -> visible only to that specific user id
  const notificationStore=[];

  function pushNotification({icon='🔔',title,message,target={},link=null}){
    const n={id:`NOTIF-${Date.now()}-${Math.floor(Math.random()*1000)}`,icon,title,message,target,link,read:false,createdAt:new Date().toISOString()};
    notificationStore.unshift(n);
    if(notificationStore.length>200) notificationStore.length=200; // cap memory growth
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.set('notifications',n.id,n).catch(()=>{});
    refreshNotifUI();
    return n;
  }

  function notifVisibleTo(n,session){
    if(!session) return false;
    const t=n.target||{};
    if(t.userId) return t.userId===session.id;
    if(t.roles && !t.roles.includes(session.role)) return false;
    if(t.wing && session.wing!==t.wing) return false;
    return !!(t.roles||t.userId);
  }

  function getNotificationsForSession(session){
    if(!session) return [];
    return notificationStore.filter(n=>notifVisibleTo(n,session));
  }

  function refreshNotifUI(){
    const s=getSession();
    const wrap=getEl('navbar-bell-wrap');
    if(!wrap) return;
    if(!s){ wrap.style.display='none'; return; }
    wrap.style.display='flex';
    const mine=getNotificationsForSession(s);
    const unread=mine.filter(n=>!n.read).length;
    const badge=getEl('navbar-bell-badge');
    if(badge){ badge.textContent=unread>9?'9+':unread; badge.style.display=unread>0?'flex':'none'; }
    const list=getEl('navbar-notif-list');
    if(list){
      if(!mine.length){ list.innerHTML=`<div class="navbar-notif-empty">🔕 No notifications yet.</div>`; }
      else{
        list.innerHTML=mine.slice(0,30).map(n=>`<div class="navbar-notif-item ${n.read?'':'unread'}" onclick="handleNotifClick('${n.id}')">
          <div class="navbar-notif-icon">${n.icon}</div>
          <div style="flex:1;">
            <div class="navbar-notif-title">${n.title}</div>
            <div class="navbar-notif-msg">${n.message}</div>
            <div class="navbar-notif-time">${timeAgo(n.createdAt)}</div>
          </div>
          ${n.read?'':'<div class="navbar-notif-dot"></div>'}
        </div>`).join('');
      }
    }
    // Keep Wing Lead pending-applications badge in sync, since it shares the same data.
    if(getDashboardRoute(s.role)==='winglead') updateWlApplicationBadge(s);
  }

  function timeAgo(iso){
    const diff=Math.max(0,Date.now()-new Date(iso).getTime());
    const mins=Math.floor(diff/60000);
    if(mins<1) return 'just now';
    if(mins<60) return `${mins}m ago`;
    const hrs=Math.floor(mins/60);
    if(hrs<24) return `${hrs}h ago`;
    return `${Math.floor(hrs/24)}d ago`;
  }

  function toggleNotifPanel(e){
    e?.stopPropagation();
    const panel=getEl('navbar-notif-panel');
    if(!panel) return;
    panel.classList.toggle('open');
  }

  function handleNotifClick(id){
    const n=notificationStore.find(n=>n.id===id);
    if(!n) return;
    n.read=true;
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.update('notifications',id,{read:true}).catch(()=>{});
    refreshNotifUI();
    getEl('navbar-notif-panel')?.classList.remove('open');
    if(n.link) navigate(n.link);
  }

  function markAllNotificationsRead(){
    const s=getSession();if(!s)return;
    const mine=getNotificationsForSession(s);
    mine.forEach(n=>n.read=true);
    if(window.ACE_FIREBASE_LIVE) mine.forEach(n=>window.ACEDB.update('notifications',n.id,{read:true}).catch(()=>{}));
    refreshNotifUI();
  }

  // Close notification panel when clicking outside it
  document.addEventListener('click',(e)=>{
    const wrap=getEl('navbar-bell-wrap');
    if(wrap && !wrap.contains(e.target)) getEl('navbar-notif-panel')?.classList.remove('open');
  });

  // ── Notification trigger #1: New Application (Student Lead) ──
  // ── Notification trigger #2: Wing-Specific Application (Wing Lead) ──
  function notifyNewApplication(m){
    pushNotification({
      icon:'📥', title:'New Application',
      message:`${m.name} applied to ${m.wing} Wing.`,
      target:{roles:[ROLES.STUDENT_LEAD]}, link:'studentlead',
    });
    const wlRole=getWingLeadRoleForWing(m.wing);
    if(wlRole){
      pushNotification({
        icon:'📥', title:`New ${m.wing} Application`,
        message:`${m.name} applied to your wing. Pending Student Lead approval.`,
        target:{roles:[wlRole]}, link:'winglead',
      });
    }
    const s=getSession();
    if(s && getDashboardRoute(s.role)==='winglead'){
      if(getEl('wl-tab-applications')?.classList.contains('active')) renderWlApplications(s);
    }
  }

  // ── Notification trigger #3: Approval / Rejection (Applicant — shown to Wing Lead of that wing as a heads-up) ──
  function notifyApprovalDecision(m,decision){
    const wlRole=getWingLeadRoleForWing(m.wing);
    if(wlRole){
      pushNotification({
        icon:decision==='approved'?'✅':'❌',
        title:decision==='approved'?'Application Approved':'Application Rejected',
        message:`${m.name}'s application to ${m.wing} Wing was ${decision}.`,
        target:{roles:[wlRole]}, link:'winglead',
      });
    }
  }

  // ── Notification trigger #4: Task Assigned (Member) ──
  function notifyTaskAssigned(task){
    pushNotification({
      icon:'✅', title:'New Task Assigned',
      message:`"${task.title}" was assigned to you.${task.due?' Due '+task.due+'.':''}`,
      target:{userId:task.assigneeId}, link:'member',
    });
  }

  // ── Notification trigger #5: Announcement (Members / specific wing) ──
  function notifyAnnouncement(a){
    const target=a.target==='all'?{roles:[ROLES.MEMBER,ROLES.WING_LEAD_AI,ROLES.WING_LEAD_CYBER,ROLES.WING_LEAD_EMBEDDED]}
                                  :{roles:[ROLES.MEMBER,ROLES.WING_LEAD_AI,ROLES.WING_LEAD_CYBER,ROLES.WING_LEAD_EMBEDDED],wing:a.target};
    pushNotification({
      icon:'📢', title:a.pinned?`📌 ${a.title}`:a.title,
      message:a.body.length>80?a.body.slice(0,80)+'…':a.body,
      target, link:'member',
    });
  }

  // ── Notification trigger #6: Inventory Alert (Student Lead + relevant Wing Lead) ──
  function notifyInventoryAlert(item){
    const remaining=item.total-item.issued;
    const roles=[ROLES.STUDENT_LEAD];
    const wlRole=getWingLeadRoleForWing(item.wing);
    if(wlRole) roles.push(wlRole);
    pushNotification({
      icon:'⚠️', title:'Low Stock Alert',
      message:`${item.name} — only ${remaining} left (threshold: ${item.threshold}).`,
      target:{roles}, link:'inventory',
    });
  }

  const WING_SKILLS={
    'AI':              ['Python','TensorFlow','PyTorch','Pandas','NumPy','Scikit-learn','Jupyter','Computer Vision','NLP','Kaggle'],
    'Cybersecurity':   ['Kali Linux','Nmap','Metasploit','Wireshark','Python','Bash','CTF','Burp Suite','Network Security','Digital Forensics'],
    'Embedded Systems':['Arduino','ESP32','Raspberry Pi','C/C++','RTOS','PCB Design','MQTT','I2C/SPI','Assembly','IoT'],
  };

  let selectedWing='',skills=[];

  function regNextStep(from){ if(validateStep(from)) showRegStep(from+1); }
  function regPrevStep(from){ showRegStep(from-1); }

  function showRegStep(n){
    [1,2,3].forEach(i=>{ getEl(`reg-step-${i}`)?.classList.add('hidden'); getEl(`step-ind-${i}`)?.classList.remove('active','done'); });
    getEl(`reg-step-${n}`)?.classList.remove('hidden');
    for(let i=1;i<=3;i++){ const ind=getEl(`step-ind-${i}`); if(i<n)ind?.classList.add('done'); else if(i===n)ind?.classList.add('active'); }
    for(let i=1;i<=2;i++) getEl(`step-line-${i}`)?.classList.toggle('done',i<n);
    window.scrollTo({top:0,behavior:'smooth'});
    if(n===3) buildReview();
  }

  function clearFormErrors(){
    document.querySelectorAll('.form-error').forEach(e=>e.textContent='');
    document.querySelectorAll('.form-input,.form-select').forEach(e=>e.style.borderColor='');
  }

  function setFormError(id,msg){
    const err=getEl(`err-${id}`),inp=getEl(`f-${id}`);
    if(err)err.textContent=msg;if(inp)inp.style.borderColor='var(--error)';return false;
  }

  function validateStep(step){
    clearFormErrors();let ok=true;
    if(step===1){
      const v=(id)=>getEl(id)?.value.trim()||'';
      if((v('f-name')).length<2)                                   {setFormError('name','⚠ Enter your full name');ok=false;}
      if((v('f-roll')).length<4)                                   {setFormError('roll','⚠ Enter a valid roll number');ok=false;}
      if(!getEl('f-branch')?.value)                                 {setFormError('branch','⚠ Select your branch');ok=false;}
      if(!getEl('f-year')?.value)                                   {setFormError('year','⚠ Select your year');ok=false;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('f-email')))         {setFormError('email','⚠ Enter a valid email');ok=false;}
      if(!/^\d{10}$/.test(getEl('f-phone')?.value.trim()||''))     {setFormError('phone','⚠ Enter a 10-digit number');ok=false;}
    }
    if(step===2){
      if(!selectedWing){const e=getEl('err-wing');if(e)e.textContent='⚠ Select a wing';ok=false;}
      if(!skills.length){const e=getEl('err-skills');if(e)e.textContent='⚠ Add at least one skill';ok=false;}
    }
    return ok;
  }

  function selectWing(wing){
    selectedWing=wing;
    document.querySelectorAll('.wing-option').forEach(el=>el.classList.remove('selected-ai','selected-cyber','selected-embedded'));
    const cls=wing==='AI'?'selected-ai':wing==='Cybersecurity'?'selected-cyber':'selected-embedded';
    document.querySelector(`[data-wing="${wing}"]`)?.classList.add(cls);
    const e=getEl('err-wing');if(e)e.textContent='';
    renderSkillChips(wing);
  }

  function renderSkillChips(wing){
    const c=getEl('skill-chips');if(!c)return;
    c.innerHTML=(WING_SKILLS[wing]||[]).map(s=>`<span class="skill-chip ${skills.includes(s)?'used':''}" onclick="addSkillFromChip('${s}')">${s}</span>`).join('');
  }

  function addSkillFromChip(s){
    if(!skills.includes(s)){skills.push(s);renderSkillTags();renderSkillChips(selectedWing);const e=getEl('err-skills');if(e)e.textContent='';}
  }

  function renderSkillTags(){
    const c=getEl('skills-tags');if(!c)return;
    c.innerHTML=skills.map((s,i)=>`<span class="skill-tag">${s}<span class="skill-tag-remove" onclick="removeSkill(${i})">×</span></span>`).join('');
  }

  function removeSkill(i){skills.splice(i,1);renderSkillTags();if(selectedWing)renderSkillChips(selectedWing);}

  function generateMemberID(wing){
    const code=wing==='AI'?'AI':wing==='Cybersecurity'?'CYB':'EMB';
    return `ACE-${code}-${new Date().getFullYear()}-${String(memberDB.length+1).padStart(3,'0')}`;
  }

  function buildReview(){
    const g=getEl('reg-review-grid');if(!g)return;
    const fields=[
      {key:'Name',val:getEl('f-name')?.value.trim()},{key:'Roll No',val:getEl('f-roll')?.value.trim()},
      {key:'Branch',val:getEl('f-branch')?.value},{key:'Year',val:getEl('f-year')?.value},
      {key:'Email',val:getEl('f-email')?.value.trim()},{key:'Phone',val:getEl('f-phone')?.value.trim()},
      {key:'Wing',val:selectedWing},{key:'Skills',val:skills.join(', ')},
      {key:'GitHub',val:getEl('f-github')?.value.trim()||'—'},{key:'LinkedIn',val:getEl('f-linkedin')?.value.trim()||'—'},
    ];
    g.innerHTML=fields.map(f=>`<div class="reg-review-item"><div class="reg-review-key">${f.key}</div><div class="reg-review-val ${f.val==='—'?'empty':''}">${f.val||'—'}</div></div>`).join('');
  }

  async function submitRegistration(){
    const terms=getEl('f-terms');
    if(!terms?.checked){const e=getEl('err-terms');if(e)e.textContent='⚠ Please accept the Code of Conduct';return;}
    const btn=getEl('submit-btn');if(btn){btn.textContent='Submitting…';btn.disabled=true;}
    const m={
      id:generateMemberID(selectedWing),
      name:getEl('f-name')?.value.trim(),roll:getEl('f-roll')?.value.trim(),
      branch:getEl('f-branch')?.value,year:getEl('f-year')?.value,
      email:getEl('f-email')?.value.trim(),phone:getEl('f-phone')?.value.trim(),
      wing:selectedWing,skills:[...skills],
      github:getEl('f-github')?.value.trim(),linkedin:getEl('f-linkedin')?.value.trim(),
      status:'pending',joinedAt:new Date().toISOString(),
      // Milestone 4 — Registration Notification Flow:
      // every application is routed to BOTH the Student Lead queue (final approval)
      // and the relevant Wing Lead queue (view-only, see Milestone 5).
      routedTo:['studentlead', getWingLeadRoleForWing(selectedWing)],
    };
    try{
      if(window.ACE_FIREBASE_LIVE){
        await window.ACEDB.set('members',m.id,m);
      } else {
        await new Promise(r=>setTimeout(r,800)); // keep the original demo-mode delay
      }
    }catch(err){
      showToast('Could not submit application. Please try again.','error');
      if(btn){btn.innerHTML='Submit Application →';btn.disabled=false;}
      return;
    }
    memberDB.push(m);window.memberDB=memberDB;
    notifyNewApplication(m);
    const sid=getEl('success-member-id');if(sid)sid.textContent=m.id;
    getEl('reg-step-3')?.classList.add('hidden');
    getEl('reg-success')?.classList.remove('hidden');
    if(btn){btn.innerHTML='Submit Application →';btn.disabled=false;}
    window.scrollTo({top:0,behavior:'smooth'});
    showToast('Application submitted!','success');
  }

  function resetRegistration(){
    selectedWing='';skills=[];
    ['f-name','f-roll','f-email','f-phone','f-github','f-linkedin'].forEach(id=>{const e=getEl(id);if(e)e.value='';});
    ['f-branch','f-year'].forEach(id=>{const e=getEl(id);if(e)e.value='';});
    document.querySelectorAll('.wing-option').forEach(el=>el.classList.remove('selected-ai','selected-cyber','selected-embedded'));
    renderSkillTags();
    getEl('reg-success')?.classList.add('hidden');
    const t=getEl('f-terms');if(t)t.checked=false;
    showRegStep(1);
  }

  function exportMembersCSV(){
    if(!memberDB.length){showToast('No members to export yet.','warning');return;}
    const headers=['Member ID','Name','Roll No','Branch','Year','Email','Phone','Wing','Skills','GitHub','LinkedIn','Status','Joined At'];
    const rows=memberDB.map(m=>[m.id,m.name,m.roll,m.branch,m.year,m.email,m.phone,m.wing,(m.skills||[]).join(';'),m.github||'',m.linkedin||'',m.status,m.joinedAt].map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(','));
    const blob=new Blob([[headers.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8;'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`ace_members_${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
    showToast('CSV exported!','success');
  }
  window.exportMembersCSV=exportMembersCSV;

  // ══════════════════════════════════════════════════════════════
  // M4 — WING LEAD & MEMBER DASHBOARDS
  // ══════════════════════════════════════════════════════════════

  // Demo members removed — this now starts empty and is populated entirely
  // by real approved registrations from Firestore (see getWingMembers()).
  const wingMemberData={
    AI:[],
    Cybersecurity:[],
    'Embedded Systems':[],
  };

  const taskStore={AI:[],Cybersecurity:[],'Embedded Systems':[]};
  let wlMemberFilter='all',taskCurrentFilter='all';

  function getWingMembers(wing){
    const base=wingMemberData[wing]||[];
    const fresh=(memberDB||[]).filter(m=>m.wing===wing&&m.status==='active').map(m=>({id:m.id,name:m.name,year:m.year,branch:m.branch,status:'active',tasks:[],attendance:[0,0,0,0]}));
    return [...base,...fresh];
  }

  function wlTab(tab){
    document.querySelectorAll('[data-page="winglead"] .dash-tab').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('[data-page="winglead"] .dash-nav-item').forEach(el=>el.classList.remove('active'));
    getEl(`wl-tab-${tab}`)?.classList.add('active');
    event?.currentTarget?.classList.add('active');
    const s=getSession();if(!s)return;
    safeRender(()=>{
      if(tab==='overview')     renderWlOverview(s.wing);
      if(tab==='applications') renderWlApplications(s);
      if(tab==='members')      renderWlMembers(s.wing);
      if(tab==='tasks')        renderTaskBoard(s.wing);
      if(tab==='attendance')   renderAttendance(s.wing);
    },`wl-tab-${tab}`);
  }

  function memberTab(tab){
    document.querySelectorAll('[data-page="member"] .dash-tab').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('[data-page="member"] .dash-nav-item').forEach(el=>el.classList.remove('active'));
    getEl(`member-tab-${tab}`)?.classList.add('active');
    event?.currentTarget?.classList.add('active');
    if(tab==='tasks') renderMemberTasks();
  }

  function populateWlDashboard(s){
    if(!s)return;
    const wing=s.wing;
    const ini=s.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    const bg=wing==='AI'?'var(--ai-cyan-dim)':wing==='Cybersecurity'?'var(--cyber-purple-dim)':'var(--embedded-green-dim)';
    const col=wing==='AI'?'var(--ai-cyan)':wing==='Cybersecurity'?'var(--cyber-purple)':'var(--embedded-green)';
    const av=getEl('wl-sb-avatar');if(av){av.textContent=ini;av.style.background=bg;av.style.color=col;}
    setEl('wl-sb-name',s.name);setEl('wl-sb-role',`${wing} Wing Lead`);
    setEl('wl-welcome-name',s.name.split(' ')[0]);
    const bh=getEl('wl-wing-badge-header');
    if(bh){const bc=wing==='AI'?'badge-ai':wing==='Cybersecurity'?'badge-cyber':'badge-embedded';const ic=wing==='AI'?'⚡':wing==='Cybersecurity'?'🔐':'🔧';bh.innerHTML=`<span class="badge ${bc}">${ic} ${wing} Wing</span>`;}
    updateWlApplicationBadge(s);
    safeRender(()=>renderWlOverview(wing),'wl-tab-overview');
  }

  function renderWlOverview(wing){
    if(!wing)return;
    const members=getWingMembers(wing),tasks=taskStore[wing]||[];
    setEl('wl-stat-total',members.length);setEl('wl-stat-active',members.filter(m=>m.status==='active').length);
    setEl('wl-stat-inactive',members.filter(m=>m.status==='inactive').length);setEl('wl-stat-tasks',tasks.filter(t=>!t.completed).length);
    const pe=getEl('wl-task-progress');if(!pe)return;
    if(!tasks.length){pe.innerHTML=emptyState('Assign tasks to see progress here.','✅');return;}
    pe.innerHTML=members.map(m=>{const mt=tasks.filter(t=>t.assigneeId===m.id);const done=mt.filter(t=>t.completed).length;const pct=mt.length?Math.round(done/mt.length*100):0;return`<div class="task-progress-item"><div class="task-progress-header"><span class="task-progress-name">${m.name}</span><span class="task-progress-pct">${done}/${mt.length} · ${pct}%</span></div><div class="task-progress-bar"><div class="task-progress-fill" style="width:${pct}%"></div></div></div>`;}).join('');
  }

  function updateWlApplicationBadge(s){
    if(!s)return;
    const cnt=getPendingApplicationsForRole(s).length;
    const b=getEl('wl-app-count');if(b){b.textContent=cnt;b.style.display=cnt>0?'inline-flex':'none';}
  }

  function renderWlApplications(s){
    if(!s)return;
    updateWlApplicationBadge(s);
    const apps=getPendingApplicationsForRole(s);
    const el=getEl('wl-applications-list');if(!el)return;
    if(!apps.length){el.innerHTML=`<div style="padding:var(--space-12);">${emptyState('No pending applications for your wing right now.','📭')}</div>`;return;}
    el.innerHTML=apps.map(m=>{
      const ini=m.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
      const wc=m.wing==='AI'?'badge-ai':m.wing==='Cybersecurity'?'badge-cyber':'badge-embedded';
      return`<div class="sl-approval-card" id="wl-app-${m.id}">
        <div class="sl-approval-avatar">${ini}</div>
        <div class="sl-approval-info">
          <div class="sl-approval-name">${m.name}</div>
          <div class="sl-approval-meta">
            <span class="badge ${wc}" style="font-size:10px;">${m.wing}</span>
            <span>📋 ${m.roll}</span>
            <span>🏫 ${m.branch} · ${m.year}</span>
            <span class="font-mono">${m.id}</span>
          </div>
          <div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-muted);">Skills: ${m.skills?.join(', ')||'—'}</div>
          <div style="margin-top:var(--space-2);font-size:11px;color:var(--text-muted);">📧 ${m.email||'—'} · 📱 ${m.phone||'—'}</div>
        </div>
        <div style="display:flex;align-items:center;padding-right:var(--space-2);">
          <span class="status-pill status-pending">⏳ Awaiting Student Lead</span>
        </div>
      </div>`;
    }).join('');
  }
  function filterWlMembers(filter,btn){
    wlMemberFilter=filter;
    document.querySelectorAll('#wl-tab-members .filter-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    const s=getSession();if(s)renderWlMembers(s.wing);
  }

  function renderWlMembers(wing){
    if(!wing)return;
    const search=(getEl('wl-member-search')?.value||'').toLowerCase();
    let members=getWingMembers(wing);
    if(wlMemberFilter==='active')members=members.filter(m=>m.status==='active');
    if(wlMemberFilter==='inactive')members=members.filter(m=>m.status==='inactive');
    if(search)members=members.filter(m=>m.name.toLowerCase().includes(search)||m.id.toLowerCase().includes(search));
    const tb=getEl('wl-members-tbody');if(!tb)return;
    if(!members.length){tb.innerHTML=`<tr><td colspan="6" style="padding:var(--space-8);">${emptyState('No members found.','👥')}</td></tr>`;return;}
    const tasks=taskStore[wing]||[];
    tb.innerHTML=members.map(m=>{const mt=tasks.filter(t=>t.assigneeId===m.id);const done=mt.filter(t=>t.completed).length;const ini=m.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();return`<tr><td><div style="display:flex;align-items:center;gap:var(--space-3);"><div style="width:32px;height:32px;border-radius:50%;background:var(--ai-cyan-dim);color:var(--ai-cyan);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:11px;flex-shrink:0;">${ini}</div><span style="font-weight:500;">${m.name}</span></div></td><td><span class="font-mono" style="font-size:11px;color:var(--text-muted);">${m.id}</span></td><td style="font-size:var(--text-sm);color:var(--text-secondary);">${m.year} · ${m.branch}</td><td><span class="status-pill ${m.status==='active'?'status-active':'status-inactive'}">${m.status}</span></td><td style="font-size:var(--text-sm);">${done}/${mt.length} done</td><td><button class="btn btn-ghost btn-sm" onclick="toggleMemberStatus('${wing}','${m.id}')">${m.status==='active'?'Deactivate':'Activate'}</button></td></tr>`;}).join('');
  }

  function toggleMemberStatus(wing,id){
    const m=(wingMemberData[wing]||[]).find(m=>m.id===id);
    if(m){m.status=m.status==='active'?'inactive':'active';renderWlMembers(wing);renderWlOverview(wing);showToast(`${m.name} marked as ${m.status}.`,'success');}
  }

  // ══════════════════════════════════════════════════════════════
  // CORE LEAD DASHBOARD — Milestone 3
  // ══════════════════════════════════════════════════════════════

  const CORE_LEAD_CONFIG={
    [ROLES.CORE_LEAD_TECH]:{
      label:'Tech Lead', icon:'💻', badgeClass:'badge-ai',
      focusTitle:'Technical Infrastructure & Tooling',
      focusDesc:'You own the club\'s technical backbone — website, internal tools, lab software, and dev workflows used by all three wings.',
      workspaceTitle:'Tech Workspace',
      quickLinks:[
        {icon:'🖥️',label:'Site & Tooling Health',desc:'Track uptime and pending fixes for club tools.'},
        {icon:'🛠️',label:'Dev Task Backlog',desc:'Open technical tasks across all wings.'},
        {icon:'🔑',label:'Access & Permissions',desc:'Manage tool access requests from members.'},
      ],
      workspaceItems:[
        {icon:'🌐',title:'Club Website',sub:'Maintain and update the public-facing site.'},
        {icon:'🧩',title:'Internal Tools',sub:'Attendance trackers, dashboards, and bots.'},
        {icon:'🗄️',title:'Lab Machine Setup',sub:'OS images, dependencies, and dev environments.'},
      ],
    },
    [ROLES.CORE_LEAD_OUTREACH]:{
      label:'Outreach Lead', icon:'📣', badgeClass:'badge-cyber',
      focusTitle:'Social Media, PR & Industry Connect',
      focusDesc:'You manage the club\'s public image — social media, sponsorships, alumni network, and industry partnerships.',
      workspaceTitle:'Outreach Workspace',
      quickLinks:[
        {icon:'📱',label:'Social Calendar',desc:'Plan posts and announcements across platforms.'},
        {icon:'🤝',label:'Sponsorships & Partners',desc:'Track outreach to companies and alumni.'},
        {icon:'📰',label:'Press & PR',desc:'Coverage requests and media mentions.'},
      ],
      workspaceItems:[
        {icon:'📸',title:'Instagram & LinkedIn',sub:'Content calendar and post approvals.'},
        {icon:'🎓',title:'Alumni Network',sub:'Outreach for mentorship and guest sessions.'},
        {icon:'🏢',title:'Industry Partnerships',sub:'Sponsor and collaboration pipeline.'},
      ],
    },
    [ROLES.CORE_LEAD_LABS]:{
      label:'Lab & CTFs Lead', icon:'🧪', badgeClass:'badge-embedded',
      focusTitle:'Lab Access, CTF Events & Challenges',
      focusDesc:'You manage physical lab scheduling and run CTF-style challenges and competitions for all wings.',
      workspaceTitle:'Lab & CTFs Workspace',
      quickLinks:[
        {icon:'🔓',label:'Lab Access Schedule',desc:'Slot bookings and equipment checkout.'},
        {icon:'🏁',label:'CTF Calendar',desc:'Upcoming internal and external competitions.'},
        {icon:'🧰',label:'Equipment Inventory',desc:'Lab hardware status — see Inventory tab.'},
      ],
      workspaceItems:[
        {icon:'🗓️',title:'Lab Booking Slots',sub:'Manage weekly lab access requests.'},
        {icon:'🚩',title:'CTF Challenge Bank',sub:'Design and curate challenges for events.'},
        {icon:'🏆',title:'Competition Results',sub:'Track scores and leaderboard history.'},
      ],
    },
    [ROLES.CORE_LEAD_RESEARCH]:{
      label:'Research Lead', icon:'🔬', badgeClass:'badge-ai',
      focusTitle:'Research Projects & Publications',
      focusDesc:'You coordinate cross-wing research efforts, paper submissions, and conference participation.',
      workspaceTitle:'Research Workspace',
      quickLinks:[
        {icon:'📄',label:'Active Papers',desc:'Track drafts, submissions, and reviews.'},
        {icon:'🧑‍🔬',label:'Research Groups',desc:'Cross-wing teams working on projects.'},
        {icon:'🎤',label:'Conferences & CFPs',desc:'Upcoming deadlines worth applying to.'},
      ],
      workspaceItems:[
        {icon:'📝',title:'Paper Tracker',sub:'Manuscripts in progress across wings.'},
        {icon:'👥',title:'Research Groups',sub:'Member teams and their focus topics.'},
        {icon:'📅',title:'Conference Deadlines',sub:'Upcoming CFPs and submission dates.'},
      ],
    },
  };

  function clTab(tab){
    document.querySelectorAll('[data-page="corelead"] .dash-tab').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('[data-page="corelead"] .dash-nav-item').forEach(el=>el.classList.remove('active'));
    getEl(`cl-tab-${tab}`)?.classList.add('active');
    event?.currentTarget?.classList.add('active');
  }

  function populateClDashboard(s){
    if(!s)return;
    const cfg=CORE_LEAD_CONFIG[s.role];if(!cfg)return;
    const av=getEl('cl-sb-avatar');if(av)av.textContent=cfg.icon;
    setEl('cl-sb-name',s.name);setEl('cl-sb-role',cfg.label);
    setEl('cl-welcome-name',s.name.split(' ')[0]);
    const bh=getEl('cl-role-badge-header');
    if(bh)bh.innerHTML=`<span class="badge ${cfg.badgeClass}">${cfg.icon} ${cfg.label}</span>`;

    const focus=getEl('cl-focus-card');
    if(focus)focus.innerHTML=`<div style="display:flex;gap:var(--space-4);align-items:flex-start;"><div style="font-size:32px;">${cfg.icon}</div><div><div style="font-weight:700;font-size:var(--text-lg);margin-bottom:var(--space-2);">${cfg.focusTitle}</div><div style="color:var(--text-secondary);font-size:var(--text-sm);line-height:1.6;">${cfg.focusDesc}</div></div></div>`;

    const ql=getEl('cl-quick-links');
    if(ql)ql.innerHTML=cfg.quickLinks.map(l=>`<div style="display:flex;gap:var(--space-3);align-items:flex-start;padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);"><div style="font-size:20px;">${l.icon}</div><div><div style="font-weight:600;font-size:var(--text-sm);">${l.label}</div><div style="font-size:12px;color:var(--text-muted);">${l.desc}</div></div></div>`).join('');

    setEl('cl-workspace-title',cfg.workspaceTitle);
    const wc=getEl('cl-workspace-card');
    if(wc)wc.innerHTML=cfg.workspaceItems.map(i=>`<div style="display:flex;gap:var(--space-4);align-items:flex-start;padding:var(--space-4) 0;border-bottom:1px solid var(--border-subtle);"><div style="font-size:24px;">${i.icon}</div><div><div style="font-weight:600;margin-bottom:2px;">${i.title}</div><div style="font-size:var(--text-sm);color:var(--text-secondary);">${i.sub}</div></div></div>`).join('');
  }

  function openTaskModal(){
    const s=getSession();if(!s)return;
    const sel=getEl('task-assignee');if(sel)sel.innerHTML=getWingMembers(s.wing).map(m=>`<option value="${m.id}">${m.name}</option>`).join('');
    show('task-modal');
  }

  function closeTaskModal(){
    hide('task-modal');
    ['task-title','task-desc'].forEach(id=>{const e=getEl(id);if(e)e.value='';});
    const st=getEl('task-type');if(st)st.value='';const du=getEl('task-due');if(du)du.value='';
  }

  function submitTask(){
    const title=getEl('task-title')?.value.trim(),type=getEl('task-type')?.value;
    const assignee=getEl('task-assignee'),due=getEl('task-due')?.value,desc=getEl('task-desc')?.value.trim();
    if(!title||!type||!assignee?.value){showToast('Fill in title, type, and assignee.','error');return;}
    const s=getSession();if(!s)return;
    const task={id:`TASK-${Date.now()}`,title,type,assigneeId:assignee.value,assigneeName:assignee.options[assignee.selectedIndex].text,due:due||null,desc:desc||'',completed:false,wing:s.wing,createdAt:new Date().toISOString()};
    if(!taskStore[s.wing])taskStore[s.wing]=[];
    taskStore[s.wing].push(task);
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.set('wingTasks',task.id,task).catch(()=>{});
    notifyTaskAssigned(task);
    closeTaskModal();renderTaskBoard(s.wing);renderWlOverview(s.wing);showToast(`Task assigned to ${task.assigneeName}!`,'success');
  }

  function filterTasks(filter,btn){
    taskCurrentFilter=filter;
    document.querySelectorAll('#wl-tab-tasks .task-filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    const s=getSession();if(s)renderTaskBoard(s.wing);
  }

  function renderTaskBoard(wing){
    if(!wing)return;
    let tasks=taskStore[wing]||[];
    if(taskCurrentFilter==='Research')  tasks=tasks.filter(t=>t.type==='Research');
    if(taskCurrentFilter==='Event Duty')tasks=tasks.filter(t=>t.type==='Event Duty');
    if(taskCurrentFilter==='Project')   tasks=tasks.filter(t=>t.type==='Project');
    if(taskCurrentFilter==='pending')   tasks=tasks.filter(t=>!t.completed);
    if(taskCurrentFilter==='completed') tasks=tasks.filter(t=>t.completed);
    const board=getEl('wl-task-board');if(!board)return;
    if(!tasks.length){board.innerHTML=emptyState('No tasks match this filter.','✅');return;}
    board.innerHTML=tasks.map(t=>`<div class="task-card ${t.completed?'completed':''}" id="task-${t.id}"><div class="task-card-check" onclick="toggleTask('${wing}','${t.id}')">✓</div><div class="task-card-body"><div class="task-card-title">${t.title}</div><div class="task-card-meta"><span class="task-type-pill task-type-${t.type.replace(' ','-')}">${t.type}</span><span>👤 ${t.assigneeName}</span>${t.due?`<span>📅 ${t.due}</span>`:''}</div></div><div class="task-card-actions"><button class="task-delete-btn" onclick="deleteTask('${wing}','${t.id}')">🗑</button></div></div>`).join('');
  }

  function toggleTask(wing,id){const t=(taskStore[wing]||[]).find(t=>t.id===id);if(t){t.completed=!t.completed;if(window.ACE_FIREBASE_LIVE)window.ACEDB.update('wingTasks',id,{completed:t.completed}).catch(()=>{});renderTaskBoard(wing);renderWlOverview(wing);showToast(t.completed?'Task complete! ✓':'Task reopened.',t.completed?'success':'warning');}}
  function deleteTask(wing,id){if(!confirm('Delete this task?'))return;const arr=taskStore[wing]||[];const i=arr.findIndex(t=>t.id===id);if(i>-1){arr.splice(i,1);if(window.ACE_FIREBASE_LIVE)window.ACEDB.remove('wingTasks',id).catch(()=>{});renderTaskBoard(wing);renderWlOverview(wing);showToast('Task deleted.','warning');}}

  function renderAttendance(wing){
    if(!wing)return;
    const tb=getEl('wl-attendance-tbody');if(!tb)return;
    const members=getWingMembers(wing);
    tb.innerHTML=members.map(m=>{const sess=m.attendance||[0,0,0,0];const pres=sess.filter(Boolean).length;const pct=Math.round(pres/sess.length*100);const dots=sess.map((s,i)=>`<td class="att-cell" onclick="toggleAttendance('${wing}','${m.id}',${i})"><div class="att-dot ${s?'att-present':'att-absent'}">${s?'✓':'✕'}</div></td>`).join('');return`<tr><td style="font-weight:500;">${m.name}</td><td><span class="font-mono" style="font-size:11px;color:var(--text-muted);">${m.id}</span></td>${dots}<td><div style="display:flex;align-items:center;gap:var(--space-2);"><div style="flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:${pct>=75?'var(--success)':pct>=50?'var(--warning)':'var(--error)'};border-radius:2px;"></div></div><span style="font-family:var(--font-mono);font-size:11px;color:${pct>=75?'var(--success)':pct>=50?'var(--warning)':'var(--error)'};">${pct}%</span></div></td></tr>`;}).join('');
  }

  function toggleAttendance(wing,id,idx){const m=(wingMemberData[wing]||[]).find(m=>m.id===id);if(m&&m.attendance){m.attendance[idx]=m.attendance[idx]?0:1;renderAttendance(wing);}}

  function populateMemberDashboard(s){
    if(!s)return;
    const ini=s.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    setEl('member-sb-avatar',ini);setEl('member-sb-name',s.name);
    setEl('member-welcome-name',s.name.split(' ')[0]);setEl('member-header-id',s.memberId);
    const wing=s.wing||'AI';
    setEl('member-wing-icon',wing==='AI'?'⚡':wing==='Cybersecurity'?'🔐':'🔧');
    setEl('member-wing-name',`${wing} Wing`);
    const allT=Object.values(taskStore).flat().filter(t=>t.assigneeId===s.memberId);
    const done=allT.filter(t=>t.completed).length;
    setEl('mem-stat-tasks',allT.length);setEl('mem-stat-done',done);setEl('mem-stat-pending',allT.length-done);
    const re=getEl('member-recent-tasks');
    if(re){if(!allT.length)re.innerHTML=emptyState('No tasks assigned yet.','✅');else re.innerHTML=`<div class="task-board">${allT.slice(0,5).map(t=>`<div class="task-card ${t.completed?'completed':''}"><div class="task-card-check">${t.completed?'✓':''}</div><div class="task-card-body"><div class="task-card-title">${t.title}</div><div class="task-card-meta"><span class="task-type-pill task-type-${t.type.replace(' ','-')}">${t.type}</span>${t.due?`<span>📅 ${t.due}</span>`:''}</div></div><span class="status-pill ${t.completed?'status-active':'status-pending'}">${t.completed?'Done':'Pending'}</span></div>`).join('')}</div>`;}
  }

  function renderMemberTasks(){
    const s=getSession();if(!s)return;
    const allT=Object.values(taskStore).flat().filter(t=>t.assigneeId===s.memberId);
    const el=getEl('member-all-tasks');if(!el)return;
    if(!allT.length){el.innerHTML=emptyState('No tasks assigned yet.','✅');return;}
    el.innerHTML=`<div class="task-board">${allT.map(t=>`<div class="task-card ${t.completed?'completed':''}"><div class="task-card-check">${t.completed?'✓':''}</div><div class="task-card-body"><div class="task-card-title">${t.title}</div><div class="task-card-meta"><span class="task-type-pill task-type-${t.type.replace(' ','-')}">${t.type}</span>${t.due?`<span>📅 ${t.due}</span>`:''}</div></div><span class="status-pill ${t.completed?'status-active':'status-pending'}">${t.completed?'Done':'Pending'}</span></div>`).join('')}</div>`;
  }

  function filterMemberTasks(filter,btn){document.querySelectorAll('#member-tab-tasks .task-filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderMemberTasks();}

  // ══════════════════════════════════════════════════════════════
  // M5 — STUDENT LEAD DASHBOARD
  // ══════════════════════════════════════════════════════════════

  const slTaskStore=[],announcementStore=[],slEventStore=[];
  let slMemberFilter='all',editingEventId=null;

  function getAllMembers(){return[...getWingMembers('AI'),...getWingMembers('Cybersecurity'),...getWingMembers('Embedded Systems')];}

  function slTab(tab){
    document.querySelectorAll('[data-page="studentlead"] .dash-tab').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('[data-page="studentlead"] .dash-nav-item').forEach(el=>el.classList.remove('active'));
    getEl(`sl-tab-${tab}`)?.classList.add('active');event?.currentTarget?.classList.add('active');
    safeRender(()=>{
      if(tab==='overview')      renderSlOverview();
      if(tab==='members')       renderSlMembers();
      if(tab==='approvals')     renderSlApprovals();
      if(tab==='tasks')         renderSlTasks();
      if(tab==='announcements') renderAnnouncements();
      if(tab==='events')        renderSlEvents();
    },`sl-tab-${tab}`);
  }

  function populateSlDashboard(s){
    if(!s)return;
    const ini=s.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    setEl('sl-sb-avatar',ini);setEl('sl-sb-name',s.name);setEl('sl-welcome-name',s.name.split(' ')[0]);
    safeRender(renderSlOverview,'sl-tab-overview');
    updateApprovalBadge();
  }

  function renderSlOverview(){
    const all=getAllMembers(),pending=(memberDB||[]).filter(m=>m.status==='pending');
    const openT=[...Object.values(taskStore).flat(),...slTaskStore].filter(t=>!t.completed).length;
    setEl('sl-stat-total',all.length);setEl('sl-stat-active',all.filter(m=>m.status==='active').length);
    setEl('sl-stat-pending',pending.length);setEl('sl-stat-opentasks',openT);
    const wings=['AI','Cybersecurity','Embedded Systems'],ids=['ai','cyber','emb'],total=all.length||1;
    ids.forEach((id,i)=>{const cnt=getWingMembers(wings[i]).length;setEl(`sl-${id}-count`,`${cnt} members`);const b=getEl(`sl-${id}-bar`);if(b)b.style.width=`${Math.round(cnt/total*100)}%`;});
    const ae=getEl('sl-inv-alerts');
    if(ae){const low=inventoryStore.filter(i=>(i.total-i.issued)<=i.threshold);ae.innerHTML=low.length?low.map(i=>`<div class="sl-alert sl-alert-warning">⚠ <span><strong>${i.name}</strong> — only ${i.total-i.issued} left</span></div>`).join(''):`<div class="sl-alert sl-alert-ok">✅ All inventory levels healthy.</div>`;}
    const re=getEl('sl-recent-reg');
    if(re){const rec=(memberDB||[]).slice(-5).reverse();re.innerHTML=rec.length?rec.map(m=>`<div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) 0;border-bottom:1px solid var(--border-subtle);"><div style="width:32px;height:32px;border-radius:50%;background:var(--ai-cyan-dim);color:var(--ai-cyan);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:11px;flex-shrink:0;">${m.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</div><div style="flex:1;"><div style="font-family:var(--font-display);font-size:var(--text-sm);font-weight:600;">${m.name}</div><div style="font-size:var(--text-xs);color:var(--text-muted);">${m.wing} · ${m.roll}</div></div><span class="status-pill ${m.status==='pending'?'status-pending':'status-active'}" style="font-size:10px;">${m.status}</span></div>`).join(''):emptyState('No recent registrations.','📋');}
  }

  function renderSlApprovals(){
    const pending=(memberDB||[]).filter(m=>m.status==='pending');
    const el=getEl('sl-approvals-list');if(!el)return;
    if(!pending.length){el.innerHTML=`<div style="padding:var(--space-12);">${emptyState('All registrations reviewed ✓','🎉')}</div>`;return;}
    el.innerHTML=pending.map(m=>{const ini=m.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();const wc=m.wing==='AI'?'badge-ai':m.wing==='Cybersecurity'?'badge-cyber':'badge-embedded';return`<div class="sl-approval-card" id="approval-${m.id}"><div class="sl-approval-avatar">${ini}</div><div class="sl-approval-info"><div class="sl-approval-name">${m.name}</div><div class="sl-approval-meta"><span class="badge ${wc}" style="font-size:10px;">${m.wing}</span><span>📋 ${m.roll}</span><span>🏫 ${m.branch} · ${m.year}</span><span class="font-mono">${m.id}</span></div><div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-muted);">Skills: ${m.skills?.join(', ')||'—'}</div></div><div class="sl-approval-actions"><button class="btn-approve" onclick="approveRegistration('${m.id}')">✓ Approve</button><button class="btn-reject" onclick="rejectRegistration('${m.id}')">✕ Reject</button></div></div>`;}).join('');
  }

  function approveRegistration(id){
    const m=(memberDB||[]).find(m=>m.id===id);if(!m)return;
    m.status='active';
    if(wingMemberData[m.wing])wingMemberData[m.wing].push({id:m.id,name:m.name,year:m.year,branch:m.branch,status:'active',tasks:[],attendance:[0,0,0,0]});
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.update('members',m.id,{status:'active'}).catch(()=>{});
    notifyApprovalDecision(m,'approved');updateApprovalBadge();renderSlApprovals();renderSlOverview();showToast(`${m.name} approved and added to ${m.wing} Wing! ✓`,'success');
  }
  function rejectRegistration(id){
    const i=(memberDB||[]).findIndex(m=>m.id===id);if(i===-1)return;
    const m=memberDB[i];
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.remove('members',m.id).catch(()=>{});
    notifyApprovalDecision(m,'rejected');memberDB.splice(i,1);updateApprovalBadge();renderSlApprovals();renderSlOverview();showToast(`${m.name}'s application rejected.`,'warning');
  }

  function updateApprovalBadge(){const cnt=(memberDB||[]).filter(m=>m.status==='pending').length;const b=getEl('sl-approval-count');if(b){b.textContent=cnt;b.style.display=cnt>0?'inline-flex':'none';}}

  function filterSlMembers(filter,btn){slMemberFilter=filter;document.querySelectorAll('#sl-tab-members .filter-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderSlMembers();}

  function renderSlMembers(){
    const search=(getEl('sl-member-search')?.value||'').toLowerCase();
    let members=getAllMembers();
    if(['AI','Cybersecurity','Embedded Systems'].includes(slMemberFilter))members=getWingMembers(slMemberFilter);
    else if(slMemberFilter==='active')members=members.filter(m=>m.status==='active');
    else if(slMemberFilter==='inactive')members=members.filter(m=>m.status==='inactive');
    if(search)members=members.filter(m=>m.name.toLowerCase().includes(search)||m.id.toLowerCase().includes(search)||(m.branch||'').toLowerCase().includes(search));
    const tb=getEl('sl-members-tbody');if(!tb)return;
    if(!members.length){tb.innerHTML=`<tr><td colspan="6" style="padding:var(--space-8);">${emptyState('No members found.','👥')}</td></tr>`;return;}
    tb.innerHTML=members.map(m=>{const ini=m.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();const wing=m.id.includes('-AI-')?'AI':m.id.includes('-CYB-')?'Cybersecurity':'Embedded Systems';return`<tr><td><div style="display:flex;align-items:center;gap:var(--space-3);"><div style="width:32px;height:32px;border-radius:50%;background:var(--ai-cyan-dim);color:var(--ai-cyan);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;font-size:11px;flex-shrink:0;">${ini}</div><span style="font-weight:500;">${m.name}</span></div></td><td><span class="font-mono" style="font-size:11px;color:var(--text-muted);">${m.id}</span></td><td>${wingBadgeSmall(wing)}</td><td style="font-size:var(--text-sm);color:var(--text-secondary);">${m.year||'—'} · ${m.branch||'—'}</td><td><span class="status-pill ${m.status==='active'?'status-active':'status-inactive'}">${m.status}</span></td><td><button class="btn btn-ghost btn-sm" onclick="slToggleMember('${m.id}')">${m.status==='active'?'Deactivate':'Activate'}</button></td></tr>`;}).join('');
  }

  function slToggleMember(id){for(const w of['AI','Cybersecurity','Embedded Systems']){const m=(wingMemberData[w]||[]).find(m=>m.id===id);if(m){m.status=m.status==='active'?'inactive':'active';renderSlMembers();renderSlOverview();showToast(`${m.name} marked as ${m.status}.`,'success');return;}}}

  function openSlTaskModal() {show('sl-task-modal');}
  function closeSlTaskModal(){hide('sl-task-modal');['sl-task-title','sl-task-due'].forEach(id=>{const e=getEl(id);if(e)e.value='';});['sl-task-assignee','sl-task-type'].forEach(id=>{const e=getEl(id);if(e)e.value='';}); }

  function submitSlTask(){
    const title=getEl('sl-task-title')?.value.trim(),assignee=getEl('sl-task-assignee'),type=getEl('sl-task-type')?.value,due=getEl('sl-task-due')?.value;
    if(!title||!assignee?.value||!type){showToast('Please fill in all required fields.','error');return;}
    const task={id:`SLTASK-${Date.now()}`,title,assigneeId:assignee.value,assigneeName:assignee.options[assignee.selectedIndex].text,type,due:due||null,completed:false,createdAt:new Date().toISOString()};
    slTaskStore.push(task);
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.set('slTasks',task.id,task).catch(()=>{});
    notifyTaskAssigned(task);
    closeSlTaskModal();renderSlTasks();showToast('Task assigned!','success');
  }

  function renderSlTasks(){
    const board=getEl('sl-wl-tasks');
    if(board){if(!slTaskStore.length)board.innerHTML=emptyState('No tasks assigned to wing leads yet.','✅');else board.innerHTML=slTaskStore.map(t=>`<div class="sl-wl-task-card ${t.completed?'completed':''}"><div style="cursor:pointer;border:2px solid var(--border-strong);width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;color:${t.completed?'white':'transparent'};background:${t.completed?'var(--success)':'transparent'};flex-shrink:0;" onclick="toggleSlTask('${t.id}')">✓</div><div style="flex:1;"><div class="task-card-title">${t.title}</div><div class="task-card-meta" style="display:flex;gap:var(--space-3);font-size:var(--text-xs);color:var(--text-muted);margin-top:3px;"><span class="task-type-pill task-type-${t.type.replace(' ','-')}">${t.type}</span><span>👤 ${t.assigneeName}</span>${t.due?`<span>📅 ${t.due}</span>`:''}</div></div><span class="status-pill ${t.completed?'status-active':'status-pending'}">${t.completed?'Done':'Pending'}</span><button class="task-delete-btn" onclick="deleteSlTask('${t.id}')">🗑</button></div>`).join('');}
    const sm=getEl('sl-task-summary');
    if(sm){const wings=['AI','Cybersecurity','Embedded Systems'];const icons={AI:'⚡',Cybersecurity:'🔐','Embedded Systems':'🔧'};sm.innerHTML=wings.map(w=>{const t=taskStore[w]||[];const done=t.filter(x=>x.completed).length;return`<div class="sl-task-summary-card"><div class="sl-task-summary-wing">${icons[w]} ${w}</div><div class="sl-task-summary-row"><span>Total</span><span style="font-weight:600;">${t.length}</span></div><div class="sl-task-summary-row"><span>Done</span><span style="color:var(--success);">${done}</span></div><div class="sl-task-summary-row"><span>Pending</span><span style="color:var(--warning);">${t.length-done}</span></div><div style="height:1px;background:var(--border-subtle);margin-block:var(--space-2);"></div><div class="sl-task-summary-row"><span>Research</span><span>${t.filter(x=>x.type==='Research').length}</span></div><div class="sl-task-summary-row"><span>Events</span><span>${t.filter(x=>x.type==='Event Duty').length}</span></div><div class="sl-task-summary-row"><span>Projects</span><span>${t.filter(x=>x.type==='Project').length}</span></div></div>`;}).join('');}
  }

  function toggleSlTask(id){const t=slTaskStore.find(t=>t.id===id);if(t){t.completed=!t.completed;if(window.ACE_FIREBASE_LIVE)window.ACEDB.update('slTasks',id,{completed:t.completed}).catch(()=>{});renderSlTasks();showToast(t.completed?'Done! ✓':'Reopened.',t.completed?'success':'warning');}}
  function deleteSlTask(id){const i=slTaskStore.findIndex(t=>t.id===id);if(i>-1){slTaskStore.splice(i,1);if(window.ACE_FIREBASE_LIVE)window.ACEDB.remove('slTasks',id).catch(()=>{});renderSlTasks();showToast('Task deleted.','warning');}}

  function openAnnouncementModal(){show('announce-modal');}
  function closeAnnouncementModal(){hide('announce-modal');['ann-title','ann-body'].forEach(id=>{const e=getEl(id);if(e)e.value='';});const p=getEl('ann-pin');if(p)p.checked=false;}

  function submitAnnouncement(){
    const title=getEl('ann-title')?.value.trim(),body=getEl('ann-body')?.value.trim(),target=getEl('ann-target')?.value,pinned=getEl('ann-pin')?.checked;
    if(!title||!body){showToast('Fill in title and message.','error');return;}
    const a={id:`ANN-${Date.now()}`,title,body,target,pinned,createdAt:new Date().toLocaleString(),author:getSession()?.name||'Student Lead'};
    announcementStore.unshift(a);
    announcementStore.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
    if(window.ACE_FIREBASE_LIVE) window.ACEDB.set('announcements',a.id,a).catch(()=>{});
    notifyAnnouncement(a);
    closeAnnouncementModal();renderAnnouncements();showToast('Announcement posted!','success');
  }

  function renderAnnouncements(){
    const el=getEl('sl-announcements-list');if(!el)return;
    if(!announcementStore.length){el.innerHTML=emptyState('No announcements yet.','📢');return;}
    const tl=t=>t==='all'?'All Members':`${t} Wing`;
    el.innerHTML=announcementStore.map(a=>`<div class="ann-card ${a.pinned?'pinned':''}" id="ann-${a.id}"><div class="ann-card-header"><div>${a.pinned?'<span class="font-mono" style="font-size:10px;color:var(--ai-cyan);display:block;margin-bottom:4px;">📌 Pinned</span>':''}<div class="ann-card-title">${a.title}</div></div><div style="display:flex;gap:var(--space-2);align-items:center;"><span class="badge badge-neutral" style="font-size:10px;">${tl(a.target)}</span><button class="ann-pin-btn" onclick="toggleAnnPin('${a.id}')">📌</button><button class="task-delete-btn" onclick="deleteAnnouncement('${a.id}')">🗑</button></div></div><div class="ann-card-body">${a.body}</div><div class="ann-card-footer"><div class="ann-card-meta">${a.createdAt} · ${a.author}</div></div></div>`).join('');
  }

  function toggleAnnPin(id){const a=announcementStore.find(a=>a.id===id);if(a){a.pinned=!a.pinned;announcementStore.sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));if(window.ACE_FIREBASE_LIVE)window.ACEDB.update('announcements',id,{pinned:a.pinned}).catch(()=>{});renderAnnouncements();showToast(a.pinned?'Pinned!':'Unpinned.','success');}}
  function deleteAnnouncement(id){const i=announcementStore.findIndex(a=>a.id===id);if(i>-1){announcementStore.splice(i,1);if(window.ACE_FIREBASE_LIVE)window.ACEDB.remove('announcements',id).catch(()=>{});renderAnnouncements();showToast('Deleted.','warning');}}

  function openEventModal(editId=null){
    editingEventId=editId;const tEl=getEl('event-modal-title');
    if(editId){const ev=slEventStore.find(e=>e.id===editId);if(ev){['ev-title','ev-date','ev-wing','ev-location','ev-duration','ev-desc'].forEach(id=>{const e=getEl(id);if(e)e.value=ev[id.replace('ev-','')]||'';});if(tEl)tEl.textContent='Edit Event';}}
    else{['ev-title','ev-date','ev-location','ev-duration','ev-desc'].forEach(id=>{const e=getEl(id);if(e)e.value='';});if(tEl)tEl.textContent='Create Event';}
    show('event-modal');
  }
  function closeEventModal(){hide('event-modal');editingEventId=null;}

  function submitEvent(){
    const title=getEl('ev-title')?.value.trim(),date=getEl('ev-date')?.value;
    if(!title||!date){showToast('Title and date are required.','error');return;}
    const ev={title,date,wing:getEl('ev-wing')?.value,location:getEl('ev-location')?.value.trim(),duration:getEl('ev-duration')?.value.trim(),desc:getEl('ev-desc')?.value.trim()};
    if(editingEventId){
      const e=slEventStore.find(e=>e.id===editingEventId);
      if(e){Object.assign(e,ev);if(window.ACE_FIREBASE_LIVE)window.ACEDB.update('events',e.id,ev).catch(()=>{});showToast('Event updated!','success');}
    } else {
      const newEv={id:`EV-${Date.now()}`,...ev};
      slEventStore.push(newEv);
      if(window.ACE_FIREBASE_LIVE) window.ACEDB.set('events',newEv.id,newEv).catch(()=>{});
      showToast('Event created!','success');
    }
    slEventStore.sort((a,b)=>new Date(a.date)-new Date(b.date));closeEventModal();renderSlEvents();
  }

  function renderSlEvents(){
    const el=getEl('sl-events-list');if(!el)return;
    if(!slEventStore.length){el.innerHTML=emptyState('No events yet.','📅');return;}
    el.innerHTML=slEventStore.map(ev=>{const d=new Date(ev.date);return`<div class="sl-event-card"><div class="sl-event-date-box"><div class="sl-event-day">${d.getDate()}</div><div class="sl-event-month">${d.toLocaleString('default',{month:'short'}).toUpperCase()}</div></div><div class="sl-event-info"><div style="margin-bottom:var(--space-1);">${wingBadgeSmall(ev.wing==='all'?'All':ev.wing)}</div><div class="sl-event-title">${ev.title}</div><div class="sl-event-meta">${ev.location?`📍 ${ev.location}`:''}${ev.duration?` · ⏱ ${ev.duration}`:''}</div></div><div class="sl-event-actions"><button class="btn btn-ghost btn-sm" onclick="openEventModal('${ev.id}')">Edit</button><button style="background:rgba(239,68,68,0.08);color:var(--error);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);cursor:pointer;font-size:var(--text-xs);padding:4px 10px;" onclick="deleteSlEvent('${ev.id}')">Delete</button></div></div>`;}).join('');
  }

  function deleteSlEvent(id){if(!confirm('Delete this event?'))return;const i=slEventStore.findIndex(e=>e.id===id);if(i>-1){slEventStore.splice(i,1);if(window.ACE_FIREBASE_LIVE)window.ACEDB.remove('events',id).catch(()=>{});renderSlEvents();showToast('Event deleted.','warning');}}

  // ══════════════════════════════════════════════════════════════
  // M6 — INVENTORY MANAGEMENT
  // ══════════════════════════════════════════════════════════════

  // Demo inventory removed — populated entirely from Firestore once items
  // are added through the Inventory tab or directly in the console.
  const inventoryStore=[];

  const invLog=[],activeIssues=[];let editingInvId=null;

  function populateInvSidebar(){
    const s=getSession();if(!s)return;
    setEl('inv-sb-name',s.name);setEl('inv-sb-role',getRoleLabel(s.role));
    const av=getEl('inv-sb-avatar');if(av)av.textContent=s.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    renderInvOverview();
  }

  function invTab(tab){
    document.querySelectorAll('[data-page="inventory"] .dash-tab').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('[data-page="inventory"] .dash-nav-item').forEach(el=>el.classList.remove('active'));
    getEl(`inv-tab-${tab}`)?.classList.add('active');event?.currentTarget?.classList.add('active');
    safeRender(()=>{
      if(tab==='overview')renderInvOverview();
      if(tab==='items'){renderInvItems();}
      if(tab==='issue'){renderIssueDropdown();renderIssuedTable();}
      if(tab==='return')renderReturnTable();
      if(tab==='log')renderInvLog();
    },`inv-tab-${tab}`);
  }

  function renderInvOverview(){
    const low=inventoryStore.filter(i=>(i.total-i.issued)<=i.threshold);
    const ae=getEl('inv-alert-strip');
    if(ae)ae.innerHTML=low.length?low.map(i=>`<div class="sl-alert sl-alert-warning" style="margin-bottom:var(--space-2);">⚠ <span><strong>${i.name}</strong> — ${i.total-i.issued} in stock (threshold: ${i.threshold})</span></div>`).join(''):`<div class="sl-alert sl-alert-ok">✅ All inventory levels healthy.</div>`;
    const cats=['ESP32 Kits','Arduino Boards','Components','Routers','Switches','Other'];
    const icons={'ESP32 Kits':'🔌','Arduino Boards':'🤖','Components':'⚙️','Routers':'📡','Switches':'🔀','Other':'📦'};
    const cg=getEl('inv-cat-grid');
    if(cg)cg.innerHTML=cats.map(cat=>{const items=inventoryStore.filter(i=>i.category===cat);const inS=items.reduce((s,i)=>s+(i.total-i.issued),0);const tot=items.reduce((s,i)=>s+i.total,0);const hasL=items.some(i=>(i.total-i.issued)<=i.threshold);return`<div class="inv-cat-card"${hasL?' style="border-color:rgba(245,158,11,0.3);"':''}><div style="display:flex;align-items:center;justify-content:space-between;"><div class="inv-cat-icon">${icons[cat]||'📦'}</div>${hasL?'<span style="color:var(--warning);">⚠</span>':''}</div><div class="inv-cat-name">${cat}</div><div class="inv-cat-count">${inS}</div><div class="inv-cat-sub">${inS}/${tot} available · ${items.length} type${items.length!==1?'s':''}</div></div>`;}).join('');
    const tb=getEl('inv-low-stock-tbody');
    if(tb)tb.innerHTML=!low.length?`<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:var(--space-6);">No low-stock items 🎉</td></tr>`:low.map(i=>{const inS=i.total-i.issued;return`<tr><td style="font-weight:600;">${i.name}</td><td><span class="font-mono" style="font-size:11px;color:var(--text-muted);">${i.category}</span></td><td>${wingBadgeSmall(i.wing)}</td><td style="font-weight:700;color:${inS===0?'var(--error)':'var(--warning)'};">${inS}</td><td style="color:var(--text-muted);">${i.threshold}</td><td><span class="status-pill ${inS===0?'status-inactive':'status-pending'}">${inS===0?'Out of Stock':'Low Stock'}</span></td></tr>`;}).join('');
  }

  function renderInvItems(){
    const cf=getEl('inv-cat-filter')?.value||'all',search=(getEl('inv-search')?.value||'').toLowerCase();
    let items=[...inventoryStore];
    if(cf!=='all')items=items.filter(i=>i.category===cf);
    if(search)items=items.filter(i=>i.name.toLowerCase().includes(search)||i.category.toLowerCase().includes(search)||i.wing.toLowerCase().includes(search));
    const tb=getEl('inv-items-tbody');if(!tb)return;
    if(!items.length){tb.innerHTML=`<tr><td colspan="8" style="padding:var(--space-8);">${emptyState('No items found.','📦')}</td></tr>`;return;}
    tb.innerHTML=items.map(i=>{const inS=i.total-i.issued;const low=inS<=i.threshold;const cc=`inv-condition-${i.condition.replace(' ','-')}`;return`<tr><td><div style="font-family:var(--font-display);font-weight:600;">${i.name}</div>${i.notes?`<div style="font-size:11px;color:var(--text-muted);">${i.notes}</div>`:''}</td><td><span class="font-mono" style="font-size:11px;color:var(--text-muted);">${i.category}</span></td><td>${wingBadgeSmall(i.wing)}</td><td style="font-weight:600;">${i.total}</td><td style="font-weight:700;color:${low?(inS===0?'var(--error)':'var(--warning)'):'var(--success)'};">${inS}${low?' ⚠':''}</td><td>${i.issued}</td><td><span class="inv-condition ${cc}">${i.condition}</span></td><td><div style="display:flex;gap:var(--space-2);"><button class="btn btn-ghost btn-sm" onclick="openEditItemModal('${i.id}')">Edit</button><button style="background:rgba(239,68,68,0.08);color:var(--error);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);cursor:pointer;font-size:var(--text-xs);padding:2px 10px;" onclick="deleteInvItem('${i.id}')">Del</button></div></td></tr>`;}).join('');
  }

  function openAddItemModal(){editingInvId=null;['inv-item-name','inv-item-notes','inv-item-qty','inv-item-threshold'].forEach(id=>{const e=getEl(id);if(e)e.value='';});['inv-item-cat','inv-item-wing','inv-item-condition'].forEach(id=>{const e=getEl(id);if(e)e.value='';});setEl('inv-modal-title','Add Inventory Item');show('inv-item-modal');}
  function openEditItemModal(id){const item=inventoryStore.find(i=>i.id===id);if(!item)return;editingInvId=id;getEl('inv-item-name').value=item.name;getEl('inv-item-cat').value=item.category;getEl('inv-item-wing').value=item.wing;getEl('inv-item-qty').value=item.total;getEl('inv-item-threshold').value=item.threshold;getEl('inv-item-condition').value=item.condition;getEl('inv-item-notes').value=item.notes||'';setEl('inv-modal-title','Edit Item');show('inv-item-modal');}
  function closeAddItemModal(){hide('inv-item-modal');editingInvId=null;}

  function submitInventoryItem(){
    const name=getEl('inv-item-name')?.value.trim(),category=getEl('inv-item-cat')?.value,wing=getEl('inv-item-wing')?.value;
    const qty=parseInt(getEl('inv-item-qty')?.value),threshold=parseInt(getEl('inv-item-threshold')?.value)||3;
    const condition=getEl('inv-item-condition')?.value||'Good',notes=getEl('inv-item-notes')?.value.trim();
    if(!name||!category||!wing||isNaN(qty)||qty<1){showToast('Fill in name, category, wing, and quantity.','error');return;}
    if(editingInvId){
      const item=inventoryStore.find(i=>i.id===editingInvId);
      if(item){
        Object.assign(item,{name,category,wing,total:qty,threshold,condition,notes});
        if(window.ACE_FIREBASE_LIVE) window.ACEDB.update('inventory',item.id,{name,category,wing,total:qty,threshold,condition,notes}).catch(()=>{});
        showToast('Item updated!','success');
      }
    } else {
      const newItem={id:`INV-${String(inventoryStore.length+1).padStart(3,'0')}`,name,category,wing,total:qty,issued:0,threshold,condition,notes};
      inventoryStore.push(newItem);
      const logEntry={id:`LOG-${Date.now()}`,icon:'➕',cls:'add',desc:`Added: ${name} (${qty})`,time:new Date().toLocaleString()};
      invLog.unshift(logEntry);
      if(window.ACE_FIREBASE_LIVE){
        window.ACEDB.set('inventory',newItem.id,newItem).catch(()=>{});
        window.ACEDB.set('inventoryLog',logEntry.id,logEntry).catch(()=>{});
      }
      showToast('Item added!','success');
    }
    closeAddItemModal();renderInvItems();renderInvOverview();
  }

  function deleteInvItem(id){
    if(!confirm('Delete?'))return;
    const i=inventoryStore.findIndex(x=>x.id===id);
    if(i>-1){
      const n=inventoryStore[i].name;
      inventoryStore.splice(i,1);
      if(window.ACE_FIREBASE_LIVE) window.ACEDB.remove('inventory',id).catch(()=>{});
      renderInvItems();renderInvOverview();showToast(`${n} removed.`,'warning');
    }
  }

  function renderIssueDropdown(){const sel=getEl('issue-item-id');if(!sel)return;const av=inventoryStore.filter(i=>(i.total-i.issued)>0);sel.innerHTML=`<option value="">Select item</option>`+av.map(i=>`<option value="${i.id}">${i.name} (${i.total-i.issued} avail.)</option>`).join('');}
  function updateIssueMax(){const sel=getEl('issue-item-id'),qe=getEl('issue-qty');if(!sel||!qe)return;const item=inventoryStore.find(i=>i.id===sel.value);if(item){qe.max=item.total-item.issued;qe.value=1;}}

  function submitIssue(){
    const itemId=getEl('issue-item-id')?.value,issuedTo=getEl('issue-to')?.value.trim();
    const qty=parseInt(getEl('issue-qty')?.value),returnDate=getEl('issue-return-date')?.value;
    const notes=getEl('issue-notes')?.value.trim(),err=getEl('issue-qty-error');
    if(!itemId||!issuedTo||isNaN(qty)||qty<1){showToast('Fill in item, recipient, and quantity.','error');return;}
    const item=inventoryStore.find(i=>i.id===itemId);if(!item)return;
    const avail=item.total-item.issued;
    if(qty>avail){if(err)err.textContent=`⚠ Only ${avail} available.`;return;}
    if(err)err.textContent='';
    item.issued+=qty;
    const issue={id:`ISSUE-${Date.now()}`,itemId,itemName:item.name,issuedTo,qty,returnDate:returnDate||null,notes,issuedAt:new Date().toLocaleString(),status:'issued'};
    activeIssues.push(issue);
    const logEntry={id:`LOG-${Date.now()}`,icon:'📤',cls:'issue',desc:`Issued ${qty}× ${item.name} to ${issuedTo}`,time:new Date().toLocaleString()};
    invLog.unshift(logEntry);
    if(window.ACE_FIREBASE_LIVE){
      window.ACEDB.update('inventory',item.id,{issued:item.issued}).catch(()=>{});
      window.ACEDB.set('issues',issue.id,issue).catch(()=>{});
      window.ACEDB.set('inventoryLog',logEntry.id,logEntry).catch(()=>{});
    }
    if((item.total-item.issued)<=item.threshold) notifyInventoryAlert(item);
    ['issue-item-id','issue-to','issue-return-date','issue-notes'].forEach(id=>{const e=getEl(id);if(e)e.value='';});if(getEl('issue-qty'))getEl('issue-qty').value=1;
    renderIssueDropdown();renderIssuedTable();renderInvOverview();showToast(`${qty}× ${item.name} issued!`,'success');
  }

  function renderIssuedTable(){const tb=getEl('inv-issued-tbody');if(!tb)return;const p=activeIssues.filter(i=>i.status==='issued');if(!p.length){tb.innerHTML=`<tr><td colspan="7" style="padding:var(--space-6);">${emptyState('No items currently issued.','📥')}</td></tr>`;return;}tb.innerHTML=p.map(i=>{const ov=i.returnDate&&new Date(i.returnDate)<new Date();return`<tr><td style="font-weight:600;">${i.itemName}</td><td>${i.issuedTo}</td><td style="font-weight:700;">${i.qty}</td><td style="font-size:var(--text-xs);color:var(--text-muted);">${i.issuedAt}</td><td style="color:${ov?'var(--error)':'var(--text-secondary)'};">${i.returnDate||'—'}${ov?' ⚠':''}</td><td><span class="status-pill ${ov?'status-inactive':'status-pending'}">${ov?'Overdue':'Issued'}</span></td><td><button class="btn-approve" onclick="returnItem('${i.id}')">📥 Return</button></td></tr>`;}).join('');}

  function returnItem(issueId){
    const issue=activeIssues.find(i=>i.id===issueId);if(!issue)return;
    const item=inventoryStore.find(i=>i.id===issue.itemId);if(item)item.issued-=issue.qty;
    issue.status='returned';issue.returnedAt=new Date().toLocaleString();
    const logEntry={id:`LOG-${Date.now()}`,icon:'📥',cls:'return',desc:`Returned ${issue.qty}× ${issue.itemName} from ${issue.issuedTo}`,time:new Date().toLocaleString()};
    invLog.unshift(logEntry);
    if(window.ACE_FIREBASE_LIVE){
      if(item) window.ACEDB.update('inventory',item.id,{issued:item.issued}).catch(()=>{});
      window.ACEDB.update('issues',issue.id,{status:'returned',returnedAt:issue.returnedAt}).catch(()=>{});
      window.ACEDB.set('inventoryLog',logEntry.id,logEntry).catch(()=>{});
    }
    renderIssuedTable();renderReturnTable();renderInvOverview();showToast(`${issue.qty}× ${issue.itemName} returned!`,'success');
  }
  function renderReturnTable(){const tb=getEl('inv-return-tbody');if(!tb)return;if(!activeIssues.length){tb.innerHTML=`<tr><td colspan="7" style="padding:var(--space-6);">${emptyState('No records yet.','📋')}</td></tr>`;return;}tb.innerHTML=activeIssues.map(i=>`<tr><td style="font-weight:600;">${i.itemName}</td><td>${i.issuedTo}</td><td>${i.qty}</td><td style="font-size:var(--text-xs);color:var(--text-muted);">${i.issuedAt}</td><td>${i.returnDate||'—'}</td><td><span class="status-pill ${i.status==='returned'?'status-active':'status-pending'}">${i.status==='returned'?'Returned':'Issued'}</span></td><td>${i.status==='issued'?`<button class="btn-approve" onclick="returnItem('${i.id}')">📥 Return</button>`:'<span style="color:var(--success);">✓ Done</span>'}</td></tr>`).join('');}
  function renderInvLog(){const el=getEl('inv-log-list');if(!el)return;if(!invLog.length){el.innerHTML=emptyState('No activity yet.','📜');return;}el.innerHTML=invLog.map(l=>`<div class="inv-log-item"><div class="inv-log-icon inv-log-${l.cls}">${l.icon}</div><div class="inv-log-body"><div class="inv-log-desc">${l.desc}</div><div class="inv-log-time">${l.time}</div></div></div>`).join('');}

  // ══════════════════════════════════════════════════════════════
  // M7 — MEETING MINUTES
  // ══════════════════════════════════════════════════════════════

  const minutesStore=[];let actionFilter='all',editingMinId=null,pendingActions=[];

  function populateMinSidebar(){
    const s=getSession();if(!s)return;
    setEl('min-sb-name',s.name);setEl('min-sb-role',getRoleLabel(s.role));
    const av=getEl('min-sb-avatar');if(av)av.textContent=s.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    renderMinutesList();
  }

  function minTab(tab){
    document.querySelectorAll('[data-page="minutes"] .dash-tab').forEach(el=>el.classList.remove('active'));
    document.querySelectorAll('[data-page="minutes"] .dash-nav-item').forEach(el=>el.classList.remove('active'));
    getEl(`min-tab-${tab}`)?.classList.add('active');event?.currentTarget?.classList.add('active');
    safeRender(()=>{if(tab==='list')renderMinutesList();if(tab==='actions')renderActionItems();},'min-list-container');
  }

  function renderMinutesList(){
    const search=(getEl('min-search')?.value||'').toLowerCase(),wf=getEl('min-wing-filter')?.value||'all';
    let records=[...minutesStore];
    if(wf!=='all')records=records.filter(r=>r.wing===wf);
    if(search)records=records.filter(r=>r.title.toLowerCase().includes(search)||(r.notes||'').toLowerCase().includes(search)||(r.decisions||'').toLowerCase().includes(search)||r.actions.some(a=>a.text.toLowerCase().includes(search)));
    records.sort((a,b)=>new Date(b.date)-new Date(a.date));
    const el=getEl('min-list-container');if(!el)return;
    if(!records.length){el.innerHTML=emptyState('No meeting minutes found.','📝');return;}
    el.innerHTML=records.map(r=>{const oa=r.actions.filter(a=>!a.resolved).length;return`<div class="min-card" onclick="openMinuteDetail('${r.id}')"><div class="min-card-header"><div><div class="min-card-title">${r.title}</div></div><div style="display:flex;gap:var(--space-2);align-items:center;">${wingBadgeSmall(r.wing)}${oa>0?`<span class="sl-badge-count">${oa}</span>`:''}</div></div><div class="min-card-meta"><span>📅 ${new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>${r.attendees?`<span>👥 ${r.attendees}</span>`:''}<span>📝 ${r.actions.length} action${r.actions.length!==1?'s':''}</span></div><div class="min-card-preview">${r.notes}</div></div>`;}).join('');
  }

  function openMinuteDetail(id){
    const r=minutesStore.find(m=>m.id===id);if(!r)return;
    const s=getSession();const canDel=s?.role===ROLES.STUDENT_LEAD;
    const content=getEl('min-detail-content');
    if(content)content.innerHTML=`<div style="margin-bottom:var(--space-5);"><div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2);">${wingBadgeSmall(r.wing)}<span class="font-mono" style="font-size:10px;color:var(--text-muted);">${r.id}</span></div><h2 style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;margin-bottom:var(--space-1);">${r.title}</h2><div style="font-size:var(--text-sm);color:var(--text-muted);">📅 ${new Date(r.date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}${r.attendees?` · 👥 ${r.attendees}`:''}</div></div><div style="background:var(--bg-overlay);border-radius:var(--radius-lg);padding:var(--space-4);margin-bottom:var(--space-4);"><div class="font-mono" style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:var(--space-2);">Notes</div><div style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.8;white-space:pre-wrap;">${r.notes}</div></div>${r.decisions?`<div style="background:var(--bg-overlay);border-radius:var(--radius-lg);padding:var(--space-4);margin-bottom:var(--space-4);"><div class="font-mono" style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:var(--space-2);">Decisions</div><div style="font-size:var(--text-sm);color:var(--text-secondary);line-height:1.8;white-space:pre-wrap;">${r.decisions}</div></div>`:''} ${r.actions.length?`<div><div class="font-mono" style="font-size:10px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:var(--space-3);">Action Items (${r.actions.filter(a=>!a.resolved).length} open)</div>${r.actions.map(a=>`<div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) 0;border-bottom:1px solid var(--border-subtle);"><div style="width:16px;height:16px;border-radius:50%;border:2px solid ${a.resolved?'var(--success)':'var(--border-strong)'};background:${a.resolved?'var(--success)':'transparent'};display:flex;align-items:center;justify-content:center;font-size:9px;color:${a.resolved?'white':'transparent'};flex-shrink:0;">✓</div><span style="font-size:var(--text-sm);color:var(--text-secondary);${a.resolved?'text-decoration:line-through;':''}">${a.text}</span><span class="status-pill ${a.resolved?'status-active':'status-pending'}" style="margin-left:auto;font-size:10px;">${a.resolved?'Resolved':'Open'}</span></div>`).join('')}</div>`:''}`;
    const eb=getEl('min-detail-edit-btn'),db=getEl('min-detail-delete-btn');
    if(eb)eb.onclick=()=>{closeMinuteDetail();editMinutes(id);};
    if(db){db.style.display=canDel?'inline-flex':'none';db.onclick=()=>{if(confirm('Delete permanently?')){deleteMinutes(id);closeMinuteDetail();}};}
    show('min-detail-modal');
  }
  function closeMinuteDetail(){hide('min-detail-modal');}

  function renderPendingActions(){const c=getEl('action-tags');if(!c)return;c.innerHTML=pendingActions.map((a,i)=>`<span class="skill-tag" style="background:var(--cyber-purple-dim);border-color:rgba(139,92,246,0.25);color:var(--cyber-purple);">${a.text}<span class="skill-tag-remove" onclick="removePendingAction(${i})">×</span></span>`).join('');}
  function removePendingAction(i){pendingActions.splice(i,1);renderPendingActions();}

  function submitMinutes(){
    const title=getEl('min-title')?.value.trim(),date=getEl('min-date')?.value,wing=getEl('min-wing')?.value;
    const attendees=getEl('min-attendees')?.value.trim(),notes=getEl('min-notes')?.value.trim(),decisions=getEl('min-decisions')?.value.trim();
    if(!title||!date||!notes){showToast('Title, date, and notes are required.','error');return;}
    const s=getSession();
    if(editingMinId){
      const r=minutesStore.find(m=>m.id===editingMinId);
      if(r){
        Object.assign(r,{title,date,wing,attendees,notes,decisions,actions:[...pendingActions],updatedAt:new Date().toLocaleString()});
        if(window.ACE_FIREBASE_LIVE) window.ACEDB.update('minutes',r.id,{title,date,wing,attendees,notes,decisions,actions:r.actions,updatedAt:r.updatedAt}).catch(()=>{});
        showToast('Record updated!','success');
      }
    } else {
      const rec={id:`MTG-${String(minutesStore.length+1).padStart(3,'0')}`,title,date,wing:wing||'General',attendees,notes,decisions,actions:[...pendingActions],createdAt:new Date().toLocaleString(),author:s?.name||'Unknown'};
      minutesStore.unshift(rec);
      if(window.ACE_FIREBASE_LIVE) window.ACEDB.set('minutes',rec.id,rec).catch(()=>{});
      showToast('Meeting record saved!','success');
    }
    resetMinutesForm();
    document.querySelectorAll('[data-page="minutes"] .dash-tab').forEach(el=>el.classList.remove('active'));
    getEl('min-tab-list')?.classList.add('active');
    safeRender(renderMinutesList,'min-list-container');
  }

  function editMinutes(id){const r=minutesStore.find(m=>m.id===id);if(!r)return;editingMinId=id;pendingActions=[...r.actions];getEl('min-title').value=r.title;getEl('min-date').value=r.date;getEl('min-wing').value=r.wing;getEl('min-attendees').value=r.attendees||'';getEl('min-notes').value=r.notes;getEl('min-decisions').value=r.decisions||'';renderPendingActions();setEl('min-form-title','Edit Meeting Record');minTab('new');}
  function deleteMinutes(id){const i=minutesStore.findIndex(m=>m.id===id);if(i>-1){minutesStore.splice(i,1);if(window.ACE_FIREBASE_LIVE)window.ACEDB.remove('minutes',id).catch(()=>{});renderMinutesList();showToast('Deleted permanently.','warning');}}
  function resetMinutesForm(){editingMinId=null;pendingActions=[];['min-title','min-attendees','min-notes','min-decisions'].forEach(id=>{const e=getEl(id);if(e)e.value='';});const d=getEl('min-date');if(d)d.value='';const w=getEl('min-wing');if(w)w.value='General';renderPendingActions();setEl('min-form-title','New Meeting Record');}

  function filterActions(filter,btn){actionFilter=filter;document.querySelectorAll('#min-tab-actions .filter-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderActionItems();}
  function renderActionItems(){
    const all=minutesStore.flatMap(r=>r.actions.map(a=>({...a,meetingTitle:r.title,date:r.date})));
    let filtered=all;if(actionFilter==='open')filtered=all.filter(a=>!a.resolved);if(actionFilter==='resolved')filtered=all.filter(a=>a.resolved);
    const el=getEl('min-actions-list');if(!el)return;
    if(!filtered.length){el.innerHTML=emptyState('No action items match this filter.','✅');return;}
    el.innerHTML=filtered.map(a=>`<div class="min-action-item ${a.resolved?'resolved':''}"><div class="min-action-check" onclick="toggleActionItem('${a.id}')">✓</div><div class="min-action-body"><div class="min-action-text">${a.text}</div><div class="min-action-source">From: ${a.meetingTitle} · ${new Date(a.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div></div><span class="status-pill ${a.resolved?'status-active':'status-pending'}">${a.resolved?'Resolved':'Open'}</span></div>`).join('');
  }
  function toggleActionItem(id){
    let parentRec=null;
    minutesStore.forEach(r=>{const a=r.actions.find(a=>a.id===id);if(a){a.resolved=!a.resolved;parentRec=r;}});
    if(parentRec && window.ACE_FIREBASE_LIVE) window.ACEDB.update('minutes',parentRec.id,{actions:parentRec.actions}).catch(()=>{});
    renderActionItems();showToast('Action item updated!','success');
  }

  // ══════════════════════════════════════════════════════════════
  // M1 — HERO ANIMATIONS & SCROLL REVEAL
  // ══════════════════════════════════════════════════════════════

  function runHeroAnimations(){document.querySelectorAll('[data-animate]').forEach(el=>{setTimeout(()=>el.classList.add('visible'),parseInt(el.dataset.delay||0));});}
  function countUp(id,target,suffix='+',dur=1800){const el=getEl(id);if(!el)return;const start=performance.now();(function tick(now){const p=Math.min((now-start)/dur,1);const e=1-Math.pow(1-p,3);el.textContent=Math.round(e*target)+suffix;if(p<1)requestAnimationFrame(tick);})(performance.now());}
  function triggerHomeAnimations(){setTimeout(()=>{runHeroAnimations();countUp('stat-members',0);countUp('stat-projects',0);countUp('stat-events',0);},100);}

  const revealObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.parentElement.querySelectorAll('.scroll-reveal').forEach((el,i)=>setTimeout(()=>el.classList.add('visible'),i*80));e.target.classList.add('visible');revealObserver.unobserve(e.target);}});},{threshold:0.12});
  function initScrollReveal(){document.querySelectorAll('.scroll-reveal').forEach(el=>revealObserver.observe(el));}

  // ══════════════════════════════════════════════════════════════
  // M8.8 — DYNAMIC STYLE INJECTION (spinner, page transitions)
  // ══════════════════════════════════════════════════════════════

  const _s=document.createElement('style');
  _s.textContent=`
    .loading-spinner{width:18px;height:18px;border:2px solid var(--border-subtle);border-top-color:var(--ai-cyan);border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .hidden{display:none!important;}
    [data-page].page-active{animation:pageFadeIn 180ms ease forwards;}
    @keyframes pageFadeIn{from{opacity:0;transform:translateY(5px);}to{opacity:1;transform:translateY(0);}}
    .form-textarea{background:var(--bg-overlay);border:1px solid var(--border-strong);border-radius:var(--radius-md);padding:var(--space-3) var(--space-4);color:var(--text-primary);font-family:var(--font-body);font-size:var(--text-sm);width:100%;transition:border-color var(--transition-fast);line-height:1.6;}
    .form-textarea:focus{outline:none;border-color:var(--ai-cyan);box-shadow:0 0 0 3px var(--ai-cyan-glow);}
    .form-textarea::placeholder{color:var(--text-muted);}
    @media(max-width:1024px){.dash-sidebar.open{display:flex!important;position:fixed;z-index:200;width:var(--sidebar-width);height:calc(100vh - var(--navbar-height));box-shadow:var(--shadow-lg);}}
  `;
  document.head.appendChild(_s);

  // ══════════════════════════════════════════════════════════════
  // MILESTONE 7 — Firebase status banner
  // ══════════════════════════════════════════════════════════════
  window.ACE_FIREBASE_LIVE = false;
  async function handleAcedbReady(detail){
    window.ACE_FIREBASE_LIVE = detail.live;
    const banner = document.getElementById('acedb-status-banner');
    if (banner) banner.style.display = detail.live ? 'none' : 'block';
    if (detail.live) {
      console.log('[Firebase] Connected ✅ — live data mode active.');
      await loadAllStoresFromFirestore();
      const s=getSession();
      if(s){
        const page=document.querySelector('[data-page].page-active')?.dataset.page;
        if(page) navigate(page);
      }
    }
  }
  // Defensive: the module script (type="module") is deferred and may dispatch
  // 'acedb-ready' before or after this classic script runs, depending on the
  // browser. window.ACEDB existing already means we missed the event — handle
  // it immediately rather than waiting for a listener that'll never fire.
  if (window.ACEDB) {
    handleAcedbReady({ live: window.ACEDB.isLive });
  } else {
    window.addEventListener('acedb-ready', (e) => handleAcedbReady(e.detail));
  }

  // Pulls every collection from Firestore into the matching in-memory store.
  // Each store keeps working exactly as before — this just swaps where the
  // initial data comes from, so all existing render functions need no changes.
  async function loadAllStoresFromFirestore(){
    try{
      const [members,users,wingTasks,slTasks,announcements,events,inventory,minutes,notifications]=await Promise.all([
        window.ACEDB.getAll('members'),
        window.ACEDB.getAll('users'),
        window.ACEDB.getAll('wingTasks'),
        window.ACEDB.getAll('slTasks'),
        window.ACEDB.getAll('announcements'),
        window.ACEDB.getAll('events'),
        window.ACEDB.getAll('inventory'),
        window.ACEDB.getAll('minutes'),
        window.ACEDB.getAll('notifications'),
      ]);
      if(members.length){memberDB.length=0;memberDB.push(...members);}
      if(users.length){USER_STORE.length=0;USER_STORE.push(...users);}
      if(announcements.length){announcementStore.length=0;announcementStore.push(...announcements);}
      if(events.length){slEventStore.length=0;slEventStore.push(...events);}
      if(inventory.length){inventoryStore.length=0;inventoryStore.push(...inventory);}
      if(minutes.length){minutesStore.length=0;minutesStore.push(...minutes);}
      if(notifications.length){notificationStore.length=0;notificationStore.push(...notifications);}
      if(wingTasks.length){
        wingTasks.forEach(t=>{ if(!taskStore[t.wing]) taskStore[t.wing]=[]; taskStore[t.wing].push(t); });
      }
      if(slTasks.length){slTaskStore.length=0;slTaskStore.push(...slTasks);}
      console.log('[Firebase] Initial data loaded from Firestore.');
    }catch(err){
      console.error('[Firebase] Failed to load initial data:',err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // SINGLE UNIFIED LOAD LISTENER
  // ══════════════════════════════════════════════════════════════

  window.addEventListener('load',()=>{
    // Auth
    updateNavbarForAuth();
    refreshNotifUI();

    // Route
    handleRoute();

    // Hero
    if(currentFile()==='index.html') triggerHomeAnimations();
    setTimeout(initScrollReveal,400);

    // Skill input (M2)
    const si=getEl('skill-input');
    if(si)si.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===','){e.preventDefault();const v=si.value.trim().replace(/,+$/,'');if(v&&!skills.includes(v)){skills.push(v);renderSkillTags();if(selectedWing)renderSkillChips(selectedWing);const err=getEl('err-skills');if(err)err.textContent='';}si.value='';}
      if(e.key==='Backspace'&&si.value===''&&skills.length){skills.pop();renderSkillTags();if(selectedWing)renderSkillChips(selectedWing);}
    });

    // Action input (M7)
    const ai=getEl('action-input');
    if(ai)ai.addEventListener('keydown',e=>{
      if(e.key==='Enter'){e.preventDefault();const v=ai.value.trim();if(v&&!pendingActions.find(a=>a.text===v)){pendingActions.push({id:`ACT-${Date.now()}`,text:v,resolved:false});renderPendingActions();}ai.value='';}
      if(e.key==='Backspace'&&ai.value===''&&pendingActions.length){pendingActions.pop();renderPendingActions();}
    });

    // Login enter key (M3)
    ['login-email','login-pw'].forEach(id=>getEl(id)?.addEventListener('keydown',e=>{if(e.key==='Enter')handleLogin();}));

    // Countdown (M1.10)
    updateCountdown();setInterval(updateCountdown,60000);
  });

  function updateCountdown(){
    const diff=new Date('2025-07-20T09:00:00')-new Date();
    if(diff<=0){['cd-days','cd-hours','cd-mins'].forEach(id=>{const e=getEl(id);if(e)e.textContent='00';});return;}
    const set=(id,v)=>{const e=getEl(id);if(e)e.textContent=String(v).padStart(2,'0');};
    set('cd-days',Math.floor(diff/(864e5)));set('cd-hours',Math.floor((diff%864e5)/36e5));set('cd-mins',Math.floor((diff%36e5)/6e4));
  }

