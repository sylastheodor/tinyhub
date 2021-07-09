const generateRandomString = () => {
  /* so I could do a bunch of equations with a String.FromCharCode, but then I'd have to make a couple if statements to avoid the punctuation characters
  What I'm gonna do instead, is make a very long array of all the characters, and then return a random number from 0-61 corresponding to a character in the array
  Maybe this will get refactored out but it's just a beta baby we're just getting started.  I found a pretty dece method on stackoverflow but I'm gonna do
  my own method first.  */
  // like idk it's way too many lines of code but I could make it less readable and just reduce the array to one string make it not so bad?
  //That's probably not the move
  let result = '';
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
}; //modular

const findByEmail = (email, database) => {
  for (let users in database){ //iteration just returns me the key
    console.log('users:', database[users]) //still have to access it like this
    if (database[users].email === email) {
      return database[users]; 
    } 
  }
};//modular


//creates an object of urls related to the logged in user
const urlsForUser = (id, database) => {
  result = {}
  for(let url in database){
    if(id === database[url].userId){
      result[url] = database[url]['longURL'];
    }
  }
  return result;
} // MODULAR

module.exports = {generateRandomString, findByEmail, urlsForUser}