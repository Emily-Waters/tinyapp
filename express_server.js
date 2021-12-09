//------------------------------DEPENDENCY IMPORT-------------------------------

const methodOverride = require('method-override');
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const morgan = require("morgan");

//------------------------------CONSTANTS---------------------------------------

// urlDatabase, urls have an id(shortURL) key that contains a longURL and the userID of who created it. Example format is included.
const urlDatabase = {
  // b6UTxQ: {
  //   longURL: "https://www.tsn.ca",
  //   userID: "aJ48lW"
  //   date: string,
  //   visitors: 0,
  //   uniqueVisitors: [],
  //   dateTimeVisited: []
  // }
};

// userDatabase holds users as objects by a pseudorandomly generated 6 character alphanumeric string key and each contains an id, email and password. Example format is included.
const userDatabase = {
  // "userRandomID": {
  //   id: "userRandomID",
  //   email: "user@example.com",
  //   password: "purple-monkey-dinosaur"
};

//------------------------------HELPER FUNCTIONS--------------------------------

const {
  generateRandomString,
  validateEmail,
  validatePassword,
  makeEditURL,
  getURL,
  validateShortURL,
  getUserByEmail,
  grabThemByTheCookie,
  analytics
} = require('./helpers');

//------------------------------APP SETUP---------------------------------------

const app = express();  // Setting express as the application

app.set('view engine', 'ejs');  // Setting the view engine as ejs

app.use(bodyParser.urlencoded({extended: true})); // Parse encoded URLs

app.use(cookieSession({  // Cookie Session stores session cookies on the client
  name: 'session',
  keys: ['user_id','visitor'],
  // Cookie Options
  // maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use(methodOverride('_method'));

app.use(morgan('tiny'));  // Logs pertinent info to the console for dev

//------------------------------CONNECT-----------------------------------------

const PORT = 8080; // Default port 8080

app.listen(PORT, () => {  // Begin listening on port 8080
  console.log(`tinyapp listening on port ${PORT}!`);
});

//------------------------------GET ROUTES--------------------------------------

// Homepage - Redirects to login
app.get("/urls", (req, res) => {
  const userID = grabThemByTheCookie(req);
  if (userID) {
    const templateVars = {
      urls: getURL(userID, urlDatabase),
      "user_id": userDatabase[userID]
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect('/login');
  }
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
  const userID = grabThemByTheCookie(req);
  if (!userID) {
    const templateVars = {
      "user_id": userDatabase[userID]
    };
    res.render("urls_login",templateVars);
  } else {
    res.redirect('/urls');
  }
});

// New URLs page
app.get("/urls/new", (req, res) => {
  const userID = grabThemByTheCookie(req);
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
  const userID = grabThemByTheCookie(req);
  if (userID) {
    const templateVars = {
      shortURL,
      longURL: urlDatabase[shortURL].longURL,
      "user_id": userDatabase[userID],
      urlDatabase
    };
    res.render("urls_show",templateVars);
  } else {
    res.redirect(403,"/login");
  }
});

// Redirects to actual site using shortURL
app.get("/u/:shortURL", (req, res) => {
  const userID = grabThemByTheCookie(req);
  const shortURL = req.params.shortURL;
  if (validateShortURL(shortURL, urlDatabase)) {
    analytics(urlDatabase, userID, shortURL);
    const longURL = urlDatabase[shortURL].longURL;
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
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (!validateEmail(email, userDatabase) && password && email) {
    const userID = generateRandomString();
    userDatabase[userID] = {
      id: userID,
      email,
      password: hashedPassword
    };
    req.session['user_id'] = userID;
    res.redirect("/urls");
  } else if (validateEmail(email, userDatabase)) {
    res.redirect(400,"/register");
  } else {
    res.redirect(400,"/register");
  }
});

// Login user
app.post("/login", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  if (validateEmail(email, userDatabase) && validatePassword(password, email, userDatabase)) {
    const userID = getUserByEmail(email,userDatabase);
    //using ['user_id'] here as eslint doesn't like .user_id (not camelCase)
    req.session['user_id'] = userID.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Invalid email or password\n");
  }
});

// Logout user
app.post("/logout/:user_id", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// POST request for new URL's, redirects to urls_show
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const userID = grabThemByTheCookie(req);
  const longURL = req.body.longURL;
  makeEditURL(userID, urlDatabase, longURL, shortURL);
  res.redirect('/urls/' + shortURL);
});

//------------------------------PUT ROUTES--------------------------------------

// Edit a URL, then redirect back to homepage
app.put("/urls/:shortURL", (req, res) => {
  const userID = grabThemByTheCookie(req);
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (userID && userID === urlDatabase[shortURL].userID) {
    makeEditURL(userID, urlDatabase, longURL, shortURL);
    res.redirect("/urls");
  } else {
    res.status(403).send("You do not have permission to edit, please login first\n");
  }
});

//------------------------------DELETE ROUTES-----------------------------------

// Delete URL then redirect back to homepage
app.delete("/urls/:shortURL", (req, res) => {
  const userID = grabThemByTheCookie(req);
  const shortURL = req.params.shortURL;
  if (userID && userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.status(403).send("You do not have permission to delete, please login first\n");
  }
});

