const express = require("express");
const bodyParser = require("body-parser");
const app = express();

//------------------------------CONSTANTS---------------------------------------

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//------------------------------FUNCTIONS---------------------------------------

const generateRandomString = function() { //Generate encoded string

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

//------------------------------CONNECT-----------------------------------------

const PORT = 8080; // Default port 8080

app.set('view engine', 'ejs');  // Setting the view engine as ejs

app.use(bodyParser.urlencoded({extended: true})); // Parse encoded URL's

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

//--------------------------------MAIN BODY-------------------------------------


app.get("/urls", (req, res) => {  // Main URL's page
  const templateVars = {urls: urlDatabase};
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => { // POST requests for new URL's
  const newDBEntry = generateRandomString();
  urlDatabase[newDBEntry] = `http://www.${req.body.longURL}`;
  res.redirect("urls");
});

app.get("/urls/new", (req, res) => {  // New URL's page
  res.render("urls_new");
});

app.get("/u/:shortURL", (req, res) => { // Redirects using encoded strings
  const longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("404 - Not Found");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {  // Delete URL
  delete urlDatabase[req.params.shortURL];          // Redirect to /urls
  req.url = '';
  res.redirect('/urls');
});

//------------------------------------------------------------------------------


