let sourceMap = require('source-map');

let prefix = `
let __runp5 = {};
Object.assign(__runp5, {
  tick: new Promise((resolve, reject) => {
    __runp5.tickResolve = resolve;
  }),
  moveToNextTick: function() {
    let resolve = __runp5.tickResolve;
    __runp5.tick = new Promise((resolve, reject) => {
      __runp5.tickResolve = resolve;
    });
    resolve();
  },
  drawFrame: function() { return __runp5.tick; },
  runp5: function(game) {
    game.setup = function() {
      game.createCanvas(640, 480);
    };
    game.draw = __runp5.moveToNextTick;
    window.game = game;
    __runp5.main(__runp5.drawFrame);
  }
});

__runp5.main = async function(drawFrame) {
await drawFrame();
`;

let postfix = `
}
new p5(__runp5.runp5);
`;


module.exports = function(source, map) {
  //let asyncSource = source.replaceAll(`
  //const node = new sourceMap.SourceNode(0, 0, this.resourcePath,
  console.log("TEST", source, map, this.sourceMap);
  /*let node = sourceMap.SourceNode.fromStringWithSourceMap(source, map);
  node.prepend(prefix);
  node.add(postfix);
  let result = node.toStringWithSourceMap();
  return [result.code, result.map];*/
  //return prefix + source + postfix;

  let node = new sourceMap.SourceNode(1, 0, this.resourcePath, source);
  node.setSourceContent(this.resourcePath, source);
  node.prepend(prefix);
  node.add(postfix);
  let result = node.toStringWithSourceMap();
  this.callback(null, result.code, JSON.parse(result.map.toString()));
};
