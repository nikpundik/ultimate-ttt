import { cloneBoards, getBoardsMoves, playBoards } from "./utils.js";

// adapted from https://github.com/SethPipho/monte-carlo-tree-search-js

class MCTSNode {
  constructor(moves, parent) {
    this.parent = parent;
    this.visits = 0;
    this.wins = 0;
    this.numUnexpandedMoves = moves.length;
    this.children = new Array(this.numUnexpandedMoves).fill(null);
  }
}

class MCTS {
  constructor(boards, player, iterations = 500, exploration = 1.41) {
    this.boards = boards;
    this.player = player;
    this.iterations = iterations;
    this.exploration = exploration;
  }

  selectMove() {
    const originalState = this.boards;
    const possibleMoves = getBoardsMoves(originalState);
    const root = new MCTSNode(possibleMoves, null);

    for (let i = 0; i < this.iterations; i++) {
      this.boards = cloneBoards(originalState);

      let selectedNode = this.selectNode(root);
      if (this.boards.completed) {
        if (this.boards.winner != this.player && this.boards.winner != null) {
          selectedNode.parent.wins = Number.MIN_SAFE_INTEGER;
        }
      }
      let expandedNode = this.expandNode(selectedNode);
      this.playout(expandedNode);

      let reward;
      if (this.boards.winner === null) {
        reward = 0;
      } else if (this.boards.winner == this.player) {
        reward = 1;
      } else {
        reward = -1;
      }
      this.backprop(expandedNode, reward);
    }

    let maxWins = -Infinity;
    let maxIndex = -1;
    for (let i in root.children) {
      const child = root.children[i];
      if (child == null) {
        continue;
      }
      if (child.wins > maxWins) {
        maxWins = child.wins;
        maxIndex = i;
      }
    }

    this.boards = originalState;
    return possibleMoves[maxIndex];
  }

  selectNode(root) {
    const c = this.exploration;

    while (root.numUnexpandedMoves == 0) {
      let maxUBC = -Infinity;
      let maxIndex = -1;
      let Ni = root.visits;
      for (let i in root.children) {
        const child = root.children[i];
        const ni = child.visits;
        const wi = child.wins;
        const ubc = this.computeUCB(wi, ni, c, Ni);
        if (ubc > maxUBC) {
          maxUBC = ubc;
          maxIndex = i;
        }
      }
      const moves = getBoardsMoves(this.boards);
      const [board, cell] = moves[maxIndex];
      playBoards(this.boards, board, cell);

      root = root.children[maxIndex];
      if (this.boards.completed) {
        return root;
      }
    }
    return root;
  }

  expandNode(node) {
    if (this.boards.completed) {
      return node;
    }
    let moves = getBoardsMoves(this.boards);
    const childIndex = this.selectRandomUnexpandedChild(node);
    const [board, cell] = moves[childIndex];
    playBoards(this.boards, board, cell);

    moves = getBoardsMoves(this.boards);
    const newNode = new MCTSNode(moves, node);
    node.children[childIndex] = newNode;
    node.numUnexpandedMoves -= 1;

    return newNode;
  }

  playout(node) {
    while (!this.boards.completed) {
      const moves = getBoardsMoves(this.boards);
      const randomChoice = Math.floor(Math.random() * moves.length);
      const [board, cell] = moves[randomChoice];
      playBoards(this.boards, board, cell);
    }
    return this.boards.winner;
  }
  backprop(node, reward) {
    while (node != null) {
      node.visits += 1;
      node.wins += reward;
      node = node.parent;
    }
  }

  selectRandomUnexpandedChild(node) {
    const choice = Math.floor(Math.random() * node.numUnexpandedMoves);
    let count = -1;
    for (let i in node.children) {
      const child = node.children[i];
      if (child == null) {
        count += 1;
      }
      if (count == choice) {
        return i;
      }
    }
  }

  computeUCB(wi, ni, c, Ni) {
    return wi / ni + c * Math.sqrt(Math.log(Ni) / ni);
  }
}

export { MCTS };
