'use strict'

const Router = require('express').Router
const router = module.exports = Router()

const requireAdmin = require('../middleware/requireAdmin')
const controller = require('./controller')
const { urlencodedParser } = require('../utils')

// All admin routes require admin authentication
router.use(requireAdmin)

router.get('/admin', controller.dashboard)
router.get('/admin/users', controller.users)
router.get('/admin/users/create', controller.createUserForm)
router.post('/admin/users/create', urlencodedParser, controller.createUser)
router.get('/admin/users/:id', controller.userDetail)
router.get('/admin/users/:id/change-password', controller.changePasswordForm)
router.post('/admin/users/:id/change-password', urlencodedParser, controller.changePassword)
router.post('/admin/users/:id/delete', urlencodedParser, controller.deleteUser)
router.get('/admin/users/:id/delete', controller.deleteUser)
router.post('/admin/users/batch-delete', urlencodedParser, controller.batchDeleteUsers)
router.post('/admin/notes/:id/delete', urlencodedParser, controller.deleteNote)
router.get('/admin/notes/:id/delete', controller.deleteNote)
router.post('/admin/notes/batch-delete', urlencodedParser, controller.batchDeleteNotes)
router.get('/admin/notes', controller.notes)
