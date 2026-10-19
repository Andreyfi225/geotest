const C = [
  {n:'Россия',cap:'Москва',f:'ru',cont:'Европа'}, {n:'США',cap:'Вашингтон',f:'us',cont:'Сев. Америка'},
  {n:'Китай',cap:'Пекин',f:'cn',cont:'Азия'}, {n:'Германия',cap:'Берлин',f:'de',cont:'Европа'},
  {n:'Франция',cap:'Париж',f:'fr',cont:'Европа'}, {n:'Великобритания',cap:'Лондон',f:'gb',cont:'Европа'},
  {n:'Япония',cap:'Токио',f:'jp',cont:'Азия'}, {n:'Индия',cap:'Нью-Дели',f:'in',cont:'Азия'},
  {n:'Бразилия',cap:'Бразилиа',f:'br',cont:'Юж. Америка'}, {n:'Канада',cap:'Оттава',f:'ca',cont:'Сев. Америка'},
  {n:'Австралия',cap:'Канберра',f:'au',cont:'Океания'}, {n:'Италия',cap:'Рим',f:'it',cont:'Европа'},
  {n:'Испания',cap:'Мадрид',f:'es',cont:'Европа'}, {n:'Мексика',cap:'Мехико',f:'mx',cont:'Сев. Америка'},
  {n:'Египет',cap:'Каир',f:'eg',cont:'Африка'}, {n:'Турция',cap:'Анкара',f:'tr',cont:'Азия'}
];

const DB = {
  users: JSON.parse(localStorage.getItem('g_users') || '[]'),
  results: JSON.parse(localStorage.getItem('g_results') || '[]'),
  save() { localStorage.setItem('g_users', JSON.stringify(this.users)); localStorage.setItem('g_results', JSON.stringify(this.results)); }
};

const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
const session = JSON.parse(sessionStorage.getItem('g_session') || 'null');

const S = {
  user: session, view: session ? 'menu' : 'auth',
  theme: localStorage.getItem('g_theme') || 'dark',
  sound: localStorage.getItem('g_sound') !== '0',
  diff: 'easy', quiz: null, map: []
};

const playSound = (type) => {
  if (!S.sound) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = type === 'ok' ? 600 : (type === 'err' ? 200 : 400);
    g.gain.value = 0.1; o.start(); o.stop(ctx.currentTime + 0.1);
  } catch(e) {}
};

const toast = (msg, type = '') => {
  toastEl.textContent = msg;
  toastEl.className = `toast show ${type}`;
  setTimeout(() => toastEl.className = 'toast', 2500);
};

document.documentElement.setAttribute('data-theme', S.theme);

// --- РЕНДЕР ---
function render() {
  if (S.view === 'auth') return renderAuth();
  if (S.view === 'menu') return renderMenu();
  if (S.view === 'quiz') return renderQuiz();
  if (S.view === 'map') return renderMap();
  if (S.view === 'class') return renderClass();
}

// --- АВТОРИЗАЦИЯ ---
function renderAuth() {
  root.innerHTML = `
    <div class="card">
      <h2>🌍 ГеоТест PRO</h2>
      <input id="name" placeholder="Ваше имя">
      <input id="pass" type="password" placeholder="Пароль">
      <select id="role"><option value="student">Ученик</option><option value="teacher">Учитель</option></select>
      <input id="class" placeholder="Код класса (ученикам)" style="display:none">
      <button class="btn" data-action="login">Войти / Создать</button>
    </div>`;
  document.getElementById('role').onchange = (e) => {
    document.getElementById('class').style.display = e.target.value === 'student' ? 'block' : 'none';
  };
}

