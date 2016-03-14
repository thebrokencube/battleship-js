const Board = {
  Cell: {
    generate: function(x, y) {
      return { x, y, hit: false, shipIdx: null }
    },
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

  isSunk: function(state, pidx, shipIdx) {
    const player = state.players[pidx], ship = player.ships[shipIdx];

    ship.sunk = _.reduce(ship.coordinates,
      (allHit, coordinate) => {
        const cell = player.board[coordinate.x][coordinate.y];
        return allHit && cell.hit;
      },
      true
    );
    state.players[pidx].ships[shipIdx] = ship;
    console.log('IS SUNK', state.players[pidx].ships[shipIdx].sunk, ship);

    // check if game over
    const allSunk = _.reduce(state.players[pidx].ships,
      (shipsSunk, ship) => { return shipsSunk && ship.sunk },
      true
    );
    if (allSunk) state.winnerIdx = pidx ? 0 : 1;

    return state;
  }
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

  // perform an attack if possible
  attack: function(state, action) {
    if (state.winnerIdx !== null) return state;

    const { type, pidx, x, y } = action;
    let cell = _.clone(state.players[pidx].board[x][y]);

    // if attacking the correct player and the cell hasn't been hit yet
    if (pidx !== state.currentPlayerIdx && !cell.hit) {
      cell.hit = true;
      state.players[pidx].board[x][y] = cell;
      state.turn++;
      state.currentPlayerIdx = state.currentPlayerIdx ? 0 : 1;

      // update ship
      if (cell.shipIdx !== null) {
        state = Ship.isSunk(state, pidx, cell.shipIdx)
      }
    }

    return state;
  }
}

// REDUX

const Store = {
  store: null,
  reducer: function(state = {}, action) {
    switch (action.type) {
      case 'RESET':
        return Game.generate();
      case 'ATTACK':
        return Game.attack(state, action);
      default:
        return state;
    }
  }
};


// REACT

const BattleJS = {};
BattleJS.Game = React.createClass({
  getInitialState: function() { return {} },

  componentDidMount: function() {
    this._setupStore();
    return Store.store.dispatch({type: 'RESET'});
  },

  _setupStore: function() {
    Store.store = Redux.createStore(Store.reducer, {});
    Store.store.subscribe(() => {
      const gameState = Store.store.getState();
      this.setState({gameState});
    });
  },

  render: function() {
    if (this.state.gameState === undefined)
      return <h1>Loading...</h1>;
    else {
      return (
        <div>
          {this.renderGameOverState()}
          {this.renderPlayers()}
        </div>
      )
    }
  },

  renderGameOverState: function() {
    if (this.state.gameState.winnerIdx !== null) {
      const text = 'Player ' + this.state.gameState.winnerIdx + ' wins! Again?';
      return (
        <div>
          <h1>{text}</h1>
          <div
            className='btn btn-default'
            onClick={() => { Store.store.dispatch({type: 'RESET'}) }}
          >
            RESET
          </div>
        </div>
      )
    } else return;
  },

  renderPlayers: function() {
    const players = _.map(this.state.gameState.players, (player) => {
      return (
        <BattleJS.Player key={'p_' + player.idx}
          pidx={player.idx}
          {...this.state}
        />
      )
    });

    return <div>{players}</div>;
  }

});

BattleJS.Player = React.createClass({
  render: function() {
    let playerStyles = {textDecoration: 'underline'};
    if (this.props.pidx === this.props.gameState.currentPlayerIdx)
      _.extend(playerStyles, {color: 'red'});

    return (
      <div style={{float: 'left', marginLeft: 20}}>
        <h2 style={playerStyles}>{'Player ' + this.props.pidx}</h2>
        <BattleJS.Board {...this.props} />
      </div>
    )
  }
});

BattleJS.Board = React.createClass({
  render: function() {
    return (
      <div>
        <h3>Board</h3>
        {this.renderOpponentBoard()}
      </div>
    )
  },

  renderOpponentBoard: function() {
    const oidx = this.props.pidx ? 0 : 1,
      state = this.props.gameState,
      board = state.players[oidx].board,
      rows = _.map(board, (row, ridx) => {
        return this.renderRow(row, ridx, oidx, state)
      });

    return (
      <table className='table table-bordered'>
        <tbody>
          {this.renderLabelRow()}
          {rows}
        </tbody>
      </table>
    )
  },

  renderRow: function(row, ridx, pidx, gameState) {
    const styles = { width: 50, height: 50, textAlign: 'center', verticalAlign: 'middle' },
      cells = _.map(row, (cell) => {
        const key = _.join(['cell', pidx, cell.x, cell.y], '_');
        return <BattleJS.Cell {...{key, pidx, cell, gameState}} />
      });

    return (
      <tr>
        <td className='board-label' style={styles}>
          <strong>{ridx}</strong>
        </td>
        {cells}
      </tr>
    )
  },

  renderLabelRow: function() {
    const styles = { width: 50, height: 50, textAlign: 'center', verticalAlign: 'middle' };
    let cells = [<td></td>];
    for (let i = 0; i < 10; i++)
      cells.push(
        <td className='board-label' style={styles}>
          <strong>{i}</strong>
        </td>
      );
    return <tr>{cells}</tr>
  }
});

BattleJS.Cell = React.createClass({
  render: function() {
    let { cell, gameState, pidx } = this.props,
      cellContents = '',
      styles = { width: 50, height: 50, textAlign: 'center', verticalAlign: 'middle' };

    if (cell.hit && cell.shipIdx === null) {
      // attacked but missed
      cellContents = '-';
      _.extend(styles, { backgroundColor: 'gray' });
    } else if (cell.hit) {
      // attacked and hit
      const ship = gameState.players[pidx].ships[cell.shipIdx];
      if (ship.sunk) {
        cellContents = cell.shipIdx;
        _.extend(styles, { color: 'white', backgroundColor: 'green' });
      } else _.extend(styles, { backgroundColor: 'red' });
    }

    // override to show where ships are for debugging
    //if (cell.shipIdx !== null) cellContents = cell.shipIdx;

    return <td style={styles} onClick={this.clickHandler}>{cellContents}</td>
  },

  clickHandler: function() {
    if (!this.props.cell.hit) {
      Store.store.dispatch({
        type: 'ATTACK',
        pidx: this.props.pidx,
        x: this.props.cell.x,
        y: this.props.cell.y
      });
    }
    return;
  }
});



ReactDOM.render(
  <BattleJS.Game />,
  document.getElementById('main')
);
