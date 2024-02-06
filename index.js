const express = require("express");
const mongoose = require("mongoose");
var routers = require('./routes/routes');
const bodyParser = require("body-parser");

const app = express();

const port = 5000;

const mongodatabaseURL = "mongodb+srv://ramiakamananaricky:mongo@cluster0.kjxgbml.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongodatabaseURL);

const connection = mongoose.connection;

app.listen(port, () => {
    console.log("Server is running on port " + port);
});

connection.once("open", () => {
    console.log("Mongodb connected");
});

app.use(bodyParser.json());
app.use(routers);