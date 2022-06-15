const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const jwt = require("jsonwebtoken");
require("dotenv").config();

// middleWare:
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
  const auth = req.headers.authentication;

  // jodi jwt token nah thake tahole ami ekti error message dekhabo server side e:
  if (!auth) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  // ar jodi token ti thake and token ti jodi jei user login koreche tar ei hoy tar jonne(that means verify this JWT token):
  const token = auth.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    console.log("Decoded", decoded);
    req.decoded = decoded;
    next();
  });

  console.log("Inside Jwt", auth);
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.runn8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniusCar").collection("service");
    const orderCollection = client.db("geniusCar").collection("order");

    //  jwt auth:
    // eikhane post hobe karon user login korlei amra take ekti jwt token dibo:

    app.post("/login", async (req, res) => {
      const user = req.body;
      var accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // load all data to the server side from mongoDb in the /user api:
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    // load individual service through their id:
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
      console.log(id);
    });

    // Post a user to the mongodb database:
    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });

    // Delete a user:
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });

    // order api:

    // get api:
    app.get("/order", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;

      if (email === decodedEmail) {
        const query = { email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.send(orders);
      }
    });

    // post api:
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
      console.log(order);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("From Genius server");
});

app.listen(port, () => {
  console.log(`Listening to the port ${port}`);
});
