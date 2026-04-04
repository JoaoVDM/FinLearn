// ========================================
// FINLEARN — Frontend JS
// ========================================

const API = '';

// ---- Nav injection (evita duplicação em todos os HTMLs) ----

function injectNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const page = location.pathname.split('/').pop() || 'index.html';
  const active = (p) => page === p ? ' active' : '';
  const theme = document.documentElement.dataset.theme || 'dark';
  const themeIcon = theme === 'light' ? '🌙' : '☀️';
  const themeLabel = theme === 'light' ? 'Escuro' : 'Claro';

  nav.innerHTML = `
    <div class="sidebar-logo">
      <a href="index.html" class="nav-logo"><span>Fin</span>Learn</a>
    </div>
    <ul class="nav-links">
      <li><a href="index.html" class="${active('index.html')}"><span class="nav-icon">🏠</span> Início</a></li>
      <li><a href="trilha.html" class="${active('trilha.html')}"><span class="nav-icon">📚</span> Trilha</a></li>
      <li><a href="glossario.html" class="${active('glossario.html')}"><span class="nav-icon">📖</span> Glossário</a></li>
      <li><a href="simulador.html" class="${active('simulador.html')}"><span class="nav-icon">📊</span> Simulador</a></li>
      <li><a href="meta.html" class="${active('meta.html')}"><span class="nav-icon">🎯</span> Meta</a></li>
      <li><a href="fluxo.html" class="${active('fluxo.html')}"><span class="nav-icon">💰</span> Fluxo de Caixa</a></li>
    </ul>
    <div class="sidebar-footer">
      <button class="theme-toggle" id="theme-toggle">
        <span id="theme-icon">${themeIcon}</span>
        <span id="theme-label">${themeLabel}</span>
      </button>
    </div>
  `;

  // Mobile header
  const mobileHeader = document.createElement('div');
  mobileHeader.className = 'mobile-header';
  mobileHeader.innerHTML = `
    <a href="index.html" class="nav-logo"><span>Fin</span>Learn</a>
    <button class="hamburger-btn" id="hamburger-btn" aria-label="Abrir menu">
      <span></span><span></span><span></span>
    </button>
  `;
  document.body.prepend(mobileHeader);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.dataset.theme || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Toggle sidebar
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    nav.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay.addEventListener('click', () => {
    nav.classList.remove('open');
    overlay.classList.remove('open');
  });
  nav.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      overlay.classList.remove('open');
    });
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('fl_theme', theme);
  const icon = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (icon) icon.textContent = theme === 'light' ? '🌙' : '☀️';
  if (label) label.textContent = theme === 'light' ? 'Escuro' : 'Claro';
  // Update chart colors if simulator chart is visible
  if (simChart) {
    const isDark = theme === 'dark';
    const tickColor = isDark ? '#5a6478' : '#94a3b8';
    const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    const legendColor = isDark ? '#8892a4' : '#475569';
    simChart.options.plugins.legend.labels.color = legendColor;
    simChart.options.scales.x.ticks.color = tickColor;
    simChart.options.scales.x.grid.color = gridColor;
    simChart.options.scales.y.ticks.color = tickColor;
    simChart.options.scales.y.grid.color = gridColor;
    simChart.update();
  }
}

function initTheme() {
  // Apply data-theme immediately (before nav injection) to avoid flash
  const saved = localStorage.getItem('fl_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
}


// ---- Utility ----

function fmt(n) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCurrency(n) {
  return 'R$ ' + fmt(n);
}

function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.className = `toast-${type}`;
  toast.innerHTML = (type === 'success' ? '✓ ' : '✗ ') + msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function getParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(API + path, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error(`API ${method} ${path} falhou:`, err.message);
    showToast('Erro de comunicação com o servidor', 'error');
    return {};
  }
}

// ========================================
// INDEX PAGE
// ========================================

