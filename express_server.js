const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan")
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const bcrypt = require('bcryptjs')

app.set("view engine", "ejs")

app.use(morgan('dev'))

app.use(cookieParser())

app.use(bodyParser.urlencoded({extended: true}));

const generateRandomString = () => {
  /* so I could do a bunch of equations with a String.FromCharCode, but then I'd have to make a couple if statements to avoid the punctuation characters
  What I'm gonna do instead, is make a very long array of all the characters, and then return a random number from 0-61 corresponding to a character in the array
  Maybe this will get refactored out but it's just a beta baby we're just getting started.  I found a pretty dece method on stackoverflow but I'm gonna do
  my own method first.  */
  // like idk it's way too many lines of code but I could make it less readable and just reduce the array to one string make it not so bad?
  //That's probably not the move
  let result = ''
  const randoChar = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 
    'h', 'i', 'j', 'k', 'l', 'm', 'n', 
    'o', 'p', 'q', 'r', 's', 't', 'u', 
    'v', 'w', 'x', 'y', 'z', 'A', 'B', 
    'C', 'D', 'E', 'F', 'G', 'H', 'I', 
    'J', 'K', 'L', 'M', 'N', 'O', 'P', 
    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 
    'X', 'Y', 'Z'
  ];
  for (let i = 0; i < 6; i++) {
    result += randoChar[Math.floor(Math.random() * 62)];
  };
  return result;
};

class User {
  constructor(id, email, password){
    this.id = id;
    this.email = email;
    this.password = password;
  };
  getUser() {
    return {'id': this.id, 'email': this.email, 'password': this.password};
  }
};

const usersDatabase ={};

//will return as true if email is already present
const emailChecker = (email) => {
  for (let users in usersDatabase){ //iteration just returns me the key THIS WORKED EARLIER
    console.log('email:', email);
    console.log('users', usersDatabase[users].email, " typeOf users.email:", typeof usersDatabase[users].email); //still have to access it like this
    if (usersDatabase[users].email === email) {
      return true;
    }
  }
};

const pwChecker = (pw) => {
  for (let users in usersDatabase){ //iteration just returns me the key
    if (usersDatabase[users].password === pw) {
      return true;
    } 
  }
};

const findByEmail = (email) => {
  for (let users in usersDatabase){ //iteration just returns me the key
    console.log('users:', usersDatabase[users]) //still have to access it like this
    if (usersDatabase[users].email === email) {
      return usersDatabase[users]; //I could probably just make this the emailChecker function, no? It's late at night check tomorrow morning
    } 
  }
};

const urlDatabase = {};

const urlsForUser = (id) => {
  result = {}
  for(let url in urlDatabase){
    if(id === urlDatabase[url].userId){
      result[url] = urlDatabase[url]['longURL']
    }
  }
  return result
}

app.post("/urls/:shortURL/delete", (req, res) => {
  const validUrls = urlsForUser(req.cookies.user_id)
  for(urls in validUrls){
    if (req.params.shortURL === url) {
      delete urlDatabase[req.params.shortURL];
      res.redirect(`/urls/`)
    }
  }
  console.log("not deleted")
  res.send(405)
  res.redirect(`/urls/`)
});

app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.sendStatus(400);
    res.send('<div class="danger"><p><strong>Yo!</strong> Please fill out both fields...</p></div>'); //make this a pop up window
    res.redirect('/login')
    return;
  }
  let userId = `${generateRandomString()}`;
  const pass = bcrypt.hashSync(req.body.password, 10)
  let newUser = new User(userId, req.body.email, pass);
  console.log('newUser:', newUser)
  if(emailChecker(req.body.email)){ 
    res.sendStatus(400);
    return;
    //pop up to come
  } 
  usersDatabase[userId] = newUser.getUser();
  res.cookie('user_id', usersDatabase[userId]);
  console.log('usersDatabase:', usersDatabase)
  res.redirect('/urls');
}); //needs polish