// --- МЕНЮ ---
function renderMenu() {
  root.innerHTML = `
    <div class="card">
      <div class="topbar">
        <div class="userinfo">
          <span>${S.user.name}</span>
          <span class="pill" style="background:var(--accent-soft);color:var(--accent);padding:4px 10px;border-radius:20px;font-size:12px">
            ${S.user.role === 'teacher' ? 'Учитель' : 'Ученик'}
          </span>
        </div>
        <div>
          <button class="btn ghost small" data-action="open-settings">⚙️</button>
          <button class="btn ghost small" data-action="logout">Выйти</button>
        </div>
      </div>
     
      <select id="diff" style="margin-bottom:20px">
        <option value="easy" ${S.diff==='easy'?'selected':''}>Сложность: Лёгкая (4 вар)</option>
        <option value="hard" ${S.diff==='hard'?'selected':''}>Сложность: Сложная (6 вар)</option>
      </select>

      <div class="menu-grid">
        <button class="menu-item" data-action="start-quiz" data-type="flags">
          <span class="icon">🚩</span><span class="title">Флаги</span><span class="desc">Угадай страну по флагу</span>
        </button>
        <button class="menu-item" data-action="start-quiz" data-type="capitals">
          <span class="icon">🏛️</span><span class="title">Столицы</span><span class="desc">Угадай столицу страны</span>
        </button>
        <button class="menu-item" data-action="start-quiz" data-type="mixed">
          <span class="icon">🎲</span><span class="title">Микс</span><span class="desc">Все вопросы подряд</span>
        </button>
        <button class="menu-item" data-action="start-map">
          <span class="icon">🗺️</span><span class="title">Карта</span><span class="desc">Нарисуй реки и горы</span>
        </button>
      </div>
     
      ${S.user.role === 'teacher' ? `
        <button class="btn ghost" data-action="view-class" style="margin-top:15px">👨‍🏫 Мой класс</button>
      ` : ''}
    </div>`;
   
  document.getElementById('diff').onchange = (e) => S.diff = e.target.value;
}

// --- КВИЗ ---
function startQuiz(type) {
  const qs = [...C].sort(() => Math.random() - 0.5).slice(0, 5);
  S.quiz = { type, qs, idx: 0, score: 0, opts: genOpts(qs[0]) };
  S.view = 'quiz'; render();
}

function genOpts(q) {
  const n = S.diff === 'hard' ? 6 : 4;
  const bad = (arr) => [...arr].sort(() => Math.random() - 0.5).slice(0, n - 1);
  const r = Math.random();
 
  if (S.quiz.type === 'capitals' || (S.quiz.type === 'mixed' && r < 0.5)) {
    const wrong = bad(C.filter(x => x.cap !== q.cap)).map(x => x.cap);
    return { title: `Столица страны: <b>${q.n}</b>`, ans: q.cap, arr: [q.cap, ...wrong].sort(() => Math.random() - 0.5) };
  }
  const wrong = bad(C.filter(x => x.n !== q.n)).map(x => x.n);
  return { title: "Что это за страна?", ans: q.n, arr: [q.n, ...wrong].sort(() => Math.random() - 0.5) };
}

function renderQuiz() {
  const q = S.quiz.qs[S.quiz.idx];
  if (!q) {
    DB.results.push({ userId: S.user.id, score: S.quiz.score, date: new Date().toLocaleDateString() });
    DB.save();
    root.innerHTML = `<div class="card" style="text-align:center"><h2>Результат: ${S.quiz.score} / 5</h2><button class="btn" data-action="back-menu" style="margin-top:20px">В меню</button></div>`;
    return;
  }
 
  const opt = S.quiz.opts;
  root.innerHTML = `
    <div class="card">
      <h2>Вопрос ${S.quiz.idx + 1} / 5</h2>
      <div class="flag-display"><img src="https://flagcdn.com/w320/${q.f}.png"></div>
      <div class="flag-question">${opt.title}</div>
      <div class="options">
        ${opt.arr.map((o, i) => `<button class="option" data-action="answer" data-val="${o}"><span class="opt-num">${i+1}</span>${o}</button>`).join('')}
      </div>
      <button class="btn ghost" data-action="back-menu" style="margin-top:15px">Сдаться</button>
    </div>`;
}

