// ---- State ----
let todos = [];
let activeTab = 'today';
const collapsedDates = new Set();

// ---- DOM refs ----
const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');
const counter = document.getElementById('counter');
const emptyState = document.getElementById('empty-state');
const historyListEl = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty');
const dateTitle = document.getElementById('date-title');
const closeBtn = document.getElementById('close-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const opacityBtn = document.getElementById('opacity-btn');
const opacityPanel = document.getElementById('opacity-panel');
const opacitySlider = document.getElementById('opacity-slider');
const tabToday = document.getElementById('tab-today');
const tabHistory = document.getElementById('tab-history');
const todayPanel = document.getElementById('today-panel');
const historyPanel = document.getElementById('history-panel');

// ---- Date title ----
function updateDateTitle() {
  dateTitle.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
updateDateTitle();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') updateDateTitle();
});

// ---- Init ----
async function init() {
  todos = (await window.api.getTodos()) || [];
  const opacity = await window.api.getOpacity();
  opacitySlider.value = opacity;
  render();
}

// ---- Helper ----
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ---- Render: today tab (active + completed-today todos) ----
function render() {
  taskList.innerHTML = '';
  const todayStart = startOfToday();
  const todayItems = todos.filter(t => !t.done || (t.completedAt >= todayStart));

  if (todayItems.length === 0) {
    emptyState.classList.add('visible');
    taskList.style.display = 'none';
  } else {
    emptyState.classList.remove('visible');
    taskList.style.display = 'flex';

    todayItems.forEach((todo) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (todo.done ? ' done' : '');
      li.dataset.id = todo.id;

      const checkbox = document.createElement('button');
      checkbox.className = 'task-checkbox';
      checkbox.setAttribute('aria-label', todo.done ? 'Mark as not done' : 'Mark as done');
      checkbox.addEventListener('click', () => toggleTodo(todo.id));

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = todo.text;
      if (!todo.done) text.addEventListener('dblclick', () => editTodo(todo.id, text));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete';
      deleteBtn.textContent = '×';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      li.append(checkbox, text, deleteBtn);
      taskList.appendChild(li);
    });
  }

  const active = todos.filter(t => !t.done);
  const count = active.length;
  const total = todos.length;
  if (total === 0) counter.textContent = '0 tasks';
  else if (count === 0) counter.textContent = 'all done! 🎉';
  else counter.textContent = `${count} task${count === 1 ? '' : 's'}`;
}

// ---- Render: history tab (completed todos grouped by date) ----
function renderHistory() {
  historyListEl.innerHTML = '';
  const todayStart = startOfToday();
  const done = todos.filter(t => t.done && t.completedAt < todayStart);

  if (done.length === 0) {
    historyEmpty.classList.add('visible');
    return;
  }
  historyEmpty.classList.remove('visible');

  const groups = new Map();
  done.forEach(t => {
    const ts = t.completedAt || t.createdAt;
    const key = new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    if (!groups.has(key)) groups.set(key, { ts, items: [] });
    groups.get(key).items.push(t);
  });

  const sorted = [...groups.entries()].sort((a, b) => b[1].ts - a[1].ts);

  sorted.forEach(([dateKey, { items }]) => {
    const group = document.createElement('div');
    group.className = 'date-group' + (collapsedDates.has(dateKey) ? ' collapsed' : '');

    const header = document.createElement('div');
    header.className = 'date-group-header';

    const label = document.createElement('span');
    label.textContent = dateKey;

    const toggle = document.createElement('span');
    toggle.className = 'date-group-toggle';
    toggle.textContent = '▾';

    header.append(label, toggle);
    header.addEventListener('click', () => {
      if (collapsedDates.has(dateKey)) collapsedDates.delete(dateKey);
      else collapsedDates.add(dateKey);
      group.classList.toggle('collapsed');
    });

    const itemsEl = document.createElement('ul');
    itemsEl.className = 'date-group-items task-list';

    items.forEach(todo => {
      const li = document.createElement('li');
      li.className = 'task-item done';

      const checkbox = document.createElement('button');
      checkbox.className = 'task-checkbox';
      checkbox.setAttribute('aria-label', 'Mark as not done');
      checkbox.addEventListener('click', () => toggleTodo(todo.id));

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = todo.text;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete';
      deleteBtn.textContent = '×';
      deleteBtn.setAttribute('aria-label', 'Delete task');
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      li.append(checkbox, text, deleteBtn);
      itemsEl.appendChild(li);
    });

    group.append(header, itemsEl);
    historyListEl.appendChild(group);
  });
}

// ---- Tab switching ----
function switchTab(tab) {
  activeTab = tab;
  if (tab === 'today') {
    todayPanel.classList.add('active');
    historyPanel.classList.remove('active');
    tabToday.classList.add('active');
    tabHistory.classList.remove('active');
    render();
  } else {
    historyPanel.classList.add('active');
    todayPanel.classList.remove('active');
    tabHistory.classList.add('active');
    tabToday.classList.remove('active');
    renderHistory();
  }
}

// ---- Actions ----
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    text: trimmed,
    done: false,
    createdAt: Date.now(),
    completedAt: null
  });
  save();
  render();
}

function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.done = !todo.done;
    todo.completedAt = todo.done ? Date.now() : null;
    save();
    render();
    if (activeTab === 'history') renderHistory();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  save();
  render();
  if (activeTab === 'history') renderHistory();
}

function editTodo(id, textEl) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.value = todo.text;
  input.maxLength = 200;
  input.style.cssText = `
    flex: 1;
    font: inherit;
    color: inherit;
    background: rgba(255,255,255,0.9);
    border: 1px solid var(--accent);
    border-radius: 4px;
    padding: 2px 6px;
    outline: none;
  `;
  textEl.replaceWith(input);
  input.focus();
  input.select();

  const commit = () => {
    const newText = input.value.trim();
    if (newText) todo.text = newText;
    save();
    render();
  };

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = todo.text; input.blur(); }
  });
}

function save() {
  window.api.saveTodos(todos);
}

// ---- Event listeners ----
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTodo(taskInput.value);
    taskInput.value = '';
  }
});

tabToday.addEventListener('click', () => switchTab('today'));
tabHistory.addEventListener('click', () => switchTab('history'));

closeBtn.addEventListener('click', () => window.api.closeWindow());
minimizeBtn.addEventListener('click', () => window.api.minimizeWindow());

opacityBtn.addEventListener('click', () => {
  opacityPanel.classList.toggle('visible');
});

opacitySlider.addEventListener('input', (e) => {
  window.api.setOpacity(parseFloat(e.target.value));
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'n') {
    e.preventDefault();
    if (activeTab !== 'today') switchTab('today');
    taskInput.focus();
  }
});

init();
