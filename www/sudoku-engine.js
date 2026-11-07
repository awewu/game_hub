// A small, dependency-free generator used by both the web and Capacitor builds.
window.SudokuEngine = (() => {
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const pattern = (row, col) => (row * 3 + Math.floor(row / 3) + col) % 9;
  const removeByDifficulty = { easy: 38, medium: 47, hard: 55 };

  function countSolutions(grid, stopAt = 2) {
    const FULL = 1022;
    const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
    for (let index = 0; index < 81; index++) {
      const digit = grid[index];
      if (!digit) continue;
      const row = Math.floor(index / 9), col = index % 9, box = Math.floor(row / 3) * 3 + Math.floor(col / 3), bit = 1 << digit;
      rows[row] |= bit; cols[col] |= bit; boxes[box] |= bit;
    }
    function search() {
      let best = -1, options = 0, fewest = 10;
      for (let index = 0; index < 81; index++) {
        if (grid[index]) continue;
        const row = Math.floor(index / 9), col = index % 9, box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
        const available = FULL & ~(rows[row] | cols[col] | boxes[box]);
        let count = 0;
        for (let bits = available; bits; bits &= bits - 1) count++;
        if (!count) return 0;
        if (count < fewest) { best = index; options = available; fewest = count; if (count === 1) break; }
      }
      if (best < 0) return 1;
      const row = Math.floor(best / 9), col = best % 9, box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      let total = 0;
      for (let bits = options; bits; bits &= bits - 1) {
        const bit = bits & -bits;
        let digit = 1;
        while ((1 << digit) !== bit) digit++;
        grid[best] = digit; rows[row] |= bit; cols[col] |= bit; boxes[box] |= bit;
        total += search();
        grid[best] = 0; rows[row] ^= bit; cols[col] ^= bit; boxes[box] ^= bit;
        if (total >= stopAt) return total;
      }
      return total;
    }
    return search();
  }

  function generate(difficulty = 'easy') {
    const digits = shuffle([1,2,3,4,5,6,7,8,9]);
    const rows = shuffle([0,1,2]).flatMap(band => shuffle([0,1,2]).map(row => band * 3 + row));
    const cols = shuffle([0,1,2]).flatMap(stack => shuffle([0,1,2]).map(col => stack * 3 + col));
    const solution = rows.flatMap(row => cols.map(col => digits[pattern(row, col)]));
    const puzzle = [...solution];
    let remaining = removeByDifficulty[difficulty] ?? removeByDifficulty.easy;
    for (const index of shuffle([...Array(81).keys()])) {
      if (!remaining) break;
      puzzle[index] = 0;
      if (countSolutions(puzzle, 2) === 1) remaining--;
      else puzzle[index] = solution[index];
    }
    return { solution, puzzle };
  }
  return { generate, countSolutions };
})();
