import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

const HOLE_POSITION = 8;

class Tile extends React.Component {
  render() {

    // the hole tile should not have any background style
    const style = this.props.correctPosition !== HOLE_POSITION
      ? getImageStyle(this.props.image, this.props.correctPosition)
      : {};
    return (
      <button
        className="tile"
        onClick={this.props.onClick}
        style={style}
      >
      </button>
    );
  }
}

class Board extends React.Component {
  renderTile(i) {
    return (<Tile
      correctPosition={this.props.tiles[i]}
      onClick={() => this.props.onClick(i)}
      image={this.props.image}
    />);
  }

  render() {
    let tiles = []
    for (let pos = 0; pos < 9; pos++) {
      tiles.push(this.renderTile(pos))
    }

    const style = getImageStyle(this.props.image);
    return (
      <div>
        <div className="board">
          {tiles}
          <div className="full-image" style={style}></div>
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  constructor() {
      super();

      let positions = [0,1,2,3,4,5,6,7]
      shuffle(positions)
      positions.push(HOLE_POSITION)

      this.state = {
        tiles: positions,
        hole: HOLE_POSITION,
        image: {},
      };

      this.getImage();
  }

  getImage() {
    let xhttp = new XMLHttpRequest();
    xhttp.onload = () => {
      const obj = JSON.parse(xhttp.response);
      let photo = obj.photos.photo[0]

      // try to use a medium size of the image (640 on the longest size)
      // if unavailable, use the original image size
      this.setState(
        {image: {
          url: photo.url_z || photo.url_o,
          width: photo.width_z || photo.width_o,
          height: photo.height_z || photo.height_o }
        });
    }
    xhttp.open("GET", "https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=da997692cbca69a5a6d9c8fc210061a2&extras=url_z%2C+url_o&per_page=1&format=json&nojsoncallback=1");
    xhttp.send();
  }

  handleClick(i) {
    if (!isAdjacent(i, this.state.hole)) {
      return;
    }

    const tiles = this.state.tiles.slice();
    if (isComplete(tiles)) {
      return;
    }

    tiles[this.state.hole] = tiles[i];
    tiles[i] = HOLE_POSITION;
    this.setState({tiles: tiles, hole: i});
  }

  render() {
    const complete = isComplete(this.state.tiles);
    let status
    if (complete) {
      status = 'Good Job!'
    } else {
      status = "Move the Blocks to Complete the Puzzle!"
    }

    return (
      <div className="game">
        <div className="game-info">
          {status}
        </div>
        <div className="game-board">
          <Board
            tiles={this.state.tiles}
            image={this.state.image}
            onClick={i => this.handleClick(i)}
          />
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Game />,
  document.getElementById('root')
);

/**
 * Shuffles array in place.
 * @param {Array} a The array to shuffle.
 */
function shuffle(a) {
  for (let i = a.length; i; i--) {
    let j = Math.floor(Math.random() * i);
    [a[i - 1], a[j]] = [a[j], a[i - 1]];
  }
}

/**
* Checks if tile position is adjacent to hole position on the board.
* @param {Number} tile The current position of the tile to check.
* @param {Number} hole The current position of the hole.
*/
function isAdjacent(tile, hole) {
  return tile === hole - 1 || tile === hole + 1 ||
          tile === hole - 3 || tile === hole + 3
}

/**
* Checks if all the tiles are in the correct position.
* @param {Array} tiles The array describing the current position of tiles.
* @returns {Boolean} True if the puzzle is complete.
*/
function isComplete(tiles) {
  // Puzzle is complete when each tile value (correct position)
  // equals the tile index (current position)
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i) {
      return false;
    }
  }
  return true
}

/**
* Computes style for the image properties and tile position given.
* @param {Object} image The image properties - url, width, height.
* @param {Number} correctPosition If defining style for a tile, specifies the correct position of that tile in the original image.
* @returns {Object} The computed style.
*/
function getImageStyle(image, correctPosition) {
  let xOffset = 0
  let yOffset = 0

  // if no position was specified, we are not dealing with a tile
  // so we don't need to adjust the image offset
  if (correctPosition !== undefined) {
    xOffset = (correctPosition % 3) * (-132);
    yOffset = Math.trunc(correctPosition/3) * (-132);
  }

  const size = image.width < image.height ? '396px auto' : 'auto 396px';
  return {
    backgroundImage: `url(${image.url})`,
    backgroundSize: size,
    backgroundPosition: `${xOffset}px ${yOffset}px`
  };
}
