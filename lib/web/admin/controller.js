'use strict'

const models = require('../../models')
const config = require('../../config')
const logger = require('../../logger')
const errors = require('../../errors')

// Helper to check admin access
function isAdmin (req) {
  return req.isAuthenticated() && req.user.isAdmin
}

function renderAdmin (req, res, view, data) {
  data.serverURL = config.serverURL
  data.isAdmin = true
  res.render('admin/' + view + '.ejs', data)
}

// GET /admin - Dashboard
exports.dashboard = function (req, res) {
  Promise.all([
    models.User.count(),
    models.Note.count(),
    models.Revision.count(),
    models.Note.findAll({
      attributes: ['id', 'title', 'createdAt', 'updatedAt', 'ownerId', 'lastchangeuserId'],
      order: [['updatedAt', 'DESC']],
      limit: 10,
      include: [
        { model: models.User, as: 'owner', attributes: ['email'] },
        { model: models.User, as: 'lastchangeuser', attributes: ['email'] }
      ]
    })
  ]).then(function (results) {
    // Check default password separately — never let this break the dashboard
    var passwordCheck = Promise.resolve(false)
    try {
      if (req.user && req.user.password) {
        passwordCheck = req.user.verifyPassword('12345678')
      }
    } catch (e) {
      passwordCheck = Promise.resolve(false)
    }
    return passwordCheck.then(function (needsPasswordChange) {
      renderAdmin(req, res, 'dashboard', {
        totalUsers: results[0],
        totalNotes: results[1],
        totalRevisions: results[2],
        recentNotes: results[3],
        needsPasswordChange: needsPasswordChange,
        currentUserId: req.user.id
      })
    })
  }).catch(function (err) {
    logger.error('Admin dashboard error: ' + err)
    errors.errorInternalError(res)
  })
}

// GET /admin/users - List all users
exports.users = function (req, res) {
  models.User.findAll({
    attributes: ['id', 'email', 'isAdmin', 'createdAt', 'updatedAt'],
    order: [['createdAt', 'DESC']]
  }).then(function (users) {
    // For each user, get their note count and last active time
    const userPromises = users.map(function (user) {
      return Promise.all([
        models.Note.count({ where: { ownerId: user.id } }),
        models.Note.findOne({
          where: { lastchangeuserId: user.id },
          attributes: ['updatedAt'],
          order: [['updatedAt', 'DESC']]
        })
      ]).then(function (stats) {
        return {
          id: user.id,
          email: user.email || '(no email)',
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          noteCount: stats[0],
          lastActive: stats[1] ? stats[1].updatedAt : null
        }
      })
    })
    return Promise.all(userPromises)
  }).then(function (userData) {
    renderAdmin(req, res, 'users', { users: userData })
  }).catch(function (err) {
    logger.error('Admin users list error: ' + err)
    errors.errorInternalError(res)
  })
}

// GET /admin/users/:id - View single user with notes
exports.userDetail = function (req, res) {
  models.User.findOne({
    where: { id: req.params.id },
    attributes: ['id', 'email', 'isAdmin', 'createdAt', 'updatedAt']
  }).then(function (user) {
    if (!user) {
      return errors.errorNotFound(res)
    }
    models.Note.findAll({
      where: { ownerId: user.id },
      attributes: ['id', 'shortid', 'title', 'alias', 'permission', 'viewcount', 'createdAt', 'updatedAt', 'lastchangeAt'],
      order: [['updatedAt', 'DESC']],
      include: [
        { model: models.User, as: 'lastchangeuser', attributes: ['email'] }
      ]
    }).then(function (notes) {
      // Get revision count for each note
      const notePromises = notes.map(function (note) {
        return models.Revision.count({ where: { noteId: note.id } }).then(function (count) {
          return {
            id: note.id,
            shortid: note.shortid,
            title: note.title,
            alias: note.alias,
            viewcount: note.viewcount,
            permission: note.permission,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            lastchangeAt: note.lastchangeAt,
            lastEditor: note.lastchangeuser ? note.lastchangeuser.email : null,
            revisionCount: count
          }
        })
      })
      return Promise.all(notePromises).then(function (noteData) {
        renderAdmin(req, res, 'user', {
          user: {
            id: user.id,
            email: user.email || '(no email)',
            isAdmin: user.isAdmin,
            createdAt: user.createdAt
          },
          notes: noteData
        })
      })
    })
  }).catch(function (err) {
    logger.error('Admin user detail error: ' + err)
    errors.errorInternalError(res)
  })
}

