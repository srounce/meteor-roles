;(function () {

  var users = {},
      roles = ['admin','editor','user']


  function addUser (name) {
    return Accounts.createUser({'username': name})
  }

  function reset () {
    Meteor.roles.remove({})
    Meteor.users.remove({})

    users = {
      'eve': addUser('eve'),
      'bob': addUser('bob'),
      'joe': addUser('joe')
    }
  }


  function testUser (test, user, expectedRoles) {
    var userId = users[user]

    _.each(roles, function (role) {
      var expected = expectedRoles.indexOf(role) !== -1,
          msg = user + ' is not in expected role ' + role,
          nmsg = user + ' is in un-expected role ' + role

      if (expected) {
        test.isTrue(Roles.isUserInRole(userId, role), msg)
      } else {
        test.isFalse(Roles.isUserInRole(userId, role), nmsg)
      }
    })
  }

  Tinytest.add('can create and delete roles', function (test) {
    reset()

    Roles.createRole('test1')
    test.equal(Meteor.roles.findOne().name, 'test1')

    Roles.createRole('test2')
    test.equal(Meteor.roles.findOne({'name':'test2'}).name, 'test2')

    test.equal(Meteor.roles.find().count(), 2)

    Roles.deleteRole('test1')
    test.equal(typeof Meteor.roles.findOne({'name':'test1'}), 'undefined')

    Roles.deleteRole('test2')
    test.equal(typeof Meteor.roles.findOne(), 'undefined')
  })

  Tinytest.add('can\'t create duplicate roles', function (test) {
    reset()

    Roles.createRole('test1')
    test.throws(function () {Roles.createRole('test1')})
  })

  Tinytest.add('can check if user is in role', function (test) {
    reset()

    Meteor.users.update(
      {"_id":users.eve}, 
      {$addToSet: { roles: { $each: ['admin', 'user'] } } }
    )
    testUser(test, 'eve', ['admin', 'user'])
  })

  Tinytest.add('can check if non-existant user is in role', function (test) {
    reset()

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    test.isFalse(Roles.isUserInRole('1', 'admin'))
  })

  Tinytest.add('can add individual users to roles', function (test) {
    reset() 

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    Roles.addUsersToRoles(users.eve, ['admin', 'user'])

    testUser(test, 'eve', ['admin', 'user'])
    testUser(test, 'bob', [])
    testUser(test, 'joe', [])

    Roles.addUsersToRoles(users.joe, ['editor', 'user'])

    testUser(test, 'eve', ['admin', 'user'])
    testUser(test, 'bob', [])
    testUser(test, 'joe', ['editor', 'user'])
  })
  Tinytest.add('can add user to roles multiple times', function (test) {
    reset() 

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    Roles.addUsersToRoles(users.eve, ['admin', 'user'])
    Roles.addUsersToRoles(users.eve, ['admin', 'user'])

    testUser(test, 'eve', ['admin', 'user'])
    testUser(test, 'bob', [])
    testUser(test, 'joe', [])
  })

  Tinytest.add('can add multiple users to roles', function (test) {
    reset() 

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    Roles.addUsersToRoles([users.eve, users.bob], ['admin', 'user'])

    testUser(test, 'eve', ['admin', 'user'])
    testUser(test, 'bob', ['admin', 'user'])
    testUser(test, 'joe', [])

    Roles.addUsersToRoles([users.bob, users.joe], ['editor', 'user'])

    testUser(test, 'eve', ['admin', 'user'])
    testUser(test, 'bob', ['admin', 'editor', 'user'])
    testUser(test, 'joe', ['editor', 'user'])
  })

  Tinytest.add('can\'t add non-exist user to role', function (test) {
    reset()

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    Roles.addUsersToRoles(['1'], ['admin'])
    test.equal(Meteor.users.findOne({_id:'1'}), undefined)
  })

  Tinytest.add('can remove individual users from roles', function (test) {
    reset() 

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    // remove user role - one user
    Roles.addUsersToRoles([users.eve, users.bob], ['editor', 'user'])
    testUser(test, 'eve', ['editor', 'user'])
    testUser(test, 'bob', ['editor', 'user'])
    Roles.removeUsersFromRoles(users.eve, ['user'])
    testUser(test, 'eve', ['editor'])
    testUser(test, 'bob', ['editor', 'user'])
  })
  Tinytest.add('can remove user from roles multiple times', function (test) {
    reset() 

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    // remove user role - one user
    Roles.addUsersToRoles([users.eve, users.bob], ['editor', 'user'])
    testUser(test, 'eve', ['editor', 'user'])
    testUser(test, 'bob', ['editor', 'user'])
    Roles.removeUsersFromRoles(users.eve, ['user'])
    testUser(test, 'eve', ['editor'])
    testUser(test, 'bob', ['editor', 'user'])

    // try remove again
    Roles.removeUsersFromRoles(users.eve, ['user'])
    testUser(test, 'eve', ['editor'])
  })

  Tinytest.add('can remove multiple users from roles', function (test) {
    reset() 

    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    // remove user role - two users
    Roles.addUsersToRoles([users.eve, users.bob], ['editor', 'user'])
    testUser(test, 'eve', ['editor', 'user'])
    testUser(test, 'bob', ['editor', 'user'])

    test.isFalse(Roles.isUserInRole(users.joe, 'admin'))
    Roles.addUsersToRoles([users.bob, users.joe], ['admin', 'user'])
    testUser(test, 'bob', ['admin', 'user', 'editor'])
    testUser(test, 'joe', ['admin', 'user'])
    Roles.removeUsersFromRoles([users.bob, users.joe], ['admin'])
    testUser(test, 'bob', ['user', 'editor'])
    testUser(test, 'joe', ['user'])
  })

  Tinytest.add('can\'t create role with empty names', function (test) {
    reset() 

    Roles.createRole('')
    Roles.createRole(null)

    test.equal(Meteor.roles.find().count(), 0)

    Roles.createRole(' ')
    test.equal(Meteor.roles.find().count(), 0)
  })

  Tinytest.add('can get all roles for user', function (test) {
    reset()
    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    Roles.addUsersToRoles([users.eve], ['admin', 'user'])
    test.equal(Roles.getRolesForUser(users.eve), ['admin', 'user'])
  })

  Tinytest.add('can\'t get roles for non-existant user', function (test) {
    reset()
    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    test.equal(Roles.getRolesForUser('1'), undefined)
  })

  Tinytest.add('can get all roles', function (test) {
    reset()
    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    // compare roles, sorted alphabetically
    var expected = roles,
        actual = _.pluck(Roles.getAllRoles().fetch(), 'name')

    test.equal(actual, expected)
  })


  Tinytest.add('can get all users in role', function (test) {
    reset()
    _.each(roles, function (role) {
      Roles.createRole(role)
    })

    Roles.addUsersToRoles([users.eve, users.joe], ['admin', 'user'])
    Roles.addUsersToRoles([users.bob, users.joe], ['editor'])

    var expected = [users.eve, users.joe],
        actual = _.pluck(Roles.getUsersInRole('admin').fetch(), '_id')

    // order may be different so check difference instead of equality
    test.equal(_.difference(actual, expected), [])
  })

}());
