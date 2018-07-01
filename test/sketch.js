let x = 0;
let y = 50;

while (game.goToNextFrame()) {

  if (x + 100) {
    console.log(x < 5 || true);
  }

  game.background(0);
  game.fill(255);
  game.rect(x,y,50,50);
  game.ellipse(x, 50, 80, 80);
  x++;
}
