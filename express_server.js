//------------------------------DEV TOOLS---------------------------------------

// const morgan = require("morgan");
// app.use(morgan('tiny'));  // Logs pertinent info to the console for dev

//------------------------------DEPENDENCY IMPORT-------------------------------

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

//------------------------------CONSTANTS---------------------------------------



// urlDatabase, urls have an id(shortURL) key that contains a longURL and the userID of who created it. Example format is included.
const urlDatabase = {
  // b6UTxQ: {
  //   longURL: "https://www.tsn.ca",
  //   userID: "aJ48lW"
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
  makeURL,
  getURL,
  getUserByEmail,
  grabThemByTheCookie,
} = require('./helpers');

//------------------------------APP SETUP---------------------------------------

const app = express();  // Setting express as the application

app.set('view engine', 'ejs');  // Setting the view engine as ejs

app.use(bodyParser.urlencoded({extended: true})); // Parse encoded URLs

app.use(cookieSession({  // Cookie Session stores session cookies on the client
  name: 'session',
  keys: ['user_id']
}));

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
  const templateVars = {
    "user_id": userDatabase[req.session.user_id]
  };
  res.render("urls_login",templateVars);
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
  const longURL = urlDatabase[req.params.shortUrl].longURL;
  const userID = grabThemByTheCookie(req);
  if (userID) {
    const templateVars = {
      shortURL,
      longURL,
      "user_id": userDatabase[userID]
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
  res.redirect("/login");
});

// POST request for new URL's, redirects to urls_show
app.post("/urls", (req, res) => {
  const encodeString = generateRandomString();
  const userID = grabThemByTheCookie(req);
  const longURL = req.body.longURL;
  makeURL(userID, urlDatabase, longURL, encodeString);
  res.redirect('/urls/' + encodeString);
});

// Delete URL then redirect back to homepage
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = grabThemByTheCookie(req);
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
  const userID = grabThemByTheCookie(req);
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (userID && userID === urlDatabase[shortURL].userID) {
    makeURL(userID, urlDatabase, longURL, shortURL);
    res.redirect("/urls");
  } else {
    res.status(403).send("You do not have permission to edit, please login first\n");
  }
});







