"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cors = require("cors");
var dns = require("dns");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
console.log(mongoose.connection.readyState);
mongoose.connection.on("connected", () =>
  console.log("MongoDB Connected", mongoose.connection.readyState)
);
app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const Schema = mongoose.Schema;
// Create Schema
const URLSchema = new Schema({
  original_url: {
    type: String
  },
  short_url: {
    type: Number
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const URLModel = mongoose.model("url", URLSchema);

// your first API endpoint...
app.post("/api/shorturl/new", function(req, res) {
  const url = req.body.url;
  const withoutHTTP = url.replace(/https{0,1}:\/\//gm, "");
  dns.lookup(withoutHTTP, function(err) {
    if (err) {
      return res.json({ error: "invalid URL" });
    } else {
      URLModel.findOne()
        .sort({ short_url: -1 })
        .exec(function(err, data) {
          if (err) {
            return console.log(err);
          } else {
            const id = data.short_url + 1;
            const newURL = new URLModel({
              original_url: url,
              short_url: id
            });
            newURL.save().then(
              res.json({
                original_url: url,
                short_url: id
              })
            );
          }
        });
    }
  });
});

app.get("/api/shorturl/:id", function(req, res) {
  const short_url = req.params.id;
  URLModel.findOne({ short_url: short_url }, function(err, data) {
    if (err) {
      return console.log(err);
    } else {
      if (!data) {
        return res.json({ error: "Short url not found" });
      } else {
        res.redirect(data.original_url);
      }
    }
  });
});

app.listen(port, function() {
  console.log("Node.js listening ...");
});
