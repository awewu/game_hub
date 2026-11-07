// Add a game here and provide its local page to extend the library.
const games = [
  { id: 'sudoku', name: '数独', englishName: 'Sudoku', href: 'sudoku.html?new=1&difficulty=easy', description: '用数字理清思绪，享受每一格的成就感。', tags: ['逻辑益智', '3 种难度', '可离线'], art: 'sudoku-art', badge: '现在就玩' },
  { id: 'tetris', name: '俄罗斯方块', englishName: 'Tetris', href: 'tetris.html', description: '方块落下，排满一行就消除，简单但停不下来。', tags: ['经典街机', '即时操作', '新加入'], art: 'tetris-art', badge: '新加入' }
];

const list = document.getElementById('gameList');
const cardTemplate = list.querySelector('.library-game').cloneNode(true);
list.replaceChildren();
games.forEach(game => {
  const card = cardTemplate.cloneNode(true);
  card.href = game.href;
  card.dataset.game = game.id;
  const art = card.querySelector('.game-art');
  art.className = `game-art ${game.art}`;
  card.querySelector('.game-badge').textContent = game.badge;
  if (game.id === 'tetris') {
    art.innerHTML = '<div class="tetris-preview"><i class="tetromino t-blue"></i><i class="tetromino t-yellow"></i><i class="tetromino t-pink"></i><i class="tetromino t-green"></i><i class="tetromino t-orange"></i><i class="tetromino t-purple"></i></div><span class="art-spark">✦</span><span class="game-badge"></span>';
    art.querySelector('.game-badge').textContent = game.badge;
  }
  const heading = card.querySelector('h3');
  const englishName = document.createElement('span');
  englishName.textContent = game.englishName;
  heading.replaceChildren(document.createTextNode(game.name + ' '), englishName);
  card.querySelector('.library-game-content p').textContent = game.description;
  card.querySelector('.game-tags').replaceChildren(...game.tags.map(tag => {
    const label = document.createElement('span');
    label.textContent = tag;
    return label;
  }));
  list.append(card);
});
document.getElementById('gameCount').textContent = `${games.length} 款可玩`;

const difficultyModal = document.getElementById('difficultyModal');
const sudokuCard = document.querySelector('[data-game="sudoku"]');
const closeDifficulty = () => { difficultyModal.hidden = true; document.body.classList.remove('modal-open'); };
const openDifficulty = event => { event.preventDefault(); difficultyModal.hidden = false; document.body.classList.add('modal-open'); difficultyModal.querySelector('[data-difficulty="easy"]').focus(); };
sudokuCard.addEventListener('click', openDifficulty);
document.getElementById('closeDifficulty').addEventListener('click', closeDifficulty);
difficultyModal.querySelector('[data-close-difficulty]').addEventListener('click', closeDifficulty);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !difficultyModal.hidden) closeDifficulty(); });

function updateResume() {
  const panel = document.getElementById('resumePanel');
  panel.hidden = true;
  try {
    const saved = JSON.parse(localStorage.getItem('sudoku-game-v1'));
    const labels = { easy: '简单', medium: '中等', hard: '困难' };
    if (!saved || !labels[saved.difficulty] || !Array.isArray(saved.values) || saved.values.length !== 81 || !Array.isArray(saved.solution) || saved.solution.length !== 81 || !Array.isArray(saved.puzzle) || saved.puzzle.length !== 81) return;
    const complete = saved.values.every((value, index) => value === saved.solution[index]);
    const played = saved.values.some((value, index) => value && !saved.puzzle[index]) || Number(saved.seconds) > 0;
    if (complete || !played) return;
    const filled = saved.values.filter(Boolean).length;
    const seconds = Math.max(0, Math.floor(Number(saved.seconds) || 0));
    const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    document.getElementById('resumeDescription').textContent = `${labels[saved.difficulty]}难度 · 已填 ${filled}/81 格 · ${time}`;
    panel.hidden = false;
  } catch (_) { /* The library remains usable when local storage is unavailable. */ }
}
updateResume();
window.addEventListener('pageshow', updateResume);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
