const Board = {
  Cell: {
    generate: function(x, y) {
      return { x, y, hitState: '', shipIdx: null }
    }
  },

  // returns: 2d array of `Board.Cell`s
  generate: function(size = 10) {
    return _.map(new Array(size), (i, x) => {
      return _.map(new Array(size), (j, y) => {
        return Board.Cell.generate(x, y)
      })
    })
  },

  validCoordinate: function(board, coordinate) {
    const boardSize = board[0].length, { x, y } = coordinate;
    return (
      0 <= x && x < boardSize &&   // x coordinate is valid
      0 <= y && y < boardSize &&   // y coordinate is valid
      board[x][y].shipIdx === null // ship doesn't already exist at (x,y)
    )
  },

  addShip: function(board, ship) {
    _.each(ship.coordinates, (coord) => {
      board[coord.x][coord.y].shipIdx = ship.idx
    })
  }
}

const Ship = {
  // opts: { cell, direction, shipSize, shipIdx }
  generate: function(opts) {
    const coordinates = this._generateCoordinates(opts);
    return { idx: opts.shipIdx, coordinates, sunk: false }
  },

  // opts: { cell, direction, shipSize, shipIdx }
  // returns: [{x, y}, ...]
  _generateCoordinates: function(opts) {
    return _.map(new Array(opts.shipSize), (i, idx) => {
      return {
        x: opts.cell.x + opts.direction[0] * idx,
        y: opts.cell.y + opts.direction[1] * idx
      }
    })
  },
}

const GameBoard = {
  // set up ships randomly on a board
  // returns: { board, ships }
  generateRandomPlacement: function(shipSizes = [5,4,3,3,2]) {
    let board = Board.generate(), ships = [];

    _.each( shipSizes, (shipSize, shipIdx) => {
      let availableIdx = 0;
      const directions = this._shuffledDirections(),
        availableCells = this._shuffledAvailableCells(board);

      // "AVAILABLE CELLS LOOP"
      while (ships.length === shipIdx && availableIdx < availableCells.length) {
        let directionIdx = 0;
        const cell = availableCells[availableIdx];

        // "DIRECTIONS LOOP"
        while (ships.length === shipIdx && directionIdx < directions.length) {
          const direction = directions[directionIdx],
            ship = Ship.generate({ cell, direction, shipSize, shipIdx }),

            // check if all the ship's coordinates are valid for the board
            validShip = _.reduce( ship.coordinates,
              (isValid, coord) => { return isValid && Board.validCoordinate(board, coord) },
              true
            );

          if (validShip) {
            ships.push(ship);
            Board.addShip(board, ship);
          } else directionIdx++
        }

        availableIdx++
      }
    });

    return { board, ships }
  },

  _shuffledDirections: function() {
    return _.chain([
      [0 , 1], // up
      [0 ,-1], // down
      [1 , 0], // right
      [-1, 0]  // left
    ]).shuffle().value()
  },

  // TODO: convert to generator, or use a heuristic to improve performance
  _shuffledAvailableCells: function(board) {
    return _.chain(
      _.flatten(board).filter((cell) => { return cell.shipIdx === null })
    ).shuffle().value()
  },
}

const Game = {
  Player: {
    generate: function(idx) {
      return { idx, ...GameBoard.generateRandomPlacement() }
    }
  },

  generate: function() {
    return {
      turn: 0,
      currentPlayerIdx: 0,
      winnerIdx: null,
      players: [Game.Player.generate(0), Game.Player.generate(1)]
    }
  },
}

/*
// REDUX

const Store = {store: null};
Store.Reducers = {
  reset: function(state = {}, action) {
    if (action.type === 'RESET') return Game.generate();
    else return state;
  },

  action: function(state = {}, action) {
    return state;
  }
}

const reducers = Redux.combineReducers(Store.Reducers);
Store.store = Redux.createStore(reducers, {});
//store.subscribe(() => console.log('SUBSCRIBED.RESET:', store.getState().reset))
//store.dispatch({type: 'RESET'});

// USE WHEN INTEGRATING REDUX PROPERLY
ReactDOM.render(
  <ReactRedux.Provider store={Store.store}>
    <BattleJS.Game />
  </ReactRedux.Provider>,
  document.getElementById('main')
);
*/

// REACT

const BattleJS = {};
BattleJS.Game = React.createClass({
  getInitialState: function() { return {} },

  componentDidMount: function() {
    // generate default game state
    const gameState = Game.generate();
    return this.setState({gameState})
  },

  render: function() {
    if (this.state.gameState === undefined)
      return <h1>Loading...</h1>;
    else {
      return (
        <div>
          <h1>LOADED!</h1>
          {this.renderPlayers()}
        </div>
      )
    }
  },

  renderPlayers: function() {
    const players = _.map(this.state.gameState.players, (player) => {
      return (
        <BattleJS.Player
          key={'p_'+player.idx}
          player={player}
        />
      )
    });

    return <div>{players}</div>;
  }

});

BattleJS.Player = React.createClass({
  render: function() {
    return (
      <div style={{float: 'left', marginLeft: 20}}>
        <h2>{'Player ' + this.props.player.idx}</h2>
        <BattleJS.Board board={this.props.player.board} />
      </div>
    )
  }
});

BattleJS.Board = React.createClass({
  render: function() {
    return (
      <div>
        <h3>Board</h3>
        {this.renderBoard()}
      </div>
    )
  },

  renderBoard: function() {
    const rows = _.map(this.props.board, (row) => { return this.renderRow(row) });
    return (
      <table>
        <tbody>{rows}</tbody>
      </table>
    )
  },

  renderRow: function(row) {
    const cells = _.map(row, (cell) => { return <BattleJS.Cell cell={cell} /> });
    return <tr>{cells}</tr>
  }
});

BattleJS.Cell = React.createClass({
  render: function() {
    let cellContents = '-',
      styles = { width: 25, height: 25, textAlign: 'center', verticalAlign: 'middle' };
    if (this.props.cell.shipIdx !== null) {
      cellContents = this.props.cell.shipIdx;
      styles = _.extend(styles, { backgroundColor: 'gray' });
    }


    return (
      <td style={styles}>{cellContents}</td>
    )
  }
});



ReactDOM.render(
  <BattleJS.Game />,
  document.getElementById('main')
);
