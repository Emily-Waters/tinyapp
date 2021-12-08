// Looks up unique userID by email, assumes security checks have been passed
const getIDByEmail = function(email, userDB) {
  for (const userID in userDB)
    if (userDB[userID].email === email) {
      return userDB[userID].id;
    }
};

module.exports = {
  getIDByEmail
};