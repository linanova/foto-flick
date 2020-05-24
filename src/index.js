import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'bulma/css/bulma.css'

const HOLE_POSITION = 8;
const PUZZLE_PIXEL_SIZE = 132;
const PUZZEL_BLOCK_SIZE = 3;

class Block extends React.Component {
  render() {

    // the hole block should not have any background style
    const style = this.props.correctPosition !== HOLE_POSITION
      ? getImageStyle(this.props.image, this.props.correctPosition)
      : {};
    return (
      <button
        className="puzzle-block"
        onClick={this.props.onClick}
        style={style}
      >
      </button>
    );
  }
}

class Board extends React.Component {
  renderBlock(i) {
    return (<Block
      key={i}
      correctPosition={this.props.blocks[i]}
      onClick={() => this.props.onClick(i)}
      image={this.props.image}
    />);
  }

  render() {
    let blocks = []
    for (let pos = 0; pos < 9; pos++) {
      blocks.push(this.renderBlock(pos))
    }

    const style = getImageStyle(this.props.image);
    return (

        <div className="board container">
          <div className="full-image is-overlay" style={style}></div>
          {blocks}
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
        blocks: positions,
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
    xhttp.open("GET", "https://api.flickr.com/services/rest/?method=flickr.photos.getRecent&api_key=ff9496e0e983b050641d2dd10fefcc37&extras=url_z%2C+url_o&per_page=1&format=json&nojsoncallback=1");
    xhttp.send();
  }

  handleClick(i) {
    if (!isAdjacent(i, this.state.hole)) {
      return;
    }

    const blocks = this.state.blocks.slice();
    if (isComplete(blocks)) {
      return;
    }

    blocks[this.state.hole] = blocks[i];
    blocks[i] = HOLE_POSITION;
    this.setState({blocks: blocks, hole: i});
  }

  render() {
    const complete = isComplete(this.state.blocks);
    let status
    if (complete) {
      status = 'Good Job!'
    } else {
      status = "Move the Blocks to Complete the Puzzle!"
    }

    return (
      <div className="game">
        <div className="title section has-text-centered"> foto flick </div>
        <div className="game-board hero is-primary">
          <Board
            blocks={this.state.blocks}
            image={this.state.image}
            onClick={i => this.handleClick(i)}
          />
        </div>
        <div className="game-info section has-text-centered"> {status} </div>
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
* Checks if block position is adjacent to hole position on the board.
* @param {Number} block The current position of the block to check.
* @param {Number} hole The current position of the hole.
*/
function isAdjacent(block, hole) {
  let verticallyAdjacent = block === hole - PUZZEL_BLOCK_SIZE || block === hole + PUZZEL_BLOCK_SIZE

  let holeIsLeftmost = hole % PUZZEL_BLOCK_SIZE === 0
  let holeIsRightmost = hole % PUZZEL_BLOCK_SIZE === PUZZEL_BLOCK_SIZE - 1
  let horizontallyAdjacent = (!holeIsLeftmost && block === hole - 1) || (!holeIsRightmost && block === hole + 1)

  return horizontallyAdjacent || verticallyAdjacent
}

/**
* Checks if all the blocks are in the correct position.
* @param {Array} blocks The array describing the current position of blocks.
* @returns {Boolean} True if the puzzle is complete.
*/
function isComplete(blocks) {
  // Puzzle is complete when each block value (correct position)
  // equals the block index (current position)
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i] !== i) {
      return false;
    }
  }
  return true
}

/**
* Computes style for the image properties and block position given.
* @param {Object} image The image properties - url, width, height.
* @param {Number} correctPosition If defining style for a block, specifies the correct position of that block in the original image.
* @returns {Object} The computed style.
*/
function getImageStyle(image, correctPosition) {
  let xOffset = 0
  let yOffset = 0

  // if no position was specified, we are not dealing with a block
  // so we don't need to adjust the image offset
  if (correctPosition !== undefined) {
    xOffset = (correctPosition % PUZZEL_BLOCK_SIZE) * (-PUZZLE_PIXEL_SIZE);
    yOffset = Math.trunc(correctPosition/PUZZEL_BLOCK_SIZE) * (-PUZZLE_PIXEL_SIZE);
  }

  const size = image.width < image.height ? '396px auto' : 'auto 396px';
  return {
    backgroundImage: `url(${image.url})`,
    backgroundSize: size,
    backgroundPosition: `${xOffset}px ${yOffset}px`
  };
}