// GET /admin/users/create - Show create user form
exports.createUserForm = function (req, res) {
  renderAdmin(req, res, 'createUser', {})
}

// POST /admin/users/create - Create a new user
exports.createUser = function (req, res) {
  var email = (req.body.email || '').trim()
  var password = req.body.password || ''
  var isAdmin = req.body.isAdmin === 'true'

  if (!email) {
    return renderAdmin(req, res, 'createUser', { error: 'Email is required.' })
  }
  if (!password || password.length < 6) {
    return renderAdmin(req, res, 'createUser', { error: 'Password must be at least 6 characters.' })
  }

  models.User.findOne({ where: { email: email } }).then(function (existing) {
    if (existing) {
      return renderAdmin(req, res, 'createUser', { error: 'A user with this email already exists.' })
    }
    return models.User.create({
      email: email,
      password: password,
      isAdmin: isAdmin
    }).then(function () {
      res.redirect(config.serverURL + '/admin/users')
    })
  }).catch(function (err) {
    logger.error('Admin create user error: ' + err)
    renderAdmin(req, res, 'createUser', { error: 'Failed to create user: ' + err.message })
  })
}

// GET /admin/users/:id/change-password - Show change password form
exports.changePasswordForm = function (req, res) {
  models.User.findOne({
    where: { id: req.params.id },
    attributes: ['id', 'email', 'isAdmin']
  }).then(function (user) {
    if (!user) {
      return errors.errorNotFound(res)
    }
    renderAdmin(req, res, 'changePassword', {
      targetUser: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      }
    })
  }).catch(function (err) {
    logger.error('Admin change password form error: ' + err)
    errors.errorInternalError(res)
  })
}

// POST /admin/users/:id/change-password - Process password change
exports.changePassword = function (req, res) {
  var userId = req.params.id
  var newPassword = req.body.password || ''
  var confirmPassword = req.body.confirmPassword || ''

  function renderForm (data) {
    models.User.findOne({
      where: { id: userId },
      attributes: ['id', 'email', 'isAdmin']
    }).then(function (user) {
      if (!user) return errors.errorNotFound(res)
      data.targetUser = { id: user.id, email: user.email, isAdmin: user.isAdmin }
      renderAdmin(req, res, 'changePassword', data)
    }).catch(function (err) {
      logger.error('Admin change password error: ' + err)
      errors.errorInternalError(res)
    })
  }

  if (!newPassword || newPassword.length < 6) {
    return renderForm({ error: 'Password must be at least 6 characters.' })
  }
  if (newPassword !== confirmPassword) {
    return renderForm({ error: 'Passwords do not match.' })
  }

  models.User.findOne({ where: { id: userId } }).then(function (user) {
    if (!user) return errors.errorNotFound(res)
    return user.update({ password: newPassword }).then(function () {
      renderForm({ success: 'Password changed successfully.' })
    })
  }).catch(function (err) {
    logger.error('Admin change password error: ' + err)
    renderForm({ error: 'Failed to change password.' })
  })
}

// POST /admin/users/:id/delete - Delete a user
exports.deleteUser = function (req, res) {
  var userId = req.params.id

  // Don't allow deleting your own account
  if (req.user.id === userId) {
    req.flash('error', 'You cannot delete your own account.')
    return res.redirect(config.serverURL + '/admin/users')
  }

  // Reassign notes owned by this user to anonymous
  models.Note.update({ ownerId: null, lastchangeuserId: null }, { where: { ownerId: userId } }).then(function () {
    return models.User.destroy({ where: { id: userId } })
  }).then(function () {
    res.redirect(config.serverURL + '/admin/users')
  }).catch(function (err) {
    logger.error('Admin delete user error: ' + err)
    req.flash('error', 'Failed to delete user.')
    res.redirect(config.serverURL + '/admin/users')
  })
}

