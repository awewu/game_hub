const TETRIS_KEY = 'tetris-game-v1';
const COLS = 10;
const ROWS = 20;
const COLORS = { I: '#55bfe1', O: '#f0c957', T: '#987cd3', S: '#79c98b', Z: '#dd77b6', J: '#6786dd', L: '#f0925f' };
const SHAPES = {
  I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1]], S: [[0,1,1],[1,1,0]],
  Z: [[1,1,0],[0,1,1]], J: [[1,0,0],[1,1,1]], L: [[0,0,1],[1,1,1]]
};
const TYPES = Object.keys(SHAPES);
const boardCanvas = document.getElementById('tetrisBoard');
const ctx = boardCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextPiece');
const nextCtx = nextCanvas.getContext('2d');
const $ = id => document.getElementById(id);
let animationFrame;
let lastFrame = 0;
let saveTimer;
let swipeStart = null;

const state = { board: emptyBoard(), current: null, next: randomType(), score: 0, lines: 0, level: 1, paused: false, over: false };

function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function randomType() { return TYPES[Math.floor(Math.random() * TYPES.length)]; }
function cloneMatrix(matrix) { return matrix.map(row => [...row]); }
function rotateMatrix(matrix) { return matrix[0].map((_, column) => matrix.map(row => row[column]).reverse()); }
function pieceMatrix(piece) { let matrix = cloneMatrix(SHAPES[piece.type]); for (let i = 0; i < piece.rotation; i++) matrix = rotateMatrix(matrix); return matrix; }
function makePiece(type = state.next) { const matrix = SHAPES[type]; return { type, rotation: 0, x: Math.floor((COLS - matrix[0].length) / 2), y: 0 }; }

function collides(piece, dx = 0, dy = 0, rotation = piece.rotation) {
  const test = { ...piece, x: piece.x + dx, y: piece.y + dy, rotation };
  const matrix = pieceMatrix(test);
  for (let row = 0; row < matrix.length; row++) for (let col = 0; col < matrix[row].length; col++) {
    if (!matrix[row][col]) continue;
    const x = test.x + col, y = test.y + row;
    if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && state.board[y][x])) return true;
  }
  return false;
}

function spawn() {
  state.current = makePiece();
  state.next = randomType();
  if (collides(state.current)) { state.over = true; state.paused = false; showOverlay('游戏结束', '点击重新开始'); }
  draw(); saveGame();
}

function startNewGame() {
  state.board = emptyBoard(); state.current = null; state.next = randomType(); state.score = 0; state.lines = 0; state.level = 1; state.paused = false; state.over = false;
  hideOverlay(); updateStats(); spawn(); lastFrame = performance.now(); cancelAnimationFrame(animationFrame); animationFrame = requestAnimationFrame(loop); saveGame();
}

function move(dx) { if (state.paused || state.over) return false; if (!collides(state.current, dx, 0)) { state.current.x += dx; draw(); saveGame(); return true; } return false; }
function softDrop() { if (state.paused || state.over) return false; if (!collides(state.current, 0, 1)) { state.current.y++; state.score += 1; updateStats(); draw(); saveGame(); return true; } lockPiece(); return false; }
function hardDrop() { if (state.paused || state.over) return; let distance = 0; while (!collides(state.current, 0, distance + 1)) distance++; state.current.y += distance; state.score += distance * 2; lockPiece(); }
function rotate() { if (state.paused || state.over) return; const nextRotation = (state.current.rotation + 1) % 4; for (const kick of [0, -1, 1, -2, 2]) if (!collides(state.current, kick, 0, nextRotation)) { state.current.x += kick; state.current.rotation = nextRotation; draw(); saveGame(); return; } }

function lockPiece() {
  const matrix = pieceMatrix(state.current);
  for (let row = 0; row < matrix.length; row++) for (let col = 0; col < matrix[row].length; col++) if (matrix[row][col] && state.current.y + row >= 0) state.board[state.current.y + row][state.current.x + col] = state.current.type;
  const cleared = clearLines();
  if (cleared) { const points = [0, 100, 300, 500, 800][cleared] || 800; state.score += points * state.level; state.lines += cleared; state.level = 1 + Math.floor(state.lines / 10); updateStats(); }
  spawn();
}

function clearLines() { let cleared = 0; state.board = state.board.filter(row => { if (row.every(Boolean)) { cleared++; return false; } return true; }); while (state.board.length < ROWS) state.board.unshift(Array(COLS).fill(null)); return cleared; }

