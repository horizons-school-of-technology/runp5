# `runp5`: command line tool for serving p5 projects

## Installation

```sh
npm install -g git+ssh:git@github.com:horizons-school-of-technology/runp5.git
```

## Usage

```sh
runp5 main.js
```

where `main.js` is the root file of your p5 program

## Programming environment

`runp5` uses p5.js's instance mode, with the instance named `game`. You should
call `p5` functions using `game.fill()` etc:

```
game.fill(0, 0, 255);
game.ellipse(50, 50, 100, 100);

```

### Game loop:

`runp5` allows you to create a game loop in one of two ways:

1. By setting the `game.draw` function: `game.draw = function() { };`

2. By creating a `while(true)` loop and calling `await frame();` in each
   iteration of the loop to advance the frame counter

