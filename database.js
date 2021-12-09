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

module.exports = {
  urlDatabase,
  userDatabase
};