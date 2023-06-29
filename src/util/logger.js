const TYPE_ERROR = '[custom error]'
const TYPE_DEBUG = '[custom debug]'
const TYPE_INFO = '[custom info]'
const TYPE_WARN = '[custom warn]'

/**
 * 输出异常信息
 * @param args
 */
function error(...args) {
    console.error(TYPE_ERROR, ...args)
}

/**
 * 输出调试信息
 * @param args
 */
function debug(...args) {
    console.debug(TYPE_DEBUG, ...args)
}

/**
 * 输出日志信息
 * @param args
 */
function info(...args) {
    console.info(TYPE_INFO, ...args)
}

/**
 * 输出警告信息
 * @param args
 */
function warn(...args) {
    console.warn(TYPE_WARN, ...args)
}

export default {
    error,
    debug,
    info,
    warn
}
