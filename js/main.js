/// BOARD

const Board = {
  // returns a [size][size] array, filled with return value of cellFunc
  generate: (size = 10, cellFunc) => {
    return _.map(
      (new Array(size)),
      (i, xidx) => {
        return _.map(
          (new Array(size)),
          (j, yidx) => { return cellFunc(xidx, yidx) }
        )
      }
    )
  },

  setupRandomBoard: (board) => {
    const shipSizes = [5,4,3,3,2];
    const directions = [
      [0 , 1], // up
      [0 ,-1], // down
      [1 , 0], // right
      [-1, 0]  // left
    ];
    let ships = [];

    _.each(shipSizes, (size, shipIdx) => {
      let found = false, availableIdx = 0;
      let availableCells = _.chain(
        _.flatten(board).filter((cell) => { return cell.shipIdx === null })
      ).shuffle().value();

      while (!found && availableIdx < availableCells.length) {
        let dirIdx = 0, cell = availableCells[availableIdx], coords = null;

        while (coords === null && dirIdx < directions.length) {
          let dir = directions[dirIdx], boardSize = board[0].length;
          // calculate coordinates and validity of ship in this direction
          const possibleCoords = _.map(
            (new Array(size)),
            (i, iIdx) => {
              return {
                x: cell.x + dir[0] * iIdx,
                y: cell.y + dir[1] * iIdx
              }
            }
          );
          const validShip = _.reduce(
            possibleCoords,
            (valid, coord) => {
              return valid &&
                (coord.x < boardSize && coord.x >= 0) &&
                (coord.y < boardSize && coord.y >= 0) &&
                (board[coord.x][coord.y].shipIdx === null);
            },
            true
          );

          if (validShip) {
            coords = possibleCoords;

            // mark cells on board with ship id
            _.each(coords, (coord) => {
              let cell = board[coord.x][coord.y];
              cell.shipIdx = shipIdx;
              board[coord.x][coord.y] = cell;
            });
          } else dirIdx++;
        }

        if (coords !== null) {
          ships.push(Ship.generate(coords))
          found = true;
          console.log('>>>FOUND SHIP', coords, ships, '\n\n');
        } else { console.log('>>>NOT FOUND\n\n'); availableIdx++; }
      }
    });

    return { board: board, ships: ships }
  }
}

/// CELL

const Cell = {
  blankPlayerCell: (x, y) => {
    return {
      x: x,
      y: y,
      shipIdx: null,
      hitState: ''
    }
  },

  blankOpponentCell: (x, y) => {
    return {
      x: x,
      y: y,
      hitState: ''
    }
  }
}

/// SHIP

const Ship = {
  generate: (coords) => {
    return {
      coordinates: coords,
      hitState: ''
    }
  }
}

/// PLAYER

const Player = {
  generateBlank: () => {
    return {
      board: Board.generate(10, Cell.blankPlayerCell),
      ships: [],
      opponent: {
        board: Board.generate(10, Cell.blankOpponentCell),
        shipsLeft: 0
      }
    }
  }
}

/// GAME

const newGame = () => {
  return {
    turn: 0,
    currentPlayerIdx: 0,
    winnerIdx: null,
    players: [Player.generateBlank(), Player.generateBlank()]
  }
}



//debugger;
const x = newGame();
console.log(x);

console.log(Board.setupRandomBoard(x.players[0].board));








/*
// REDUX

const Store = {
  Reducers: {}
};

Store.Reducers.counter = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
};

let store = Redux.createStore(Store.Reducers.counter);

store.subscribe(() => console.log(store.getState()))

console.log(store.getState());
store.dispatch({type: 'INCREMENT'});
store.dispatch({type: 'INCREMENT'});
store.dispatch({type: 'DECREMENT'});

// REACT

const BattleJS = {};
BattleJS.App = React.createClass({
  render: () => {
    return (
      <h1>OHAI</h1>
    );
  }
});

ReactDOM.render(
  <BattleJS.App />,
  document.getElementById('main')
);
*/
