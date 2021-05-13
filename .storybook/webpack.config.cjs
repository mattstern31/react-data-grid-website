'use strict';

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const stylis = require('stylis');

stylis.set({ prefix: false });

module.exports = function ({ config, mode }) {
  const isProd = mode === 'PRODUCTION';

  config.module.rules = [
    {
      test: /\.tsx?$/,
      exclude: /node_modules/,
      use: [
        {
          loader: 'babel-loader',
          options: { cacheDirectory: !isProd }
        },
        {
          loader: '@linaria/webpack-loader',
          options: { sourceMap: !isProd }
        }
      ]
    },
    {
      test: /\.css$/,
      use: [MiniCssExtractPlugin.loader, 'css-loader']
    }
  ];

  config.plugins.push(
    new MiniCssExtractPlugin({
      filename: isProd ? '[name].[contenthash].css' : '[name].css',
      chunkFilename: isProd ? '[id].[contenthash].css' : '[id].css',
      ignoreOrder: true
    })
  );

  return config;
};
