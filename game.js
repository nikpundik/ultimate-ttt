import select from "@inquirer/select";
import {
  logBoards,
  getBoardsMoves,
  playBoards,
  getRandomMove,
} from "./utils.js";
import { MCTS } from "./monte.js";

const createBoard = () => ({
  completed: false,
  winner: null,
  board: {},
  moves: 0,
});

const createBoards = () => ({
  player: 1,
  lock: null,
  completed: false,
  winner: null,
  board: {},
  boards: [
    createBoard(),
    createBoard(),
    createBoard(),
    createBoard(),
    createBoard(),
    createBoard(),
    createBoard(),
    createBoard(),
    createBoard(),
  ],
  moves: 0,
  boardsCompleted: 0,
});

const boardPrompt = `Select board:
[ 1 2 3 ]
[ 4 5 6 ]
[ 7 8 9 ]
`;

const cellPrompt = (board) => `Select cell on board ${board}:
[ 1 2 3 ]
[ 4 5 6 ]
[ 7 8 9 ]
`;

class Game {
  async start() {
    this.boards = createBoards();
    await this.loopVsBot();
    this.end();
    return this.boards.winner;
  }

  test() {
    this.boards = createBoards();
    this.loopRandomVsBot();
    this.end();
    return this.boards.winner;
  }

  runTests(iterations = 1000) {
    const wins = {};
    for (let i = 0; i < iterations; i += 1) {
      this.boards = createBoards();
      this.loopRandomVsBot();
      if (!wins[this.boards.winner]) wins[this.boards.winner] = 0;
      wins[this.boards.winner] += 1;
      console.clear();
      console.log(wins);
    }
  }

  end() {
    console.clear();
    logBoards(this.boards);
    console.log("Winner", this.boards.winner);
  }

  ai() {
    const player = this.boards.player;
    const tree = new MCTS(this.boards, player, 2000);
    const move = tree.selectMove();
    return move;
  }

  async promptMoves() {
    const moves = getBoardsMoves(this.boards);
    const boards = [];
    moves.forEach(([board]) => {
      if (boards.indexOf(board) === -1) boards.push(board);
    });
    let board;
    if (boards.length === 1) {
      board = boards[0];
    } else {
      const random = boards[Math.floor(Math.random() * boards.length)];
      board = await select({
        message: boardPrompt,
        choices: [
          {
            name: "Random",
            value: random,
          },
          ...boards.map((board) => ({
            name: board + 1,
            value: board,
          })),
        ],
      });
    }
    const cells = moves.filter(([c]) => c === board);
    const cellsChoices = cells.map(([, cell]) => ({
      name: cell + 1,
      value: cell,
    }));
    if (cellsChoices.length > 1) {
      const random = cells[Math.floor(Math.random() * cells.length)][1];
      cellsChoices.unshift({
        name: "Random",
        value: random,
      });
    }
    const cell = await select({
      message: cellPrompt(board),
      choices: cellsChoices,
    });
    return [board, cell];
  }

  async loopVsBot() {
    let error = null;
    while (!this.boards.completed) {
      try {
        console.clear();
        logBoards(this.boards);
        if (error) console.log(error);
        error = null;
        if (this.boards.player === 1) {
          const [board, cell] = await this.promptMoves();
          playBoards(this.boards, Number(board), Number(cell));
        } else {
          const [board2, cell2] = this.ai();
          playBoards(this.boards, Number(board2), Number(cell2));
        }
      } catch (e) {
        error = e.message;
      }
    }
  }

  async loopRandomVsBot() {
    while (!this.boards.completed) {
      if (this.boards.player === 1) {
        const [board, cell] = getRandomMove(this.boards);
        playBoards(this.boards, Number(board), Number(cell));
      } else {
        const [board2, cell2] = this.ai();
        playBoards(this.boards, Number(board2), Number(cell2));
      }
    }
  }
}

const game = new Game();
game.start();
// game.runTests();