function drawCell(context, x, y, size, color) { context.fillStyle = color; context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2); context.fillStyle = '#ffffff38'; context.fillRect(x * size + 2, y * size + 2, size - 5, 3); context.strokeStyle = '#17284826'; context.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2); }
function draw() {
  const dark = document.documentElement.dataset.theme === 'dark';
  const size = boardCanvas.width / COLS; ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height); ctx.fillStyle = dark ? '#101827' : '#f1f4fb'; ctx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  ctx.strokeStyle = dark ? '#41517188' : '#b8c3d955'; ctx.lineWidth = 1; for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * size, 0); ctx.lineTo(x * size, boardCanvas.height); ctx.stroke(); } for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * size); ctx.lineTo(boardCanvas.width, y * size); ctx.stroke(); }
  state.board.forEach((row, y) => row.forEach((type, x) => { if (type) drawCell(ctx, x, y, size, COLORS[type]); }));
  if (state.current && !state.over) { const matrix = pieceMatrix(state.current); matrix.forEach((row, y) => row.forEach((filled, x) => { if (filled && state.current.y + y >= 0) drawCell(ctx, state.current.x + x, state.current.y + y, size, COLORS[state.current.type]); })); }
  drawNext();
}
function drawNext() { nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height); const matrix = SHAPES[state.next]; const size = 17; const offsetX = (nextCanvas.width - matrix[0].length * size) / 2; const offsetY = (nextCanvas.height - matrix.length * size) / 2; matrix.forEach((row, y) => row.forEach((filled, x) => { if (filled) { nextCtx.fillStyle = COLORS[state.next]; nextCtx.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, size - 2); } })); }
function updateStats() { $('score').textContent = String(state.score).padStart(6, '0'); $('lines').textContent = String(state.lines); $('level').textContent = String(state.level); }
function showOverlay(title, hint) { $('overlayTitle').textContent = title; $('overlayHint').textContent = hint; $('tetrisOverlay').hidden = false; }
function hideOverlay() { $('tetrisOverlay').hidden = true; }
function togglePause() { if (state.over) return; state.paused = !state.paused; $('pauseButton').textContent = state.paused ? '继续' : '暂停'; state.paused ? showOverlay('已暂停', '点击继续') : hideOverlay(); saveGame(); }
function saveGame() { try { localStorage.setItem(TETRIS_KEY, JSON.stringify({ ...state, savedAt: Date.now() })); $('saveStatus').textContent = '已自动保存'; } catch (_) { $('saveStatus').textContent = '自动保存不可用'; } }
function restoreGame() { try { const saved = JSON.parse(localStorage.getItem(TETRIS_KEY)); if (!saved || !Array.isArray(saved.board) || saved.board.length !== ROWS || !saved.current) return false; state.board = saved.board; state.current = saved.current; state.next = TYPES.includes(saved.next) ? saved.next : randomType(); state.score = Number(saved.score) || 0; state.lines = Number(saved.lines) || 0; state.level = Number(saved.level) || 1; state.paused = true; state.over = Boolean(saved.over); updateStats(); $('saveStatus').textContent = '已恢复上次进度'; state.over ? showOverlay('游戏结束', '点击重新开始') : showOverlay('已恢复进度', '点击继续'); draw(); return true; } catch (_) { return false; } }
function loop(timestamp) { if (!state.paused && !state.over && timestamp - lastFrame > Math.max(100, 800 - (state.level - 1) * 70)) { if (!collides(state.current, 0, 1)) state.current.y++; else lockPiece(); lastFrame = timestamp; draw(); } animationFrame = requestAnimationFrame(loop); }

function performControl(action) {
  if (state.over) return;
  if (state.paused) {
    lastFrame = performance.now();
    togglePause();
  }
  action();
}
document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => performControl(() => ({ left: move, right: move, rotate, down: softDrop, drop: hardDrop }[button.dataset.action])(button.dataset.action === 'left' ? -1 : button.dataset.action === 'right' ? 1 : undefined))));
boardCanvas.addEventListener('pointerdown', event => { swipeStart = { x: event.clientX, y: event.clientY }; boardCanvas.setPointerCapture(event.pointerId); });
boardCanvas.addEventListener('pointerup', event => {
  if (!swipeStart || state.paused || state.over) { swipeStart = null; return; }
  const dx = event.clientX - swipeStart.x, dy = event.clientY - swipeStart.y;
  swipeStart = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    const cellWidth = boardCanvas.getBoundingClientRect().width / COLS;
    const steps = Math.max(1, Math.min(5, Math.round(Math.abs(dx) / cellWidth)));
    for (let i = 0; i < steps; i++) move(dx < 0 ? -1 : 1);
  } else if (dy < 0) rotate();
  else hardDrop();
});
boardCanvas.addEventListener('pointercancel', () => { swipeStart = null; });
document.getElementById('pauseButton').addEventListener('click', togglePause);
document.getElementById('restartButton').addEventListener('click', startNewGame);
document.getElementById('tetrisOverlay').addEventListener('click', () => { if (state.over) startNewGame(); else togglePause(); });
document.addEventListener('keydown', event => { const action = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowUp: rotate, ArrowDown: softDrop, ' ': hardDrop, p: togglePause, P: togglePause }[event.key]; if (action) { event.preventDefault(); if (action === togglePause) action(); else performControl(action); } });
window.addEventListener('pagehide', saveGame);
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!state.over && !state.paused) togglePause(); saveGame(); } });
saveTimer = setInterval(saveGame, 5000);

if (!restoreGame()) startNewGame(); else { cancelAnimationFrame(animationFrame); lastFrame = performance.now(); animationFrame = requestAnimationFrame(loop); }
window.addEventListener('pocket-theme-change', draw);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
