// Visitor script. No passwords, no edit mode, no secrets — owner tools live in
// vault.html and jx4qd8zv/ instead. Everything here is safe for visitors to read.
const _year = document.getElementById('year');
if (_year) _year.textContent = new Date().getFullYear();

// constant carousel loop: mirror the real figures so the -50% loop is seamless.
function mirrorTrack() {
  const track = document.getElementById('gallery');
  if (!track) return;
  track.querySelectorAll('[data-clone]').forEach(n => n.remove());
  const hardcoded = [...track.children].filter(n => n.hasAttribute('aria-hidden'));
  hardcoded.forEach(n => n.remove());
  const items = [...track.children];
  // repeat the whole set 4x so the strip is always full and the -50% loop stays seamless,
  // whether there's 1 image or 10 — same rule every time
  for (let s = 0; s < 3; s++) {
    items.forEach(el => {
      const c = el.cloneNode(true);
      c.setAttribute('data-clone', '1');
      c.setAttribute('aria-hidden', 'true');
      c.querySelectorAll('a').forEach(a => a.tabIndex = -1);
      track.appendChild(c);
    });
  }
}
// auto-find art: list the art/ folder on github, build one slide per file,
// captioned with the filename (+ dimensions once loaded). Falls back to baked HTML offline.
(function () {
  const track = document.getElementById('gallery');
  if (!track || !location.pathname.includes('art')) return;
  // wait for DOM images first so the baked fallback mirrors correctly if the api fails
  fetch('https://api.github.com/repos/ashlynnthefox/ashlynnthefox.github.io/contents/art')
    .then(r => r.json())
    .then(files => {
      const imgs = Array.isArray(files)
        ? files.filter(f => f.type === 'file' && /\.(png|jpe?g|gif|webp)$/i.test(f.name))
        : [];
      if (!imgs.length) { mirrorTrack(); return; }
      track.querySelectorAll('figure').forEach(n => n.remove());
      imgs.forEach(f => {
        const pretty = f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        const fig = document.createElement('figure');
        fig.innerHTML = '<a><img class="g-img" alt="" /></a><figcaption><b></b><br/><small></small></figcaption>';
        const a = fig.querySelector('a');
        a.href = f.download_url;
        const img = fig.querySelector('img');
        img.src = f.download_url;
        img.alt = pretty;
        fig.querySelector('b').textContent = f.name;
        const sm = fig.querySelector('small');
        sm.textContent = ext;
        img.onload = () => { sm.textContent = ext + ' · ' + img.naturalWidth + '×' + img.naturalHeight; };
        track.appendChild(fig);
      });
      mirrorTrack();
    })
    .catch(() => mirrorTrack());
})();

