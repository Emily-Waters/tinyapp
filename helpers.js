const bcrypt = require('bcryptjs');

// Generate encoded string
const generateRandomString = function() {

  let encodeString = '';
  let randomNumber = (Math.floor((Math.random() * 122) + 1));

  while (encodeString.length < 6) {
    randomNumber = (Math.floor((Math.random() * 122) + 1));
    if (randomNumber >= 48 && randomNumber <= 57 || randomNumber >= 65 && randomNumber <= 90 || randomNumber >= 97 && randomNumber <= 122) {
      encodeString += String.fromCharCode(randomNumber);
    }
  }
  return encodeString;
};

// Check for user provided email address in user database
const validateEmail = function(email, userDB) {
  for (const userID in userDB) {
    if (userDB[userID].email === email) {
      return true;
    }
  }
  return false;
};

// Check user password matches email
const validatePassword = function(password, email, userDB) {
  for (const userID in userDB) {
    if (userDB[userID].email === email && bcrypt.compareSync(password,userDB[userID].password)) {
      return true;
    }
  }
  return false;
};

// Creates a new urlDatabase entry tied to a given userID
const makeURL = function(userID, urlDB, longURL, encodedString) {
  urlDB[encodedString] = {longURL: `http://www.${longURL}`, userID: userID};
};

// Filters urlDatabase using userID
const getURL = function(id, urlDB) {
  const userURLs = {};
  for (const shortURL in urlDB) {
    if (urlDB[shortURL].userID === id) {
      userURLs[shortURL] = urlDB[shortURL];
    }
  }
  return userURLs;
};

// Looks up unique userID by email, assumes security checks have been passed
const getUserByEmail = function(email, userDB) {
  for (const userID in userDB)
    if (userDB[userID].email === email) {
      return userDB[userID];
    }
};

// Cookie grabber
const grabThemByTheCookie = function(req)  {
  return req.session.user_id;
};

module.exports = {
  generateRandomString,
  validateEmail,
  validatePassword,
  makeURL,
  getURL,
  getUserByEmail,
  grabThemByTheCookie
};