async function initIndex() {
  const el = document.getElementById('modules-grid');
  const heroPercent = document.getElementById('hero-percent');
  const heroCompleted = document.getElementById('hero-completed');
  const heroTotal = document.getElementById('hero-total');
  const overallBar = document.getElementById('overall-bar');
  const overallPct = document.getElementById('overall-pct');

  if (!el) return;

  const [progress, modules] = await Promise.all([
    api('GET', '/api/progresso'),
    api('GET', '/api/content/modules')
  ]);

  heroPercent.textContent = progress.overallPercent + '%';
  heroCompleted.textContent = progress.completedCount;
  heroTotal.textContent = progress.totalLessons;
  overallBar.style.width = progress.overallPercent + '%';
  overallPct.textContent = progress.overallPercent + '%';

  // Botão "Continue estudando" — substitui "Começar a Aprender" quando há progresso
  const startBtn = document.getElementById('start-btn');
  const continueWrapper = document.getElementById('continue-wrapper');
  if (progress.completedCount > 0) {
    if (startBtn) startBtn.style.display = 'none';
    if (continueWrapper) {
      let nextLesson = null;
      for (const m of modules) {
        for (const l of m.lessons) {
          if (!progress.completedLessons.includes(l.id)) {
            nextLesson = l;
            break;
          }
        }
        if (nextLesson) break;
      }
      continueWrapper.innerHTML = nextLesson
        ? `<a href="licao.html?id=${nextLesson.id}" class="btn btn-primary continue-btn">▶ Continuar: ${nextLesson.title}</a>`
        : `<span class="trilha-completa">✓ Trilha concluída!</span>`;
    }
  }

  // Reset
  document.getElementById('reset-btn')?.addEventListener('click', async () => {
    if (!confirm('Tem certeza? Todo o progresso e quizzes serão apagados.')) return;
    await api('POST', '/api/progresso/reset');
    location.reload();
  });


  el.innerHTML = '';
  progress.modulesProgress.forEach(m => {
    // div em vez de <a> para permitir links filhos sem nested anchors (HTML inválido)
    const card = document.createElement('div');
    card.className = 'module-card fade-in';
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => { window.location.href = `trilha.html?modulo=${m.id}`; });

    const quizInfo = m.quizScore
      ? `<span class="badge badge-success">Quiz: ${m.quizScore.score}/${m.quizScore.total}</span>`
      : (m.percent === 100
        ? `<a href="quiz.html?modulo=${m.id}" class="btn btn-ghost" style="padding:4px 10px;font-size:0.78rem;">Fazer Quiz →</a>`
        : `<span class="badge badge-neutral">${m.total} lições</span>`);

    card.innerHTML = `
      <div class="module-card-header">
        <div class="module-icon">${m.icon}</div>
        <div>
          <div class="module-card-title">Módulo ${m.id} — ${m.title}</div>
          <div class="module-card-subtitle">${m.completed}/${m.total} lições concluídas</div>
        </div>
      </div>
      <div class="module-card-desc">${m.description}</div>
      <div class="module-progress-row">
        <span class="module-progress-label">Progresso</span>
        <span class="module-progress-pct">${m.percent}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${m.percent}%"></div></div>
      <div class="module-footer">
        ${quizInfo}
        <span style="font-size:0.8rem;color:var(--text-muted)">Ver lições →</span>
      </div>
    `;
    el.appendChild(card);
  });
}

// ========================================
// TRILHA PAGE
// ========================================

