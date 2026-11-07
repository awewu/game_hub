const difficultySettings = {
  easy: { label: '简单', hint: '适合刚刚开始', remove: 38 },
  medium: { label: '中等', hint: '来一点思考挑战', remove: 47 },
  hard: { label: '困难', hint: '给高手的专注时刻', remove: 55 }
};

const state = {
  difficulty: 'easy', solution: [], puzzle: [], values: [], notes: Array.from({ length: 81 }, () => new Set()),
  selected: 0, mistakes: 0, seconds: 0, noteMode: false, gameOver: false, wrong: new Set(), showErrors: false
};
const STORAGE_KEY = 'sudoku-game-v1';
let timerHandle;
let toastHandle;

const $ = id => document.getElementById(id);
const boardEl = $('board');

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatTime(seconds) {
  const min = String(Math.floor(seconds / 60)).padStart(2, '0');
  const sec = String(seconds % 60).padStart(2, '0');
  return `${min}:${sec}`;
}

function startTimer() {
  clearInterval(timerHandle);
  timerHandle = setInterval(() => { if (!state.gameOver && !document.hidden) { state.seconds++; $('timer').textContent = formatTime(state.seconds); if (state.seconds % 5 === 0) saveGame(); } }, 1000);
}

function saveGame() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ difficulty: state.difficulty, solution: state.solution, puzzle: state.puzzle, values: state.values, mistakes: state.mistakes, seconds: state.seconds, selected: state.selected, notes: state.notes.map(set => [...set]), wrong: [...state.wrong], savedAt: Date.now() }));
    $('saveStatus').textContent = '已自动保存';
  } catch (_) {
    $('saveStatus').textContent = '自动保存不可用';
  }
}

function restoreGame() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !difficultySettings[saved.difficulty] || !Array.isArray(saved.puzzle) || saved.puzzle.length !== 81 || !Array.isArray(saved.solution) || saved.solution.length !== 81 || !Array.isArray(saved.values) || saved.values.length !== 81 || saved.puzzle.some((n, i) => n && n !== saved.values[i])) return false;
    state.difficulty = saved.difficulty; state.solution = saved.solution; state.puzzle = saved.puzzle; state.values = saved.values;
    state.mistakes = Number(saved.mistakes) || 0; state.seconds = Number(saved.seconds) || 0; state.selected = Math.max(0, Math.min(80, Number(saved.selected) || 0));
    state.notes = Array.isArray(saved.notes) && saved.notes.length === 81 ? saved.notes.map(items => new Set(items)) : Array.from({ length: 81 }, () => new Set());
    state.wrong = new Set(Array.isArray(saved.wrong) ? saved.wrong.filter(index => Number.isInteger(index) && index >= 0 && index < 81 && state.values[index] !== state.solution[index]) : []);
    state.showErrors = false;
    state.gameOver = state.values.every((value, index) => value === state.solution[index]);
    $('timer').textContent = formatTime(state.seconds); $('mistakes').textContent = String(state.mistakes); updateProgress(); $('saveStatus').textContent = '已恢复上次进度';
    return true;
  } catch (_) { return false; }
}

function newGame() {
  const generated = SudokuEngine.generate(state.difficulty);
  state.solution = generated.solution;
  state.puzzle = generated.puzzle;
  state.values = [...state.puzzle];
  state.notes = Array.from({ length: 81 }, () => new Set());
  state.selected = state.values.findIndex(value => value === 0);
  state.mistakes = 0; state.seconds = 0; state.gameOver = false; state.wrong.clear(); state.noteMode = false; state.showErrors = false;
  $('timer').textContent = '00:00'; $('mistakes').textContent = '0'; $('progress').textContent = String(state.values.filter(Boolean).length);
  $('notesButton').classList.remove('active'); $('notesState').textContent = '关';
  $('reviewErrorsButton').classList.remove('active'); $('errorReviewState').textContent = '点击后显示';
  $('boardTip').innerHTML = '<span class="tip-dot"></span> 点击格子，再选择下方数字';
  render(); startTimer(); saveGame();
}

function render() {
  boardEl.innerHTML = '';
  const selectedValue = state.values[state.selected];
  const selectedRow = Math.floor(state.selected / 9), selectedCol = state.selected % 9;
  for (let index = 0; index < 81; index++) {
    const cell = document.createElement('button');
    cell.className = 'cell'; cell.type = 'button'; cell.setAttribute('role', 'gridcell');
    const row = Math.floor(index / 9), col = index % 9;
    if (state.puzzle[index]) cell.classList.add('given');
    if (index === state.selected) cell.classList.add('selected');
    if (row === selectedRow || col === selectedCol || (Math.floor(row / 3) === Math.floor(selectedRow / 3) && Math.floor(col / 3) === Math.floor(selectedCol / 3))) cell.classList.add('related');
    if (selectedValue && state.values[index] === selectedValue) cell.classList.add('same-number');
    if (state.showErrors && state.wrong.has(index)) cell.classList.add('wrong');
    const value = state.values[index];
    if (value) cell.append(String(value));
    else if (state.notes[index].size) {
      const noteWrap = document.createElement('span'); noteWrap.className = 'notes';
      for (let n = 1; n <= 9; n++) { const note = document.createElement('span'); note.textContent = state.notes[index].has(n) ? n : ''; noteWrap.append(note); }
      cell.append(noteWrap);
    }
    cell.addEventListener('click', () => { state.selected = index; render(); saveGame(); });
    boardEl.append(cell);
  }
  document.querySelectorAll('.number-pad button').forEach(button => {
    const number = Number(button.dataset.number);
    button.classList.toggle('is-used', state.values.includes(number));
  });
  document.querySelector('.sudoku-shell').classList.toggle('game-over', state.gameOver);
  $('newGameButton').innerHTML = state.gameOver ? '<span>＋</span> 开始下一局' : '<span>＋</span> 开始新游戏';
}

