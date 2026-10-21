/* MESH site script: theme, menu, search, copy buttons, dates, calendar, map, ask form.
   No libraries. Every feature checks that its elements exist before running. */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  var rootMeta = doc.querySelector('meta[name="mesh-root"]');
  var ROOT = rootMeta ? rootMeta.content : './';
  var PREVIEW = !!doc.querySelector('meta[name="mesh-preview"]');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Site path ('study/', 'calendar/#ramadan') → link from this page.
  function pageUrl(key) {
    var parts = key.split('#');
    var p = parts[0];
    var out = ROOT + p;
    if (PREVIEW && (p === '' || p.slice(-1) === '/')) out += 'index.html';
    return parts.length > 1 ? out + '#' + parts[1] : out;
  }

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  // ---------- dates (Umm al-Qura; month names match tools/lib/dates.mjs) ----------

  var HIJRI_MONTHS = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah',
    'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'];

  function todayIso() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function asDate(iso) { return new Date(iso + 'T00:00:00Z'); }
  function daysUntil(iso, from) { return Math.round((asDate(iso) - asDate(from)) / 86400000); }
  function hijriText(iso) {
    try {
      var parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).formatToParts(asDate(iso));
      var o = {};
      parts.forEach(function (x) { o[x.type] = x.value; });
      return Number(o.day) + ' ' + HIJRI_MONTHS[Number(o.month) - 1] + ' ' + parseInt(o.year, 10);
    } catch (e) { return ''; }
  }
  function longDate(iso) {
    return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(asDate(iso));
  }
  function countdownText(start, end, today) {
    var last = end || start;
    if (today > last) return 'Passed';
    if (today >= start) {
      if (!end) return 'Today';
      var left = daysUntil(end, today);
      return left === 0 ? 'Ends today' : left === 1 ? 'Ends tomorrow' : 'Ends in ' + left + ' days';
    }
    var d = daysUntil(start, today);
    if (d === 1) return 'Tomorrow';
    return 'In ' + d + ' days';
  }

  var TODAY = todayIso();

  doc.querySelectorAll('[data-hijri-today]').forEach(function (el) {
    var h = hijriText(TODAY);
    if (h) el.textContent = 'Today is ' + h + ', ' + longDate(TODAY) + '.';
  });

  // Home: next date on the calendar, recomputed so it stays right between rebuilds.
  var nextCard = doc.querySelector('[data-next-up]');
  var eventsData = doc.getElementById('mesh-events');
  if (nextCard && eventsData) {
    try {
      var all = JSON.parse(eventsData.textContent);
      var next = all.filter(function (e) { return e.date >= TODAY; })[0];
      if (!next) {
        nextCard.closest('.next-up').hidden = true;
      } else {
        var when = countdownText(next.date, next.end, TODAY);
        nextCard.querySelector('[data-next-title]').textContent = next.title;
        nextCard.querySelector('[data-next-when]').textContent = when.toLowerCase();
        nextCard.querySelector('[data-next-meta]').textContent = (next.term ? next.term + '. ' : '') + (next.expected ? 'Expected ' : '') + next.greg + ', ' + next.hijri;
        nextCard.setAttribute('href', pageUrl('calendar/#' + next.slug));
      }
    } catch (e) { /* keep the built version */ }
  }

  // Calendar page: countdowns, removing dates that have passed since the build, and filters.
  var cal = doc.querySelector('[data-calendar]');
  if (cal) {
    var items = Array.prototype.slice.call(cal.querySelectorAll('.cal-item')).filter(function (li) {
      var text = countdownText(li.dataset.date, li.dataset.end, TODAY);
      if (text === 'Passed') { li.remove(); return false; }
      var slot = li.querySelector('[data-countdown]');
      if (slot) slot.textContent = text;
      li.classList.toggle('is-now', text === 'Today' || text.indexOf('Ends') === 0);
      return true;
    });
    cal.querySelectorAll('[data-filter]').forEach(function (chip) {
      var f = chip.dataset.filter;
      if (f !== 'all' && !items.some(function (li) { return li.dataset.group === f; })) chip.remove();
      chip.addEventListener('click', function () {
        cal.querySelectorAll('[data-filter]').forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        items.forEach(function (li) { li.hidden = !(f === 'all' || li.dataset.group === f); });
      });
    });
  }

  // ---------- giant wordmarks: fit the four letters to the full width ----------

  function fitWordmarks() {
    doc.querySelectorAll('.wm-letters, .footer-word').forEach(function (row) {
      var letters = Array.prototype.slice.call(row.children);
      // Measure at a fixed size, then scale: gives the same answer however often it runs.
      row.style.fontSize = '100px';
      var cs = getComputedStyle(row);
      var inner = row.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var used = letters.reduce(function (sum, l) { return sum + l.offsetWidth; }, 0);
      if (!used || !inner) { row.style.fontSize = ''; return; }
      // Letters take ~94% of the row; the rest is shared out as gaps.
      row.style.fontSize = (100 * inner * 0.94 / used).toFixed(2) + 'px';
    });
  }
  fitWordmarks();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(fitWordmarks);
  var fitTimer;
  window.addEventListener('resize', function () {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(function () {
      fitWordmarks();
    }, 120);
  });

  // ---------- home: the search hint cycles through example searches ----------

  var hint = doc.querySelector('[data-hint-cycle]');
  if (hint && !reduceMotion) {
    var hints = [hint.textContent, 'Try “Ramadan”', 'Try “exams”', 'Try “Eid”', 'Try “restaurants”', 'Try “رمضان”'];
    var h = 0;
    setInterval(function () {
      if (doc.hidden) return;
      hint.classList.add('is-swapping');
      setTimeout(function () {
        h = (h + 1) % hints.length;
        hint.textContent = hints[h];
        hint.classList.remove('is-swapping');
      }, 350);
    }, 3200);
  }

  // ---------- theme ----------

  function activeTheme() {
    var t = html.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function labelThemeButtons() {
    var next = activeTheme() === 'dark' ? 'light' : 'dark';
    doc.querySelectorAll('[data-theme-toggle]').forEach(function (b) { b.setAttribute('aria-label', 'Switch to ' + next + ' theme'); });
  }
  labelThemeButtons();
  doc.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = activeTheme() === 'dark' ? 'light' : 'dark';
      var apply = function () {
        html.setAttribute('data-theme', next);
        store('mesh-theme', next);
        labelThemeButtons();
      };
      if (doc.startViewTransition && !reduceMotion) {
        var r = btn.getBoundingClientRect();
        html.style.setProperty('--vt-x', (r.left + r.width / 2) + 'px');
        html.style.setProperty('--vt-y', (r.top + r.height / 2) + 'px');
        html.classList.add('theme-switching');
        var t = doc.startViewTransition(apply);
        t.finished.then(function () { html.classList.remove('theme-switching'); }, function () { html.classList.remove('theme-switching'); });
      } else apply();
    });
  });

  // ---------- sheets (menu, search) ----------

  function openSheet(d) {
    if (!d || d.open) return;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
    html.classList.add('is-locked');
  }
  function closeSheet(d) {
    if (!d) return;
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }
  doc.querySelectorAll('dialog.sheet').forEach(function (d) {
    d.addEventListener('close', function () { html.classList.remove('is-locked'); });
    d.addEventListener('click', function (e) {
      if (e.target === d) closeSheet(d);
      if (e.target.closest('[data-close]')) closeSheet(d);
    });
  });
  var menu = doc.getElementById('menu');
  doc.querySelectorAll('[data-open-menu]').forEach(function (b) {
    b.addEventListener('click', function () { openSheet(menu); });
  });

  // ---------- search ----------

  var searchSheet = doc.getElementById('search');
  var searchInput = doc.getElementById('search-input');
  var resultsBox = searchSheet && searchSheet.querySelector('[data-search-results]');
  var index = null;
  var loading = null;

  function norm(s) {
    return (s || '').toLowerCase().normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[ً-ْٰـ]/g, '')      // Arabic vowel marks + tatweel
      .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
      .replace(/[’'`]/g, '');
  }
  function loadIndex() {
    if (index) return Promise.resolve(index);
    if (loading) return loading;
    loading = fetch(ROOT + 'search-index.json').then(function (r) {
      if (!r.ok) throw new Error('index');
      return r.json();
    }).then(function (docs) {
      index = docs.map(function (d) {
        return { d: d, t: norm(d.t), s: norm(d.s), x: norm(d.x + ' ' + (d.g || '')), a: norm(d.a), c: norm(d.c) };
      });
      return index;
    });
    return loading;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function highlight(text, terms) {
    var out = escapeHtml(text);
    terms.forEach(function (t) {
      if (t.length < 2) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }
  function snippet(d, terms) {
    var src = d.x || d.s || '';
    var lower = src.toLowerCase();
    var at = -1;
    terms.some(function (t) { at = lower.indexOf(t); return at >= 0; });
    if (at < 0) return d.s || src.slice(0, 140);
    var start = Math.max(0, at - 50);
    return (start > 0 ? '…' : '') + src.slice(start, start + 150) + (start + 150 < src.length ? '…' : '');
  }
  function runSearch(q) {
    var terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return renderIdle();
    var scored = [];
    index.forEach(function (e) {
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        var s = 0;
        if (e.t.indexOf(t) >= 0) s += (new RegExp('(^|\\s)' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(e.t)) ? 10 : 6;
        if (e.a.indexOf(t) >= 0) s += 6;
        if (e.s.indexOf(t) >= 0) s += 3;
        if (e.c.indexOf(t) >= 0) s += 2;
        if (e.x.indexOf(t) >= 0) s += 1;
        if (!s) return;          // every word has to match somewhere
        score += s;
      }
      if (e.d.c === 'Topic') score += 1;
      scored.push({ e: e, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    var top = scored.slice(0, 12);
    if (!top.length) {
      resultsBox.innerHTML = '<p class="search-empty">Nothing matches “' + escapeHtml(q) + '”. Try a shorter word, or <a href="' + pageUrl('ask/') + '">ask MESH</a>.</p>';
      return;
    }
    var rawTerms = q.toLowerCase().split(/\s+/).filter(Boolean);
    resultsBox.innerHTML = '<ul>' + top.map(function (r) {
      var d = r.e.d;
      return '<li><a href="' + pageUrl(d.u) + '"><span class="r-kind">' + escapeHtml(d.c) + '</span><span class="r-title">' + highlight(d.t, rawTerms) + '</span><span class="r-snip">' + highlight(snippet(d, rawTerms), rawTerms) + '</span></a></li>';
    }).join('') + '</ul>';
  }
  function renderIdle() {
    var links = [['calendar/', 'Calendar'], ['visas/', 'Visas'], ['study/', 'Study tools'], ['restaurants/', 'Restaurants'], ['admissions/', 'Admissions']];
    resultsBox.innerHTML = '<p class="search-hint">Search every guide, date and restaurant. Arabic works too.</p><div class="quick-links">' +
      links.map(function (l) { return '<a href="' + pageUrl(l[0]) + '">' + l[1] + '</a>'; }).join('') + '</div>';
  }
  function openSearch() {
    if (!searchSheet) return;
    openSheet(searchSheet);
    searchInput.value = '';
    renderIdle();
    setTimeout(function () { searchInput.focus(); }, 30);
    loadIndex().catch(function () {
      resultsBox.innerHTML = '<p class="search-empty">Search couldn’t load. Check your connection and try again.</p>';
    });
  }
  doc.querySelectorAll('[data-open-search]').forEach(function (b) { b.addEventListener('click', openSearch); });
  if (searchInput) {
    var timer;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        loadIndex().then(function () { runSearch(searchInput.value); }).catch(function () {});
      }, 80);
    });
    searchSheet.querySelector('[data-search-form]').addEventListener('submit', function (e) {
      e.preventDefault();
      var first = resultsBox.querySelector('a[href]');
      if (first) window.location.href = first.getAttribute('href');
    });
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeSheet(searchSheet); return; }
      if (e.key !== 'ArrowDown') return;
      var first = resultsBox.querySelector('a');
      if (first) { e.preventDefault(); first.focus(); }
    });
    resultsBox.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var links = Array.prototype.slice.call(resultsBox.querySelectorAll('a'));
      var i = links.indexOf(doc.activeElement);
      if (i < 0) return;
      e.preventDefault();
      if (e.key === 'ArrowDown' && links[i + 1]) links[i + 1].focus();
      if (e.key === 'ArrowUp') (links[i - 1] || searchInput).focus();
    });
  }
  doc.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if (!typing && (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) {
      e.preventDefault();
      openSearch();
    }
  });

  // ---------- copy buttons ----------

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var box = btn.closest('.prompt, .code-block, .tool-card, .fold-body');
    var source = box && (box.querySelector('[data-copy-source]') || box.querySelector('pre code') || box.querySelector('pre'));
    if (!source) return;
    var text = source.textContent;
    var label = btn.textContent;
    function done(msg) {
      btn.textContent = msg;
      btn.classList.add('is-copied');
      setTimeout(function () { btn.textContent = label; btn.classList.remove('is-copied'); }, 1800);
    }
    function fallback() {
      var range = doc.createRange();
      range.selectNodeContents(source);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      var ok = false;
      try { ok = doc.execCommand('copy'); } catch (err) { ok = false; }
      done(ok ? 'Copied' : 'Selected. Copy it now');
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done('Copied'); }, fallback);
    } else fallback();
  });

  // ---------- restaurant map ↔ cards ----------

  doc.querySelectorAll('.map-pin').forEach(function (pin) {
    var id = (pin.getAttribute('href') || '').slice(1);
    var card = id && doc.getElementById(id);
    if (!card) return;
    var on = function () { pin.classList.add('is-active'); card.classList.add('is-active'); };
    var off = function () { pin.classList.remove('is-active'); card.classList.remove('is-active'); };
    card.addEventListener('mouseenter', on);
    card.addEventListener('mouseleave', off);
    pin.addEventListener('mouseenter', on);
    pin.addEventListener('mouseleave', off);
  });

  // ---------- ask form ----------

  var form = doc.getElementById('ask-form');
  if (form) {
    var params = new URLSearchParams(window.location.search);
    var topicSel = form.querySelector('#ask-topic');
    if (params.get('topic') && topicSel.querySelector('option[value="' + params.get('topic') + '"]')) topicSel.value = params.get('topic');
    var typeParam = params.get('type');
    var typeInput = typeParam && form.querySelector('input[name="type"][value="' + typeParam + '"]');
    if (typeInput) typeInput.checked = true;
    if (params.get('page')) form.querySelector('#ask-page').value = params.get('page');
    if (typeParam === 'restaurant' && !params.get('topic')) topicSel.value = 'restaurants';
    form.querySelectorAll('input[name="type"]').forEach(function (r) {
      r.addEventListener('change', function () { if (r.value === 'restaurant' && r.checked) topicSel.value = 'restaurants'; });
    });

    var status = form.querySelector('.form-status');
    var msg = form.querySelector('#ask-message');
    var email = form.querySelector('#ask-email');
    var submitBtn = form.querySelector('button[type="submit"]');

    function setError(input, show) {
      var err = doc.getElementById(input.id + '-error');
      input.setAttribute('aria-invalid', show ? 'true' : 'false');
      if (err) err.hidden = !show;
      if (show) input.setAttribute('aria-describedby', err.id); else input.removeAttribute('aria-describedby');
    }
    function showStatus(text, isError) {
      status.hidden = false;
      status.textContent = text;
      status.classList.toggle('is-error', !!isError);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var badMsg = msg.value.trim().length < 10;
      var badEmail = email.value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
      setError(msg, badMsg);
      setError(email, badEmail);
      if (badMsg) { msg.focus(); return; }
      if (badEmail) { email.focus(); return; }

      var data = new FormData(form);
      if (data.get('botcheck')) { showStatus('Sent. Thank you.'); form.reset(); return; }

      var key = form.dataset.accessKey;
      if (!key) {
        showStatus(form.dataset.preview
          ? 'Preview only: nothing was sent. On the live site this message goes to the MESH inbox.'
          : 'This form isn’t connected yet, so nothing was sent. Please try again later.', !form.dataset.preview);
        return;
      }
      var typeLabel = (form.querySelector('input[name="type"]:checked + span') || {}).textContent || 'Message';
      var topicLabel = topicSel.options[topicSel.selectedIndex].text;
      var payload = {
        access_key: key,
        subject: 'MESH: ' + typeLabel + ' about ' + topicLabel,
        from_name: data.get('name') ? data.get('name') + ' via MESH' : 'MESH website',
        type: typeLabel,
        topic: topicLabel,
        message: data.get('message'),
        name: data.get('name') || '',
        email: data.get('email') || '',
        page: data.get('page') || '',
        botcheck: false
      };
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (!res.success) throw new Error(res.message || 'failed');
        form.reset();
        showStatus('Sent. JazakAllahu khayran. ' + (payload.email ? 'We’ll reply to ' + payload.email + '.' : 'Useful answers get added to the site.'));
      }).catch(function () {
        showStatus('Your message wasn’t sent. Check your connection and press Send again.', true);
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send to MESH';
      });
    });
  }
})();
