const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(user.id,expectedUserID);
  });

  it('should return undefined for a user that is not in the database', function() {
    const user = getUserByEmail("blabla@gmail.com", testUsers);
    assert.strictEqual(user, undefined);
  });

  it('should return undefined if an email is not provided', function() {
    const user = getUserByEmail("", testUsers);
    assert.strictEqual(user, undefined);
  });
});