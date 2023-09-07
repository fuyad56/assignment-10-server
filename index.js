const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://bookShop:7f39m3NsFRaMQ3od@cluster0.odt7wqf.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

async function run() {
  await client.connect();
  await client.db(`${process.env.DB_NAME}`).command({ ping: 1 });
  console.log("Connected to MongoDB!");

  app.get("/books", async (req, res) => {
    try {
      const collection = client.db(process.env.DB_NAME).collection("books");
      const items = await collection.find().toArray();
      console.log("from database:", items);
      res.json(items); // Send the data as JSON response
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  app.post("/addBook", async (req, res) => {
    const newBook = req.body;
    const result = await client
      .db(process.env.DB_NAME)
      .collection("books")
      .insertOne(newBook);
    console.log("New book added:", result.insertedId);
  });

  app.delete("/deleteBook/:id", async (req, res) => {
    const id = new ObjectId(req.params.id);
    console.log("delete this", id);
    try {
      const result = await client
        .db(process.env.DB_NAME)
        .collection("books")
        .findOneAndDelete({ _id: id });

      if (result.value) {
        res.send(result.value);
      } else {
        res.status(404).send("Book not found");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).send("Internal server error");
    }
  });

  app.get("/books/:id", async (req, res) => {
    const id = new ObjectId(req.params.id);
    try {
      const collection = client.db(process.env.DB_NAME).collection("books");
      const item = await collection.findOne({ _id: id });

      if (item) {
        res.json(item); // Send the data as JSON response
      } else {
        res.status(404).send("Book not found");
      }
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  });

  // Import necessary modules and configure your server

  app.put("/updateBook/:id", async (req, res) => {
    const id = new ObjectId(req.params.id);
    const updatedBookData = req.body;

    try {
      const collection = client.db(process.env.DB_NAME).collection("books");

      const result = await collection.findOneAndUpdate(
        { _id: id },
        { $set: { ...updatedBookData, _id: id } }, // Exclude _id from the update
        { returnOriginal: false }
      );

      if (result.value) {
        res.json(result.value);
      } else {
        res.status(404).send("Book not found");
      }
    } catch (err) {
      console.error("Error updating book:", err);
      res.status(500).send("Internal Server Error");
    }
  });
}
run().catch(console.dir);

app.listen(port);
