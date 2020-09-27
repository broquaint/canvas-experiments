// The idea was to add the ability to detect rectangles of blocks.
// The current "design" makes this more difficult thant it needs to be.
// So the best thing to do will be to start over. Probably.

const GRIDIM  = 9;   // Dimension of the grid square
const BS      = 20;  // Block size
// Key codes for the keydown event
const LEFT    = 37;
const RIGHT   = 39;
const DOWN    = 40;

const GAP = "rgb(175,172,177)";


// https://coolors.co/5603ad-8367c7-b3e9c7-255957-ed6a5a-eb9486
const COLOURS = [
  ['purple', 'rgb(86,3,173)',     'rgb(131,103,199)'],  // Purple, Blue Violet Crayola
  ['green',  'rgb(54, 129, 127)', 'rgb(98, 208, 142)'], // Celadon Green, Emerald
  ['orange', 'rgb(237,106,90)',   'rgb(235,148,134)']   // Terra Cotta, Vivid Tangerine
];
const MATCHED = {
  purple: 'rgb(169, 151, 216)', // Blue Bell
  green:  'rgb(176, 232, 198)', // Magic Mint
  orange: 'rgb(241, 177, 167)', // Melon
};

function fillCell({gx, gy, colour, type}, state) {
  const canvas = document.getElementById("canvas"),
        ctx    = canvas.getContext("2d");

  let [x, y] = [gx * BS, gy * BS];
  if(type == 'breaker' && state !== 'set') {
    ctx.fillStyle = GAP;
    ctx.fillRect(x, y, 18, 18);
    ctx.fillStyle = colour;
    ctx.fillRect(x + 4, y + 4, 10, 10);
  }
  else {
    ctx.fillStyle = colour || GAP;
    ctx.fillRect(x, y, 18, 18);
  }

}

function drawPair(bp) {
  fillCell(bp.a, bp.state);
  fillCell(bp.b, bp.state);
}

function drawGrid() {
  for(let i = 0; i <= GRIDIM; i++) {
    for(let j = 0; j <= GRIDIM; j++) {
      fillCell({gx: i, gy: j});
    }
  }
}

var turnsSinceBreaker = 0;
function newPair() {
  const enter = Math.floor(Math.random() * GRIDIM),
        [base, colourA, colourB] = COLOURS[Math.floor(Math.random() * 10 % COLOURS.length)];

  let maybeBreaker;
  // Use turnsSinceBreaker to ensure some regularity of breakers.
  if(Math.random() < 0.3 || ++turnsSinceBreaker > 5) {
    maybeBreaker = 'breaker';
    turnsSinceBreaker = 0;
  }
  else {
    maybeBreaker = 'block';
  }

  return {
    state:  'moving',
    // a = bottom cell, b = top cell
    a: { gx: enter, gy: 0,  colour: colourA, base, type: maybeBreaker, state: 'moving' },
    b: { gx: enter, gy: -1, colour: colourB, base, type: 'block',      state: 'moving' }
  };
}

var blocks = [];

function hasCollision(curBp, dir) {
  const x = curBp.a.gx,
        y = curBp.a.gy ,
      len = blocks.length - 1;

  // At the edge of the grid?
  if((dir == LEFT  && x == 0)
  || (dir == RIGHT && (x + 1) >= GRIDIM) )
    return 'grid edge vertical';

  // At the edge of the grid?
  if(y >= GRIDIM)
    return `grid edge horizontal`;
  
  for(let i = 0; i < len; i++) {
    const bp = blocks[i];
    // Any blocks below?
    if(x == bp.a.gx && (y + 2) == bp.a.gy)
      return 'blocks below';

    // Only check for blocks left/right for movements
    if(!dir) continue;

    // Don't check left/right if curBp isn't on the same level.
    if(! (curBp.a.gy == bp.a.gy || curBp.a.gy == bp.b.gy) )
      continue;

    // Any blocks to left of the current bottom block?
    if( dir == LEFT
    && (curBp.a.gx - 1) == bp.a.gx
    && (curBp.a.gx - 1) == bp.b.gx)
      return 'blocks left';
    // Any blocks to right of the current bottom block?
    if( dir == RIGHT
    && (curBp.a.gx + 1) == bp.a.gx
    && (curBp.a.gx + 1) == bp.b.gx)
      return 'blocks right';

    // Any blocks below this pair?
    if( dir == DOWN
    && (curBp.a.gy + 1) == bp.a.gy
    && (curBp.a.gy + 1) == bp.b.gy)
      return 'blocks below';
  }

  return false;
}

