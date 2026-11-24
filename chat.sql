// chat.js: ruang chat kumpulan (tab keenam). Dimuatkan selepas skrip utama dalam index.html.
(() => {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  // ---- Gaya ----
  const st = document.createElement('style');
  st.textContent = `
#chatCard{display:flex;flex-direction:column;padding:0;overflow:hidden;height:calc(100vh - 150px);height:calc(100dvh - 150px);min-height:320px}
.ch-h{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--ln)}
#chatMsgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;overscroll-behavior:contain}
.cm{max-width:82%;padding:7px 11px;border-radius:16px;word-break:break-word;white-space:pre-wrap}
.cm b{display:block;font-size:.72rem;color:var(--pri)}
.cm small{display:block;text-align:right;font-size:.65rem;opacity:.65;margin-top:1px}
.cm.lain{align-self:flex-start;background:var(--field);border:1px solid var(--bd);border-bottom-left-radius:4px}
.cm.me{align-self:flex-end;background:var(--pri);color:#fff;border-bottom-right-radius:4px}
.cdate{align-self:center;font-size:.7rem;color:var(--mut);background:var(--field);padding:2px 10px;border-radius:999px;margin:6px 0}
.cf{display:flex;gap:6px;padding:8px 10px;border-top:1px solid var(--ln)}
.cf input{margin:0;flex:1;min-width:0}.cf button{width:auto;margin:0;padding:10px 16px}
body.chat #aiLaunch,body.chat #aiBubble,body.chat #aiPanel,body.chat .kredit{display:none!important}
.tabs button{position:relative}
.tdot{position:absolute;top:3px;left:calc(50% + 4px);min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--bad);color:#fff;font:700 .62rem/1 system-ui;font-style:normal;display:none;place-items:center}`;
  document.head.appendChild(st);

  // ---- Tab dan butang ----
  const sec = document.createElement('section');
  sec.id = 't6'; sec.className = 'tab';
  sec.innerHTML = `<div class="card" id="chatCard">
    <div class="ch-h"><h2 style="margin:0">Chat kumpulan</h2><span id="chatInfo" class="mut">Semua anggota</span></div>
    <div id="chatMsgs"></div>
    <div class="cf"><input id="chatIn" placeholder="Tulis mesej..." maxlength="500" autocomplete="off" enterkeyhint="send"><button id="chatSend" class="pri" type="button">Hantar</button></div>
  </div>`;
  const kredit = document.querySelector('.kredit');
  if (kredit) kredit.before(sec); else document.getElementById('app').appendChild(sec);

  const nav = document.querySelector('.tabs');
  const nb = document.createElement('button');
  nb.dataset.tab = 't6';
  nb.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H10l-4 3.5V16H4z"/></svg>Chat<i id="chatDot" class="tdot"></i>';
  nav.appendChild(nb);
  nb.onclick = () => bukaTab('t6');
  const n5 = nav.querySelector('button[data-tab="t5"]'); // label dipendekkan supaya 6 tab muat
  if (n5 && n5.lastChild && n5.lastChild.nodeType === 3) n5.lastChild.textContent = 'Notif';

  // ---- Keadaan ----
  let msgs = [], tdkBaca = 0, sedia = false, sibuk = false;
  const kini = () => sec.classList.contains('on');
  const dot = () => { const d = document.getElementById('chatDot'); d.style.display = tdkBaca ? 'grid' : 'none'; d.textContent = tdkBaca > 9 ? '9+' : tdkBaca; };
  const pengirim = m => { const a = anggota.find(x => x.user_id === m.user_id); return a ? a.nama : (m.nama || '?'); };

  nav.addEventListener('click', () => setTimeout(() => {
    document.body.classList.toggle('chat', kini());
    if (kini()) { tdkBaca = 0; dot(); render(true); }
  }, 0));

  function render(bawah) {
    const el = document.getElementById('chatMsgs');
    const dekat = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    let h = '', hari = '';
    msgs.forEach(m => {
      const hk = new Date(m.masa).toLocaleDateString('ms-MY', {weekday: 'short', day: 'numeric', month: 'short'});
      if (hk !== hari) { hari = hk; h += `<div class="cdate">${esc(hk)}</div>`; }
      const sendiri = m.user_id === me.user_id;
      h += `<div class="cm ${sendiri ? 'me' : 'lain'}">${sendiri ? '' : `<b>${esc(pengirim(m))}</b>`}<span>${esc(m.mesej)}</span><small>${jam(m.masa)}</small></div>`;
    });
    el.innerHTML = h || '<p class="mut" style="text-align:center;margin:auto">Belum ada mesej. Mulakan perbualan!</p>';
    if (bawah || dekat) el.scrollTop = el.scrollHeight;
  }

  function terima(m) {
    if (msgs.some(x => x.id === m.id)) return;
    msgs.push(m);
    if (msgs.length > 200) msgs.shift();
    render(false);
    if (m.user_id !== me.user_id && !kini()) {
      tdkBaca++; dot();
      toast(`Chat · ${pengirim(m)}: ${m.mesej}`);
      beep(120);
    }
  }

  async function muat() {
    const {data, error} = await db.from('chat').select('*').order('masa', {ascending: false}).limit(200);
    if (error) {
      document.getElementById('chatMsgs').innerHTML = `<p class="mut" style="text-align:center;margin:auto;padding:0 16px">Chat belum sedia. Jalankan SQL chat di Supabase dahulu.<br>(${esc(error.message)})</p>`;
      return false;
    }
    msgs = (data || []).reverse();
    render(true);
    return true;
  }

  async function hantar() {
    const i = document.getElementById('chatIn'), v = i.value.trim();
    if (!v || !me || sibuk) return;
    sibuk = true; i.value = '';
    const {data, error} = await db.from('chat').insert({nama: me.nama, mesej: v}).select().single();
    sibuk = false;
    if (error) { i.value = v; return alert('Gagal hantar: ' + error.message); }
    terima(data); render(true);
  }
  document.getElementById('chatSend').onclick = hantar;
  document.getElementById('chatIn').onkeydown = e => { if (e.key === 'Enter') hantar(); };

  async function mula() {
    if (!(await muat())) return;
    sedia = true;
    db.channel('chat-grup')
      .on('postgres_changes', {event: 'INSERT', schema: 'public', table: 'chat'}, p => terima(p.new))
      .subscribe();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && sedia) muat(); }); // kejar mesej yang terlepas

  // tunggu sehingga log masuk selesai (db dan me sedia)
  const tunggu = setInterval(() => {
    if (typeof db === 'undefined' || !db || typeof me === 'undefined' || !me) return;
    clearInterval(tunggu); mula();
  }, 500);
})();