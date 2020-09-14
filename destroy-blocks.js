// The idea was to add the ability to detect rectangles of blocks.
// The current "design" makes this more difficult thant it needs to be.
// So the best thing to do will be to start over. Probably.

var SQUAREA = 150;
var BS      = 20;
var LEFT    = 37;
var RIGHT   = 39;

function square(x, y, colour) {
 var canvas = document.getElementById("canvas");
 var ctx    = canvas.getContext("2d");

                          // Light pink
 ctx.fillStyle = colour || "rgb(225,150,150)";
 ctx.fillRect(x, y, 18, 18);
}

function drawPair(bp) {
  square(bp.a.x, bp.a.y, bp.colour);
  square(bp.b.x, bp.b.y, bp.colour);
}

function grid() {
  for(var i = 0; i < SQUAREA; i += BS) {
    for(var j = 0; j < SQUAREA; j += BS) {
      square(i, j);
    }
  }
}

// Dark {red,green,blue}
COLOURS = ["rgb(100,30,30)", "rgb(30,100,30)", "rgb(30,30,100)"];
function newPair() {
  var enter = Math.floor(Math.random() * SQUAREA);
  enter -= enter % BS;

  var bp = { colour: COLOURS[Math.floor(Math.random() * 10 % COLOURS.length)] };
  bp.a = { x: enter, y: 0   };
  bp.b = { x: enter, y: -BS };
  return bp;
}

var blocks = [];

function start() {
  blocks = [newPair()];
  draw();
}

function draw() {
  grid();
  for(var i = 0; i < blocks.length; i++)
    drawPair(blocks[i]);
}

function hasCollision(curBp, dir) {
  var x = curBp.a.x,
      y = curBp.a.y,
    len = blocks.length - 1;

  // At the edge of the grid?
  if((dir == LEFT  && x == 0)
  || (dir == RIGHT && (x + 20) >= SQUAREA) ) 
    return true;
  
  for(var i = 0; i < len; i++) {
    var bp = blocks[i];
    // Any blocks below?
    if(x == bp.a.x && (y + BS) == bp.b.y)
      return true;

    // Only check for blocks left/right for movements
    if(!dir) continue;
    // Don't check left/right if curBp isn't on the same level.
    if(! (curBp.a.y == bp.a.y || curBp.a.y == bp.b.y) )
      continue;

    // Any blocks to left of the current bottom block?
    if( dir == LEFT
    && (curBp.a.x - BS) == bp.a.x
    && (curBp.a.x - BS) == bp.b.x)
      return true;
    // Any blocks to left of the current bottom block?
    if( dir == RIGHT
    && (curBp.a.x + BS) == bp.a.x
    && (curBp.a.x + BS) == bp.b.x)
      return true;
  }

  return false;
}

function runTheNumbers() {
  // XXX This is how the little hacks begin
  var botTot = 0,
      topTot = 0;
  for(var i = 0; i < blocks.length; i++) {
    if(blocks[i].a.y >= (SQUAREA - BS))
      botTot++;
    if(blocks[i].b.y <= 0)
      topTot++;
  }
  if(botTot == Math.ceil(SQUAREA / BS))
    document.getElementById('tally').textContent = 'Some win!';
  if(topTot > 0) {
    document.getElementById('tally').textContent = 'EPIC FAIL';
    return 'GAME OVER';
  }
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
  // Left
  else if(key == LEFT)
    move.x -= BS;

  if(!hasCollision(blockPair, key)) {
    blockPair.a.x = move.x;
    blockPair.b.x = move.x;
    draw();
  }
}, true);
