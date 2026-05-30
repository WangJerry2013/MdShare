'use strict'

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('Users', 'isAdmin', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    }).catch(function (error) {
      if (error.message.toLowerCase().includes('duplicate column name') ||
        error.message.includes('column \"isAdmin\" of relation \"Users\" already exists') ||
        error.message.includes('already exists')) {
        console.log('Migration has already run… ignoring.')
      } else {
        throw error
      }
    })
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('Users', 'isAdmin')
  }
}
