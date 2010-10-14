var SQUAREA = 150;
var BS      = 20;
var LEFT    = 37;
var RIGHT   = 39;

function square(x, y, colour) {
 var canvas = document.getElementById("canvas");
 var ctx    = canvas.getContext("2d");

 ctx.fillStyle = colour || "rgb(200,0,0)";
 ctx.fillRect(x, y, 18, 18);
}

function drawPair(bp) {
  square(bp.a.x, bp.a.y, "rgb(0,0,200)");
  square(bp.b.x, bp.b.y, "rgb(0,0,200)");
}

function grid() {
  for(var i = 0; i < SQUAREA; i += BS) {
    for(var j = 0; j < SQUAREA; j += BS) {
      square(i, j);
    }
  }
}

function newPair() {
  var enter = Math.floor(Math.random() * SQUAREA);
  enter -= enter % BS;

  var bp = {};
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

var gameLoopId = setInterval(function() {
  var blockPair = blocks[blocks.length - 1];
  if(hasCollision(blockPair) || blockPair.a.y >= (SQUAREA - BS)) {
    if(runTheNumbers() === 'GAME OVER')
      clearInterval(gameLoopId);
    blocks.push(newPair());
    return;
  }
  blockPair.a.y += BS;
  blockPair.b.y += BS;

  draw();
}, 500);

document.addEventListener('keydown', function(evt) {
  var key       = evt.keyCode,
      blockPair = blocks[blocks.length - 1],
      move      = { x: blockPair.a.x, y: blockPair.a.y };

  // r == Reset
  if(key == 82) {
    start();
    return;
  }

  // Right
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