// --- КАРТА ---
const TASKS = [
  { t:'Река Нил', hint:'Центр Африки, на север к Средиземному морю.', p:[[520,260],[520,200],[530,180]] },
  { t:'Горы Анды', hint:'Западное побережье Южной Америки.', p:[[300,280],[300,360]] },
  { t:'Гималаи', hint:'Север Индии, дугой.', p:[[680,220],[720,230]] }
];

function startMap() {
  S.map = { idx: 0, strokes: [], task: TASKS[0] };
  S.view = 'map'; render();
}

function renderMap() {
  const t = S.map.task;
  root.innerHTML = `
    <div class="card">
      <h2>${t.t}</h2>
      <p class="muted" style="text-align:center;margin-bottom:15px">${t.hint}</p>
     
      <div class="map-box">
        <svg class="map" id="svg" viewBox="0 0 1000 500">
          <rect width="1000" height="500" fill="#0c1f3d"/>
          <!-- Африка -->
          <path d="M 450,150 L 550,140 L 600,250 L 550,400 L 480,350 L 450,250 Z" fill="#2d5041" stroke="#4a7a64" stroke-width="2"/>
          <!-- Юж. Америка -->
          <path d="M 250,250 L 320,230 L 350,320 L 300,450 L 260,350 Z" fill="#2d5041" stroke="#4a7a64" stroke-width="2"/>
          <!-- Азия -->
          <path d="M 600,100 L 800,80 L 850,200 L 700,250 L 600,180 Z" fill="#2d5041" stroke="#4a7a64" stroke-width="2"/>
         
          <polyline id="line" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round"/>
          <rect id="cap" width="1000" height="500" fill="transparent" style="cursor:crosshair"/>
        </svg>
      </div>
     
      <div style="display:flex;gap:10px;margin-top:15px">
        <button class="btn" data-action="check-map">Проверить</button>
        <button class="btn ghost" data-action="back-menu">Меню</button>
      </div>
    </div>`;

  const svg = document.getElementById('svg'), cap = document.getElementById('cap'), line = document.getElementById('line');
  let drawing = false;

  const getXY = (e) => {
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * 1000, y: (e.clientY - r.top) / r.height * 500 };
  };

  cap.onpointerdown = (e) => { drawing = true; S.map.strokes = [getXY(e)]; update(); cap.setPointerCapture(e.pointerId); };
  cap.onpointermove = (e) => { if(drawing) { S.map.strokes.push(getXY(e)); update(); } };
  cap.onpointerup = () => drawing = false;

  function update() { line.setAttribute('points', S.map.strokes.map(p => `${p.x},${p.y}`).join(' ')); }
}

// --- КЛАСС УЧИТЕЛЯ ---
function renderClass() {
  const students = DB.users.filter(u => u.classCode === S.user.classCode && u.role === 'student');
  let html = '<h3 style="margin-top:20px">Ученики:</h3>';
  if (students.length === 0) html += '<p class="muted" style="text-align:center">Никто не присоединился.</p>';
 
  students.forEach(s => {
    const res = DB.results.filter(r => r.userId === s.id);
    const best = res.length ? Math.max(...res.map(r => r.score)) : 0;
    html += `<div class="result-item"><span>${s.name}</span><span>Лучший: <b>${best}/5</b></span></div>`;
  });

  root.innerHTML = `
    <div class="card">
      <h2>Кабинет учителя</h2>
      <div style="text-align:center;background:var(--bg-0);padding:15px;border-radius:10px;margin:15px 0">
        <p class="muted">Код для входа:</p>
        <b style="font-size:24px;color:var(--accent)">${S.user.classCode}</b>
      </div>
      ${html}
      <button class="btn" data-action="back-menu" style="margin-top:15px">Назад</button>
    </div>`;
}

