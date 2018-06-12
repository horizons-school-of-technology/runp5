let path = require('path');
let express = require("express");
let webpackDevMiddleware = require("webpack-dev-middleware");
let webpack = require("webpack");
let cli = require('commander');

let packagejson = require('./package.json');

let isBuild = false;

cli.version(packagejson.version);
cli.command('build').action(function() { isBuild = true; });
cli.parse(process.argv);

if (!isBuild && cli.args.length !== 1) {
  console.log(cli.args);
  cli.help();
  process.exit(1);
}

let entryFile = path.resolve(cli.args[0]);
// TODO: test for entryFile existence here

let app = express();

let webpackConfig = {
  mode: 'development',
  entry: entryFile,
  output: {
    path: path.dirname(entryFile),
    filename: 'bundle.js',
  },
  module: {
    rules: [{
      resource: entryFile,
      use: [
        './game-loop-loader.js'
      ],
    }],
  },
  devtool: 'source-map',
};

let webpackCompiler = webpack(webpackConfig);

if (isBuild) {
  webpackCompiler.run(function() {
    console.log('compiled');
    process.exit(0);
  });
} else {

let devServerConfig = {

};

app.get('/', function(req, res, next) {
  res.sendFile(path.resolve(__dirname, 'game.html'));
});

app.get('/p5.js', function(req, res, next) {
  res.sendFile(path.resolve(__dirname, 'p5.js'));
});

app.use(webpackDevMiddleware(webpackCompiler, devServerConfig));

app.listen(3000);
}
