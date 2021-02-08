// nodebb-plugin-newsletter
// Require modules from NodeBB

const nodebb = path => require.main.require(path)

exports.SocketAdmin = nodebb('./src/socket.io/admin')

exports.db = nodebb('./src/database')
exports.Emailer = nodebb('./src/emailer')
exports.Meta = nodebb('./src/meta')
exports.Plugins = nodebb('./src/plugins')
exports.User = nodebb('./src/user')

exports.async = nodebb('async')
exports.nconf = nodebb('nconf')
exports.winston = nodebb('winston')
exports.jwt = nodebb('jsonwebtoken')
exports.url = nodebb('url')
exports.util = nodebb('util')
