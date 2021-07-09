const express = require("express");
const app = express();
const PORT = 8080;
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcryptjs');

app.set("view engine", "ejs");
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'user',
  keys: ['key1', 'key2']
}));
app.use(bodyParser.urlencoded({extended: true}));

const {generateRandomString} = require('./helpers');
const {findByEmail} = require('./helpers');
const {urlsForUser} = require('./helpers');

const urlDatabase = {};
const usersDatabase = {};


class User {
  constructor(id, email, password) {
    this.id = id;
    this.email = email;
    this.password = password;
  }
  getUser() {
    return {'id': this.id, 'email': this.email, 'password': this.password};
  }
}

app.post("/urls/:shortURL/delete", (req, res) => {
  const validUrls = urlsForUser(req.session.user_id.id, urlDatabase);
  for (let urls in validUrls) {
    if (req.params.shortURL === urls) {
      delete urlDatabase[req.params.shortURL];
      res.redirect(`/urls/`);
    }
  }
  res.send(405);
  res.redirect(`/urls/`);
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.sendStatus(400);
    res.send(`<script>alert ("Yo! Please fill out both fields...")</script>`);
    res.redirect('/login');
    return;
  }
  let userId = `${generateRandomString()}`;
  const pass = bcrypt.hashSync(req.body.password, 10);
  let newUser = new User(userId, req.body.email, pass);
  console.log('newUser:', newUser);
  if (findByEmail(req.body.email, usersDatabase)) {
    res.sendStatus(400);
    return;
    //pop up to come
  }
  usersDatabase[userId] = newUser.getUser();
  req.session.user_id = usersDatabase[userId];
  console.log('usersDatabase:', usersDatabase);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  console.log('req.body.email:', req.body.email);
  let email = req.body.email;
  if (!findByEmail(email, usersDatabase)) {
    res.status(401).send(`<script>alert ("That email isn't in our database!")</script>`);
    res.redirect('/urls');
    console.log('email wrong');
    return;
  }
  let id = findByEmail(req.body.email, usersDatabase);
  console.log('var id:', id);
  if (!bcrypt.compareSync(req.body.password, id.password)) {
    res.status(401).send(`<script>alert ("Wrong password!")</script>`);
    console.log('password wrong');
    return;
  } else {
    req.session.user_id = findByEmail(req.body.email, usersDatabase);
    res.redirect(`/urls`);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: req.session['user_id']};
  res.render(`login_page`, templateVars);
});


app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls/new", (req, res) => {
  const templateVars = {user: req.session.user_id};
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  res.render("register");
});



app.get('/urls', (req, res) => {
  const Youser = req.session.user_id;
  if (!req.session.user_id) {
    const templateVars = { urls: null, user: null };
    res.render('urls_index', templateVars);
    return;
  } else {
    const templateVars = { urls: urlsForUser(req.session.user_id.id, urlDatabase), user: Youser }; //passing urlDatabase as "urls" so that the urls_index.ejs can access it as such
    res.render('urls_index', templateVars);
  }
});

app.get('/urls/:shortURL', (req, res) => {

  //we get an object of urls that match the 'req.cookies.user_id.id' ID.
  //SO, if req.param.shortURL !== one of those URLS, we need to redirect, perhaps send a 403 or a 401
  //

  const validUrl = urlsForUser(req.session.user_id.id, urlDatabase);
  console.log('validUrl:', validUrl);
  if (!req.session.user_id) {
    const templateVars = { shortURL: null, longURL: null, user: null };
    res.render('urls_show', templateVars);
    return;
  }
  for (let url in validUrl) {
    if (url === req.params.shortURL) {
      const templateVars = { shortURL: req.params.shortURL, longURL: validUrl[req.params.shortURL], user: req.session['user_id'] };
      res.render('urls_show', templateVars);
      return;
    }
  }
  res.redirect('/urls');
  res.sendStatus(401);
});

app.post('/urls/:id', (req, res) => {
  console.log('req.params.id', req.params.id); // this is the shortened URL
  console.log('req.body', req.body.longURL); // this is the EDITED input
  console.log('urlDatabase', urlDatabase);//why is the urlDatabase passed to here?  I should ask tomorrow. Or is it because it's already in the file??
  
  if (!req.session.user_id) {
    res.redirect(`'/login`);
    return;
  }
  const input = req.body.longURL;
  const urlKey = req.params.id;
  if (!input) {
    res.redirect(`/urls/${urlKey}`);
    return;
  }
  const validUrls = urlsForUser(req.session.user_id, urlDatabase);
  for (let urls in validUrls) {
    if (!req.params.id === urls) {
      res.send(405);
      res.redirect(`/urls/`);
      return;
    }
  }

  urlDatabase[urlKey]['longURL'] = input;
  res.redirect(`/urls/`);
});


app.post('/logout', (req, res) => {
  req.session = null;
  console.log('usersDatabase:', usersDatabase);
  res.redirect(`/urls`);
});


app.post('/urls', (req, res) => {
  const longURL = req.body.longURL; //This is how we access the actual FORM of it.  req.body would be the entire body section.
  const shortURL = generateRandomString();
  console.log('urldatabase before:', urlDatabase);
  urlDatabase[shortURL] = {};
  urlDatabase[shortURL]['longURL'] = longURL;
  urlDatabase[shortURL]['userId'] =  req.session.user_id.id;
  console.log('urldatabase after:', urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});


app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]['longURL'];
  if (!longURL.startsWith('http')) {
    longURL = 'http://' + longURL;
  }
  res.redirect(longURL);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