app.post("/login", (req, res) => {
  console.log('req.body.email:', req.body.email)
  let email = req.body.email
  if (!emailChecker(email)) {
    res.sendStatus(403);
    console.log('email wrong')
    return;
  }
  let id = findByEmail(req.body.email)
  console.log('var id:', id)
  if (!bcrypt.compareSync(req.body.password, id.password)) {
    res.status(401).resredirect('/urls');
    console.log('password wrong')
    return;
  } else {
  res.cookie('user_id', findByEmail(req.body.email));
  res.redirect(`/urls`);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: req.cookies['user_id']};
  res.render(`login_page`, templateVars);
});


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls/new", (req, res) => {
  const templateVars = {user: req.cookies.user_id};
  res.render("urls_new", templateVars);
});

app.get("/register", (req, res) => {
  res.render("register");
});



app.get('/urls', (req, res) => { 
  const Youser = req.cookies.user_id 
  if(!req.cookies.user_id) {
    const templateVars = { urls: null, user: null }; 
    res.render('urls_index', templateVars);
    return;
  } else {
  const templateVars = { urls: urlsForUser(req.cookies.user_id.id), user: Youser }; //passing urlDatabase as "urls" so that the urls_index.ejs can access it as such
  res.render('urls_index', templateVars);
  }
});

app.get('/urls/:shortURL', (req, res) => {

  //we get an object of urls that match the 'req.cookies.user_id.id' ID.  
  //SO, if req.param.shortURL !== one of those URLS, we need to redirect, perhaps send a 403 or a 401
  //

  const validUrl = urlsForUser(req.cookies.user_id.id)
  console.log('validUrl:', validUrl)
  if(!req.cookies.user_id) {
    const templateVars = { shortURL: null, longURL: null, user: null }; 
    res.render('urls_show', templateVars);
    return;
  }
  for(let url in validUrl) {
    if(url === req.params.shortURL) {
      const templateVars = { shortURL: req.params.shortURL, longURL: validUrl[req.params.shortURL], user: req.cookies['user_id'] }; 
      res.render('urls_show', templateVars); 
      return;
    }
  }
  res.redirect('/urls')
  res.sendStatus(401)
});

app.post('/urls/:id', (req, res) => {
  console.log('req.params.id', req.params.id) // this is the shortened URL
  console.log('req.body', req.body.longURL) // this is the EDITED input
  console.log('urlDatabase', urlDatabase)//why is the urlDatabase passed to here?  I should ask tomorrow. Or is it because it's already in the file??
  
  if (!req.cookies.user_id){
    res.redirect(`'/login`);
    return;
  }  
  const input = req.body.longURL
  const urlKey = req.params.id
  if(!input) {
    res.redirect(`/urls/${urlKey}`);
    return;
  }
  const validUrls = urlsForUser(req.cookies.user_id)
  for(urls in validUrls){
    if (!req.params.id === url) {
      res.send(405);
      res.redirect(`/urls/`);
      return;
    }
  }

  urlDatabase[urlKey]['longURL'] = input;
  res.redirect(`/urls/`); 
});


app.post('/logout', (req, res) => {
  console.log('req.cookies:', req.cookies)
  res.clearCookie('user_id')
  console.log('usersDatabase:', usersDatabase)
  res.redirect(`/urls`)
});


app.post('/urls', (req, res) => {
  const longURL = req.body.longURL; //This is how we access the actual FORM of it.  req.body would be the entire body section.
  const shortURL = generateRandomString();
  console.log('req.cookies.user_id:', req.cookies.user_id.id)
  console.log('urldatabase before:', urlDatabase)
  urlDatabase[shortURL] = {}; 
  urlDatabase[shortURL]['longURL'] = longURL;
  urlDatabase[shortURL]['userId'] =  req.cookies.user_id.id
  console.log('urldatabase after:', urlDatabase)
  res.redirect(`/urls/${shortURL}`);
});

//This only works with full http://www.websitesFormattedLikeThis.com
app.get('/u/:shortURL', (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]['longURL'];
  if (!longURL.startsWith('http')) {
    longURL = 'http://' + longURL
  }
  res.redirect(longURL);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
