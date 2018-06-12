let path = require('path');
let WebpackDevServer = require("webpack-dev-server");
let Webpack = require("webpack");
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

let port = 3000;

let entryFile = path.resolve(cli.args[0]);
// TODO: test for entryFile existence here

let webpackConfig = {
  mode: 'development',
  entry: [
    entryFile,
    path.resolve(__dirname, 'node_modules', 'webpack-dev-server') +
      '/client?http://localhost:' + port + '/'
  ],
  output: {
    path: path.dirname(entryFile),
    filename: 'bundle.js',
  },
  module: {
    rules: [{
      resource: entryFile,
      use: [
        path.resolve(__dirname, 'game-loop-loader.js'),
      ],
    }],
  },
  devtool: 'source-map',
  watch: true,
  devServer: {
    contentBase: __dirname,
  },
};

let webpackCompiler = Webpack(webpackConfig);

if (isBuild) {
  // TODO(aria): Make this less hacky
  webpackCompiler.run(function() {
    console.log('compiled');
    process.exit(0);
  });
} else {

  let server = new WebpackDevServer(webpackCompiler, webpackConfig.devServer);

  server.listen(port, '127.0.0.1', function() {
    console.log('Starting server on http://localhost:' + port);
  });
}