// --- ДЕЛЕГИРОВАНИЕ СОБЫТИЙ (Работает 100%) ---
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if (action === 'login') {
    const n = document.getElementById('name').value.trim(), p = document.getElementById('pass').value;
    const r = document.getElementById('role').value, c = document.getElementById('class').value.trim().toUpperCase();
    if (n.length < 2 || p.length < 3) return toast('Имя от 2 символов, пароль от 3', 'err');
   
    let u = DB.users.find(x => x.name === n && x.pass === p);
    if (!u) {
      const code = r === 'teacher' ? Math.random().toString(36).substring(2, 7).toUpperCase() : c;
      if (r === 'student' && !DB.users.find(x => x.role === 'teacher' && x.classCode === c)) return toast('Учитель не найден!', 'err');
      u = { id: Date.now(), name: n, pass: p, role: r, classCode: code };
      DB.users.push(u); DB.save();
    }
    sessionStorage.setItem('g_session', JSON.stringify(u));
    S.user = u; S.view = 'menu'; toast(`Привет, ${n}!`, 'ok'); render();
  }

  if (action === 'logout') {
    sessionStorage.removeItem('g_session');
    S.user = null; S.view = 'auth'; render();
  }

  if (action === 'back-menu') { S.view = 'menu'; render(); }
  if (action === 'start-quiz') { startQuiz(el.dataset.type); }
  if (action === 'start-map') { startMap(); }
  if (action === 'view-class') { S.view = 'class'; render(); }

  if (action === 'answer') {
    const ch = el.dataset.val;
    const opt = S.quiz.opts;
    document.querySelectorAll('.option').forEach(b => b.disabled = true);
   
    if (ch === opt.ans) { el.classList.add('correct'); S.quiz.score++; playSound('ok'); }
    else {
      el.classList.add('wrong');
      document.querySelectorAll('.option').forEach(b => { if(b.dataset.val === opt.ans) b.classList.add('correct'); });
      playSound('err');
    }
    setTimeout(() => { S.quiz.idx++; if(S.quiz.idx < 5) S.quiz.opts = genOpts(S.quiz.qs[S.quiz.idx]); render(); }, 1200);
  }

  if (action === 'check-map') {
    if (S.map.strokes.length < 2) return toast('Нарисуйте линию!', 'err');
    const start = S.map.strokes[0], end = S.map.strokes[S.map.strokes.length - 1];
    const t = S.map.task;
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
   
    const d1 = Math.min(dist(start, {x:t.p[0][0], y:t.p[0][1]}), dist(start, {x:t.p[t.p.length-1][0], y:t.p[t.p.length-1][1]}));
    const d2 = Math.min(dist(end, {x:t.p[0][0], y:t.p[0][1]}), dist(end, {x:t.p[t.p.length-1][0], y:t.p[t.p.length-1][1]}));
   
    if (d1 < 60 && d2 < 60) {
      toast('Идеально! +1 балл', 'ok'); playSound('ok');
      S.map.idx++;
      if(S.map.idx >= TASKS.length) {
        DB.results.push({ userId: S.user.id, score: 5, date: new Date().toLocaleDateString() }); DB.save();
        return S.view='menu', render();
      }
      S.map.task = TASKS[S.map.idx]; S.map.strokes = []; render();
    } else {
      toast('Мимо! Смотрите подсказку.', 'err'); playSound('err');
    }
  }
 
  // Настройки
  if (action === 'open-settings') document.getElementById('settings').classList.add('open');
  if (action === 'close-settings') document.getElementById('settings').classList.remove('open');
  if (action === 'toggle-theme') {
    S.theme = S.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('g_theme', S.theme);
    document.documentElement.setAttribute('data-theme', S.theme);
  }
  if (action === 'toggle-sound') {
    S.sound = !S.sound; localStorage.setItem('g_sound', S.sound ? '1' : '0');
  }
  if (action === 'reset-data') {
    if(confirm('Удалить все данные?')) {
      localStorage.clear(); sessionStorage.clear(); location.reload();
    }
  }
});

document.getElementById('set-theme').checked = S.theme === 'dark';
document.getElementById('set-sound').checked = S.sound;

render();
