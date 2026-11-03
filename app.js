(function () {
  'use strict';

  var STORAGE_KEY = 'todo.tasks';

  var form = document.getElementById('task-form');
  var input = document.getElementById('task-input');
  var list = document.getElementById('task-list');
  var emptyState = document.getElementById('empty-state');
  var countEl = document.getElementById('task-count');
  var clearBtn = document.getElementById('clear-completed');

  // --- Persistence -------------------------------------------------------

  function load() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(data)) return [];
      return data.filter(function (t) {
        return t && typeof t.id === 'string' && typeof t.text === 'string';
      }).map(function (t) {
        return { id: t.id, text: t.text, done: !!t.done };
      });
    } catch (e) {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      // Storage may be unavailable (private mode, quota); app still works in memory.
    }
  }

  function makeId() {
    if (window.crypto && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  var tasks = load();

  // --- Rendering ---------------------------------------------------------

  function renderTask(task) {
    var li = document.createElement('li');
    li.className = 'task' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    var toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.className = 'task-toggle';
    toggle.checked = task.done;
    toggle.setAttribute('aria-label',
      "Mark '" + task.text + "' as " + (task.done ? 'not done' : 'done'));

    var text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'task-delete';
    del.setAttribute('aria-label', 'Delete task');
    del.textContent = '×';

    li.append(toggle, text, del);
    return li;
  }

  function render() {
    list.replaceChildren.apply(list, tasks.map(renderTask));

    var remaining = tasks.filter(function (t) { return !t.done; }).length;
    countEl.textContent = remaining + (remaining === 1 ? ' task left' : ' tasks left');
    clearBtn.disabled = remaining === tasks.length; // no done tasks
    emptyState.hidden = tasks.length > 0;
  }

  // Persist and re-render after every state change.
  function update() {
    save();
    render();
  }

  // --- State changes -----------------------------------------------------

  function findTask(el) {
    var li = el.closest('li.task');
    if (!li) return null;
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === li.dataset.id) return tasks[i];
    }
    return null;
  }

  function toggleTask(task) {
    task.done = !task.done;
    update();
  }

  // --- Events ------------------------------------------------------------

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    tasks.push({ id: makeId(), text: text, done: false });
    update();
    input.value = '';
    input.focus();
  });

  // Delegated handlers on the list.
  list.addEventListener('change', function (e) {
    if (!e.target.classList.contains('task-toggle')) return;
    var task = findTask(e.target);
    if (task) toggleTask(task);
  });

  list.addEventListener('click', function (e) {
    var target = e.target;
    var task = findTask(target);
    if (!task) return;

    if (target.classList.contains('task-text')) {
      toggleTask(task);
    } else if (target.closest('.task-delete')) {
      tasks = tasks.filter(function (t) { return t !== task; });
      update();
    }
  });

  clearBtn.addEventListener('click', function () {
    tasks = tasks.filter(function (t) { return !t.done; });
    update();
  });

  render();
})();
