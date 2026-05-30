'use strict'

const errors = require('../../errors')

module.exports = function requireAdmin (req, res, next) {
  if (!req.isAuthenticated()) {
    return errors.errorForbidden(res)
  }
  if (!req.user.isAdmin) {
    return errors.errorForbidden(res)
  }
  next()
}