function buildGrid(blocks) {
  const size = GRIDIM + 1,
        // Generate grid of empty cells.
        grid = Array.from(
          Array(size),
          () => Array.from(Array(size), () => ({}))
        );
  // Populate blocks into grid.
  blocks.forEach(({ a, b }) => {
    grid[a.gy][a.gx] = a;
    grid[b.gy][b.gx] = b;
  });
  return grid;
}

var matchId = 0;
var tally = 0;
function runTheNumbers() {
  const grid = buildGrid(blocks);
  // Find and mark all blocks of the same colour.
  console.log(`running the numbers ...`);
  grid.forEach((col, i) => {
    col.slice(0, col.length - 1)
      .filter(cell => 'base' in cell)
      .filter(({base, gx, gy}) => base === grid[gy][gx + 1].base)
      .forEach(cell => {
        const {gx, gy} = cell,
              curCell  = cell,
              id       = curCell.matchId || ++matchId;
        // console.log(`matching on '${cell.base}`, cell, `with ${id}`);
        while(curCell.base === cell.base) {
          console.log(`${cell.base} -> ${id}`);
          curCell.matchId = id;
          curCell.colour  = MATCHED[curCell.base];
          if(curCell.gy < GRIDIM) {
            let otherCell = grid[curCell.gy + 1][curCell.gx];
            otherCell.matchId = id;
            otherCell.colour  = MATCHED[otherCell.base];
          }
          curCell = grid[gy][++gx];
          if(!curCell)
            break;
        }
      });
    });

  let topTot = 0;
  for(let i = 0; i < blocks.length; i++) {
    if(blocks[i].b.gy <= 0)
      topTot++;
  }
  // Check if a column has filled up.
  if(topTot > 0) {
    setTally(0, 'Game over!');
    return 'GAME OVER';
  }

  return 'ok';
}

function breakMatched(breakerPair) {
  console.log(`breaking matched ...`);
  const grid    = buildGrid(blocks),
        breaker = breakerPair.a,
        toBreak = grid[breaker.gy + 1][breaker.gx];
  if(toBreak.matchId && toBreak.base === breaker.base) {
    const remainder = blocks.filter(
      pair => pair.a.matchId !== toBreak.matchId && pair !== breakerPair
    );
    setTally(blocks.filter(c => !remainder.includes(c)).length * 2);
    // console.log(`keeping`, remainder);
    // console.log(`removing`, blocks.filter(({a, b}) => a.matchId === toBreak.matchId));
    // Remove matched blocks from the game.
    blocks = remainder;
  }
}

function setTally(n, msg) {
  const newScore = tally + (n * 10);
  document.getElementById('tally').textContent = newScore;
  document.getElementById('msg').textContent = n > 0 ? `+${n * 10}` : msg;
  tally = newScore;
}

function start() {
  blocks = [newPair()];
  draw();
}

function draw() {
  drawGrid();
  for(let i = 0; i < blocks.length; i++)
    drawPair(blocks[i]);
}

var gameLoopId;
function run() {
  clearInterval(gameLoopId);
  tally = 0;
  setTally(0, '...');
  start();
  init_loop();
}

function init_loop() {
  gameLoopId = setInterval(function() {
    const blockPair = blocks[blocks.length - 1],
          collision = hasCollision(blockPair);
    if(collision) {
      console.log(`collided - '${collision}' with `, blockPair);
      if(collision == 'blocks below' && blockPair.a.type == 'breaker') {
        breakMatched(blockPair);
      }
      // console.log(`collision '${collision}' at a:`, blockPair.a, 'b:', blockPair.b);
      if(runTheNumbers() === 'GAME OVER') {
        clearInterval(gameLoopId);
      }
      else {
        blocks[blocks.length - 1].state = 'set';
        blocks.push(newPair());
      }
      draw();
      return;
    }
    blockPair.a.gy++;
    blockPair.b.gy++;

    draw();  
  }, 500);
}

function pause() {
  if(gameLoopId) {
    clearInterval(gameLoopId);
    gameLoopId = null;
  }
  else {
    init_loop();
  }
}

document.addEventListener('keydown', function(evt) {
  const key       = evt.keyCode,
        blockPair = blocks[blocks.length - 1],
        move      = { gx: blockPair.a.gx, gy: blockPair.a.gy };

  // r == Reset
  if(key == 82) {
    run();
    return;
  }

  // p == Pause
  if(key == 80) {
    pause();
    return;
  }

  if(gameLoopId === null)
    return;

  if(key == RIGHT)
    move.gx++;
  else if(key == LEFT)
    move.gx--;
  else if(key == DOWN)
    move.gy++;

  if(!hasCollision(blockPair, key)) {
    blockPair.a.gx = move.gx;
    blockPair.b.gx = move.gx;
    blockPair.a.gy = move.gy;
    blockPair.b.gy = move.gy - 1;
    draw();
  }
}, true);

