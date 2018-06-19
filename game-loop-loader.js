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
  nextFrame: function() { return __runp5.tick; },
  runp5: function(game) {
    game.setup = function() {
      game.createCanvas(960, 720);
    };
    game.draw = __runp5.moveToNextTick;
    window.game = game;
    __runp5.main(__runp5.nextFrame);
  }
});

__runp5.main = async function(frame) {
const nextFrame = frame;
await nextFrame();
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
  let sourceMapGenerator = new sourceMap.SourceMapGenerator({
    file: this.resourcePath,
    sourceRoot: '',
  });
  sourceMapGenerator.setSourceContent(this.resourcePath, source);
  let prefixLineCount = prefix.split(/\r?\n/g).length;

  let result = prefix;
  source.split(/\r?\n/g).forEach((line, lineNumber) => {
    let sourceCol = 0;
    let resultCol = 0;
    (line.match(/\w+|\W+/g) || []).forEach((token) => {
      let resultToken = (token === 'awaitNextFrame') ? 'await nextFrame' : token;

      sourceMapGenerator.addMapping({
        source: this.resourcePath,
        original: { line: lineNumber + 1, column: sourceCol },
        generated: { line: prefixLineCount + lineNumber, column: resultCol }
      });

      result += resultToken;
      sourceCol = sourceCol + token.length;
      resultCol = resultCol + resultToken.length;
    });
    result += '\n';
  });

  result += postfix;
  let resultMap = JSON.parse(sourceMapGenerator.toString())
  this.callback(null, result, resultMap);
};