// POST /admin/notes/:id/delete - Delete a note and its revisions
exports.deleteNote = function (req, res) {
  var noteId = req.params.id

  // Delete associated data first, then the note
  models.Revision.destroy({ where: { noteId: noteId } }).then(function () {
    return models.Author.destroy({ where: { noteId: noteId } })
  }).then(function () {
    return models.Note.destroy({ where: { id: noteId } })
  }).then(function () {
    var referer = req.get('Referer') || config.serverURL + '/admin/notes'
    res.redirect(referer)
  }).catch(function (err) {
    logger.error('Admin delete note error: ' + err)
    req.flash('error', 'Failed to delete note.')
    res.redirect(config.serverURL + '/admin/notes')
  })
}

// POST /admin/users/batch-delete - Batch delete users
exports.batchDeleteUsers = function (req, res) {
  var ids = req.body.selectedIds
  if (!ids) {
    return res.redirect(config.serverURL + '/admin/users')
  }
  // Normalize to array (single checkbox sends string)
  if (!Array.isArray(ids)) ids = [ids]

  // Filter out current user
  ids = ids.filter(function (id) { return id !== req.user.id })

  if (ids.length === 0) {
    return res.redirect(config.serverURL + '/admin/users')
  }

  // Reassign notes owned by these users to anonymous, then delete users
  var currentIdx = 0
  function deleteNext () {
    if (currentIdx >= ids.length) {
      return res.redirect(config.serverURL + '/admin/users')
    }
    var userId = ids[currentIdx++]
    models.Note.update({ ownerId: null, lastchangeuserId: null }, { where: { ownerId: userId } }).then(function () {
      return models.User.destroy({ where: { id: userId } })
    }).then(deleteNext).catch(function (err) {
      logger.error('Admin batch delete user error: ' + err)
      deleteNext()
    })
  }
  deleteNext()
}

// POST /admin/notes/batch-delete - Batch delete notes
exports.batchDeleteNotes = function (req, res) {
  var ids = req.body.selectedIds
  if (!ids) {
    return res.redirect(config.serverURL + '/admin/notes')
  }
  if (!Array.isArray(ids)) ids = [ids]

  var currentIdx = 0
  function deleteNext () {
    if (currentIdx >= ids.length) {
      return res.redirect(config.serverURL + '/admin/notes')
    }
    var noteId = ids[currentIdx++]
    models.Revision.destroy({ where: { noteId: noteId } }).then(function () {
      return models.Author.destroy({ where: { noteId: noteId } })
    }).then(function () {
      return models.Note.destroy({ where: { id: noteId } })
    }).then(deleteNext).catch(function (err) {
      logger.error('Admin batch delete note error: ' + err)
      deleteNext()
    })
  }
  deleteNext()
}

// GET /admin/notes - List all notes
exports.notes = function (req, res) {
  models.Note.findAll({
    attributes: ['id', 'shortid', 'title', 'alias', 'permission', 'viewcount', 'createdAt', 'updatedAt', 'lastchangeAt'],
    order: [['updatedAt', 'DESC']],
    include: [
      { model: models.User, as: 'owner', attributes: ['email'] },
      { model: models.User, as: 'lastchangeuser', attributes: ['email'] }
    ]
  }).then(function (notes) {
    const notePromises = notes.map(function (note) {
      return models.Revision.count({ where: { noteId: note.id } }).then(function (count) {
        return {
          id: note.id,
          shortid: note.shortid,
          title: note.title,
          alias: note.alias,
          viewcount: note.viewcount,
          permission: note.permission,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          lastchangeAt: note.lastchangeAt,
          ownerEmail: note.owner ? note.owner.email : '(anonymous)',
          lastEditorEmail: note.lastchangeuser ? note.lastchangeuser.email : '(anonymous)',
          revisionCount: count
        }
      })
    })
    return Promise.all(notePromises)
  }).then(function (noteData) {
    renderAdmin(req, res, 'notes', { notes: noteData })
  }).catch(function (err) {
    logger.error('Admin notes list error: ' + err)
    errors.errorInternalError(res)
  })
}
