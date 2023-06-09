
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect('mongodb+srv://Anurag:anuragcluster@cluster0.deeests.mongodb.net/todoList', {useNewUrlParser: true ,  useUnifiedTopology: true });

// creating the schema for the todolits items 
const listSchema = new mongoose.Schema({
  name : String
})

// now we create a mongoose model using the above schema 
// first para we specify the name of the collection which will be converted into plural form and second is the schema type we want the model to be of
const TodoItem = mongoose.model("TodoItem", listSchema);

const item1 = new TodoItem(
  { 
    name : "Buy Food"
  }
);

const item2 = new TodoItem(
  {
    name : "Eat Food"
  }
);

const item3 = new TodoItem(
  {
    name : "Repeat"
  }
);

const defaultItems = [item1 , item2 , item3];


const newlistSchema = {
  name : String,
  items : [listSchema]
};

const NewList = mongoose.model("NewList", newlistSchema);


app.get("/", function(req, res) {
  
  TodoItem.find({},function(err , itemList){
    
    if(itemList.length === 0 )
    {
      // to insert the items into the database we do 
      TodoItem.insertMany(defaultItems);

      res.redirect("/")
    }
    else
    {
      res.render("list", {listTitle: "Today", newListItems: itemList});
      
    }

  })


});

app.post("/", function(req, res){

  const itemName =  req.body.newItem;

  const listName = req.body.list;

  const userItem = new TodoItem({
    name: itemName 
  });
  
  if(listName === "Today")
  {
    userItem.save();

  res.redirect("/");
    
  }
  else
  {
    NewList.findOne({name : listName} , function(err, foundList)
    {
      foundList.items.push(userItem);
      foundList.save();
      res.redirect("/"+listName)
    })
  }


  

});

app.get("/:customListName" , function(req, res)
{
   const customListName = _.capitalize(req.params.customListName);
   
   NewList.findOne({name : customListName} , function(err , foundList)
   {
     if(!err)
     {
       if(foundList)
       {
            // show an existing list

           res.render("list", {listTitle: foundList.name  , newListItems: foundList.items});

        }
        else
        {
          // create a new list

          const userNewList = new NewList(
            {
              name : customListName,
              items : defaultItems
            }
          )

           userNewList.save();

           res.redirect("/"+customListName)
        }
      }
    })

   
    
  })


  

app.get("/about", function(req, res){
  res.render("about");
});


app.post("/delete", function(req,res)
{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today")
  {
    TodoItem.findByIdAndDelete(checkedItemId , function (err)
    {
      if(err)console.log(err);
      else console.log("Deleted ");
    });
    
    res.redirect("/");
   
  }
  else
  {
    NewList.findOneAndUpdate({name : listName},{$pull : {items : {_id : checkedItemId}}} , {useFindAndModify : false} , function (err , foundList){

      if(!err)
      {
        res.redirect("/"+listName);
      }
    });
  }
})


app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
