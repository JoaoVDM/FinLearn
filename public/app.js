// ========================================
// FINLEARN — Frontend JS
// ========================================

const API = '';

// ---- Nav injection (evita duplicação em todos os HTMLs) ----

function injectNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  nav.innerHTML = `
    <a href="index.html" class="nav-logo"><span>Fin</span>Learn</a>
    <ul class="nav-links">
      <li><a href="index.html"><span>🏠</span> <span>Início</span></a></li>
      <li><a href="trilha.html"><span>📚</span> <span>Trilha</span></a></li>
      <li><a href="glossario.html"><span>📖</span> <span>Glossário</span></a></li>
      <li><a href="simulador.html"><span>📊</span> <span>Simulador</span></a></li>
    </ul>
  `;
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

  const progress = await api('GET', '/api/progresso');

  heroPercent.textContent = progress.overallPercent + '%';
  heroCompleted.textContent = progress.completedCount;
  heroTotal.textContent = progress.totalLessons;
  overallBar.style.width = progress.overallPercent + '%';
  overallPct.textContent = progress.overallPercent + '%';

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
    const res = await api('POST', '/api/progresso', { lessonId: id, completed: checkbox.checked });
    checkLabel.textContent = checkbox.checked ? 'Lição concluída' : 'Marcar como concluída';
    showToast(checkbox.checked ? 'Lição marcada como concluída!' : 'Progresso removido');
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
  answered: false
};

async function initQuiz() {
  const container = document.getElementById('quiz-container');
  if (!container) return;

  const { modulo } = getParams();
  if (!modulo) { container.innerHTML = '<p>Módulo não especificado.</p>'; return; }

  document.getElementById('quiz-module-title').textContent = `Módulo ${modulo}`;

  const data = await api('GET', `/api/quiz/${modulo}`);
  if (data.error) { container.innerHTML = '<p>' + data.error + '</p>'; return; }

  quizState.questions = data.questions;
  quizState.modulo = modulo;
  quizState.current = 0;
  quizState.answers = [];
  quizState.answered = false;

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
}

function selectAnswer(index) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.current];
  const isCorrect = index === q.correct;

  quizState.answers.push({ selected: index, correct: q.correct, isCorrect });

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

  qCard.outerHTML = `
    <div class="quiz-result fade-in">
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
        <a href="trilha.html?modulo=${quizState.modulo}" class="btn btn-secondary">← Voltar ao Módulo</a>
        <a href="index.html" class="btn btn-primary">Ver Progresso Geral</a>
      </div>
    </div>
  `;
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
      t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)
    ) : terms;

    countEl.textContent = `${filtered.length} ${filtered.length === 1 ? 'termo' : 'termos'}`;
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Nenhum termo encontrado para "${query}".</p></div>`;
      return;
    }

    filtered.forEach(t => {
      const def = t.definition || t.def || '';
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

function initSimulator() {
  const form = document.getElementById('sim-form');
  if (!form) return;

  const monthBtn = document.getElementById('rate-month');
  const yearBtn = document.getElementById('rate-year');
  const rateLabel = document.getElementById('rate-label');

  monthBtn.addEventListener('click', () => {
    rateMode = 'month';
    monthBtn.classList.add('active');
    yearBtn.classList.remove('active');
    rateLabel.textContent = 'Taxa de Juros ao Mês (%)';
    calculate();
  });

  yearBtn.addEventListener('click', () => {
    rateMode = 'year';
    yearBtn.classList.add('active');
    monthBtn.classList.remove('active');
    rateLabel.textContent = 'Taxa de Juros ao Ano (%)';
    calculate();
  });

  form.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', calculate);
  });

  calculate();
}

function calculate() {
  const initial = parseFloat(document.getElementById('initial').value) || 0;
  const monthly = parseFloat(document.getElementById('monthly').value) || 0;
  const rateInput = parseFloat(document.getElementById('rate').value) || 0;
  const years = parseInt(document.getElementById('years').value) || 1;

  let monthlyRate;
  if (rateMode === 'month') {
    monthlyRate = rateInput / 100;
  } else {
    monthlyRate = Math.pow(1 + rateInput / 100, 1 / 12) - 1;
  }

  const months = years * 12;
  let balance = initial;
  let totalInvested = initial;

  const yearlyData = [{ year: 0, balance: initial, invested: initial, gains: 0 }];

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthly;
    totalInvested += monthly;
    if (m % 12 === 0) {
      yearlyData.push({
        year: m / 12,
        balance: balance,
        invested: totalInvested,
        gains: balance - totalInvested
      });
    }
  }

  const gains = balance - totalInvested;

  document.getElementById('result-final').textContent = fmtCurrency(balance);
  document.getElementById('result-invested').textContent = fmtCurrency(totalInvested);
  document.getElementById('result-gains').textContent = fmtCurrency(gains);

  renderChart(yearlyData);
  renderTable(yearlyData);
}

function renderChart(data) {
  const ctx = document.getElementById('sim-chart');
  if (!ctx) return;

  const labels = data.map(d => d.year === 0 ? 'Início' : `Ano ${d.year}`);
  const balances = data.map(d => d.balance);
  const invested = data.map(d => d.invested);

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
          borderDash: [6, 3],
          pointRadius: 3,
          pointBackgroundColor: '#3a4460'
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
// INIT
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  injectNav();
  setActiveNav();
  initIndex();
  initTrilha();
  initLesson();
  initQuiz();
  initQuizNav();
  initGlossary();
  initSimulator();
});
