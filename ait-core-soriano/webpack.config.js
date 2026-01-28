const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const shouldAnalyze = process.env.ANALYZE === 'true';

module.exports = {
  mode: isProduction ? 'production' : 'development',

  entry: {
    main: './src/index.ts',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
    chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
    publicPath: '/',
    clean: true,
    pathinfo: false,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@lib': path.resolve(__dirname, 'src/lib'),
    },
    modules: ['node_modules', path.resolve(__dirname, 'src')],
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              cacheCompression: false,
              compact: isProduction,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: !isProduction,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'images/[name].[contenthash:8][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]',
        },
      },
    ],
  },

  optimization: {
    minimize: isProduction,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 2020,
          },
          compress: {
            ecma: 2015,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: isProduction,
            drop_debugger: isProduction,
            pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 2015,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
          name: 'react-vendor',
          priority: 20,
          reuseExistingChunk: true,
        },
        ui: {
          test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
          name: 'ui-vendor',
          priority: 20,
          reuseExistingChunk: true,
        },
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          name: 'charts-vendor',
          priority: 20,
          reuseExistingChunk: true,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
    runtimeChunk: {
      name: 'runtime',
    },
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    }),
    isProduction && new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    isProduction && new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        level: 11,
      },
      threshold: 8192,
      minRatio: 0.8,
    }),
    shouldAnalyze && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    }),
  ].filter(Boolean),

  performance: {
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    hints: isProduction ? 'warning' : false,
  },

  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    buildDependencies: {
      config: [__filename],
    },
  },

  devtool: isProduction ? 'source-map' : 'eval-source-map',

  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
};
