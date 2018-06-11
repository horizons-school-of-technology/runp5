let path = require('path');
let express = require("express");
let webpackDevMiddleware = require("webpack-dev-middleware");
let webpack = require("webpack");
var cli = require('commander');

var packagejson = require('./package.json');

cli.version(packagejson.version);
cli.parse(process.argv);

if (cli.args.length !== 1) {
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
};

let devServerConfig = {

};

app.get('/', function(req, res, next) {
  res.sendFile(path.resolve(__dirname, 'game.html'));
});

app.get('/p5.js', function(req, res, next) {
  res.sendFile(path.resolve(__dirname, 'p5.js'));
});

app.use(webpackDevMiddleware(webpack(webpackConfig), devServerConfig));

app.listen(3000);
