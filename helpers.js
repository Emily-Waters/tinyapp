const bcrypt = require('bcryptjs');

// Generate encoded string
// Not bothering to check if the string is unique, as the odds of it being nonunique are astronomical, however perhaps this could be like Y2K all over again. Something to come back and fix later.
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

// Make a new longURL
const makeURL = function(userID, urlDB, longURL, shortURL) {
  const date = new Date;
  urlDB[shortURL] = {
    longURL: longURL,
    userID,
    date: date.toUTCString(),
    visits: 0,
    visitors: [],
    datesvisited: []
  };
};

// Edit the longURL of an existing URL
const editURL = function(urlDatabase, longURL, shortURL) {
  urlDatabase[shortURL].longURL = longURL;
};

// Filters urlDatabase using userID
const getURL = function(userID, urlDatabase) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === userID) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

// Check if the specified shortURL exists in the database
const validateShortURL = function(shortURL, urlDatabase) {
  if (urlDatabase[shortURL]) {
    return true;
  }
  return false;
};

const validateUser = function(userID, urlDatabase, shortURL) {
  if (urlDatabase[shortURL].userID === userID) {
    return true;
  }
  return false;
};

// Looks up unique userID by email, assumes security checks have been passed
const getUserByEmail = function(email, userDatabase) {
  for (const userID in userDatabase)
    if (userDatabase[userID].email === email) {
      return userDatabase[userID];
    }
};

// Cookie grabber
const grabCookies = function(req)  {
  return req.session.user_id;
};

// Tracks information on how many times a shortURL was visited, unique visitors and the datetime visited and by whom
const analytics = function(urlDatabase, userID, shortURL) {
  const date = new Date;
  urlDatabase[shortURL].visits += 1;
  if (!urlDatabase[shortURL].visitors.includes(userID)) {
    urlDatabase[shortURL].visitors.push(userID);
  }
  urlDatabase[shortURL].datesvisited.push("Date Visited: " + date.toUTCString() + " | User: " + userID);
};

module.exports = {
  generateRandomString,
  validateEmail,
  validatePassword,
  makeURL,
  editURL,
  getURL,
  validateShortURL,
  validateUser,
  getUserByEmail,
  grabCookies,
  analytics
};

