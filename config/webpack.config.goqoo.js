const path = require('path')
const KintonePlugin = require('@kintone/webpack-plugin-kintone-plugin')
const config = require('../.goqoo/webpack.config.base')

config.output = { path: path.resolve('plugin', 'js') }
config.plugins.push(
  new KintonePlugin({
    manifestJSONPath: './plugin/manifest.json',
    privateKeyPath: './private.ppk',
    pluginZipPath: './dist/plugin.zip',
  })
)

module.exports = config
