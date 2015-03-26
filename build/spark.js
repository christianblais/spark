var Tile = React.createClass({displayName: "Tile",
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
        return React.createElement("div", {className: "card card--empty", onMouseEnter: this.handleMouseEnter})
      } else {
        return(
          React.createElement("div", {className: "card-previewer", onMouseLeave: this.handleMouseLeave}, 
            React.createElement(Card, React.__spread({},  this.state.selectedCard))
          )
        );
      }
    } else {
      return React.createElement(Card, React.__spread({},  this.props.card))
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
      React.createElement("div", {className: klass, style: style, onClick: this.handleClick}, 
        this.getCard()
      )
    );
  }
});

var Card = React.createClass({displayName: "Card",
  render: function() {
    var klass = "card card--" + this.props.type;

    return(
      React.createElement("div", {className: klass, onClick: this.props.onClick}, 
        this.props.damages.map(function(damage, index) {
          if (damage) {
            var className = "card__side--" + (index + 1);

            return(
              React.createElement("div", {className: className, key: index}, 
                React.createElement("div", {className: "card__side__damage"}, damage)
              )
            );
          }
        }), 

        this.props.walls.map(function(wall, index) {
          if (wall) {
            var className = "card__side--" + (index + 1);

            return(
              React.createElement("div", {className: className, key: index}, 
                React.createElement("div", {className: "card__side__wall"})
              )
            );
          }
        })
      )
    );
  }
});

var Hand = React.createClass({displayName: "Hand",
  handleClick: function(card) {
    if (this.props.onClick !== undefined)
      this.props.onClick(card);
  },

  render: function() {
    return(
      React.createElement("div", {className: "hand"}, 
        this.props.cards.map(function(card, index) {
          return React.createElement(Card, React.__spread({key: index},  card, {onClick: this.handleClick.bind(this, card)}))
        }, this)
      )
    );
  }
});

var Map = React.createClass({displayName: "Map",
  render: function() {
    return(
      React.createElement("div", {className: "map"}, 
        Object.keys(this.props.tiles).map(function(position, index) {
          return React.createElement(Tile, {key: index, 
            position: position, 
            card: this.props.tiles[position], 
            selectedCard: this.props.card, 
            onClick: this.props.onClick})
        }, this)
      )
    );
  }
});

var Spark = React.createClass({displayName: "Spark",
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
      React.createElement("div", {className: "spark__container"}, 
        React.createElement(Map, {ref: "map", tiles: this.state.tiles, card: this.state.card, onClick: this.mapClickHandler}), 
        React.createElement(Hand, {ref: "hand", cards: this.props.deck, onClick: this.handClickHandler})
      )
    );
  }
});

React.render(React.createElement(Spark, null), document.getElementById('spark'))
