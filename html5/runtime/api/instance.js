import { services, createServices } from './service'
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

  // default bundle type
  return 'Weex'
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

  const context = {
    config,
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
  services.forEach(service => {
    const refresh = service.options.refresh
    if (refresh) {
      refresh(id, {
        info: { framework: type },
        runtime: getRuntimeConfig()
      })
    }
  })

  const runtimeConfig = getRuntimeConfig()
  const fm = runtimeConfig.frameworks[type]
  if (!fm) {
    return new Error(`invalid bundle type "${type}".`)
  }

  return fm.refreshInstance(id, ...args)
}

export function destroyInstance (id, ...args) {
  delete instanceMap[id]
  const type = getFrameworkType(id)
  services.forEach(service => {
    const destroy = service.options.destroy
    if (destroy) {
      destroy(id, {
        info: { framework: type },
        runtime: getRuntimeConfig()
      })
    }
  })

  const runtimeConfig = getRuntimeConfig()
  const fm = runtimeConfig.frameworks[type]
  if (!fm) {
    return new Error(`invalid bundle type "${type}".`)
  }

  return fm.destroyInstance(id, ...args)
}