// lil popout: gallery clicks open overlay instead of new tab
(function () {
  const pop = document.getElementById('pop');
  if (!pop) return;
  const img = document.getElementById('pop-img');
  const cap = document.getElementById('pop-cap');
  document.addEventListener('click', e => {
    const a = e.target.closest('.carousel a');
    if (a) {
      e.preventDefault();
      img.src = a.href;
      const fig = a.closest('figure');
      cap.innerHTML = fig && fig.querySelector('figcaption') ? fig.querySelector('figcaption').innerHTML : '';
      pop.hidden = false;
      return;
    }
    if (!pop.hidden && (e.target === pop || e.target.closest('.pop-box'))) pop.hidden = true;
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') pop.hidden = true; });
})();

// projects tabs: site-stored vs github
(function () {
  const t1 = document.getElementById('tab-site');
  const t2 = document.getElementById('tab-gh');
  if (!t1 || !t2) return;
  const p1 = document.getElementById('pane-site');
  const p2 = document.getElementById('pane-gh');
  const show = gh => {
    t1.classList.toggle('on', !gh);
    t2.classList.toggle('on', gh);
    p1.hidden = gh;
    p2.hidden = !gh;
  };
  t1.onclick = () => show(false);
  t2.onclick = () => show(true);
})();

// live github embed: refreshes the projects list from the github api
(function () {
  const list = document.getElementById('gh-list');
  if (!list || !location.pathname.includes('projects')) return;
  fetch('https://api.github.com/users/ashlynnthefox/repos?per_page=100&sort=updated')
    .then(r => r.json())
    .then(repos => {
      if (!Array.isArray(repos)) return;
      const own = repos.filter(r => !r.fork);
      list.innerHTML = own.map(r => {
        const desc = r.description ? '<p>' + r.description.replace(/</g, '&lt;') + '</p>' : '';
        const lang = r.language ? '<span>' + r.language + '</span>' : '';
        return '<article class="proj"><h3><a href="' + r.html_url + '">' + r.name + '</a></h3>' + desc +
          '<p class="tags"><span>★ ' + r.stargazers_count + '</span>' + lang + '</p></article>';
      }).join('');
    })
    .catch(() => { /* keep the static snapshot above when offline */ });
})();

// van wert, ohio: live eastern clock, moon, day counter, browser readout, real weather
(function () {
  const t = document.getElementById('oh-time');
  if (!t) return;
  const inET = (o) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', ...o });
  const tick = () => {
    const n = new Date();
    const time = inET({ hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(n);
    t.textContent = time;
    document.getElementById('oh-date').textContent =
      inET({ weekday: 'short', month: 'short', day: 'numeric' }).format(n);
    const bar = document.getElementById('oh-clock');
    if (bar) bar.textContent = '· ' + time + ' ET';
    // moon phase tonight (synodic cycle from a known new moon)
    const days = (n.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
    const age = ((days % 29.530588853) + 29.530588853) % 29.530588853;
    const phases = [
      [1.8, 'new moon 🌑'], [5.5, 'waxing crescent 🌒'], [9.2, 'first quarter 🌓'],
      [12.9, 'waxing gibbous 🌔'], [16.6, 'full moon 🌕'], [20.3, 'waning gibbous 🌖'],
      [24.0, 'last quarter 🌗'], [27.7, 'waning crescent 🌘'], [99, 'new moon 🌑']
    ];
    document.getElementById('oh-moon').textContent = phases.find(p => age < p[0])[1];
    // day-of-year counter
    const jan1 = new Date(n.getFullYear(), 0, 1);
    document.getElementById('oh-daynum').textContent =
      Math.floor((n - jan1) / 86400000) + 1;
    // 2013-style "you are browsing with..." readout
    const ua = navigator.userAgent;
    const os = /Windows/.test(ua) ? 'windows' : /Mac/.test(ua) ? 'mac' :
      /Android/.test(ua) ? 'android' : /iPhone|iPad/.test(ua) ? 'ios' :
      /Linux/.test(ua) ? 'linux' : 'something exotic';
    const br = /Firefox\//.test(ua) ? 'firefox' : /Edg\//.test(ua) ? 'edge' :
      /OPR\//.test(ua) ? 'opera' : /Chrome\//.test(ua) ? 'chrome' :
      /Safari\//.test(ua) ? 'safari' : 'a mystery browser';
    document.getElementById('you-agent').textContent = br + ' on ' + os;
  };
  tick();
  setInterval(tick, 1000);
  const code2txt = c => {
    if (c === 0) return 'clear sky';
    if (c === 1) return 'mostly clear';
    if (c === 2) return 'partly cloudy';
    if (c === 3) return 'overcast';
    if (c === 45 || c === 48) return 'foggy';
    if (c >= 51 && c <= 57) return 'drizzle';
    if (c >= 61 && c <= 67) return 'rain';
    if (c >= 71 && c <= 77) return 'snow';
    if (c >= 80 && c <= 82) return 'showers';
    if (c === 85 || c === 86) return 'snow showers';
    if (c >= 95) return 'storms';
    return 'outside';
  };
  fetch('https://api.open-meteo.com/v1/forecast?latitude=40.8684&longitude=-84.5813&current=temperature_2,relative_humidity_2,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York')
    .then(r => r.json())
    .then(d => {
      const c = d.current;
      const box = document.getElementById('oh-wx');
      if (!c || !box) return;
      box.innerHTML = '<b>' + Math.round(c.temperature_2) + '°F</b> · ' + code2txt(c.weather_code) +
        '<br/><small>wind ' + Math.round(c.wind_speed_10m) + ' mph · humidity ' +
        c.relative_humidity_2 + '%</small>';
    })
    .catch(() => {
      const box = document.getElementById('oh-wx');
      if (box) box.innerHTML = '<i>sky unavailable offline</i>';
    });
})();

// fact ticker: fresh random facts every load (static text is the offline fallback)
(function () {
  const m = document.querySelector('.fact-ticker marquee');
  if (!m) return;
  const get = () => fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en')
    .then(r => r.json()).then(j => j.text).catch(() => null);
  m.textContent = '★ failed to load fact api :/ ★';
  setTimeout(() => {
    Promise.all([get(), get(), get(), get(), get()]).then(fs => {
      const facts = fs.filter(Boolean);
      if (!facts.length) { m.textContent = '★ failed to load fact api :/ ★'; return; }
      m.textContent = facts.map(f => '★ ' + f).join('  ') + '  ★';
    });
  }, 3000);
})();

// public notes wall (each visitor's own browser — no accounts, no tracking)
(function () {
  const wall = document.getElementById('notes');
  if (!wall) return;
  const nameIn = document.getElementById('note-name');
  const textIn = document.getElementById('note-text');
  const KEY = 'ashlynn-notes-v2';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } };
  const render = () => {
    const notes = load();
    wall.innerHTML = notes.length ? '' : '<p class="muted"><i>No notes yet — leave the first one.</i></p>';
    notes.forEach(n => {
      const d = document.createElement('div');
      d.className = 'note';
      const b = document.createElement('b');
      b.textContent = n.name;
      const p = document.createElement('p');
      p.textContent = n.text;
      p.style.margin = '4px 0';
      const s = document.createElement('small');
      s.textContent = n.date;
      d.append(b, p, s);
      wall.appendChild(d);
    });
  };
  render();
  document.getElementById('note-post').onclick = () => {
    const name = nameIn.value.trim().slice(0, 30) || 'anon';
    const text = textIn.value.trim().slice(0, 300);
    if (!text) return;
    const notes = load();
    notes.push({ name, text, date: new Date().toLocaleDateString() });
    try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (e) {}
    nameIn.value = '';
    textIn.value = '';
    render();
  };
})();
