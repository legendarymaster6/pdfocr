var twig = require("twig");
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var cors = require('cors')
var multer = require('multer');

var DIR = './storage/uploads/';

upload = multer({dest: DIR});

require('./common')

var app = express();

// Normal express config defaults
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use(session({ secret: 'conduit', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false  }));

app.use(require('./routes'));

app.set('views', './views');
app.set('view engine', 'twig');
app.set("view options", { layout: false });

var server = app.listen( process.env.PORT || 3000, function() {
    console.log('Listening on port ' + server.address().port);
});
