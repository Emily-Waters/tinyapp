//------------------------------CONSTANTS---------------------------------------

const PORT = 8080; // Default port 8080
const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const app = express();
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');


// urlDatabase, urls have an id(shortURL) key that contains a longURL and the userID of who created it
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const userDatabase = {
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

//------------------------------FUNCTIONS---------------------------------------

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

// Looks up unique userID by email, assumes security checks have been passed
const getIDByEmail = function(email, userDB) {
  for (const userID in userDB)
    if (userDB[userID].email === email) {
      return userDB[userID].id;
    }
};

// Filters urlDatabase using userID
const getURLByID = function(id, urlDB) {
  const userURLs = {};
  for (const shortURL in urlDB) {
    if (urlDB[shortURL].userID === id) {
      userURLs[shortURL] = urlDB[shortURL];
    }
  }
  return userURLs;
};

// Creates a new urlDatabase entry tied to a given userID
const makeURLDBEntry = function(userID, urlDB, longURL, encodedString) {
  urlDB[encodedString] = {longURL: `http://www.${longURL}`, userID: userID};
};


//------------------------------APP SETUP---------------------------------------

app.set('view engine', 'ejs');  // Setting the view engine as ejs

app.use(bodyParser.urlencoded({extended: true})); // Parse encoded URL's

// app.use(cookieParser()); // Cookie Parser decodes cookies

app.use(cookieSession({  // Cookie Session stores session cookies on the client
  name: 'session',
  keys: ['user_id'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(morgan('tiny'));  // Logs pertinent info to the console

//------------------------------CONNECT-----------------------------------------

app.listen(PORT, () => {  // Begin listening on port 8080
  console.log(`tinyapp listening on port ${PORT}!`);
});

//------------------------------GET ROUTES--------------------------------------

// Homepage
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {
    urls: getURLByID(userID, urlDatabase),
    "user_id": userDatabase[userID]
  };
  console.log(templateVars);
  res.render("urls_index", templateVars);
});

// Register new user
app.get("/register", (req, res) => {
  const userID = userDatabase[req.session.user_id];
  const templateVars = {
    "user_id": userID
  };
  res.render("urls_register", templateVars);
});

// User login
app.get("/login", (req, res) => {
  const templateVars = {
    "user_id": userDatabase[req.session.user_id]
  };
  res.render("urls_login",templateVars);
});

// New URLs page
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    const templateVars = {
      "user_id": userDatabase[userID],
    };
    res.render("urls_new",templateVars);
  } else {
    res.redirect('/login');
  }
});

// Show a URL by its shortURL
app.get("/urls/:shortUrl", (req, res) => {
  const shortURL = req.params.shortUrl;
  const longURL = urlDatabase[req.params.shortUrl].longURL;
  const userID = req.session.user_id;
  console.log(userID);
  if (userID) {
    const templateVars = {
      shortURL,
      longURL,
      "user_id": userID
    };
    res.render("urls_show",templateVars);
  } else {
    res.redirect("/login");
  }
});

// Redirects to actual site using shortURL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send("404 - Not Found");
  }
});

//------------------------------POST ROUTES-------------------------------------

// Register new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("Password: ",password);
  const hashedPassword = bcrypt.hashSync(password, 10);
  console.log("HashedPassword: ",hashedPassword);
  if (!validateEmail(email, userDatabase) && password && email) {
    const userID = generateRandomString();
    userDatabase[userID] = {
      id: userID,
      email,
      password: hashedPassword
    };
    req.session.user_id = userID;
    // res.cookie("user_id", userID);
    res.redirect("/urls");
  } else if (validateEmail(email, userDatabase)) {
    res.status(400).send("That email address is already in use\n");
  } else {
    res.status(400).send("Invalid email or password\n");
  }
});

// Login user
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (validateEmail(email, userDatabase) && validatePassword(password, email, userDatabase)) {
    const userID = getIDByEmail(email,userDatabase);
    req.session.user_id = userID;
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid email or password\n");
  }
});

// Logout user
app.post("/logout/:user_id", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// POST request for new URL's, redirects to urls_show
app.post("/urls", (req, res) => {
  const encodeString = generateRandomString();
  const userID = req.session.user_id;
  const longURL = req.body.longURL;
  makeURLDBEntry(userID, urlDatabase, longURL, encodeString);
  res.redirect('/urls/' + encodeString);
});

// Delete URL then redirect back to homepage
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (userID && userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("You do not have permission to delete, please login first\n");
  }
});

// Edit a URL, then redirect back to homepage
app.post("/urls/:shortURL/edit", (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  console.log(longURL);
  if (userID && userID === urlDatabase[shortURL].userID) {
    console.log(urlDatabase);
    makeURLDBEntry(userID, urlDatabase, longURL, shortURL);
    console.log(urlDatabase);
    res.redirect("/urls");
  } else {
    res.status(403).send("You do not have permission to edit, please login first\n");
  }
});







