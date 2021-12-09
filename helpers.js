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

// Creates a new urlDatabase entry, or edits an existing entry
const makeEditURL = function(userID, urlDB, longURL, shortURL) {
  const date = new Date;
  if (!urlDB[shortURL]) {
    urlDB[shortURL] = {
      longURL: 'http://www.' + longURL,
      userID,
      date: date.toUTCString(),
      visits: 0,
      visitors: [],
      datesvisited: []
    };
  } else {
    urlDB[shortURL].longURL = 'http://www.' + longURL;
  }
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

const validateShortURL = function(url,urlDB) {
  for (const shortURL in urlDB) {
    if (url === shortURL) {
      return true;
    }
  }
  return false;
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

const analytics = function(urlDatabase, userID, shortURL) {
  const date = new Date;
  urlDatabase[shortURL].visits += 1;
  if (!urlDatabase[shortURL].visitors.includes(userID)) {
    if (!userID) {
      // Can't quite figure out how to actually set a unique cookie on the client, so I'm just assigning them a uniqueID if theyre not signed in on tinyApp
      userID = generateRandomString();
    }
    urlDatabase[shortURL].visitors.push(userID);
  }
  urlDatabase[shortURL].datesvisited.push("Date Visited: " + date.toUTCString() + " | User: " + userID);
};

module.exports = {
  generateRandomString,
  validateEmail,
  validatePassword,
  makeEditURL,
  getURL,
  validateShortURL,
  getUserByEmail,
  grabThemByTheCookie,
  analytics
};