async function initTrilha() {
  const container = document.getElementById('trilha-container');
  if (!container) return;

  const params = getParams();
  const targetModulo = params.modulo ? parseInt(params.modulo) : null;

  const [modules, progress] = await Promise.all([
    api('GET', '/api/content/modules'),
    api('GET', '/api/progresso')
  ]);

  container.innerHTML = '';

  modules.forEach(m => {
    const section = document.createElement('div');
    section.className = 'module-section fade-in';
    section.id = `modulo-${m.id}`;

    const moduleProgress = progress.modulesProgress.find(mp => mp.id === m.id);
    const pct = moduleProgress ? moduleProgress.percent : 0;

    section.innerHTML = `
      <div class="module-section-header">
        <div class="module-icon">${m.icon}</div>
        <div style="flex:1">
          <div class="module-section-title">Módulo ${m.id} — ${m.title}</div>
          <div style="font-size:0.82rem;color:var(--text-muted)">${m.description}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:1.1rem;font-weight:700;color:var(--accent)">${pct}%</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${moduleProgress ? moduleProgress.completed : 0}/${m.lessons.length}</div>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:16px">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="lesson-list" id="lessons-${m.id}"></div>
      ${pct === 100 ? `
        <div style="margin-top:14px;display:flex;align-items:center;gap:10px">
          ${moduleProgress && moduleProgress.quizScore
            ? `<span class="badge badge-success">✓ Quiz concluído: ${moduleProgress.quizScore.score}/${moduleProgress.quizScore.total} acertos</span>`
            : `<a href="quiz.html?modulo=${m.id}" class="btn btn-primary" style="font-size:0.85rem;padding:8px 16px">🎯 Fazer Quiz do Módulo ${m.id}</a>`
          }
        </div>` : ''}
    `;

    const lessonList = section.querySelector(`#lessons-${m.id}`);
    m.lessons.forEach(l => {
      const done = progress.completedLessons.includes(l.id);
      const item = document.createElement('a');
      item.href = `licao.html?id=${l.id}`;
      item.className = `lesson-item${done ? ' completed' : ''}`;
      item.innerHTML = `
        <div class="lesson-checkbox">${done ? '✓' : ''}</div>
        <span class="lesson-title">${l.title}</span>
        <span class="lesson-arrow">→</span>
      `;
      lessonList.appendChild(item);
    });

    container.appendChild(section);
  });

  if (targetModulo) {
    // aguarda o DOM renderizar antes de rolar para o módulo alvo
    setTimeout(() => {
      const target = document.getElementById(`modulo-${targetModulo}`);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

// ========================================
// LESSON PAGE
// ========================================

async function initLesson() {
  const main = document.getElementById('lesson-main');
  if (!main) return;

  const { id } = getParams();
  if (!id) { main.innerHTML = '<p>Lição não encontrada.</p>'; return; }

  const [lesson, progress] = await Promise.all([
    api('GET', `/api/content/lesson/${id}`),
    api('GET', '/api/progresso')
  ]);

  if (lesson.error) { main.innerHTML = '<p>Lição não encontrada.</p>'; return; }

  const done = progress.completedLessons.includes(id);
  const lessonIndex = lesson.lessons.findIndex(l => l.id === id);
  const prevLesson = lessonIndex > 0 ? lesson.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lesson.lessons.length - 1 ? lesson.lessons[lessonIndex + 1] : null;

  // Breadcrumb
  document.getElementById('bc-module').textContent = `Módulo ${lesson.moduleId} — ${lesson.moduleTitle}`;
  document.getElementById('bc-module').href = `trilha.html?modulo=${lesson.moduleId}`;
  document.getElementById('bc-lesson').textContent = lesson.title;

  // Title
  document.getElementById('lesson-title').textContent = lesson.title;
  document.title = lesson.title + ' — FinLearn';

  // Body
  document.getElementById('lesson-body').innerHTML = lesson.content;

  // Checkbox
  const checkbox = document.getElementById('complete-checkbox');
  const checkLabel = document.getElementById('check-label');
  checkbox.checked = done;
  checkLabel.textContent = done ? 'Lição concluída' : 'Marcar como concluída';

  checkbox.addEventListener('change', async () => {
    await api('POST', '/api/progresso', { lessonId: id, completed: checkbox.checked });
    checkLabel.textContent = checkbox.checked ? 'Lição concluída' : 'Marcar como concluída';
    showToast(checkbox.checked ? 'Lição marcada como concluída!' : 'Progresso removido');

    // Atualiza sidebar sem recarregar a página
    const updatedProgress = await api('GET', '/api/progresso');
    const modProgress = updatedProgress.modulesProgress?.find(m => m.id === lesson.moduleId);
    if (modProgress) {
      document.getElementById('sidebar-progress-bar').style.width = modProgress.percent + '%';
      document.getElementById('sidebar-progress-text').textContent =
        `${modProgress.completed}/${modProgress.total} lições (${modProgress.percent}%)`;
    }
    const sidebarItem = sidebarList?.querySelector(`a[href="licao.html?id=${id}"]`);
    if (sidebarItem) {
      sidebarItem.className = `sidebar-lesson-item active${checkbox.checked ? ' done' : ''}`;
    }
  });

  // Navigation
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');

  if (prevBtn) {
    if (prevLesson) {
      prevBtn.href = `licao.html?id=${prevLesson.id}`;
      prevBtn.textContent = '← ' + prevLesson.title;
    } else {
      prevBtn.style.display = 'none';
    }
  }

  if (nextBtn) {
    if (nextLesson) {
      nextBtn.href = `licao.html?id=${nextLesson.id}`;
      nextBtn.textContent = nextLesson.title + ' →';
    } else {
      // Last lesson — show quiz button
      nextBtn.href = `quiz.html?modulo=${lesson.moduleId}`;
      nextBtn.textContent = '🎯 Fazer Quiz do Módulo →';
      nextBtn.className = 'btn btn-primary';
    }
  }

  // Sidebar
  const sidebarList = document.getElementById('sidebar-lessons');
  if (sidebarList) {
    lesson.lessons.forEach(l => {
      const item = document.createElement('a');
      item.href = `licao.html?id=${l.id}`;
      const isDone = progress.completedLessons.includes(l.id);
      item.className = `sidebar-lesson-item${l.id === id ? ' active' : ''}${isDone ? ' done' : ''}`;
      item.innerHTML = `<span class="sidebar-lesson-text">${l.title}</span>`;
      sidebarList.appendChild(item);
    });
  }

  // Module progress in sidebar
  const modProgress = progress.modulesProgress.find(m => m.id === lesson.moduleId);
  if (modProgress) {
    document.getElementById('sidebar-progress-bar').style.width = modProgress.percent + '%';
    document.getElementById('sidebar-progress-text').textContent = `${modProgress.completed}/${modProgress.total} lições (${modProgress.percent}%)`;
  }
}

// ========================================
// QUIZ PAGE
// ========================================

let quizState = {
  questions: [],
  current: 0,
  answers: [],
  answered: false,
  keyHandler: null
};

function attachQuizKeyboard() {
  detachQuizKeyboard();
  const keyMap = { a: 0, b: 1, c: 2, d: 3, e: 4, '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
  quizState.keyHandler = e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const idx = keyMap[e.key.toLowerCase()];
    const q = quizState.questions[quizState.current];
    if (idx !== undefined && q && idx < q.options.length) {
      selectAnswer(idx);
    } else if (e.key === 'Enter') {
      const btn = document.getElementById('next-btn');
      if (btn && btn.style.display !== 'none' && quizState.answered) btn.click();
    }
  };
  document.addEventListener('keydown', quizState.keyHandler);
}

function detachQuizKeyboard() {
  if (quizState.keyHandler) {
    document.removeEventListener('keydown', quizState.keyHandler);
    quizState.keyHandler = null;
  }
}

function shuffleOptions(questions) {
  return questions.map(q => {
    const indices = q.options.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return {
      ...q,
      options: indices.map(i => q.options[i]),
      correct: indices.indexOf(q.correct)
    };
  });
}

async function initQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  const { modulo } = getParams();
  if (!modulo) { container.innerHTML = '<p>Módulo não especificado.</p>'; return; }

  let questions;
  if (modulo === 'all') {
    document.getElementById('quiz-module-title').textContent = 'Quiz Geral';
    const allData = await Promise.all(
      ['1', '2', '3', '4', '5'].map(m => api('GET', `/api/quiz/${m}`))
    );
    questions = allData.flatMap(d => d.questions || []);
  } else {
    document.getElementById('quiz-module-title').textContent = `Módulo ${modulo}`;
    const data = await api('GET', `/api/quiz/${modulo}`);
    if (data.error) { container.innerHTML = '<p>' + data.error + '</p>'; return; }
    questions = data.questions;
  }

  quizState.questions = shuffleOptions(questions);
  quizState.modulo = modulo;
  quizState.current = 0;
  quizState.answers = [];
  quizState.answered = false;

  renderQuestion();
}

async function restartQuiz() {
  let questions;
  if (quizState.modulo === 'all') {
    const allData = await Promise.all(
      ['1', '2', '3', '4', '5'].map(m => api('GET', `/api/quiz/${m}`))
    );
    questions = allData.flatMap(d => d.questions || []);
  } else {
    const data = await api('GET', `/api/quiz/${quizState.modulo}`);
    if (!data.questions) return;
    questions = data.questions;
  }

  quizState.questions = shuffleOptions(questions);
  quizState.current = 0;
  quizState.answers = [];
  quizState.answered = false;

  const container = document.getElementById('quiz-container');
  const resultEl = container.querySelector('.quiz-result');
  if (resultEl) {
    const qCard = document.createElement('div');
    qCard.id = 'question-card';
    qCard.className = 'question-card';
    resultEl.replaceWith(qCard);
  }

  const nav = document.getElementById('quiz-nav');
  nav.style.display = '';

  const preview = document.getElementById('quiz-score-preview');
  if (preview) preview.textContent = '';

  document.getElementById('quiz-progress-bar').style.width = '0%';

  renderQuestion();
}

function renderQuestion() {
  const { questions, current } = quizState;
  const q = questions[current];

  const progressBar = document.getElementById('quiz-progress-bar');
  const progressText = document.getElementById('quiz-progress-text');
  progressBar.style.width = `${((current) / questions.length) * 100}%`;
  progressText.textContent = `Questão ${current + 1} de ${questions.length}`;

  const qCard = document.getElementById('question-card');
  qCard.innerHTML = `
    <div class="question-number">Questão ${current + 1}</div>
    <div class="question-text">${q.question}</div>
    <div class="options-list" id="options-list"></div>
    <div id="explanation-box" style="display:none"></div>
  `;

  const optionsList = document.getElementById('options-list');
  const letters = ['A', 'B', 'C', 'D', 'E'];

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <div class="option-letter">${letters[i]}</div>
      <div class="option-text">${opt}</div>
    `;
    btn.addEventListener('click', () => selectAnswer(i));
    optionsList.appendChild(btn);
  });

  quizState.answered = false;

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'none';
  nextBtn.textContent = current === questions.length - 1 ? 'Ver Resultado' : 'Próxima →';

  attachQuizKeyboard();
}

function selectAnswer(index) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.current];
  const isCorrect = index === q.correct;

  quizState.answers.push({ selected: index, correct: q.correct, isCorrect });

  const correctSoFar = quizState.answers.filter(a => a.isCorrect).length;
  const preview = document.getElementById('quiz-score-preview');
  if (preview) preview.textContent = `${correctSoFar}/${quizState.answers.length} corretos`;

  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    else if (i === index && !isCorrect) btn.classList.add('wrong');
  });

  const explBox = document.getElementById('explanation-box');
  explBox.style.display = 'block';
  explBox.className = `explanation-box${isCorrect ? '' : ' wrong'}`;
  explBox.innerHTML = `<strong>${isCorrect ? '✓ Correto!' : '✗ Incorreto.'}</strong> ${q.explanation}`;

  const nextBtn = document.getElementById('next-btn');
  nextBtn.style.display = 'flex';
}

function initQuizNav() {
  const nextBtn = document.getElementById('next-btn');
  if (!nextBtn) return;

  nextBtn.addEventListener('click', () => {
    if (!quizState.answered) return;

    quizState.current++;
    if (quizState.current >= quizState.questions.length) {
      showResult();
    } else {
      renderQuestion();
    }
  });
}

async function showResult() {
  detachQuizKeyboard();
  const score = quizState.answers.filter(a => a.isCorrect).length;
  const total = quizState.questions.length;
  const pct = Math.round((score / total) * 100);

  await api('POST', `/api/quiz/${quizState.modulo}`, {
    score, total,
    answers: quizState.answers
  });

  const progressBar = document.getElementById('quiz-progress-bar');
  progressBar.style.width = '100%';

  const qCard = document.getElementById('question-card');
  const nav = document.getElementById('quiz-nav');
  nav.style.display = 'none';

  let emoji = '🎉';
  let msg = 'Excelente! Você domina este módulo!';
  if (pct < 60) { emoji = '📚'; msg = 'Continue estudando — você vai chegar lá!'; }
  else if (pct < 80) { emoji = '👍'; msg = 'Bom resultado! Revise os erros para fixar o conteúdo.'; }

  const wrongAnswers = quizState.answers
    .map((a, i) => ({ ...a, question: quizState.questions[i] }))
    .filter(a => !a.isCorrect);

  const reviewHTML = wrongAnswers.length > 0
    ? `<div class="quiz-review">
        <h3>📝 Revise seus erros (${wrongAnswers.length})</h3>
        ${wrongAnswers.map(({ question, correct }) => `
          <div class="review-item">
            <div class="review-question">${question.question}</div>
            <div class="review-answer">✓ ${question.options[correct]}</div>
            <div class="review-explanation">${question.explanation}</div>
          </div>
        `).join('')}
      </div>`
    : `<div class="quiz-review quiz-review-empty">🎯 Parabéns! Você acertou tudo!</div>`;

  const resultEl = document.createElement('div');
  resultEl.className = 'quiz-result fade-in';
  resultEl.innerHTML = `
    <div style="font-size:3rem;margin-bottom:12px">${emoji}</div>
    <div class="result-score">${pct}%</div>
    <div class="result-label">${msg}</div>
    <div class="result-details">
      <div class="result-stat">
        <div class="result-stat-value" style="color:var(--accent)">${score}</div>
        <div class="result-stat-label">Acertos</div>
      </div>
      <div class="result-stat">
        <div class="result-stat-value" style="color:var(--danger)">${total - score}</div>
        <div class="result-stat-label">Erros</div>
      </div>
      <div class="result-stat">
        <div class="result-stat-value">${total}</div>
        <div class="result-stat-label">Total</div>
      </div>
    </div>
    <div class="result-actions">
      <button id="restart-quiz-btn" class="btn btn-secondary">↺ Refazer</button>
      ${quizState.modulo === 'all'
        ? `<a href="trilha.html" class="btn btn-secondary">← Trilha</a>`
        : `<a href="trilha.html?modulo=${quizState.modulo}" class="btn btn-secondary">← Módulo</a>`}
      <a href="index.html" class="btn btn-primary">Ver Progresso</a>
    </div>
    ${reviewHTML}
  `;
  qCard.replaceWith(resultEl);
  resultEl.querySelector('#restart-quiz-btn').addEventListener('click', restartQuiz);
}

// ========================================
// GLOSSARY PAGE
// ========================================

async function initGlossary() {
  const grid = document.getElementById('glossary-grid');
  const searchInput = document.getElementById('search-input');
  const countEl = document.getElementById('glossary-count');
  if (!grid) return;

  const terms = await api('GET', '/api/content/glossary');
  terms.sort((a, b) => a.term.localeCompare(b.term));

  function render(query) {
    const q = query.trim().toLowerCase();
    const filtered = q ? terms.filter(t =>
      t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    ) : terms;

    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'termo' : 'termos'}`;
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Nenhum termo encontrado para "${query}".</p></div>`;
      return;
    }

    filtered.forEach(t => {
      const def = t.definition || '';
      const highlightedTerm = q ? t.term.replace(new RegExp(`(${q})`, 'gi'), '<mark class="highlight">$1</mark>') : t.term;
      const highlightedDef = q ? def.replace(new RegExp(`(${q})`, 'gi'), '<mark class="highlight">$1</mark>') : def;
      const item = document.createElement('div');
      item.className = 'glossary-item fade-in';
      item.innerHTML = `
        <div class="glossary-term">${highlightedTerm}</div>
        <div class="glossary-def">${highlightedDef}</div>
      `;
      grid.appendChild(item);
    });
  }

  render('');
  searchInput.addEventListener('input', e => render(e.target.value));
}

// ========================================
// SIMULATOR PAGE
// ========================================

let simChart = null;
let rateMode = 'month';

function calcRequiredMonthly(goal, initial, monthlyRate, months) {
  if (monthlyRate === 0) return Math.max(0, (goal - initial) / months);
  const factor = Math.pow(1 + monthlyRate, months);
  const pmt = (goal - initial * factor) * monthlyRate / (factor - 1);
  return Math.max(0, pmt);
}

function runCompound(initial, monthly, monthlyRate, months, inflation) {
  let balance = initial;
  let totalInvested = initial;
  const yearlyData = [{ year: 0, balance: initial, invested: initial, gains: 0, realBalance: initial }];

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthly;
    totalInvested += monthly;
    if (m % 12 === 0) {
      const yr = m / 12;
      yearlyData.push({
        year: yr,
        balance,
        invested: totalInvested,
        gains: balance - totalInvested,
        realBalance: balance / Math.pow(1 + inflation / 100, yr)
      });
    }
  }

  return { balance, totalInvested, yearlyData };
}

function initRateToggle(onChange) {
  const monthBtn  = document.getElementById('rate-month');
  const yearBtn   = document.getElementById('rate-year');
  const rateLabel = document.getElementById('rate-label');
  if (!monthBtn) return;

  monthBtn.addEventListener('click', () => {
    rateMode = 'month';
    monthBtn.classList.add('active');
    yearBtn.classList.remove('active');
    rateLabel.textContent = 'Taxa de Juros ao Mês (%)';
    onChange();
  });

  yearBtn.addEventListener('click', () => {
    rateMode = 'year';
    yearBtn.classList.add('active');
    monthBtn.classList.remove('active');
    rateLabel.textContent = 'Taxa de Juros ao Ano (%)';
    onChange();
  });
}

function initSimulator() {
  const form = document.getElementById('sim-form');
  if (!form) return;

  initRateToggle(calculate);

  form.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', calculate);
  });

  const presets = {
    'preset-conservador': { initial: 1000, monthly: 300, rate: 0.84, years: 10, inflation: 4.5 },
    'preset-moderado':    { initial: 1000, monthly: 500, rate: 1.0,  years: 10, inflation: 4.5 },
    'preset-agressivo':   { initial: 1000, monthly: 800, rate: 1.2,  years: 10, inflation: 4.5 }
  };

  Object.entries(presets).forEach(([id, v]) => {
    document.getElementById(id)?.addEventListener('click', () => {
      document.getElementById('initial').value   = v.initial;
      document.getElementById('monthly').value   = v.monthly;
      document.getElementById('rate').value      = v.rate;
      document.getElementById('years').value     = v.years;
      document.getElementById('inflation').value = v.inflation;
      rateMode = 'month';
      monthBtn.classList.add('active');
      yearBtn.classList.remove('active');
      rateLabel.textContent = 'Taxa de Juros ao Mês (%)';
      calculate();
    });
  });

  calculate();
}

function calculate() {
  const initial = Math.max(0, parseFloat(document.getElementById('initial').value) || 0);
  const rateInput = Math.max(0, parseFloat(document.getElementById('rate').value) || 0);
  const years = Math.max(1, Math.min(50, parseInt(document.getElementById('years').value) || 1));
  const inflation = Math.max(0, parseFloat(document.getElementById('inflation').value) || 0);

  let monthlyRate;
  if (rateMode === 'month') {
    monthlyRate = rateInput / 100;
  } else {
    monthlyRate = Math.pow(1 + rateInput / 100, 1 / 12) - 1;
  }

  const months = years * 12;
  const monthly = Math.max(0, parseFloat(document.getElementById('monthly').value) || 0);

  const { balance, totalInvested, yearlyData } = runCompound(initial, monthly, monthlyRate, months, inflation);
  const gains = balance - totalInvested;
  const realFinal = balance / Math.pow(1 + inflation / 100, years);

  document.getElementById('result-final').textContent    = fmtCurrency(balance);
  document.getElementById('result-invested').textContent = fmtCurrency(totalInvested);
  document.getElementById('result-gains').textContent    = fmtCurrency(gains);
  document.getElementById('result-real').textContent     = fmtCurrency(realFinal);

  renderChart(yearlyData);
  renderTable(yearlyData);
}

// ========================================
// META — Calculadora de Meta
// ========================================

function initMeta() {
  const form = document.getElementById('meta-form');
  if (!form) return;

  initRateToggle(calculateMeta);

  form.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', calculateMeta);
  });

  calculateMeta();
}

function calculateMeta() {
  const goal    = Math.max(0, parseFloat(document.getElementById('goal').value)      || 0);
  const initial = Math.max(0, parseFloat(document.getElementById('initial').value)   || 0);
  const rateInput = Math.max(0, parseFloat(document.getElementById('rate').value)    || 0);
  const years   = Math.max(1, Math.min(50, parseInt(document.getElementById('years').value) || 1));
  const inflation = Math.max(0, parseFloat(document.getElementById('inflation').value) || 0);

  let monthlyRate;
  if (rateMode === 'month') {
    monthlyRate = rateInput / 100;
  } else {
    monthlyRate = Math.pow(1 + rateInput / 100, 1 / 12) - 1;
  }

  const months = years * 12;
  const monthly = calcRequiredMonthly(goal, initial, monthlyRate, months);

  const { balance, totalInvested, yearlyData } = runCompound(initial, monthly, monthlyRate, months, inflation);
  const gains = balance - totalInvested;
  const realFinal = balance / Math.pow(1 + inflation / 100, years);

  document.getElementById('result-monthly').textContent   = fmtCurrency(monthly);
  document.getElementById('result-invested').textContent  = fmtCurrency(totalInvested);
  document.getElementById('result-gains').textContent     = fmtCurrency(gains);
  document.getElementById('result-real').textContent      = fmtCurrency(realFinal);

  renderChart(yearlyData);
  renderTable(yearlyData);
}

function renderChart(data) {
  const ctx = document.getElementById('sim-chart');
  if (!ctx) return;

  const labels = data.map(d => d.year === 0 ? 'Início' : `Ano ${d.year}`);
  const balances = data.map(d => d.balance);
  const invested = data.map(d => d.invested);
  const realBalances = data.map(d => d.realBalance);

  if (simChart) simChart.destroy();

  simChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Patrimônio Total',
          data: balances,
          borderColor: '#00C896',
          backgroundColor: 'rgba(0,200,150,0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointBackgroundColor: '#00C896'
        },
        {
          label: 'Total Investido',
          data: invested,
          borderColor: '#3a4460',
          backgroundColor: 'rgba(58,68,96,0.08)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#3a4460'
        },
        {
          label: 'Poder de Compra Real',
          data: realBalances,
          borderColor: '#ffa502',
          backgroundColor: 'rgba(255,165,2,0.06)',
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#ffa502'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#8892a4', font: { size: 12 }, boxWidth: 14 }
        },
        tooltip: {
          backgroundColor: '#1a1e2a',
          borderColor: '#252b3b',
          borderWidth: 1,
          titleColor: '#e8eaf0',
          bodyColor: '#8892a4',
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#5a6478', font: { size: 11 } },
          grid: { color: 'rgba(255,255,255,0.04)' }
        },
        y: {
          ticks: {
            color: '#5a6478',
            font: { size: 11 },
            callback: v => 'R$ ' + (v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'k' : v)
          },
          grid: { color: 'rgba(255,255,255,0.04)' }
        }
      }
    }
  });
}

function renderTable(data) {
  const tbody = document.getElementById('sim-table-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  data.slice(1).forEach(d => {
    const row = document.createElement('tr');
    const gainPct = d.invested > 0 ? ((d.gains / d.invested) * 100).toFixed(1) : '0.0';
    row.innerHTML = `
      <td style="font-weight:600;color:var(--text-primary)">Ano ${d.year}</td>
      <td>${fmtCurrency(d.invested)}</td>
      <td style="color:var(--accent)">${fmtCurrency(d.gains)}</td>
      <td style="font-weight:600;color:var(--text-primary)">${fmtCurrency(d.balance)}</td>
      <td><span class="badge badge-success">+${gainPct}%</span></td>
      <td style="color:#ffa502">${fmtCurrency(d.realBalance)}</td>
    `;
    tbody.appendChild(row);
  });
}

// ========================================
// NAV ACTIVE STATE
// ========================================

function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ========================================
// FLUXO DE CAIXA
// ========================================

let fluxoTransactions = [];
let fluxoType = 'gasto';

function initFluxo() {
  if (!document.getElementById('fluxo-add-btn')) return;

  document.getElementById('fluxo-date').value = new Date().toISOString().split('T')[0];

  document.getElementById('fluxo-btn-gasto').addEventListener('click', () => {
    fluxoType = 'gasto';
    document.getElementById('fluxo-btn-gasto').classList.add('active');
    document.getElementById('fluxo-btn-invest').classList.remove('active');
  });

  document.getElementById('fluxo-btn-invest').addEventListener('click', () => {
    fluxoType = 'investimento';
    document.getElementById('fluxo-btn-invest').classList.add('active');
    document.getElementById('fluxo-btn-gasto').classList.remove('active');
  });

  document.getElementById('fluxo-add-btn').addEventListener('click', addFluxoTransaction);

  ['fluxo-desc', 'fluxo-value'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') addFluxoTransaction();
    });
  });

  document.getElementById('fluxo-month-filter').addEventListener('change', renderFluxo);
  document.getElementById('fluxo-type-filter').addEventListener('change', renderFluxo);

  loadFluxo();
}

async function loadFluxo() {
  fluxoTransactions = await api('GET', '/api/fluxo');
  populateFluxoMonthFilter();
  renderFluxo();
}

function populateFluxoMonthFilter() {
  const select = document.getElementById('fluxo-month-filter');
  const months = [...new Set(fluxoTransactions.map(t => t.date.slice(0, 7)))].sort().reverse();
  const prev = select.value;

  select.innerHTML = '<option value="all">Todos os meses</option>';
  months.forEach(m => {
    const [y, mo] = m.split('-');
    const label = new Date(y, mo - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    select.appendChild(opt);
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  if (months.includes(prev)) {
    select.value = prev;
  } else if (months.includes(currentMonth)) {
    select.value = currentMonth;
  }
}

function getFluxoFiltered() {
  const monthVal = document.getElementById('fluxo-month-filter').value;
  const typeVal  = document.getElementById('fluxo-type-filter').value;
  return fluxoTransactions.filter(t => {
    const okMonth = monthVal === 'all' || t.date.startsWith(monthVal);
    const okType  = typeVal  === 'all' || t.type === typeVal;
    return okMonth && okType;
  });
}

function renderFluxo() {
  const filtered = getFluxoFiltered();

  // Summary
  const totalGastos = filtered.filter(t => t.type === 'gasto').reduce((s, t) => s + t.value, 0);
  const totalInvest = filtered.filter(t => t.type === 'investimento').reduce((s, t) => s + t.value, 0);
  const total = totalGastos + totalInvest;
  const taxa = total > 0 ? Math.round((totalInvest / total) * 100) : 0;

  document.getElementById('fluxo-total-gastos').textContent = fmtCurrency(totalGastos);
  document.getElementById('fluxo-total-invest').textContent = fmtCurrency(totalInvest);
  document.getElementById('fluxo-taxa').textContent = taxa + '%';

  // List
  const list = document.getElementById('fluxo-list');

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="fluxo-empty">
        <div class="fluxo-empty-icon">📭</div>
        <div>Nenhuma transação encontrada</div>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(t => {
    const icon = t.type === 'gasto' ? '💸' : '📈';
    const date = new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR');
    const sign = t.type === 'gasto' ? '− ' : '+ ';
    return `
      <div class="transaction-item">
        <span class="transaction-icon">${icon}</span>
        <div class="transaction-info">
          <div class="transaction-desc">${t.description}</div>
          <div class="transaction-date">${date}</div>
        </div>
        <span class="transaction-value ${t.type}">${sign}${fmtCurrency(t.value)}</span>
        <button class="transaction-delete" data-id="${t.id}" title="Remover">✕</button>
      </div>`;
  }).join('');

  list.querySelectorAll('.transaction-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteFluxoTransaction(btn.dataset.id));
  });
}

async function addFluxoTransaction() {
  const desc  = document.getElementById('fluxo-desc').value.trim();
  const value = parseFloat(document.getElementById('fluxo-value').value);
  const date  = document.getElementById('fluxo-date').value;

  if (!desc)              { showToast('Informe uma descrição', 'error'); return; }
  if (!value || value <= 0) { showToast('Informe um valor válido', 'error'); return; }

  const btn = document.getElementById('fluxo-add-btn');
  btn.disabled = true;

  const result = await api('POST', '/api/fluxo', { type: fluxoType, description: desc, value, date });

  if (result?.success) {
    document.getElementById('fluxo-desc').value  = '';
    document.getElementById('fluxo-value').value = '';
    showToast('Transação adicionada');
    await loadFluxo();
  }

  btn.disabled = false;
}

async function deleteFluxoTransaction(id) {
  if (!confirm('Remover esta transação?')) return;
  await api('DELETE', `/api/fluxo/${id}`);
  fluxoTransactions = fluxoTransactions.filter(t => t.id !== id);
  populateFluxoMonthFilter();
  renderFluxo();
  showToast('Transação removida');
}

// ========================================
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  injectNav();
  setActiveNav();
  initIndex();
  initTrilha();
  initLesson();
  initQuiz();
  initQuizNav();
  initGlossary();
  initSimulator();
  initMeta();
  initFluxo();
});
