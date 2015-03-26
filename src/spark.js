var Tile = React.createClass({
  statics: {
    parsePosition: function(string) {
      var position = string.split(',');

      var x = parseInt(position[0]);
      var y = parseInt(position[1]);

      return [x, y];
    },

    neighbourCoordinates: function (string) {
      position = Tile.parsePosition(string);

      r = position[0];
      q = position[1];

      return [
        [r - 1, q],
        [r - 1, q + 1],
        [r, q + 1],
        [r + 1, q],
        [r + 1, q - 1],
        [r, q - 1],
      ];
    },

    hexToPixels: function(position) {
      position = Tile.parsePosition(position);

      r = position[0];
      q = position[1];

      x = 70 * 3 / 2 * q;
      y = 70 * Math.sqrt(3) * (r + q / 2);

      return [x, y];
    }
  },

  getInitialState: function() {
    return {
      selectedCard: null
    }
  },

  getCard: function() {
    if (this.props.card === null) {
      if (this.state.selectedCard === null) {
        return <div className="card card--empty" onMouseEnter={this.handleMouseEnter} />
      } else {
        return(
          <div className="card-previewer" onMouseLeave={this.handleMouseLeave}>
            <Card {...this.state.selectedCard} />
          </div>
        );
      }
    } else {
      return <Card {...this.props.card} />
    }
  },

  handleClick: function(event) {
    if (this.props.onClick !== undefined)
      this.props.onClick(this.props.position, this.props.card)

    this.setState({selectedCard: null})
  },

  handleMouseEnter: function(event) {
    this.setState({selectedCard: this.props.selectedCard})
  },

  handleMouseLeave: function(event) {
    this.setState({selectedCard: null})
  },

  render: function() {
    var coord = Tile.hexToPixels(this.props.position)
    var style = {left: coord[0] + 'px', top: coord[1] + "px"}
    var klass = "map__tile position--" + this.props.position;

    return(
      <div className={klass} style={style} onClick={this.handleClick}>
        {this.getCard()}
      </div>
    );
  }
});

var Card = React.createClass({
  render: function() {
    var klass = "card card--" + this.props.type;

    return(
      <div className={klass} onClick={this.props.onClick}>
        {this.props.damages.map(function(damage, index) {
          if (damage) {
            var className = "card__side--" + (index + 1);

            return(
              <div className={className} key={index}>
                <div className="card__side__damage">{damage}</div>
              </div>
            );
          }
        })}

        {this.props.walls.map(function(wall, index) {
          if (wall) {
            var className = "card__side--" + (index + 1);

            return(
              <div className={className} key={index}>
                <div className="card__side__wall"></div>
              </div>
            );
          }
        })}
      </div>
    );
  }
});

var Hand = React.createClass({
  handleClick: function(card) {
    if (this.props.onClick !== undefined)
      this.props.onClick(card);
  },

  render: function() {
    return(
      <div className="hand">
        {this.props.cards.map(function(card, index) {
          return <Card key={index} {...card} onClick={this.handleClick.bind(this, card)} />
        }, this)}
      </div>
    );
  }
});

var Map = React.createClass({
  render: function() {
    return(
      <div className="map">
        {Object.keys(this.props.tiles).map(function(position, index) {
          return <Tile key={index}
            position={position}
            card={this.props.tiles[position]}
            selectedCard={this.props.card}
            onClick={this.props.onClick} />
        }, this)}
      </div>
    );
  }
});

var Spark = React.createClass({
  getDefaultProps: function() {
    return {
      map: {
        "0,0": {type: 'planet', health: 1, damages: [0,0,0,0,0,0], walls: [0,0,1,0,0,1]},
        "1,0": {type: 'planet', health: 1, damages: [0,0,0,0,0,0], walls: [0,0,1,1,0,0]},
        "0,1": {type: 'planet', health: 1, damages: [0,0,0,0,0,0], walls: [1,0,0,0,1,0]},
      },

      deck: [
        {type: 'spaceship', health: 1, damages: [1,0,1,0,1,0], walls: [0,0,0,0,0,0]},
        {type: 'spaceship', health: 1, damages: [0,2,0,0,1,0], walls: [0,0,0,0,0,0]},
        {type: 'spaceship', health: 1, damages: [0,0,0,0,0,0], walls: [0,0,0,0,0,0]},
      ]
    }
  },

  getInitialState: function() {
    return {
      tiles: this.props.map,
      card: null
    }
  },

  componentDidMount: function() {
    this.tick();
  },

  fillAvailableTiles: function() {
    Object.keys(this.getOccupiedTiles()).forEach(function(position) {
      Tile.neighbourCoordinates(position).forEach(function(neighbourPosition) {
        if (this.state.tiles[neighbourPosition] === undefined) {
          this.addTile(neighbourPosition, null);
        }
      }, this);
    }, this);
  },

  addTile: function(position, card) {
    this.state.tiles[position] = card;
  },

  removeTile: function(position) {
    delete this.state.tiles[position];
  },

  getOccupiedTiles: function() {
    var tiles = {}

    Object.keys(this.state.tiles).forEach(function(position, index) {
      if (card = this.state.tiles[position]) {
        tiles[position] = card;
      }
    }, this)

    return tiles;
  },

  getCompoundedDamage: function(position, card) {
    var compoundedDamage = 0;

    Tile.neighbourCoordinates(position).forEach(function(neighbourPosition, index) {
      if (!card.walls[index]) {
        if (neighbourCard = this.state.tiles[neighbourPosition]) {
          compoundedDamage += neighbourCard.damages[(index + 3) % 6];
        }
      }
    }, this)

    return compoundedDamage;
  },

  removeDestroyedTiles: function() {
    Object.keys(this.getOccupiedTiles()).forEach(function(position) {
      var card = this.state.tiles[position];

      if (this.getCompoundedDamage(position, card) >= card.health)
        this.removeTile(position);
    }, this);
  },

  removeEmptyTiles: function() {
    Object.keys(this.state.tiles).forEach(function(position) {
      if (this.state.tiles[position] === null) {
        this.removeTile(position);
      }
    }, this);
  },

  removeOrphanTiles: function() {
    Object.keys(this.getOccupiedTiles()).forEach(function(position) {
      var kill = true;

      Tile.neighbourCoordinates(position).forEach(function(neighbourPosition) {
        if (this.state.tiles[neighbourPosition])
          kill = false;
      }, this);

      if (kill)
        this.removeTile(position);
    }, this);
  },

  tick: function() {
    this.removeDestroyedTiles();
    this.removeEmptyTiles();
    this.removeOrphanTiles();
    this.fillAvailableTiles();

    // final render
    this.setState({card: null, tiles: this.state.tiles})
  },

  mapClickHandler: function(position, card) {
    if (this.state.card === null || card !== null)
      return

    if (this.getCompoundedDamage(position, this.state.card) >= this.state.card.health)
      return

    this.addTile(position, this.state.card);

    this.tick();
  },

  handClickHandler: function(card) {
    this.setState({card: card});
  },

  render: function() {
    console.log('render')
    return(
      <div className="spark__container">
        <Map ref="map" tiles={this.state.tiles} card={this.state.card} onClick={this.mapClickHandler} />
        <Hand ref="hand" cards={this.props.deck} onClick={this.handClickHandler} />
      </div>
    );
  }
});

React.render(<Spark />, document.getElementById('spark'))
