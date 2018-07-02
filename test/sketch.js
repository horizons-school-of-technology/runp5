let x = 0;
let y = 50;

let myFunc = function(y) {
  return y * 2;
};

while (game.goToNextFrame()) {

  if (myFunc(x) < 100) {
    console.log(x < 5 || true);
  }

  game.background(0);
  game.fill(255);
  game.rect(x,y,50,50);
  game.ellipse(x, 50, 80, 80);
  x++; y++;

  x = void 0;
}
