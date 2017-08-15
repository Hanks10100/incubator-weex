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

// JS Services
export const services = []

/**
 * Register a JavaScript service.
 * A JavaScript service options could have a set of lifecycle methods
 * for each Weex instance. For example: create, refresh, destroy.
 * For the JS framework maintainer if you want to supply some features
 * which need to work well in different Weex instances, even in different
 * frameworks separately. You can make a JavaScript service to init
 * its variables or classes for each Weex instance when it's created
 * and recycle them when it's destroyed.
 * @param {object} options Could have { create, refresh, destroy }
 *                         lifecycle methods. In create method it should
 *                         return an object of what variables or classes
 *                         would be injected into the Weex instance.
 */
export function registerService (name, options) {
  if (hasService(name)) {
    console.warn(`Service "${name}" has been registered already!`)
  }
  else {
    options = Object.assign({}, options)
    services.push({ name, options })
  }
}

/**
 * Unregister a JavaScript service by name
 * @param {string} name
 */
export function unregisterService (name) {
  services.some((service, index) => {
    if (service.name === name) {
      services.splice(index, 1)
      return true
    }
  })
}

/**
 * Check if a JavaScript service with a certain name existed.
 * @param  {string}  name
 * @return {Boolean}
 */
export function hasService (name) {
  return services.map(service => service.name).indexOf(name) >= 0
}

/**
 * Generate service map
 */
export function createServices (id, env, config) {
  // Init JavaScript services for this instance.
  const serviceMap = Object.create(null)
  serviceMap.service = Object.create(null)
  services.forEach(({ name, options }) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[JS Runtime] create service ${name}.`)
    }
    const create = options.create
    if (create) {
      const result = create(id, env, config)
      Object.assign(serviceMap.service, result)
      Object.assign(serviceMap, result.instance)
    }
  })
  delete serviceMap.service.instance
  Object.freeze(serviceMap.service)
  return serviceMap
}

export function refreshServices (id, env, config) {
  services.forEach(service => {
    const refresh = service.options.refresh
    if (typeof refresh === 'function') {
      refresh(id, env, config)
    }
  })
}

export function destroyServices (id, env, config) {
  services.forEach(service => {
    const destroy = service.options.destroy
    if (typeof destroy === 'function') {
      destroy(id, env, config)
    }
  })
}
