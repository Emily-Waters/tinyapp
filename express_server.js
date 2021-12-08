const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const app = express();
const cookieParser = require('cookie-parser');

//------------------------------CONSTANTS---------------------------------------

const PORT = 8080; // Default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
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

const generateRandomString = function() { // Generate encoded string

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

//  Check user provided email address is not in user database
const validateEmail = function(userEmail ,userDB) {
  for (const user in userDB) {
    if (userDB[user].email === userEmail || !userEmail) {
      return false;
    }
  }
  return true;
};

// Check user password is not blank (for now)
const validatePassword = function(password) {
  if (!password) {
    return false;
  }
  return true;
};

//------------------------------CONNECT-----------------------------------------

app.listen(PORT, () => {  // Begin listening on port 8080
  console.log(`tinyapp listening on port ${PORT}!`);
});

//------------------------------EXAMPLES----------------------------------------

// app.get("/", (req, res) => {
//   res.send("Hello!");
// });

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });


//-------------------------------APP SETUP--------------------------------------

app.set('view engine', 'ejs');  // Setting the view engine as ejs

app.use(bodyParser.urlencoded({extended: true})); // Parse encoded URL's

app.use(cookieParser()); // Cookie Parser decodes cookies

app.use(morgan('tiny'));  // Logs pertinent info to the console

//----------------------------------GET-----------------------------------------

// Homepage
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    "user_id": users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

// New URLs page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    "user_id": users[req.cookies.user_id]
  };
  res.render("urls_new",templateVars);
});

// Register new user
app.get("/register", (req, res) => {
  const templateVars = {
    "user_id": users[req.cookies.user_id]
  };
  res.render("urls_register", templateVars);
});

// Show a URL by its shortURL
app.get("/urls/:shortUrl", (req, res) => {
  const shortURL = req.params.shortUrl;
  const longURL = urlDatabase[shortURL];
  const templateVars = {
    shortURL,
    longURL,
    "user_id": users[req.cookies.user_id]
  };
  res.render("urls_show",templateVars);
});

// Redirects to actual site using shortURL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("404 - Not Found");
  }
});

//----------------------------------POST----------------------------------------

// POST request for new URL's, redirects to urls_show
app.post("/urls", (req, res) => {
  const newDBEntry = generateRandomString();
  urlDatabase[newDBEntry] = `http://www.${req.body.longURL}`;
  res.redirect(`/urls/${newDBEntry}`);
});

// Delete URL then redirect back to homepage
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  req.url = '';
  res.redirect("/urls");
});

// Edit a URL, then redirect back to homepage
app.post("/urls/edit/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = `http://www.${req.body.longURL}`;
  res.redirect("/urls");
});

// Login user
app.post("/login", (req, res) => {
  res.cookie("username",`${req.body.username}`);
  res.redirect("/urls");
});

// Logout user
app.post("/logout/:user_id", (req, res) => {
  res.clearCookie("user_id", req.cookies);
  res.redirect("/urls");
});


// Register new user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (validateEmail(email, users) && validatePassword(password)) {
    const id = generateRandomString();
    users[id] = {
      id,
      email,
      password
    };
    res.cookie("user_id", id);
    res.redirect("/urls");
  } else {
    res.send(400);
  }
});


