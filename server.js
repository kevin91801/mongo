var express = require("express");

var bodyParser = require("body-parser");

var cheerio = require("cheerio");

var request = require("request");

var mongoose = require("mongoose");

var Note = require("./models/Note.js");

var Article = require("./models/Article.js");

mongoose.Promise = Promise;

var app = express();

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/scrapping");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

app.get("/scrape", function(req, res) {

  request("https://thebests.kotaku.com/", function(error, response, html) {
 
    var $ = cheerio.load(html);
  
    $("article h1").each(function(i, element) {

      var result = {};
     
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");
      result.summary = $(this).children("a").attr("p");
      
      var entry = new Article(result);

      entry.save(function(err, doc) {

        if (err) {
          console.log(err);
        }
   
        else {
          console.log(doc);
        }
      });

    });
  });

  res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {

  Article.find({}, function(err, data) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(data);
    }
  })

});

app.get("/articles/:id", function(req, res) {
  Article.findOne({ "_id": req.params.id})
  .populate("note")
    .exec(function(err, data) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(data);
      }
    })

});

app.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);

  newNote.save({}, function(err, data) {
    if (err) {
      res.send(err);
    }
    else {
    Article.findOneAndUpdate({ "_id": req.params.id }, {"note": data._id}
  , function(err, data) {
    if (err) {
      res.send(err);
      console.log("error");
    }
    else {
      res.send(data);
      console.log("Testing here", data);
    		}
   	 	});
  
 	 }

	});
});	
app.listen(3000, function() {
  console.log("App running on port 3000!");
});
