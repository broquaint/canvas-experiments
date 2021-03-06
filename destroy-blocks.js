// The idea was to add the ability to detect rectangles of blocks.
// The current "design" makes this more difficult thant it needs to be.
// So the best thing to do will be to start over. Probably.

var SQUAREA = 150;
var BS      = 20;
// Key codes for the keydown event
const LEFT    = 37;
const RIGHT   = 39;
const DOWN    = 40;

function square(x, y, colour) {
 var canvas = document.getElementById("canvas");
 var ctx    = canvas.getContext("2d");

 ctx.fillStyle = colour || "rgb(175,172,177)";
 ctx.fillRect(x, y, 18, 18);
}

function drawPair(bp) {
  square(bp.a.x, bp.a.y, bp.a.colour);
  square(bp.b.x, bp.b.y, bp.b.colour);
}

function drawGrid() {
  for(var i = 0; i < SQUAREA; i += BS) {
    for(var j = 0; j < SQUAREA; j += BS) {
      square(i, j);
    }
  }
}

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
function newPair() {
  var enter = Math.floor(Math.random() * SQUAREA);
  enter -= enter % BS;

  var [base, colourA, colourB] = COLOURS[Math.floor(Math.random() * 10 % COLOURS.length)];
  return {
    state:  'moving',
    a: { x: enter, y: 0,   colour: colourA, state: 'moving', base },
    b: { x: enter, y: -BS, colour: colourB, state: 'moving', base }
  };
}

var blocks = [];

function hasCollision(curBp, dir) {
  var x = curBp.a.x,
      y = curBp.a.y,
    len = blocks.length - 1;

  // At the edge of the grid?
  if((dir == LEFT  && x == 0)
  || (dir == RIGHT && (x + 20) >= SQUAREA) ) 
    return 'grid edge horizontal';

  // At the edge of the grid?
  if((y + BS) >= SQUAREA)
    return `grid edge vertical`;
  
  for(var i = 0; i < len; i++) {
    var bp = blocks[i];
    // Any blocks below?
    if(x == bp.a.x && (y + (BS * 2)) == bp.a.y)
      return 'blocks below';

    // Only check for blocks left/right for movements
    if(!dir) continue;
    // Don't check left/right if curBp isn't on the same level.
    if(! (curBp.a.y == bp.a.y || curBp.a.y == bp.b.y) )
      continue;

    // Any blocks to left of the current bottom block?
    if( dir == LEFT
    && (curBp.a.x - BS) == bp.a.x
    && (curBp.a.x - BS) == bp.b.x)
      return 'blocks left';
    // Any blocks to right of the current bottom block?
    if( dir == RIGHT
    && (curBp.a.x + BS) == bp.a.x
    && (curBp.a.x + BS) == bp.b.x)
      return 'blocks right';

    // Any blocks below this pair?
    if( dir == DOWN
    && (curBp.a.y + BS) == bp.a.y
    && (curBp.a.y + BS) == bp.b.y)
      return 'blocks down';
  }

  return false;
}

function runTheNumbers() {
  var size = Math.ceil(SQUAREA / BS),
      grid = Array.from(
        Array(size), () => Array.from(Array(size), () => ({base: null}))
  );
  blocks.forEach(p => {
    var [x1,y1,x2,y2] = [p.a.x, p.a.y, p.b.x, p.b.y].map(n => n > 1 ? n / BS : n);
    grid[y1][x1] = Object.assign(p.a, {gx: x1, gy: y1});
    grid[y2][x2] = Object.assign(p.b, {gx: x2, gy: y2});
  });
  grid.forEach((col, i) => {
      col.slice(0, col.length - 1)
        .filter(cell => cell.base !== null)
        .filter(({base, gx, gy}) => base === grid[gy][gx + 1].base)
        .forEach(cell => {
          console.log(`square found at`, cell, 'x', grid[cell.gy][cell.gx + 1]);
          cell.colour = MATCHED[cell.base];
          grid[cell.gy][cell.gx + 1].colour = MATCHED[cell.base];
        });
    });

  var topTot = 0;
  for(var i = 0; i < blocks.length; i++) {
    if(blocks[i].b.y <= 0)
      topTot++;
  }
  if(topTot > 0) {
    document.getElementById('tally').textContent = 'EPIC FAIL';
    return 'GAME OVER';
  }
}


function start() {
  blocks = [newPair()];
  draw();
}

function draw() {
  drawGrid();
  for(var i = 0; i < blocks.length; i++)
    drawPair(blocks[i]);
}

var gameLoopId;
function run() {
  clearInterval(gameLoopId);
  start();
  init_loop();
}

function init_loop() {
  gameLoopId = setInterval(function() {
    var blockPair = blocks[blocks.length - 1],
        collision = hasCollision(blockPair);
    if(collision) {
      // console.log(`collision '${collision}' at a:`, blockPair.a, 'b:', blockPair.b);
      if(runTheNumbers() === 'GAME OVER') {
        clearInterval(gameLoopId);
      }
      else {
        blocks[blocks.length - 1].state = 'set';
        blocks.push(newPair());
      }
      return;
    }
    blockPair.a.y += BS;
    blockPair.b.y += BS;

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
  var key       = evt.keyCode,
      blockPair = blocks[blocks.length - 1],
      move      = { x: blockPair.a.x, y: blockPair.a.y };

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
    move.x += BS;
  else if(key == LEFT)
    move.x -= BS;
  else if(key == DOWN)
    move.y += BS;

  if(!hasCollision(blockPair, key)) {
    blockPair.a.x = move.x;
    blockPair.b.x = move.x;
    blockPair.a.y = move.y;
    blockPair.b.y = move.y - BS;
    draw();
  }
}, true);

