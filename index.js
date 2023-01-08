const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

// author : Ala Uddin and Jillu Rahman Jibon

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("News portal daily news server is ready for use");
});

app.listen(port, () => {
  console.log("server is running on ", port);
});

const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.jf2skzr.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unAuthorized");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  const usersCollections = client.db("newsPortal").collection("users");
  // newscollections
  const newsCollections = client.db("newsPortal").collection("news");

  // alauddin vaiya and jibon we are team members

  // verify admin
  const verifyAdmin = async (req, res, next) => {
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail };
    const user = await usersCollections.findOne(query);

    if (user?.role !== "admin") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };

  // verify publisher
  const verifyPublisher = async (req, res, next) => {
    const decodedEmail = req.decoded.email;
    const query = { email: decodedEmail };
    const user = await usersCollections.findOne(query);

    if (user?.role !== "publisher") {
      return res.status(403).send({ message: "forbidden access" });
    }
    next();
  };

  app.get("/news", async (req, res) => {
    const news = await newsCollections.find({}).toArray();
    console.log(news);
    res.send(news);
  });
  // get news by id
  app.get("/news/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const news = await newsCollections.findOne(query);
    res.send(news);
  });

  // get news by category
  app.get("/news/category/:category", async (req, res) => {
    const category = req.params.category;
    const query = { category: category };
    const news = await newsCollections.find(query).toArray();
    res.send(news);
  });
  // post a news
  app.post("/news", verifyJWT, verifyPublisher, async (req, res) => {
    const news = req.body;
    const result = await newsCollections.insertOne(news);
    res.send(result);
  });
  // delete a news
  app.delete("/news/:id", verifyJWT, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await newsCollections.deleteOne(query);
    res.send(result);
  });
  // update a news
  app.patch("/news/:id", verifyJWT, verifyAdmin, async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const updateNews = req.body;
    const result = await newsCollections.updateOne(query, {
      $set: updateNews,
    });
    res.send(result);
  });
}
run().catch();
