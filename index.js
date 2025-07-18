const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://book-my-event-26b6e.web.app",
      "https://book-my-event-26b6e.firebaseapp.com/",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// mongodb uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kkwzhai.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // event related api start here
    const eventCollection = client.db("book-my-event").collection("events");
    const usersCollection = client.db("book-my-event").collection("users");
    const bookingsCollection = client
      .db("book-my-event")
      .collection("bookings");

    // event related api
    app.get("/events", async (req, res) => {
      const search = req.query?.search || "";
      const id = req.params?.id;

      let query = {};

      if (id) {
        query = { _id: new ObjectId(id) };
      }

      if (search) {
        query = {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { category: { $regex: search, $options: "i" } },
          ],
        };
      }
      const cursor = eventCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/events", async (req, res) => {
      const newEvent = req.body;

      const result = await eventCollection.insertOne(newEvent);
      res.send(result);
    });

    app.get("/events/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eventCollection.findOne(query);
      res.send(result);
    });

    // booking registration related api
    app.get("/bookings/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await bookingsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const newBookings = req.body;
      const result = await bookingsCollection.insertOne(newBookings);
      res.send(result);
    });

    app.put("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const { rating, comment } = req.body;
      console.log("Rating:", rating);
  console.log("Comment:", comment);
  
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set:  {
      review: {
        rating: rating,
        comment: comment,
      },
    },
      };
      const result = await bookingsCollection.updateOne(filter, updateDoc)
      res.send(result)
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(query);
      res.send(result);
    });

    // user related api
    app.get("/users", async (req, res) => {
      const email = req.query.email;
  if (!email) {
    return res.status(400).send({ error: "Email is required" });
  }
      let query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const { name, photoURL } = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          name: name,
          photoURL: photoURL,
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Your event on going");
});

app.listen(port, () => {
  console.log(`Event Running on ${port}`);
});
