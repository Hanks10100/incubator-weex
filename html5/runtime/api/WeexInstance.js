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

import { isRegisteredModule, getModuleDescription } from './module'
import { isRegisteredComponent } from './component'

const moduleProxys = {}

// const instanceIdMap = new WeakMap()
// function setId (weex, id) { instanceIdMap.set(weex, id) }
// function getId (weex) { return instanceIdMap.get(weex) }

function setId (weex, id) {
  Object.defineProperty(weex, '[[currentInstanceId]]', { value: id })
}
function getId (weex) { return weex['[[currentInstanceId]]'] }

export default class WeexInstance {
  constructor (id, options) {
    setId(this, id)
    this.document = null
  }

  requireModule (name) {
    const id = getId(this)
    if (!(id && this.document && this.document.taskCenter)) {
      console.error(`[JS Framework] invalid instance id "${id}"`)
      return null
    }

    // warn for unknown module
    if (!isRegisteredModule(name)) {
      console.warn(`[JS Framework] using unregistered weex module "${name}"`)
      return null
    }

    // create new module proxy
    if (!moduleProxys[name]) {
      moduleProxys[name] = {}
      const moduleApis = getModuleDescription(name)
      const taskCenter = this.document.taskCenter
      for (const methodName in moduleApis) {
        Object.defineProperty(moduleProxys[name], methodName, {
          enumerable: true,
          configurable: true,
          get () {
            return (...args) => {
              return taskCenter.send('module', {
                module: name,
                method: methodName
              }, args)
            }
          },
          set (fn) {
            if (typeof fn === 'function') {
              return taskCenter.send('module', {
                module: name,
                method: methodName
              }, [fn])
            }
          }
        })
      }
    }

    return moduleProxys[name]
  }

  supports (condition) {
    if (typeof condition !== 'string') return null

    const res = condition.match(/^@(\w+)\/(\w+)(\.(\w+))?$/i)
    if (res) {
      const type = res[1]
      const name = res[2]
      const method = res[4]
      switch (type) {
        case 'module': return isRegisteredModule(name, method)
        case 'component': return isRegisteredComponent(name)
      }
    }

    return null
  }

  // registerStyleSheet (styles) {
  //   if (this.document) {
  //     this.document.registerStyleSheet(styles)
  //   }
  // }
}
