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

import { init as initTaskHandler } from '../bridge/TaskCenter'
import { registerService, unregisterService } from './service'
import { registerModules } from './module'
import { registerComponents } from './component'
import { getFrameworkType, createInstance, refreshInstance, destroyInstance } from './instance'

const runtimeConfig = {}

export function getRuntimeConfig () {
  return runtimeConfig
}

const methods = {
  createInstance,
  refreshInstance,
  destroyInstance,
  registerService,
  unregisterService
}

/**
 * Register methods which init each frameworks.
 * @param {string} methodName
 * @param {function} sharedMethod
 */
function adaptMethod (methodName, sharedMethod) {
  methods[methodName] = function (...args) {
    if (typeof sharedMethod === 'function') {
      sharedMethod(...args)
    }

    // TODO: deprecated
    for (const name in runtimeConfig.frameworks) {
      const framework = runtimeConfig.frameworks[name]
      if (framework && framework[methodName]) {
        framework[methodName](...args)
      }
    }
  }
}

/**
 * Register methods which will be called for each instance.
 * @param {string} methodName
 */
// TODO: move to instance.js
function genInstance (methodName) {
  methods[methodName] = function (...args) {
    const id = args[0]
    const type = getFrameworkType(id)
    const framework = runtimeConfig.frameworks[type]
    if (type && framework) {
      return framework[methodName](...args)
    }
    return new Error(`invalid instance id "${id}"`)
  }
}

export default function init (config) {
  Object.assign(runtimeConfig, config)

  initTaskHandler()

  // Init each framework by `init` method and `config` which contains three
  // virtual-DOM Class: `Document`, `Element` & `Comment`, and a JS bridge method:
  // `sendTasks(...args)`.
  const frameworks = runtimeConfig.frameworks || {}
  for (const name in frameworks) {
    const framework = frameworks[name]
    framework.init(config)
  }

  adaptMethod('registerComponents', registerComponents)
  adaptMethod('registerModules', registerModules)
  adaptMethod('registerMethods')

  // TODO: deprecated
  ; ['receiveTasks', 'getRoot'].forEach(genInstance)

  // adapt instance
  methods.callJS = methods.receiveTasks

  return methods
}
