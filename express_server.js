const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const morgan = require("morgan")
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")

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
  return false;
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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/login", (req, res) => {
  console.log('req.body.email:', req.body.email)
  let email = req.body.email
  if (!emailChecker(email)) {
    res.sendStatus(403);
    console.log('email wrong')
    return;
  }
  if (!pwChecker(req.body.password)) {
    res.sendStatus(403);
    console.log('password wrong')
    return;
  } else {
  res.cookie('user_id', findByEmail(req.body.email));
  res.redirect(`/urls`);
  }
});

app.get("/login", (req, res) => {
  const templateVars = { user: req.cookies['user_id']}
  res.render(`login_page`, templateVars);
});



app.post("/register", (req, res) => {
  let userId = `${generateRandomString()}`;
  let newUser = new User(userId, req.body.email, req.body.password);
  console.log('newUser:', newUser)
  if (newUser.email === '' || newUser.password === '') {
    res.sendStatus(400);
    res.send('<div class="danger"><p><strong>Yo!</strong> Please fill out both fields...</p></div>'); //make this a pop up window
    return;
  }
  if(emailChecker(req.body.email)){ //lol why does this work?  Couldn't newUser.email work?  Look into this if you can.
    res.sendStatus(400);
    return;
    //pop up to come
  } 
  usersDatabase[userId] = newUser.getUser();
  res.cookie('user_id', usersDatabase[userId]);
  console.log()
  console.log('usersDatabase:', usersDatabase)
  res.redirect('/urls');
}); //needs polish

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/register", (req, res) => {
  res.render("register")
})


app.get('/urls', (req, res) => {
  const Youser = req.cookies.user_id 
  const templateVars = { urls: urlDatabase, user: Youser }; //passing urlDatabase as "urls" so that the urls_index.ejs can access it as such
  res.render('urls_index', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: req.cookies['user_id'] }; //passing the value shortURL and longURL into the urls_show.ejs.  That's how it has access to THOSE values.
  res.render("urls_show", templateVars); //the values for this might be switched from how they should be...
});

app.post('/urls/:id', (req, res) => {
  console.log('req.params.id', req.params.id) // this is the shortened URL
  console.log('req.body', req.body.longURL) // this is the EDITED input
  console.log('urlDatabase', urlDatabase)//why is the urlDatabase passed to here?  I should ask tomorrow. Or is it because it's already in the file??
  const input = req.body.longURL
  const urlKey = req.params.id
  if(!input) {
    res.redirect(`/urls/${urlKey}`)
    return;
  }
  urlDatabase[urlKey] = input
  res.redirect(`/urls/${urlKey}`) 
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
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect(`/urls/`)
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
