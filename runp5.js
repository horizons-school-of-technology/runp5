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
let url = 'http://localhost:' + port;

let entryFile = path.resolve(cli.args[0]);
// TODO: test for entryFile existence here

let webpackConfig = {
  mode: 'development',
  entry: [
    entryFile,
    path.resolve(__dirname, 'node_modules', 'webpack-dev-server') +
      '/client?' + url
  ],
  output: {
    path: path.dirname(entryFile),
    filename: 'runp5/bundle.js',
    devtoolModuleFilenameTemplate: function(info) {
      console.log('info:', info);

      let isWebpackInternal = (
        info.resourcePath.startsWith('(webpack)') ||
        info.absoluteResourcePath.startsWith('webpack')
      );
      let isDevServerNodeModules = (
        info.absoluteResourcePath.startsWith(__dirname) &&
        info.resourcePath.includes('/node_modules/')
      );

      if (isWebpackInternal || isDevServerNodeModules) {
        return `webpack://${info.namespace}/${info.resourcePath}`;
      }

      return url + '/' + info.resourcePath.replace(/^\.\//, '');
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: path.resolve(__dirname, 'node_modules', 'babel-loader'),
          options: {
            plugins: [
              path.resolve(__dirname, 'node_modules', 'babel-plugin-transform-strict-mode'),
              path.resolve(__dirname, 'simplejs-babel-plugin.js'),
            ],
          }
        },
      },
      {
        resource: entryFile,
        use: [
          path.resolve(__dirname, 'game-loop-loader.js'),
        ],
      }
    ],
  },
  devtool: 'source-map',
  watch: true,
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
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
    console.log('Starting server on ' + url);
  });
}
