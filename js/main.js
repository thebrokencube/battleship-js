/// BOARD

const Board = {
  // returns a [size][size] array, filled with return value of cellFunc
  generate: (size = 10, cellFunc) => {
    return _.map(
      (new Array(size)),
      () => { return (new Array(size)).fill(cellFunc()) }
    )
  }
}

/// CELL

const Cell = {
  blankPlayerCell: () => {
    return {
      shipIdx: null,
      hitState: ''
    };
  },

  blankOpponentCell: () => {
    return { hitState: '' };
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



const x = newGame();
console.log(x);








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
