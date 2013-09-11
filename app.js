var flash = require('connect-flash')
  , express = require('express')
  , passport = require('passport')
  , util = require('util')
  , LocalStrategy = require('passport-local').Strategy;
  var mongo = require('mongodb');
var MongoClient=mongo.MongoClient;
 
var Server = mongo.Server,
Db = mongo.Db,
BSON = mongo.BSONPure;
 
var mongoclient = new MongoClient(new Server('localhost', 27017,{auto_reconnect: true}));
db = mongoclient.db('passportdb');
 
db.open(function(err, db) {
if(!err) {
console.log("Connected to 'users' database");
db.collection('users',function(err, collection) {
if (err) {
console.log("The 'users' collection doesn't exist. Creating it with sample data...");}
populateDB();

});
}
});

  


function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
 db.collection('users', function(err, collection) {
collection.find({username:username}, {safe:true}, function(err, result) {
  if(result) return fn(null,result);
});
});
  
  return fn(null, null);
};


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      
      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message.  Otherwise, return the
      // authenticated `user`.
      db.collection('users', function(err, collection) {
collection.find({username:username,password:password}, {safe:true}, function(err, user) {
if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        
        return done(null, user);

});
});
    });
  }
));

var populateDB = function() {
var user = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

 
db.collection('users', function(err, collection) {
collection.insert(user, {safe:true}, function(err, result) {});
});
 
};


var app = express();

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/../../public'));
});


app.get('/', function(req, res){
  res.render('layout', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user, message: req.flash('error') });
});
app.get('/signup',function(req, res){
  res.render('signup');
});
app.post('/signup',function(req,res)
  {
    var username=req.body.username;
    var email=req.body.email;
    var password=req.body.password;
    //to calcute userl
    var userlength=db.collection('users').find({}, {id:1,_id:0}).sort({id:-1}).limit(1);
    console.log("max userlength"+userlength.String);

    var user={username:username,email:email,password:password}
   db.collection('users', function(err, collection) {
collection.insert(user, {safe:true}, function(err, result) {});
});
 res.render('login',{message:"You have successfully signup"});
    


  });

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
//
//   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
  function(req, res) {
    res.redirect('/');
  });
  
// POST /login
//   This is an alternative implementation that uses a custom callback to
//   acheive the same functionality.
/*
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.flash('error', info.message);
      return res.redirect('/login')
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/users/' + user.username);
    });
  })(req, res, next);
});
*/

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000);
console.log("server listening on 3000");

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