function showToast(message) {
  const toast = $('toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastHandle); toastHandle = setTimeout(() => toast.classList.remove('show'), 1700);
}

function hideErrorReview() {
  state.showErrors = false;
  $('reviewErrorsButton').classList.remove('active');
  $('errorReviewState').textContent = '点击后显示';
}

function updateProgress() { $('progress').textContent = String(state.values.filter(Boolean).length); }

function enterNumber(number) {
  if (state.gameOver || state.puzzle[state.selected]) return;
  const index = state.selected;
  hideErrorReview();
  if (state.noteMode) {
    if (state.values[index]) return;
    state.notes[index].has(number) ? state.notes[index].delete(number) : state.notes[index].add(number);
    render(); saveGame(); return;
  }
  state.notes[index].clear(); state.values[index] = number;
  if (number !== state.solution[index]) {
    state.wrong.add(index); state.mistakes++; $('mistakes').textContent = String(state.mistakes);
  } else {
    state.wrong.delete(index);
    checkComplete();
  }
  updateProgress(); render();
  saveGame();
}

function erase() {
  if (state.gameOver || state.puzzle[state.selected]) return;
  state.values[state.selected] = 0; state.wrong.delete(state.selected); state.notes[state.selected].clear(); hideErrorReview(); render(); updateProgress(); saveGame();
}

function giveHint() {
  if (state.gameOver || state.puzzle[state.selected]) { showToast('先选一个空白格'); return; }
  state.values[state.selected] = state.solution[state.selected]; state.notes[state.selected].clear(); state.wrong.delete(state.selected); updateProgress(); render(); showToast('提示已填入'); saveGame(); checkComplete();
}

function checkComplete() {
  if (state.values.every((value, index) => value === state.solution[index])) {
    state.gameOver = true; clearInterval(timerHandle); $('boardTip').innerHTML = '<span class="tip-dot"></span> 恭喜完成！可以开始下一局'; render(); showToast(`完成！用时 ${formatTime(state.seconds)}`); saveGame();
  }
}

document.querySelectorAll('[data-number]').forEach(button => button.addEventListener('click', () => enterNumber(Number(button.dataset.number))));
$('eraseButton').addEventListener('click', erase);
$('hintButton').addEventListener('click', giveHint);
$('newGameButton').addEventListener('click', newGame);
$('newGameTop').addEventListener('click', newGame);
$('notesButton').addEventListener('click', () => { state.noteMode = !state.noteMode; $('notesButton').classList.toggle('active', state.noteMode); $('notesState').textContent = state.noteMode ? '开' : '关'; saveGame(); });
$('reviewErrorsButton').addEventListener('click', () => {
  state.showErrors = !state.showErrors;
  const count = state.wrong.size;
  $('reviewErrorsButton').classList.toggle('active', state.showErrors);
  $('errorReviewState').textContent = state.showErrors ? (count ? `${count} 处已标出` : '没有错误') : '点击后显示';
  render();
  showToast(state.showErrors ? (count ? `已标出 ${count} 个错误位置` : '目前没有记录的错误') : '已关闭错误展示');
});
document.addEventListener('keydown', event => {
  if (/^[1-9]$/.test(event.key)) enterNumber(Number(event.key));
  if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') erase();
  const row = Math.floor(state.selected / 9), col = state.selected % 9;
  if (event.key === 'ArrowUp') state.selected = Math.max(0, state.selected - 9);
  if (event.key === 'ArrowDown') state.selected = Math.min(80, state.selected + 9);
  if (event.key === 'ArrowLeft') state.selected = row * 9 + Math.max(0, col - 1);
  if (event.key === 'ArrowRight') state.selected = row * 9 + Math.min(8, col + 1);
  if (event.key.startsWith('Arrow')) { event.preventDefault(); render(); saveGame(); }
});

const launchParams = new URLSearchParams(window.location.search);
const launchDifficulty = launchParams.get('difficulty');
const launchNewGame = launchParams.get('new') === '1';
if (launchNewGame && difficultySettings[launchDifficulty]) {
  state.difficulty = launchDifficulty;
  newGame();
  window.history.replaceState({}, document.title, 'sudoku.html');
} else if (restoreGame()) { render(); startTimer(); }
else newGame();

document.querySelector('.game-navigation a').addEventListener('click', saveGame);
window.addEventListener('pagehide', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });

if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
