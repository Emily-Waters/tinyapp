// TINYAPP - A project by Emily Waters, written during my time as a Lighthouse
// Labs WebDev Bootcamp Student
//------------------------------DEPENDENCY IMPORT-------------------------------
const methodOverride = require('method-override');
const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
//------------------------------DATABASE----------------------------------------
const { urlDatabase, userDatabase } = require('./database');
//------------------------------HELPER FUNCTIONS--------------------------------
const {
  generateRandomString,
  validateEmail,
  validatePassword,
  makeURL,
  editURL,
  getURL,
  validateShortURL,
  getUserByEmail,
  grabCookies,
  analytics
} = require('./helpers');
//------------------------------APP SETUP---------------------------------------
const app = express();  // Setting express as the application
app.set('view engine', 'ejs');  // Setting the view engine as ejs
app.use(bodyParser.urlencoded({extended: true})); // Parse encoded URLs
app.use(cookieSession({  // Cookie Session encrypts cookies
  name: 'session',
  keys: ['user_id','visitor'],
  // maxAge: 24 * 60 * 60 * 1000 // 24 hour expiry for cookies, disabled by default
}));
app.use(methodOverride('_method')); // Allows for use of PUT and DELETE
//------------------------------CONNECT-----------------------------------------
const PORT = 8080; // Default port 8080

app.listen(PORT, () => {  // Begin listening on port 8080
  console.log(`tinyapp listening on port ${PORT}!`);
});
//------------------------------GET ROUTES--------------------------------------
// Index
app.get('/', (req, res) => {
  const userID = grabCookies(req);
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

// Homepage - Redirects to login if not logged in
app.get("/urls", (req, res) => {
  const userID = grabCookies(req);
  if (userID) {
    const templateVars = {
      urls: getURL(userID, urlDatabase),
      "user_id": userDatabase[userID]
    };
    res.render("urls_index", templateVars);
  } else {
    res.redirect(403, '/login');
  }
});

// Register new user
app.get("/register", (req, res) => {
  const userID = grabCookies(req);
  if (!userID) {
    const templateVars = {
      "user_id": userID
    };
    res.render("urls_register", templateVars);
  } else {
    res.redirect('/urls');
  }
});

// User login
app.get("/login", (req, res) => {
  const userID = grabCookies(req);
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
  const userID = grabCookies(req);
  if (userID) {
    const templateVars = {
      "user_id": userDatabase[userID],
    };
    res.render("urls_new",templateVars);
  } else {
    res.redirect('/login');
  }
});

// Show a URL by its shortURL. Checks first that the shortURL exists in the database, otherwise redirect to /urls with a 404 error, otherwise then checks if the current user owns the shortURL and then renders the url_show page, otherwise redirect to login with 403(forbidden) error.
app.get("/urls/:shortUrl", (req, res) => {
  const shortURL = req.params.shortUrl;
  const userID = grabCookies(req);
  if (urlDatabase[shortURL]) {
    if (userID && urlDatabase[shortURL].userID === userID) {
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
  } else {
    res.redirect(404, '/urls');
  }
});

// Redirects to actual site using shortURL. Checks if the user is logged in for tracking cookies, otherwise sets a cookie, then checks if the shortURL exists and tracks data in analytics and redirects to the longURL, otherwise 404 error and redirect to index
app.get("/u/:shortURL", (req, res) => {
  if (!grabCookies(req)) {
    const userID = generateRandomString();
    userDatabase[userID] = {
      id: userID,
    };
    req.session['user_id'] = userID;
  }
  const userID = grabCookies(req);
  const shortURL = req.params.shortURL;
  if (validateShortURL(shortURL, urlDatabase)) {
    analytics(urlDatabase, userID, shortURL);
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.redirect(404,"/");
  }
});
//------------------------------POST ROUTES-------------------------------------
// Register new user. Check first if the email does not already exist in the user database while alos checking if the password and email fields were both filled in, then make a user database entry with a random string as the userID, and encrypts the password, then sets a cookie and redirects to the /urls page on success, otherwise redirects.
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
  } else {
    res.redirect(400,"/register");
  }
});

// Login user. Check that email and password provided match what is in the database for that user, then set a cookie and redirect to /urls. Otherwise, 403 forbidden error and redirect to login.
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (validateEmail(email, userDatabase) && validatePassword(password, email, userDatabase)) {
    const userID = getUserByEmail(email,userDatabase);
    //using ['user_id'] here as eslint doesn't like .user_id (not camelCase)
    req.session['user_id'] = userID.id;
    res.redirect("/urls");
  } else {
    res.redirect(403, "/login");
  }
});

// Logout user. Delete cookies and redirect to /urls
app.post("/logout/:user_id", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

// POST request for new URL. Creates a random string to assign as the shortURL, gets the userID of the current logged in user to assign ownership then makes a new database entry, then redirects to urls_show
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const userID = grabCookies(req);
  const longURL = req.body.longURL;
  makeURL(userID, urlDatabase, longURL, shortURL);
  res.redirect('/urls/' + shortURL);
});
//------------------------------PUT ROUTES--------------------------------------
// Edit a URL. Checks if the user is logged in and if they have ownership of the specified shortURL, then redirect back to homepage, otherwise 403 error and redirect to login
app.put("/urls/:shortURL", (req, res) => {
  const userID = grabCookies(req);
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  if (userID && userID === urlDatabase[shortURL].userID) {
    editURL(userID, urlDatabase, longURL, shortURL);
    res.redirect("/urls");
  } else {
    res.redirect(403, '/login');
  }
});
//------------------------------DELETE ROUTES-----------------------------------
// Delete URL. Checks if a user is logged in and if they own the shortURL, deletes database entry and redirects to /urls. Otherwise, 403 error and redirect to login.
app.delete("/urls/:shortURL", (req, res) => {
  const userID = grabCookies(req);
  const shortURL = req.params.shortURL;
  if (userID && userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.redirect(403, '/login');
  }
});
//------------------------------EOF---------------------------------------------