let x = 0;
let y = 50;

while (game.goToNextFrame()) {

  game.background(0);
  game.fill(255);
  game.rect(x,y,50,50);
  game.ellipse(x, 50, 80, 80);
  x++;
}
