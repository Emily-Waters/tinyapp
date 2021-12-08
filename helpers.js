// Looks up unique userID by email, assumes security checks have been passed
const getUserByEmail = function(email, userDB) {
  for (const userID in userDB)
    if (userDB[userID].email === email) {
      return userDB[userID];
    }
};

module.exports = {
  getUserByEmail
};