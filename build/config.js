
/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const path = require('path')
const json = require('rollup-plugin-json')
const eslint = require('rollup-plugin-eslint')
const replace = require('rollup-plugin-replace')
const nodeResolve = require('rollup-plugin-node-resolve')
const uglify = require('rollup-plugin-uglify')
const commonjs = require('rollup-plugin-commonjs')
const buble = require('rollup-plugin-buble')
const packageJSON = require('../package.json')
const deps = packageJSON.dependencies
const subversion = packageJSON.subversion

const frameworkBanner = `;(this.getJSFMVersion=function()`
  + `{return "${subversion.framework}"});\n`
  + `var global = this; var setTimeout = global.setTimeout;\n`

const configs = {
  'weex-js-framework': {
    moduleName: 'Weex',
    entry: absolute('runtime/entries/index.js'),
    dest: absolute('packages/weex-js-framework/index.js'),
    banner: `(this.nativeLog || function(s) {console.log(s)})`
      + `('START WEEX JS FRAMEWORK ${subversion.framework}, Build ${now()}.');\n`
      + frameworkBanner
  },
  'weex-js-runtime': {
    moduleName: 'WeexRuntime',
    entry: absolute('runtime/entries/runtime.js'),
    dest: absolute('packages/weex-js-runtime/index.js'),
    banner: `/* WEEX JS RUNTIME ${subversion.framework}, Build ${now()}. */\n\n`
  },
  'weex-vue': {
    moduleName: 'WeexVue',
    entry: absolute('runtime/entries/vue.js'),
    dest: absolute('pre-build/weex-vue.js'),
    banner: `/* [Weex + Vue] ${subversion.framework} `
      + `(Vue: ${deps['weex-vue-framework']}), Build ${now()}. */\n\n`
      + frameworkBanner
  },
  'weex-rax': {
    moduleName: 'WeexRax',
    entry: absolute('runtime/entries/rax.js'),
    dest: absolute('pre-build/weex-rax.js'),
    banner: `/* [Weex + Rax] ${subversion.framework} `
    + `(Rax: ${deps['weex-rax-framework']}), Build ${now()}. */\n\n`
      + frameworkBanner
  },
  'weex-legacy-framework': {
    moduleName: 'WeexLegacyFramework',
    entry: absolute('runtime/frameworks/legacy/index.js'),
    dest: absolute('packages/weex-legacy-framework/index.js'),
    banner: `/* Weex Legacy Framework ${subversion.framework}, Build ${now()}. */\n`
  },
  'weex-vanilla-framework': {
    moduleName: 'WeexVanillaFramework',
    entry: absolute('runtime/frameworks/vanilla/index.js'),
    dest: absolute('packages/weex-vanilla-framework/index.js'),
    banner: `/* Weex Vanilla Framework ${subversion.framework}, Build ${now()}. */\n`
  }
}

function getConfig (name, minify) {
  const opt = configs[name]
  if (!opt.plugins) {
    opt.plugins = []
  }
  const config = {
    moduleName: opt.moduleName,
    entry: opt.entry,
    dest: minify ? opt.dest && opt.dest.replace(/\.js$/, '.min.js') : opt.dest,
    format: opt.format || 'umd',
    banner: opt.banner,
    plugins: opt.plugins.concat([
      nodeResolve({
        jsnext: true,
        main: true
      }),
      json(),
      replace({
        'process.env.VIEWPORT_WIDTH': 750,
        'process.env.NODE_ENV': JSON.stringify(minify ? 'production' : 'development'),
        'process.env.VUE_ENV': JSON.stringify('WEEX'),
        'process.env.NODE_DEBUG': false
      }),
      commonjs(),
      buble()
    ])
  }

  if (minify) {
    config.plugins.push(uglify())
  }
  else {
    config.sourceMap = 'inline'
    config.plugins.unshift(eslint({ exclude: ['**/*.json', '**/*.css'] }))
  }

  return config
}

// get the absolute path
function absolute (str) {
  return path.resolve(__dirname, '..', str)
}

function now () {
  const time = Date.now() - (new Date()).getTimezoneOffset() * 60000
  return (new Date(time)).toISOString().replace('T', ' ').substring(0, 16)
}

module.exports = getConfig
