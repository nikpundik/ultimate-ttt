import chalk from "chalk";

const getPlayerColor = (player) => {
  switch (player) {
    case 1:
      return chalk.greenBright;
    case 2:
      return chalk.blueBright;
    default:
      return chalk.white;
  }
};

const getRowString = (board, index) => {
  let log = ``;
  const colorize = getPlayerColor(board.winner);
  for (let i = index * 3; i < index * 3 + 3; i++) {
    log += board.board[i] ? colorize(board.board[i]) : chalk.blackBright("-");
  }
  return log;
};

const logBoards = (boards) => {
  const del = chalk.magentaBright("•");
  const rowSeparator = " " + del.repeat(13) + "\n";
  let log = rowSeparator;
  for (let row = 0; row < 9; row += 3) {
    for (let boardRow = 0; boardRow < 3; boardRow++) {
      log += " ";
      for (let boardIndex = 0; boardIndex < 3; boardIndex++) {
        const board = boards.boards[row + boardIndex];
        log += del + getRowString(board, boardRow);
      }
      log += del + "\n";
    }
    log += rowSeparator;
  }
  console.log(log);
};

const wins = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const getWinner = (board) => {
  for (let i = 0; i < wins.length; i++) {
    const [a, b, c] = wins[i];
    if (
      board[a] &&
      board[b] &&
      board[c] &&
      board[a] === board[b] &&
      board[b] === board[c]
    ) {
      return board[a];
    }
  }
  return null;
};

const getRandomMove = (boards) => {
  const moves = getBoardsMoves(boards);
  return moves[Math.floor(Math.random() * moves.length)];
};

const getBoardsMoves = (boards) => {
  if (boards.completed) {
    return [];
  }
  const moves = [];
  const start = boards.lock === null ? 0 : boards.lock;
  const end = boards.lock === null ? 9 : boards.lock + 1;
  for (let boardIndex = start; boardIndex < end; boardIndex++) {
    if (!boards.boards[boardIndex].completed) {
      for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
        if (!boards.boards[boardIndex].board[cellIndex]) {
          moves.push([boardIndex, cellIndex]);
        }
      }
    }
  }
  return moves;
};

const cloneBoard = (board) => ({
  ...board,
  board: { ...board.board },
});

const cloneBoards = (boards) => ({
  ...boards,
  board: { ...boards.board },
  boards: boards.boards.map(cloneBoard),
});

const playBoard = (board, player, cell) => {
  if (board.completed || board.board[cell]) {
    throw new Error("Invalid move at " + cell);
  }
  board.moves += 1;
  board.board[cell] = player;
  board.winner = getWinner(board.board);
  board.completed = board.moves === 9 || !!board.winner;
};

const playBoards = (boards, boardIndex, cell) => {
  const board = boards.boards[boardIndex];
  if (boards.winner || (boards.lock && boardIndex !== boards.lock)) {
    throw new Error("Invalid move at board " + boardIndex);
  }
  playBoard(board, boards.player, cell);
  boards.moves += 1;
  if (board.winner === boards.player) {
    boards.board[boardIndex] = boards.player;
  }
  if (board.completed) {
    boards.boardsCompleted += 1;
  }
  boards.lock = boards.boards[cell].completed ? null : cell;
  boards.winner = getWinner(boards.board);
  boards.completed =
    boards.moves === 81 || boards.winner || boards.boardsCompleted === 9;
  boards.player = boards.player === 1 ? 2 : 1;
};

export {
  getWinner,
  logBoards,
  getPlayerColor,
  getRandomMove,
  playBoard,
  playBoards,
  cloneBoards,
  getBoardsMoves,
};
