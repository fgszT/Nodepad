var http = require('http');
var formidable = require('formidable');
var express = require('express');
var bodyParser = require("body-parser");
var mysql = require('mysql');

var app = express();
app.set('port', 3000);

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'nodepad'
});



http.createServer(app).listen(app.get('port'), function() {
  console.log('Server running on port ' + app.get('port'));
});


connection.connect(function(err) {
  if (err) {
    console.log("Error");
  }
  else {
    console.log("Database connected");
  }
});


var user = "";
var urlencodedParser = bodyParser.urlencoded({extended: false});

app.post("/senduser", urlencodedParser, function (req, res) {
  user = req.body.user;
});

app.post("/upload", function (req, res) {
    var form = new formidable.IncomingForm();
    form.uploadDir ='./files';
    form.keepExtensions = true;
    form.type = 'multipart/form-data';
    form.multiples = true;
    form.parse(req, function(err, fields, files){
            if(err) console.error(err);
            if (typeof files.files.length == "undefined"){
              var filespath = files.files.path + '%';
              var filename = files.files.name + '%';
              var post = {
                    user: user,
                    title: fields.title,
                    nodeBody: fields.nodebody,
                    tags: fields.tags,
                    files: filespath,
                    filename: filename,
                  }
            }
            else {
              var fileslenght = files.files.length;
              var filespath = files.files[0].path + '%';
              var filename = files.files[0].name + '%';
              for(var i = 1; i < files.files.length; i++)
              {
                filespath += files.files[i].path + '%';
                filename += files.files[i].name + '%';
              }
              var post = {
                    user: user,
                    title: fields.title,
                    nodeBody: fields.nodebody,
                    tags: fields.tags,
                    files: filespath,
                    filename: filename,
                  }
            }
            connection.query("INSERT INTO node SET ?", post, function(err, result){
              if (err) throw err;
              console.log("Number of records inserted: " + result.affectedRows);
            });
        });
});

app.post("/getTitle", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
      connection.query("SELECT title, nodeBody, tags, files, filename FROM node WHERE user=? AND title LIKE ?", [user, '%' + req.body.info + '%'], function (err, result, fields) {
          if (err) throw err;
        res.end(JSON.stringify(result));
      });
});

app.post("/getNode", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
      connection.query("SELECT title, nodeBody, tags, files, filename FROM node WHERE user=? AND nodeBody LIKE ?", [user, '%' + req.body.info + '%'], function (err, result, fields) {
          if (err) throw err;
        res.end(JSON.stringify(result));
      });
});

app.post("/getTag", urlencodedParser, function (req, res) {
    if(!req.body) return res.sendStatus(400);
      connection.query("SELECT title, nodeBody, tags, files, filename FROM node WHERE user=? AND tags LIKE ?", [user, '%' + req.body.info + '%'], function (err, result, fields) {
          if (err) throw err;
        res.end(JSON.stringify(result));
      });
});

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

app.get('/input', function(req, res) {
  if (user != ""){
    res.sendfile('pages/input.html');
  }
  else{
    res.redirect('/')
  }
});

app.get('/style.css', function(req, res) {
    res.sendfile('css/style.css');
});

app.get('/background', function(req, res) {
    res.sendfile('images/background.jpg');
});

app.get('/output', function(req, res) {
  if (user != ""){
    res.sendfile('pages/output.html');
  }
  else{
    res.redirect('/')
  }
});

app.get('/files/:path', function(req, res){
  var file = __dirname + '/files/' + req.params.path;
  connection.query("SELECT files, filename FROM node WHERE files LIKE ?", '%' + req.params.path + '%', function (err, result, fields) {
      if (err) throw err;
    var namearr = result[0].filename.split('%');
    var patharr = result[0].files.split('%');
    for (var i = 0; i < namearr.length - 1; i++){
      if (patharr[i].indexOf(req.params.path) != -1){
        var num = i;
      }
    }
    res.download(file, namearr[num]);
  });
});

app.use(function(req, res) {
  res.send(404, "Page not found");
});
