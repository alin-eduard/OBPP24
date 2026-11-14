(() => {
    'use strict';

    const INSTRUMENTE = [
        { id: 'mandolina', label: 'Mandolină' },
        { id: 'vioara1',   label: 'Vioara 1' },
        { id: 'vioara2',   label: 'Vioara 2' },
        { id: 'chitara',   label: 'Chitară' },
    ];

    const ICON_OPEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';
    const ICON_CHEVRON = '<svg class="song-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    const ICON_STACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>';

    const $ = (id) => document.getElementById(id);
    const els = {
        list: $('content'),
        search: $('search-input'),
        hint: $('list-hint'),
        empty: $('empty'),
        error: $('error'),
        updated: $('last-update'),
        toast: $('toast'),
        toolbar: $('toolbar'),
    };

    let songs = [];
    const availability = new Map(); // url -> Promise<boolean>

    // ---------- Utilitare ----------

    // Elimină diacriticele, ca „incredere” să găsească „încredere”.
    function fold(s) {
        return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function pdfUrl(instrumentId, file) {
        return `resources/${instrumentId}/${encodeURIComponent(file)}.pdf`;
    }

    function checkExists(url) {
        if (!availability.has(url)) {
            availability.set(url, fetch(url, { method: 'HEAD' })
                .then(r => r.ok)
                .catch(() => true)); // offline / blocat: nu ascundem nimic
        }
        return availability.get(url);
    }

    let toastTimer;
    function toast(msg) {
        els.toast.textContent = msg;
        els.toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { els.toast.hidden = true; }, 3200);
    }

    function parseSong(raw) {
        const m = raw.match(/^\s*(\d+)\.\s*(.*)$/);
        const num = m ? m[1] : '';
        const title = m ? m[2] : raw;
        return { file: raw, num, title, key: fold(title), el: null };
    }

    // ---------- Lista ----------

    function renderList() {
        els.list.innerHTML = '';
        const frag = document.createDocumentFragment();
        songs.forEach(s => {
            s.el = buildSong(s);
            frag.appendChild(s.el);
        });
        els.list.appendChild(frag);
        applyFilter();
    }

    function buildSong(song) {
        const li = document.createElement('li');
        li.className = 'song';
        const panelId = `song-panel-${song.num || fold(song.title).replace(/\W+/g, '-')}`;

        const row = document.createElement('div');
        row.className = 'song-row';

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'song-toggle';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-controls', panelId);
        toggle.innerHTML = `
            <span class="song-num">${escapeHtml(song.num)}</span>
            <span class="song-title"></span>
            ${ICON_CHEVRON}`;
        row.appendChild(toggle);

        const panel = document.createElement('div');
        panel.className = 'song-panel';
        panel.id = panelId;
        panel.innerHTML = '<div class="song-panel-inner"><div class="parts"></div></div>';
        const parts = panel.querySelector('.parts');
        panel.inert = true;

        let built = false;
        toggle.addEventListener('click', () => {
            const open = !li.classList.contains('is-open');
            li.classList.toggle('is-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            panel.inert = !open;
            if (open && !built) {
                built = true;
                buildParts(song, parts);
            }
        });

        li.append(row, panel);
        return li;
    }

    function buildParts(song, container) {
        INSTRUMENTE.forEach(inst => {
            const url = pdfUrl(inst.id, song.file);
            const a = document.createElement('a');
            a.className = 'part';
            a.href = url;
            a.target = '_blank';
            a.rel = 'noopener';
            a.innerHTML = `<span>${escapeHtml(inst.label)}</span>${ICON_OPEN}`;
            container.appendChild(a);
            checkExists(url).then(ok => {
                if (!ok) {
                    a.classList.add('is-missing');
                    a.removeAttribute('href');
                    a.setAttribute('aria-disabled', 'true');
                    a.title = 'Partitura nu este disponibilă';
                }
            });
        });

        const all = document.createElement('button');
        all.type = 'button';
        all.className = 'part part--all';
        all.innerHTML = `<span>All</span>${ICON_STACK}`;
        all.addEventListener('click', () => mergeSong(song, all));
        container.appendChild(all);
    }

    // ---------- Combinare PDF ----------

    async function mergeSong(song, btn) {
        if (btn.getAttribute('aria-busy') === 'true') return;
        if (!window.PDFLib) { toast('Biblioteca PDF nu s-a încărcat. Verifică conexiunea.'); return; }

        // Deschidem fereastra imediat (în gestul utilizatorului) ca să nu fie blocată de browser.
        const win = window.open('', '_blank');
        const original = btn.innerHTML;
        btn.setAttribute('aria-busy', 'true');
        btn.innerHTML = '<span>Se pregătește…</span><span class="spinner" aria-hidden="true"></span>';

        try {
            const merged = await PDFLib.PDFDocument.create();
            merged.setTitle(song.file);

            const docs = await Promise.all(INSTRUMENTE.map(async inst => {
                try {
                    const r = await fetch(pdfUrl(inst.id, song.file));
                    if (!r.ok) return null;
                    return await PDFLib.PDFDocument.load(await r.arrayBuffer());
                } catch (e) {
                    console.warn(`Nu s-a putut încărca ${inst.label}:`, e);
                    return null;
                }
            }));

            let added = 0;
            for (const doc of docs) { // păstrăm ordinea instrumentelor
                if (!doc) continue;
                const pages = await merged.copyPages(doc, doc.getPageIndices());
                pages.forEach(p => merged.addPage(p));
                added++;
            }

            if (!added) {
                win && win.close();
                toast('Nu există partituri pentru această cântare.');
                return;
            }

            const blob = new Blob([await merged.save()], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            if (win && !win.closed) win.location.href = url;
            else window.location.href = url;
            if (added < INSTRUMENTE.length) toast(`${added} din ${INSTRUMENTE.length} partide disponibile.`);
        } catch (e) {
            console.error(e);
            win && win.close();
            toast('A apărut o eroare la combinarea PDF-urilor.');
        } finally {
            btn.removeAttribute('aria-busy');
            btn.innerHTML = original;
        }
    }

    // ---------- Căutare ----------

    function applyFilter() {
        const raw = els.search.value.trim();
        const q = fold(raw);
        const numQuery = /^\d+$/.test(raw);
        let visible = 0;

        songs.forEach(s => {
            let match = !q;
            if (!match) {
                match = numQuery ? s.num.startsWith(raw) : s.key.includes(q) || s.num === raw;
            }
            s.el.hidden = !match;
            if (match) visible++;
            highlight(s, numQuery ? '' : q);
        });

        els.empty.hidden = visible !== 0 || !songs.length;
        els.list.hidden = visible === 0;

        els.hint.innerHTML = q
            ? `<strong>${visible}</strong> ${visible === 1 ? 'rezultat' : 'rezultate'}`
            : '';
    }

    function highlight(song, q) {
        const span = song.el.querySelector('.song-title');
        if (!q) { span.textContent = song.title; return; }
        const i = song.key.indexOf(q);
        if (i < 0) { span.textContent = song.title; return; }
        // fold() păstrează lungimea pentru literele românești precompuse după NFD+strip,
        // dar verificăm pentru siguranță.
        if (fold(song.title).length !== song.title.normalize('NFC').length) { span.textContent = song.title; return; }
        const t = song.title.normalize('NFC');
        span.innerHTML = escapeHtml(t.slice(0, i)) + '<mark>' + escapeHtml(t.slice(i, i + q.length)) + '</mark>' + escapeHtml(t.slice(i + q.length));
    }

    // ---------- Init ----------

    async function init() {
        try { localStorage.removeItem('obpp.instrument'); } catch { /* ignorat */ }

        els.search.addEventListener('input', applyFilter);
        els.search.addEventListener('keydown', e => {
            if (e.key === 'Escape') { els.search.value = ''; applyFilter(); els.search.blur(); }
            if (e.key === 'Enter') {
                const first = songs.find(s => !s.el.hidden);
                if (first) first.el.querySelector('.song-toggle').click();
            }
        });
        document.addEventListener('keydown', e => {
            if (e.key === '/' && document.activeElement !== els.search && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                els.search.focus();
            }
        });

        // Bordură subtilă când bara de căutare devine „lipită” sus.
        const sentinel = document.createElement('div');
        els.toolbar.before(sentinel);
        new IntersectionObserver(([en]) => els.toolbar.classList.toggle('is-stuck', !en.isIntersecting))
            .observe(sentinel);

        try {
            const r = await fetch('resources/config.json', { cache: 'no-cache' });
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const data = await r.json();
            songs = (data.cantari || []).map(parseSong);
            els.updated.textContent = data.lastUpdate ? `Actualizat la ${data.lastUpdate}` : '';
            renderList();
        } catch (e) {
            console.error('Eroare la încărcarea config.json:', e);
            els.error.hidden = false;
        }
    }

    init();
})();
