//jshint esversion:6

// Constants for node packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

//using ejs engine
app.set('view engine', 'ejs');

//using body parser
app.use(bodyParser.urlencoded({
  extended: true
}));

//to access css styles
app.use(express.static("public"));


//connecting to mongoose server
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


//defining schemas
const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});


//creating models
const Item = mongoose.model("Item", itemsSchema);

const List = mongoose.model("List", listSchema);


//creating data 
const web = new Item({
  name: "Web"
});

const eat = new Item({
  name: "Eat"
});

const code = new Item({
  name: "Code"
});

const defaultItems = [web, eat, code];


app.get("/", function (req, res) {

  //add default items only when the list is empty
  Item.find({}, function (err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("success");
        }
      });
      res.redirect("/");

      //if list has items then display the array 
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function (req, res) {

  //add items to list when submit button is pressed
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {

    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      //adding item entered by user to the items array of listschema
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }

});


//deleting item when the checkbox is checked
app.post("/delete", function (req, res) {
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(itemID, function (err) {
      if (!err) {
        console.log("Successfully Deleted");
        res.redirect("/");
      }
    });

  } else {
    //removing item from array of list schema using pull method of mongodb
    List.findOneAndUpdate({
        name: listName
      }, {
        $pull: {
          items: {
            _id: itemID
          }
        }
      },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }

      });
  }
});

//creating custom pages 
app.get("/:new", function (req, res) {
  const custormListName = _.capitalize(req.params.new);

  List.findOne({
    name: custormListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: custormListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + custormListName);
      } else {

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});