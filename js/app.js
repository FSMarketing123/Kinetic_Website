/* Kinetic CRE Network — front end.
 * Public site + member portal. The portal runs in DEMO MODE: sign-in, forum
 * posts, RSVPs and photo uploads are saved in this browser's localStorage.
 * Passcodes are checked against salted hashes in data.js — a deterrent, not real security.
 * Swap the `store` + `auth` helpers for a real backend (e.g. Supabase) to go live.
 */
(() => {
  const K = window.KINETIC;
  const app = document.getElementById("app");

  /* ---------- helpers ---------- */
  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const memberByName = n => K.members.find(m => m.name === n);
  const photoUrl = m => `assets/members/${m.photo}.jpg`;
  const parseDate = d => new Date(d + "T12:00:00");
  const fmtMonth = d => parseDate(d).toLocaleString("en-US", { month: "short" });
  const fmtDay = d => parseDate(d).getDate();
  const fmtLong = d => parseDate(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const timeAgo = ts => {
    const s = Math.max(1, (Date.now() - ts) / 1000);
    if (s < 60) return "just now";
    const units = [["y", 31536000], ["mo", 2592000], ["w", 604800], ["d", 86400], ["h", 3600], ["m", 60]];
    for (const [u, n] of units) if (s >= n) return `${Math.floor(s / n)}${u}`;
  };
  const cities = [...new Set(K.members.map(m => m.city))];

  function avatar(name, size = "") {
    const m = memberByName(name);
    if (m) return `<img class="av ${size}" src="${photoUrl(m)}" alt="" loading="lazy" />`;
    return `<span class="av av-txt ${size}">${name === "Kinetic Team" ? "K" : esc(initials(name))}</span>`;
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- storage (demo backend) ---------- */
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("kin_" + key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, val) {
      try { localStorage.setItem("kin_" + key, JSON.stringify(val)); return true; }
      catch { toast("Storage is full on this device — try a smaller photo."); return false; }
    }
  };

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }
  async function checkPasscode(name, pass) {
    const want = K.passHashes[name];
    return !!want && (await sha256(`${K.passSalt}:${pass.trim().toLowerCase()}`)) === want;
  }

  const auth = {
    user: () => store.get("user", null),
    signIn: name => store.set("user", { name }),
    signOut: () => { try { localStorage.removeItem("kin_user"); } catch {} }
  };

  function getPosts() {
    let posts = store.get("posts", null);
    if (!posts) {
      const now = Date.now();
      posts = K.seedPosts.map(p => ({
        id: p.id, channel: p.channel, author: p.author, title: p.title, body: p.body, image: null,
        score: p.score, createdAt: now - p.ageHours * 3600e3,
        comments: p.comments.map((c, i) => ({ id: p.id + "c" + i, author: c.author, body: c.body, createdAt: now - c.ageHours * 3600e3 }))
      }));
      store.set("posts", posts);
    }
    return posts;
  }
  const savePosts = p => store.set("posts", p);
  const getVotes = () => store.get("votes", {});
  const getRsvps = () => store.get("rsvps", {});
  const getPhotos = () => store.get("photos", []);
  const getDocs = () => store.get("docs", null) || K.seedDocs.map(d => ({ ...d, createdAt: Date.now() - d.ageHours * 3600e3 }));

  function resizeImage(file, max = 1400, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result; };
      reader.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function downloadIcs(ev) {
    const d = ev.date.replace(/-/g, "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kinetic CRE//EN", "BEGIN:VEVENT",
      `UID:${ev.id}@kinetic`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:Kinetic — ${ev.title}`,
      `LOCATION:${ev.venue}, ${ev.city}`, `DESCRIPTION:${ev.blurb}`, "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = `kinetic-${ev.id}.ics`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  /* ---------- lightbox ---------- */
  const lb = { items: [], i: 0 };
  function openLightbox(items, i) {
    lb.items = items; lb.i = i;
    const box = $("#lightbox");
    box.hidden = false;
    document.body.classList.add("no-scroll");
    showLb();
  }
  function showLb() {
    const it = lb.items[lb.i];
    $("#lightbox img").src = it.src;
    $("#lightbox figcaption").textContent = it.caption || "";
  }
  function closeLb() { $("#lightbox").hidden = true; document.body.classList.remove("no-scroll"); }
  $("#lightbox").addEventListener("click", e => {
    if (e.target.closest(".lb-prev")) { lb.i = (lb.i - 1 + lb.items.length) % lb.items.length; showLb(); }
    else if (e.target.closest(".lb-next")) { lb.i = (lb.i + 1) % lb.items.length; showLb(); }
    else if (e.target.closest(".lb-close") || e.target.id === "lightbox") closeLb();
  });
  document.addEventListener("keydown", e => {
    if ($("#lightbox").hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") { lb.i = (lb.i + 1) % lb.items.length; showLb(); }
    if (e.key === "ArrowLeft") { lb.i = (lb.i - 1 + lb.items.length) % lb.items.length; showLb(); }
  });

  /* ---------- shared bits ---------- */
  const logo = (cls = "") => `<a href="#/" class="logo ${cls}" aria-label="Kinetic home"><img src="assets/kinetic-logo.png?v=3" alt="Kinetic — CRE in Motion" /></a>`;
  const chevrons = `<div class="chevrons" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<span style="--i:${i}"></span>`).join("")}</div>`;

  function publicGallery() {
    const shared = getPhotos().filter(p => p.public).map(p => ({ src: p.src, caption: p.caption || p.event }));
    return [...K.gallery, ...shared];
  }

  /* =========================================================
     PUBLIC SITE
     ========================================================= */
  function renderPublic(section) {
    const user = auth.user();
    const upcoming = K.events.filter(e => parseDate(e.date) >= new Date(new Date().toDateString()));
    const gallery = publicGallery();

    app.innerHTML = `
    <header class="nav" id="top">
      <div class="nav-inner">
        ${logo()}
        <nav class="nav-links" aria-label="Main">
          <a href="#/about">About</a>
          <a href="#/members">Members</a>
          <a href="#/events">Events</a>
          <a href="#/gallery">Gallery</a>
          <a href="#/love">Testimonials</a>
        </nav>
        <div class="nav-cta">
          <a class="btn btn-ghost" href="#/portal">${user ? "My Portal" : "Member Login"}</a>
          <a class="btn btn-orange hide-sm" href="#/join">Join Kinetic</a>
          <button class="burger" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
        </div>
      </div>
      <div class="mobile-menu" hidden>
        <a href="#/about">About</a><a href="#/members">Members</a><a href="#/events">Events</a>
        <a href="#/gallery">Gallery</a><a href="#/love">Testimonials</a><a href="#/join">Join Kinetic</a>
        <a class="btn btn-orange" href="#/portal">${user ? "My Portal →" : "Member Login →"}</a>
      </div>
    </header>

    <section class="hero">
      ${chevrons}
      <div class="hero-inner">
        <p class="eyebrow"><span class="dot"></span> CRE in motion</p>
        <h1>The next generation of <em>commercial real estate</em> is already moving.</h1>
        <p class="lede">Kinetic is a network of driven, up-and-coming retail CRE brokers representing America's highest-growth markets.</p>
        <div class="hero-ctas">
          <a class="btn btn-orange btn-lg" href="#/join">Apply to join</a>
          <a class="btn btn-line btn-lg" href="#/members">Meet the members</a>
        </div>
        <dl class="stats">
          <div><dt>${K.members.length}</dt><dd>Members</dd></div>
          <div><dt>${cities.length}</dt><dd>Markets</dd></div>
          <div><dt>4</dt><dd>Events / yr</dd></div>
          <div><dt>1</dt><dd>RECON</dd></div>
        </dl>
      </div>
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track">
      ${[...cities, ...cities].map(c => `<span>${esc(c.split(",")[0])}</span><i>›</i>`).join("")}
    </div></div>

    <section class="section about" id="about">
      <div class="wrap">
        <div class="about-intro">
          <p class="kicker">About us</p>
          <h2>Energy in motion.</h2>
          <p class="about-lede">Kinetic is a network of up-and-coming, driven young commercial real estate brokers representing America's highest-growth markets. <span>Together, we're shaping tomorrow's markets.</span></p>
        </div>
        <div class="pillars">
          ${[
            { verb: "energizes us", title: "Shared passion", copy: "A tight crew of like-minded young brokers who actually want to see each other win.", icon: `<svg viewBox="0 0 24 24"><path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z"/></svg>` },
            { verb: "fuels us", title: "Knowledge", copy: "Market intel across the US — retail expansion, disruptors, and deal flow from every member city.", icon: `<svg viewBox="0 0 24 24"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375M6.003 5.125A3 3 0 0 0 6.401 6.5M3.477 10.896a4 4 0 0 1 .585-.396M19.938 10.5a4 4 0 0 1 .585.396M6 18a4 4 0 0 1-1.967-.516M19.967 17.484A4 4 0 0 1 18 18"/></svg>` },
            { verb: "strengthen us", title: "Relationships", copy: "A boutique bench of broker contacts in the markets your clients are moving into next.", icon: `<svg viewBox="0 0 24 24"><circle cx="8.5" cy="12" r="5.5"/><circle cx="15.5" cy="12" r="5.5"/></svg>` }
          ].map((p, i) => `
            ${i ? `<span class="p-arrow" aria-hidden="true"><i></i><i></i></span>` : ""}
            <article class="pillar">
              <div class="p-head"><span class="p-icon">${p.icon}</span></div>
              <h3>${p.title}</h3>
              <p class="p-verb">${p.verb}</p>
              <p class="p-copy">${p.copy}</p>
              <span class="p-bar"></span>
            </article>`).join("")}
        </div>

        <div class="membership">
          <div class="mem-head">
            <p class="kicker">Membership</p>
            <h3>Is Kinetic <span class="serif">for you?</span></h3>
          </div>
          <div class="criteria">
            ${[
              { tone: "orange", kicker: "Your energy investment", title: "What it takes", icon: `<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 12.5l2 2 4-4"/></svg>`, items: [
                "<b>Attendance is your compensation.</b> Attend 3 of 4 events per year.",
                "<b>3+ years</b> of retail CRE experience.",
                "<b>Under 35.</b>",
                "<b>Boutique firms</b> — not part of another national broker network."] },
              { tone: "teal", kicker: "Your responsibility", title: "What you bring", icon: `<svg viewBox="0 0 24 24"><path d="M4 13v6a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6M16 7l-4-4-4 4M12 3v12"/></svg>`, items: [
                "<b>Market knowledge sharing.</b>",
                "<b>Give &amp; get industry news</b> — retail expansion, market disruptors, ideas to make the group better.",
                "<b>Show up focused</b> at quarterly meetings."] },
              { tone: "navy", kicker: "Member privileges", title: "What you get", icon: `<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>`, items: [
                "Exclusive relationships with like-minded young CRE pros.",
                "Market intel across the US — and one day, internationally.",
                "Our exclusive <b>RECON</b> event.",
                "Co-branded marketing &amp; social for your personal brand."] }
            ].map(c => `
              <div class="crit-card crit-${c.tone}">
                <span class="c-icon">${c.icon}</span>
                <p class="kicker">${c.kicker}</p>
                <h4>${c.title}</h4>
                <ul class="checks">${c.items.map(i => `<li>${i}</li>`).join("")}</ul>
              </div>`).join("")}
          </div>
          <div class="mem-cta">
            <p><b>Check every box?</b> We'd love to meet you.</p>
            <a class="btn btn-orange" href="#/join">Apply to join →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section members" id="members">
      <div class="wrap">
        <div class="sec-head">
          <div><p class="kicker">The roster</p><h2>Meet the members</h2></div>
          <p class="sec-sub">${K.members.length} brokers. ${cities.length} markets. One group chat you'll actually want to be in.</p>
        </div>
        <div class="member-grid">
          ${K.members.map(m => `
            <a class="member" href="${m.linkedin}" target="_blank" rel="noopener">
              <div class="m-photo"><img src="${photoUrl(m)}" alt="${esc(m.name)}" loading="lazy" /><span class="li-badge" aria-label="LinkedIn">in</span></div>
              <h3>${esc(m.name)}</h3>
              <p class="m-firm">${esc(m.firm)}</p>
              <p class="m-city">${esc(m.city)}</p>
            </a>`).join("")}
        </div>
      </div>
    </section>

    <section class="section events" id="events">
      <div class="wrap">
        <div class="sec-head">
          <div><p class="kicker light">On the calendar</p><h2>Upcoming events</h2></div>
          <p class="sec-sub">Quarterly meetups in member markets plus our signature RECON experience. Members RSVP in the portal.</p>
        </div>
        <div class="event-list">
          ${upcoming.length ? upcoming.map(e => `
            <article class="event ${e.type === "Signature" ? "signature" : ""}">
              <div class="e-date"><span>${fmtMonth(e.date)}</span><b>${fmtDay(e.date)}</b></div>
              <div class="e-body">
                <p class="e-type">${esc(e.type)}</p>
                <h3>${esc(e.title)}</h3>
                <p class="e-meta">${esc(e.city)} · ${esc(e.venue)} · ${esc(e.time)}</p>
                <p class="e-blurb">${esc(e.blurb)}</p>
              </div>
              <div class="e-actions">
                <a class="btn btn-orange" href="#/portal/events">RSVP</a>
                <button class="btn btn-line" data-ics="${e.id}">+ Calendar</button>
              </div>
            </article>`).join("") : `<p class="empty">New dates coming soon.</p>`}
        </div>
      </div>
    </section>

    <section class="section gallery" id="gallery">
      <div class="wrap">
        <div class="sec-head">
          <div><p class="kicker">Receipts</p><h2>Past events</h2></div>
          <p class="sec-sub">Dinners, deal talk, and RECON nights. Members can add their own shots from the portal.</p>
        </div>
        <div class="masonry">
          ${gallery.map((g, i) => `<button class="tile" data-lb="${i}"><img src="${g.src}" alt="${esc(g.caption)}" loading="lazy" /><span>${esc(g.caption)}</span></button>`).join("")}
          <a class="tile tile-cta" href="#/portal/photos"><b>+</b><span>Members: add your photos</span></a>
        </div>
      </div>
    </section>

    <section class="section love" id="love">
      <div class="wrap">
        <p class="kicker center">Testimonials</p>
        <h2 class="center">Why members stay kinetic</h2>
        <div class="quotes">
          ${K.testimonials.map(t => `
            <figure class="quote">
              <span class="q-mark">“</span>
              <blockquote>${esc(t.quote)}</blockquote>
              <figcaption><b>${esc(t.who)}</b><span>${esc(t.role)}</span></figcaption>
            </figure>`).join("")}
        </div>
      </div>
    </section>

    <section class="section join" id="join">
      ${chevrons}
      <div class="wrap join-grid">
        <div>
          <p class="kicker light">Get in touch</p>
          <h2>Ready to put your career <span class="serif">in motion?</span></h2>
          <p class="lede">Tell us about you and your market. We're building the network for the next generation of CRE brokers.</p>
        </div>
        <form class="card-form" id="contactForm">
          <div class="row2">
            <label>First name<input name="first" required autocomplete="given-name" /></label>
            <label>Last name<input name="last" required autocomplete="family-name" /></label>
          </div>
          <label>Email<input type="email" name="email" required autocomplete="email" /></label>
          <div class="row2">
            <label>Firm<input name="firm" autocomplete="organization" /></label>
            <label>Market<input name="market" placeholder="City, ST" /></label>
          </div>
          <label>Message<textarea name="msg" rows="3" placeholder="Why Kinetic?"></textarea></label>
          <button class="btn btn-orange btn-lg btn-block" type="submit">Send it →</button>
        </form>
      </div>
    </section>

    <footer class="footer">
      <div class="wrap foot-inner">
        ${logo("logo-foot")}
        <p>© ${new Date().getFullYear()} Kinetic CRE Network · Powered by <a href="https://www.franklinst.com/" target="_blank" rel="noopener">Franklin Street</a></p>
        <a href="#/portal" class="foot-link">Member portal →</a>
      </div>
    </footer>`;

    // interactions
    const burger = $(".burger"), menu = $(".mobile-menu");
    burger.addEventListener("click", () => {
      const open = menu.hidden;
      menu.hidden = !open;
      burger.setAttribute("aria-expanded", open);
      burger.classList.toggle("open", open);
    });
    $$(".mobile-menu a").forEach(a => a.addEventListener("click", () => { menu.hidden = true; burger.classList.remove("open"); }));
    $$("[data-ics]").forEach(b => b.addEventListener("click", () => downloadIcs(K.events.find(e => e.id === b.dataset.ics))));
    $$("[data-lb]").forEach(b => b.addEventListener("click", () => openLightbox(gallery, +b.dataset.lb)));
    $("#contactForm").addEventListener("submit", e => {
      e.preventDefault();
      e.target.reset();
      toast("Thanks! The Kinetic team will be in touch.");
    });

    const nav = $(".nav");
    const onScroll = () => nav.classList.toggle("scrolled", scrollY > 20);
    window.onscroll = onScroll; onScroll();

    // reveal on scroll
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
    $$(".pillar, .crit-card, .member, .event, .tile, .quote").forEach(el => { el.classList.add("reveal"); io.observe(el); });

    if (section) {
      const target = document.getElementById(section);
      if (target) requestAnimationFrame(() => target.scrollIntoView({ behavior: "smooth" }));
    } else window.scrollTo(0, 0);
  }

  /* =========================================================
     MEMBER PORTAL
     ========================================================= */
  function renderLogin() {
    app.innerHTML = `
    <main class="login">
      ${chevrons}
      <div class="login-card">
        ${logo()}
        <h1>Members only.</h1>
        <p class="muted">Sign in to the forum, RSVP to events, and share your photos.</p>
        <form id="loginForm">
          <label>Who are you?
            <select name="name" required>
              <option value="">Select your name</option>
              ${K.members.map(m => `<option>${esc(m.name)}</option>`).join("")}
            </select>
          </label>
          <label>Passcode<input type="password" name="pass" required autocomplete="current-password" /></label>
          <button class="btn btn-orange btn-lg btn-block">Sign in</button>
          <p class="demo-note">Your passcode is your last name plus 4 digits. Lost it? Ask the Kinetic team.</p>
        </form>
        <a class="back" href="#/">← Back to site</a>
      </div>
    </main>`;
    $("#loginForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      if (!(await checkPasscode(f.get("name"), f.get("pass")))) { toast("That passcode didn't work."); return; }
      auth.signIn(f.get("name"));
      toast(`Welcome back, ${f.get("name").split(" ")[0]} 👋`);
      route();
    });
  }

  const TABS = [
    { id: "feed",   label: "Forum",  icon: `<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>` },
    { id: "events", label: "Events", icon: `<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>` },
    { id: "photos", label: "Photos", icon: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m21 16-5-5-9 8"/></svg>` },
    { id: "docs",   label: "Docs",   icon: `<svg viewBox="0 0 24 24"><path d="M3.5 6.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>` },
    { id: "people", label: "People", icon: `<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c.8-3.5 3.2-5.5 6-5.5s5.2 2 6 5.5M16 4.5a3 3 0 0 1 0 6M21 20c-.5-2.5-1.8-4.2-3.6-5"/></svg>` },
    { id: "me",     label: "Me",     icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4.2-6.5 8-6.5s7 2.3 8 6.5"/></svg>` }
  ];

  function portalShell(active, inner, { title } = {}) {
    const user = auth.user();
    return `
    <div class="portal">
      <aside class="side">
        ${logo()}
        <nav>${TABS.map(t => `<a href="#/portal/${t.id}" class="${t.id === active ? "on" : ""}">${t.icon}<span>${t.label}</span></a>`).join("")}</nav>
        <a class="side-back" href="#/">← Public site</a>
      </aside>
      <header class="p-top">
        ${logo("logo-sm")}
        <span class="p-title">${esc(title || TABS.find(t => t.id === active)?.label || "")}</span>
        <a href="#/portal/me" class="p-me">${avatar(user.name, "sm")}</a>
      </header>
      <main class="p-main">${inner}</main>
      <nav class="tabbar">${TABS.filter(t => t.id !== "me").map(t => `<a href="#/portal/${t.id}" class="${t.id === active ? "on" : ""}">${t.icon}<span>${t.label}</span></a>`).join("")}</nav>
    </div>`;
  }

  /* ----- forum ----- */
  const forumState = { sort: "hot", channel: "all" };
  const hot = p => (p.score + p.comments.length * 2) / Math.pow((Date.now() - p.createdAt) / 3600e3 + 2, 1.4);
  const channelOf = id => K.channels.find(c => c.id === id) || K.channels[0];

  function voteBox(p, votes) {
    const v = votes[p.id] || 0;
    return `<div class="votes" data-id="${p.id}">
      <button class="up ${v === 1 ? "on" : ""}" aria-label="Upvote">▲</button>
      <b>${p.score}</b>
      <button class="down ${v === -1 ? "on" : ""}" aria-label="Downvote">▼</button>
    </div>`;
  }

  function bindVotes(root, rerender) {
    $$(".votes", root).forEach(box => box.addEventListener("click", e => {
      const btn = e.target.closest("button"); if (!btn) return;
      e.preventDefault(); e.stopPropagation();
      const posts = getPosts(), votes = getVotes();
      const p = posts.find(x => x.id === box.dataset.id);
      const cur = votes[p.id] || 0;
      const want = btn.classList.contains("up") ? 1 : -1;
      const next = cur === want ? 0 : want;
      p.score += next - cur;
      votes[p.id] = next;
      savePosts(posts); store.set("votes", votes);
      rerender();
    }));
  }

  function renderFeed() {
    const posts = getPosts(), votes = getVotes();
    let list = forumState.channel === "all" ? posts : posts.filter(p => p.channel === forumState.channel);
    list = [...list].sort(forumState.sort === "new" ? (a, b) => b.createdAt - a.createdAt : (a, b) => hot(b) - hot(a));

    app.innerHTML = portalShell("feed", `
      <div class="feed-head">
        <div class="chips" role="tablist">
          <button class="chip ${forumState.channel === "all" ? "on" : ""}" data-ch="all">All</button>
          ${K.channels.map(c => `<button class="chip ${forumState.channel === c.id ? "on" : ""}" data-ch="${c.id}">${c.emoji} ${c.label}</button>`).join("")}
        </div>
        <div class="seg">
          <button class="${forumState.sort === "hot" ? "on" : ""}" data-sort="hot">🔥 Hot</button>
          <button class="${forumState.sort === "new" ? "on" : ""}" data-sort="new">✨ New</button>
        </div>
      </div>
      <button class="composer-trigger" id="openCompose">${avatar(auth.user().name, "sm")}<span>Share a deal, question, or hot take…</span></button>
      <div class="posts">
        ${list.length ? list.map(p => {
          const ch = channelOf(p.channel);
          return `<article class="post">
            ${voteBox(p, votes)}
            <a class="post-link" href="#/portal/post/${p.id}">
              <div class="post-meta">${avatar(p.author, "xs")}<b>${esc(p.author)}</b><span class="flair f-${ch.id}">${ch.emoji} ${ch.label}</span><span class="ago">${timeAgo(p.createdAt)}</span></div>
              <h3>${esc(p.title)}</h3>
              ${p.body ? `<p class="post-body clamp">${esc(p.body)}</p>` : ""}
              ${p.image ? `<img class="post-img" src="${p.image}" alt="" loading="lazy" />` : ""}
              <div class="post-foot"><span>💬 ${p.comments.length} ${p.comments.length === 1 ? "reply" : "replies"}</span></div>
            </a>
          </article>`;
        }).join("") : `<p class="empty">Nothing here yet. Start the conversation 👆</p>`}
      </div>
      <button class="fab" id="fab" aria-label="New post">＋</button>
    `);

    $$("[data-ch]").forEach(b => b.addEventListener("click", () => { forumState.channel = b.dataset.ch; renderFeed(); }));
    $$("[data-sort]").forEach(b => b.addEventListener("click", () => { forumState.sort = b.dataset.sort; renderFeed(); }));
    bindVotes(app, renderFeed);
    $("#openCompose").addEventListener("click", openComposer);
    $("#fab").addEventListener("click", openComposer);
  }

  function openComposer() {
    const sheet = document.createElement("div");
    sheet.className = "sheet-wrap";
    sheet.innerHTML = `
      <form class="sheet" id="composeForm">
        <div class="sheet-head"><button type="button" class="link" data-close>Cancel</button><b>New post</b><button class="btn btn-orange btn-sm">Post</button></div>
        <div class="chips wrap-chips">
          ${K.channels.map((c, i) => `<label class="chip radio"><input type="radio" name="channel" value="${c.id}" ${i === 0 ? "checked" : ""}/>${c.emoji} ${c.label}</label>`).join("")}
        </div>
        <input class="title-in" name="title" placeholder="Title" maxlength="140" required />
        <textarea name="body" rows="5" placeholder="What's going on? (optional)"></textarea>
        <div class="attach">
          <label class="btn btn-line btn-sm">📷 Add photo<input type="file" accept="image/*" name="image" hidden /></label>
          <img class="attach-preview" hidden alt="" />
        </div>
      </form>`;
    document.body.appendChild(sheet);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => sheet.classList.add("open"));
    $(".title-in", sheet).focus();

    let imageData = null;
    const close = () => { sheet.classList.remove("open"); document.body.classList.remove("no-scroll"); setTimeout(() => sheet.remove(), 250); };
    sheet.addEventListener("click", e => { if (e.target === sheet || e.target.closest("[data-close]")) close(); });
    $("input[type=file]", sheet).addEventListener("change", async e => {
      const f = e.target.files[0]; if (!f) return;
      imageData = await resizeImage(f, 1200, 0.78);
      const pv = $(".attach-preview", sheet); pv.src = imageData; pv.hidden = false;
    });
    $("#composeForm").addEventListener("submit", e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const posts = getPosts();
      const id = "p" + Date.now().toString(36);
      posts.unshift({ id, channel: f.get("channel"), author: auth.user().name, title: f.get("title").trim(), body: f.get("body").trim(), image: imageData, score: 1, createdAt: Date.now(), comments: [] });
      const votes = getVotes(); votes[id] = 1;
      if (!savePosts(posts)) return;
      store.set("votes", votes);
      close();
      forumState.sort = "new";
      toast("Posted 🚀");
      renderFeed();
    });
  }

  function renderPost(id) {
    const posts = getPosts(), votes = getVotes();
    const p = posts.find(x => x.id === id);
    if (!p) { location.hash = "#/portal/feed"; return; }
    const ch = channelOf(p.channel);
    app.innerHTML = portalShell("feed", `
      <a class="back-link" href="#/portal/feed">← Forum</a>
      <article class="post post-full">
        ${voteBox(p, votes)}
        <div class="post-link">
          <div class="post-meta">${avatar(p.author, "xs")}<b>${esc(p.author)}</b><span class="flair f-${ch.id}">${ch.emoji} ${ch.label}</span><span class="ago">${timeAgo(p.createdAt)}</span></div>
          <h1 class="post-h">${esc(p.title)}</h1>
          ${p.body ? `<p class="post-body">${esc(p.body)}</p>` : ""}
          ${p.image ? `<img class="post-img" src="${p.image}" alt="" data-full />` : ""}
          ${p.author === auth.user().name ? `<button class="link danger" id="delPost">Delete post</button>` : ""}
        </div>
      </article>
      <h2 class="replies-h">${p.comments.length} ${p.comments.length === 1 ? "reply" : "replies"}</h2>
      <div class="comments">
        ${p.comments.map(c => `
          <div class="comment">${avatar(c.author, "sm")}
            <div><p class="c-meta"><b>${esc(c.author)}</b> · ${timeAgo(c.createdAt)}</p><p>${esc(c.body)}</p></div>
          </div>`).join("") || `<p class="empty">No replies yet — be first.</p>`}
      </div>
      <form class="reply-bar" id="replyForm">
        ${avatar(auth.user().name, "sm")}
        <input name="body" placeholder="Reply…" autocomplete="off" required />
        <button class="send" aria-label="Send">➤</button>
      </form>
    `, { title: "Post" });

    bindVotes(app, () => renderPost(id));
    $("[data-full]")?.addEventListener("click", () => openLightbox([{ src: p.image, caption: p.title }], 0));
    $("#delPost")?.addEventListener("click", () => {
      if (!confirm("Delete this post?")) return;
      savePosts(getPosts().filter(x => x.id !== id));
      toast("Post deleted");
      location.hash = "#/portal/feed";
    });
    $("#replyForm").addEventListener("submit", e => {
      e.preventDefault();
      const body = new FormData(e.target).get("body").trim(); if (!body) return;
      const all = getPosts(); const post = all.find(x => x.id === id);
      post.comments.push({ id: id + "c" + Date.now(), author: auth.user().name, body, createdAt: Date.now() });
      savePosts(all);
      renderPost(id);
      window.scrollTo(0, document.body.scrollHeight);
    });
  }

  /* ----- events ----- */
  function renderPortalEvents() {
    const rsvps = getRsvps(), me = auth.user().name;
    const today = new Date(new Date().toDateString());
    const upcoming = K.events.filter(e => parseDate(e.date) >= today);
    const going = upcoming.filter(e => (rsvps[e.id] || {})[me] === "going").length;

    app.innerHTML = portalShell("events", `
      <div class="p-hero">
        <div><p class="kicker light">Your attendance</p><h2>${going} of ${upcoming.length} upcoming</h2><p>Members attend 3 of 4 events a year. ${going >= 3 ? "You're on track 🔥" : `RSVP to ${Math.max(0, 3 - going)} more to stay on track.`}</p></div>
        <div class="ring" style="--p:${Math.min(1, going / 3)}"><b>${going}/3</b></div>
      </div>
      <div class="p-events">
        ${upcoming.map(e => {
          const r = rsvps[e.id] || {};
          const mine = r[me];
          const attendees = Object.keys(r).filter(n => r[n] === "going");
          return `<article class="p-event ${e.type === "Signature" ? "signature" : ""}">
            <div class="e-date"><span>${fmtMonth(e.date)}</span><b>${fmtDay(e.date)}</b></div>
            <div class="pe-body">
              <p class="e-type">${esc(e.type)}</p>
              <h3>${esc(e.title)}</h3>
              <p class="e-meta">${fmtLong(e.date)} · ${esc(e.time)}<br/>${esc(e.venue)}, ${esc(e.city)}</p>
              <div class="attendees">
                ${attendees.length ? `<div class="stack">${attendees.slice(0, 6).map(n => avatar(n, "xs")).join("")}</div><span>${attendees.length} going</span>` : `<span>Be the first to RSVP</span>`}
              </div>
              <div class="rsvp" data-ev="${e.id}">
                <button class="${mine === "going" ? "on go" : ""}" data-r="going">✓ Going</button>
                <button class="${mine === "maybe" ? "on" : ""}" data-r="maybe">Maybe</button>
                <button class="${mine === "no" ? "on no" : ""}" data-r="no">Can't</button>
                <button class="ics" data-ics="${e.id}" aria-label="Add to calendar">📅</button>
              </div>
            </div>
          </article>`;
        }).join("")}
      </div>
    `);

    $$(".rsvp").forEach(box => box.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.ics) { downloadIcs(K.events.find(x => x.id === b.dataset.ics)); return; }
      const all = getRsvps(); const ev = box.dataset.ev;
      all[ev] = all[ev] || {};
      all[ev][me] = all[ev][me] === b.dataset.r ? undefined : b.dataset.r;
      store.set("rsvps", all);
      if (all[ev][me] === "going") toast("You're in! 🎉");
      renderPortalEvents();
    }));
  }

  /* ----- photos ----- */
  function renderPhotos() {
    const photos = getPhotos(), me = auth.user().name;
    const items = [...photos.map(p => ({ src: p.src, caption: `${p.event} · ${p.by}` })), ...K.gallery];
    app.innerHTML = portalShell("photos", `
      <form class="upload" id="uploadForm">
        <label class="drop">
          <input type="file" accept="image/*" multiple name="files" hidden />
          <b>📸 Drop your event pics</b>
          <span>Tap to choose photos from your camera roll</span>
        </label>
        <div class="upload-opts" hidden>
          <div class="previews"></div>
          <label>Which event?
            <select name="event">
              ${K.events.map(e => `<option>${esc(e.title)}</option>`).join("")}
              <option>Other / Hangout</option>
            </select>
          </label>
          <label class="toggle"><input type="checkbox" name="public" checked /><span></span> Feature on the public gallery</label>
          <button class="btn btn-orange btn-block">Upload</button>
        </div>
      </form>
      <h2 class="h-sm">Member album <span class="muted">${items.length}</span></h2>
      <div class="masonry small">
        ${items.map((g, i) => {
          const own = i < photos.length && photos[i].by === me;
          return `<div class="tile"><button class="tile-btn" data-lb="${i}"><img src="${g.src}" alt="" loading="lazy" /></button><span>${esc(g.caption)}</span>${own ? `<button class="del" data-del="${photos[i].id}" aria-label="Delete photo">✕</button>` : ""}</div>`;
        }).join("")}
      </div>
    `);

    let pending = [];
    const input = $("input[type=file]", app), opts = $(".upload-opts");
    const drop = $(".drop");
    const handle = async files => {
      pending = await Promise.all([...files].filter(f => f.type.startsWith("image/")).slice(0, 8).map(f => resizeImage(f)));
      $(".previews").innerHTML = pending.map(s => `<img src="${s}" alt="" />`).join("");
      opts.hidden = !pending.length;
    };
    input.addEventListener("change", () => handle(input.files));
    ["dragover", "dragenter"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.add("hover"); }));
    ["dragleave", "drop"].forEach(t => drop.addEventListener(t, e => { e.preventDefault(); drop.classList.remove("hover"); }));
    drop.addEventListener("drop", e => handle(e.dataTransfer.files));

    $("#uploadForm").addEventListener("submit", e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const add = pending.map((src, i) => ({ id: Date.now().toString(36) + i, src, event: f.get("event"), by: me, public: !!f.get("public"), createdAt: Date.now() }));
      if (store.set("photos", [...add, ...getPhotos()])) { toast(`${add.length} photo${add.length > 1 ? "s" : ""} added 🙌`); renderPhotos(); }
    });
    $$("[data-lb]").forEach(b => b.addEventListener("click", () => openLightbox(items, +b.dataset.lb)));
    $$("[data-del]").forEach(b => b.addEventListener("click", () => {
      if (!confirm("Remove this photo?")) return;
      store.set("photos", getPhotos().filter(p => p.id !== b.dataset.del));
      renderPhotos();
    }));
  }

  /* ----- documents ----- */
  const DOC_MAX_BYTES = 3 * 1024 * 1024; // demo limit — browser storage is small
  const docState = { folder: "all", q: "" };
  const fmtSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  function linkProvider(url) {
    const u = url.toLowerCase();
    if (u.includes("sharepoint.com") || u.includes("1drv.ms") || u.includes("onedrive")) return { name: "Microsoft 365", tag: "ms" };
    if (u.includes("docs.google.com/spreadsheets")) return { name: "Google Sheets", tag: "g" };
    if (u.includes("docs.google.com/presentation")) return { name: "Google Slides", tag: "g" };
    if (u.includes("docs.google.com") || u.includes("drive.google.com")) return { name: "Google Docs", tag: "g" };
    if (u.includes("dropbox.com")) return { name: "Dropbox", tag: "db" };
    return { name: "Web link", tag: "web" };
  }

  function docType(d) {
    if (d.kind === "link") return linkProvider(d.url).tag === "web" ? "LINK" : "LIVE";
    const ext = (d.name.split(".").pop() || "").toUpperCase();
    return ext.length <= 4 ? ext : "FILE";
  }

  function renderDocs() {
    const me = auth.user().name;
    const docs = getDocs();
    const q = docState.q.toLowerCase();
    const list = docs
      .filter(d => docState.folder === "all" || d.folder === docState.folder)
      .filter(d => !q || (d.title + d.folder + d.by).toLowerCase().includes(q))
      .sort((a, b) => b.createdAt - a.createdAt);
    const count = f => docs.filter(d => d.folder === f).length;

    app.innerHTML = portalShell("docs", `
      <div class="p-hero docs-hero">
        <div><p class="kicker light">Document library</p><h2>Shared files</h2><p>Upload files, or link a SharePoint / Google doc so the group can edit it together.</p></div>
        <div class="docs-actions">
          <button class="btn btn-orange" data-add="file">⬆ Upload</button>
          <button class="btn btn-line" data-add="link">🔗 Add link</button>
        </div>
      </div>
      <input class="search" id="docSearch" placeholder="Search documents" value="${esc(docState.q)}" />
      <div class="chips doc-folders">
        <button class="chip ${docState.folder === "all" ? "on" : ""}" data-folder="all">All <span>${docs.length}</span></button>
        ${K.docFolders.map(f => `<button class="chip ${docState.folder === f ? "on" : ""}" data-folder="${esc(f)}">${esc(f)} <span>${count(f)}</span></button>`).join("")}
      </div>
      <div class="docs">
        ${list.map(d => {
          const t = docType(d), prov = d.kind === "link" ? linkProvider(d.url) : null;
          return `<div class="doc">
            <span class="d-type t-${t === "LIVE" ? prov.tag : t.toLowerCase()}">${t === "LIVE" ? (prov.tag === "ms" ? "365" : prov.tag === "g" ? "G" : "DB") : esc(t)}</span>
            <div class="d-main">
              <a class="d-title" href="${d.kind === "link" ? esc(d.url) : d.src}" ${d.kind === "link" ? `target="_blank" rel="noopener"` : `download="${esc(d.name)}"`}>${esc(d.title)}</a>
              <p class="d-meta">${prov && prov.tag !== "web" ? `<span class="live">● Co-edit in ${prov.name}</span>` : ""}${esc(d.folder)} · ${esc(d.by.split(" ")[0])} · ${timeAgo(d.createdAt)}${d.size ? ` · ${fmtSize(d.size)}` : ""}</p>
            </div>
            <a class="d-open" href="${d.kind === "link" ? esc(d.url) : d.src}" ${d.kind === "link" ? `target="_blank" rel="noopener"` : `download="${esc(d.name)}"`} aria-label="${d.kind === "link" ? "Open" : "Download"}">${d.kind === "link" ? "↗" : "⬇"}</a>
            ${d.by === me ? `<button class="d-del" data-del="${d.id}" aria-label="Delete">✕</button>` : ""}
          </div>`;
        }).join("") || `<p class="empty">${docs.length ? "No documents match." : "No documents yet — upload the first one."}</p>`}
      </div>
    `);

    $$("[data-folder]").forEach(b => b.addEventListener("click", () => { docState.folder = b.dataset.folder; renderDocs(); }));
    $$("[data-add]").forEach(b => b.addEventListener("click", () => openDocSheet(b.dataset.add)));
    const s = $("#docSearch");
    s.addEventListener("input", () => { docState.q = s.value; const pos = s.selectionStart; renderDocs(); const n = $("#docSearch"); n.focus(); n.setSelectionRange(pos, pos); });
    $$("[data-del]").forEach(b => b.addEventListener("click", () => {
      if (!confirm("Remove this document for everyone?")) return;
      store.set("docs", getDocs().filter(d => d.id !== b.dataset.del));
      toast("Document removed");
      renderDocs();
    }));
  }

  function openDocSheet(mode) {
    const isLink = mode === "link";
    const folder = docState.folder === "all" ? K.docFolders[0] : docState.folder;
    const sheet = document.createElement("div");
    sheet.className = "sheet-wrap";
    sheet.innerHTML = `
      <form class="sheet" id="docForm">
        <div class="sheet-head"><button type="button" class="link" data-close>Cancel</button><b>${isLink ? "Add a shared link" : "Upload a file"}</b><button class="btn btn-orange btn-sm">Save</button></div>
        ${isLink
          ? `<label>Link<input name="url" type="url" required placeholder="https://…sharepoint.com/… or docs.google.com/…" /></label>
             <p class="hint">Paste a SharePoint, OneDrive or Google Docs link. Make sure its sharing settings let Kinetic members edit.</p>`
          : `<label class="drop small"><input type="file" name="file" required hidden /><b>📄 Choose a file</b><span class="file-name">PDF, Word, Excel, PowerPoint, images · up to 3 MB in demo</span></label>`}
        <label>Title<input name="title" ${isLink ? "required" : ""} maxlength="120" placeholder="${isLink ? "e.g. 2027 Market Outlook deck" : "Defaults to the file name"}" /></label>
        <label>Folder<select name="folder">${K.docFolders.map(f => `<option ${f === folder ? "selected" : ""}>${esc(f)}</option>`).join("")}</select></label>
      </form>`;
    document.body.appendChild(sheet);
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => sheet.classList.add("open"));
    const close = () => { sheet.classList.remove("open"); document.body.classList.remove("no-scroll"); setTimeout(() => sheet.remove(), 250); };
    sheet.addEventListener("click", e => { if (e.target === sheet || e.target.closest("[data-close]")) close(); });

    let file = null;
    $("input[type=file]", sheet)?.addEventListener("change", e => {
      file = e.target.files[0] || null;
      $(".file-name", sheet).textContent = file ? `${file.name} · ${fmtSize(file.size)}` : "";
    });

    $("#docForm").addEventListener("submit", async e => {
      e.preventDefault();
      const f = new FormData(e.target);
      const base = { id: "d" + Date.now().toString(36), folder: f.get("folder"), by: auth.user().name, createdAt: Date.now() };
      let doc;
      if (isLink) {
        const url = f.get("url").trim();
        if (!/^https:\/\//i.test(url)) { toast("Links need to start with https://"); return; }
        doc = { ...base, kind: "link", url, title: f.get("title").trim() };
      } else {
        if (!file) { toast("Pick a file first"); return; }
        if (file.size > DOC_MAX_BYTES) { toast("Demo limit is 3 MB per file"); return; }
        const src = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
        doc = { ...base, kind: "file", name: file.name, size: file.size, src, title: f.get("title").trim() || file.name.replace(/\.[^.]+$/, "") };
      }
      if (!store.set("docs", [doc, ...getDocs()])) return;
      close();
      docState.folder = doc.folder;
      toast(isLink ? "Link shared 🔗" : "File uploaded 📄");
      renderDocs();
    });
  }

  /* ----- people ----- */
  function renderPeople(q = "") {
    const list = K.members.filter(m => (m.name + m.firm + m.city).toLowerCase().includes(q.toLowerCase()));
    app.innerHTML = portalShell("people", `
      <input class="search" id="peopleSearch" placeholder="Search name, firm, or city" value="${esc(q)}" />
      <div class="people">
        ${list.map(m => `
          <div class="person">
            <img src="${photoUrl(m)}" alt="" loading="lazy" />
            <div><b>${esc(m.name)}</b><span>${esc(m.firm)} · ${esc(m.city)}</span></div>
            <a class="li" href="${m.linkedin}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on LinkedIn">in</a>
          </div>`).join("") || `<p class="empty">No one matches that.</p>`}
      </div>
    `);
    const s = $("#peopleSearch");
    s.addEventListener("input", () => { const pos = s.selectionStart; renderPeople(s.value); const n = $("#peopleSearch"); n.focus(); n.setSelectionRange(pos, pos); });
  }

  /* ----- me ----- */
  function renderMe() {
    const me = auth.user().name, m = memberByName(me);
    const posts = getPosts().filter(p => p.author === me).length;
    const photos = getPhotos().filter(p => p.by === me).length;
    const rsvps = getRsvps();
    const going = Object.values(rsvps).filter(r => r[me] === "going").length;
    app.innerHTML = portalShell("me", `
      <div class="me-card">
        ${chevrons}
        ${avatar(me, "xl")}
        <h2>${esc(me)}</h2>
        <p>${m ? `${esc(m.firm)} · ${esc(m.city)}` : ""}</p>
        <div class="me-stats"><div><b>${posts}</b><span>Posts</span></div><div><b>${going}</b><span>RSVPs</span></div><div><b>${photos}</b><span>Photos</span></div></div>
      </div>
      <div class="me-list">
        ${m ? `<a href="${m.linkedin}" target="_blank" rel="noopener">LinkedIn profile <span>↗</span></a>` : ""}
        <a href="#/portal/events">My events <span>→</span></a>
        <a href="#/portal/docs">Document library <span>→</span></a>
        <a href="#/">Public website <span>→</span></a>
        <button id="signOut" class="danger">Sign out</button>
      </div>
      <p class="demo-note">Tip: on your phone, tap Share → “Add to Home Screen” to use Kinetic like an app.</p>
    `);
    $("#signOut").addEventListener("click", () => { auth.signOut(); location.hash = "#/"; });
  }

  /* ---------- router ---------- */
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [root, sub, id] = h.split("/");
    window.onscroll = null;
    document.body.classList.toggle("in-portal", root === "portal");
    if (root !== "portal") { renderPublic(root || null); return; }
    if (!auth.user()) { renderLogin(); return; }
    window.scrollTo(0, 0);
    switch (sub) {
      case "post": return renderPost(id);
      case "events": return renderPortalEvents();
      case "photos": return renderPhotos();
      case "people": return renderPeople();
      case "docs": return renderDocs();
      case "me": return renderMe();
      default: return renderFeed();
    }
  }

  // Section links on the public page shouldn't re-render the whole page.
  window.addEventListener("hashchange", e => {
    const was = new URL(e.oldURL).hash, now = location.hash;
    const isPublic = x => !x.startsWith("#/portal");
    if (isPublic(was) && isPublic(now) && $(".hero")) {
      const id = now.replace(/^#\/?/, "");
      const el = id ? document.getElementById(id) : null;
      el ? el.scrollIntoView({ behavior: "smooth" }) : window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    route();
  });
  route();
})();
