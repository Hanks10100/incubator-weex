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

import { createServices, refreshServices, destroyServices } from './service'
import WeexInstance from './WeexInstance'
import { getRuntimeConfig } from './init'
const versionRegExp = /^\s*\/\/ *(\{[^}]*\}) *\r?\n/

/**
 * Detect a JS Bundle code and make sure which framework it's based to. Each JS
 * Bundle should make sure that it starts with a line of JSON comment and is
 * more that one line.
 * @param  {string} code
 * @return {object}
 */
function getBundleType (code) {
  const result = versionRegExp.exec(code)
  if (result) {
    try {
      const info = JSON.parse(result[1])
      return info.framework
    }
    catch (e) {}
  }
  return 'Weex' // default bundle type
}

const instanceMap = {}

export function getFrameworkType (id) {
  if (instanceMap[id]) {
    return instanceMap[id].framework
  }
  return 'Weex'
}

/**
 * Check which framework a certain JS Bundle code based to. And create instance
 * by this framework.
 * @param {string} id
 * @param {string} code
 * @param {object} config
 * @param {object} data
 */
export function createInstance (id, code, config, data) {
  if (instanceMap[id]) {
    return new Error(`invalid instance id "${id}"`)
  }

  // Init instance info.
  const bundleType = getBundleType(code)
  const runtimeConfig = getRuntimeConfig()

  // Init instance config.
  config = JSON.parse(JSON.stringify(config || {}))
  config.env = JSON.parse(JSON.stringify(global.WXEnvironment || {}))

  const weex = new WeexInstance(id, config)
  Object.freeze(weex)

  const context = {
    weex,
    config, // TODO: deprecated
    created: Date.now(),
    framework: bundleType
  }
  context.services = createServices(id, context, runtimeConfig)
  instanceMap[id] = context

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[JS Framework] create an ${bundleType} instance`)
  }

  const fm = runtimeConfig.frameworks[bundleType]
  if (!fm) {
    return new Error(`invalid bundle type "${bundleType}".`)
  }
  return fm.createInstance(id, code, config, data, context)
}

export function refreshInstance (id, ...args) {
  const type = getFrameworkType(id)
  const runtimeConfig = getRuntimeConfig()
  refreshServices(id, {
    info: { framework: type },
    runtime: runtimeConfig
  })

  const fm = runtimeConfig.frameworks[type]
  if (!fm) {
    return new Error(`invalid bundle type "${type}".`)
  }
  return fm.refreshInstance(id, ...args)
}

export function destroyInstance (id, ...args) {
  const type = getFrameworkType(id)
  const runtimeConfig = getRuntimeConfig()
  destroyServices(id, {
    info: { framework: type },
    runtime: runtimeConfig
  })

  const fm = runtimeConfig.frameworks[type]
  if (!fm) {
    return new Error(`invalid bundle type "${type}".`)
  }
  delete instanceMap[id]
  return fm.destroyInstance(id, ...args)
}
