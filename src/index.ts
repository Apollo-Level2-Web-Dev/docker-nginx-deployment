import express from "express";
import axios from "axios";
import mongoose, { Connection } from "mongoose";

const app = express();
app.use(express.json());

/* --------------------------------------------------
   Schema & Model
-------------------------------------------------- */
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

/* --------------------------------------------------
   Utility: Create DB Connection
-------------------------------------------------- */
async function connectToDatabase(uri: string): Promise<Connection> {
  const connection = await mongoose.createConnection(uri).asPromise();
  return connection;
}

/* --------------------------------------------------
   DEMO 1: Container → Internet
-------------------------------------------------- */
app.get("/internet/:id", async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/posts/${req.params.id}`
    );

    res.json({
      demo: "Container → Internet ✅",
      data,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to call external API" });
  }
});


/* --------------------------------------------------
   DEMO 2: Container → Host / Atlas
   Env:
   MONGO_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/demo
   OR
   MONGO_ATLAS_URI=mongodb://host.docker.internal:27017/demo   
-------------------------------------------------- */
app.get("/host-db", async (_req, res) => {
  try {
    const uri = process.env.MONGO_ATLAS_URI;
    if (!uri) {
      return res.status(400).json({ error: "MONGO_ATLAS_URI not set" });
    }

    const conn = await connectToDatabase(uri);
    const Item = conn.model("Item", itemSchema);

    await Item.create({ name: "Hello from host DB" });
    const items = await Item.find();

    await conn.close();

    res.json({
      demo: "Container → Host / Atlas ✅",
      items,
    });
  } catch (error) {
    res.status(500).json({ error: "Host DB connection failed" });
  }
});


/* --------------------------------------------------
   DEMO 3: Container → Container (MongoDB)
   Env:
   MONGO_CONTAINER_URI=mongodb://root:secret@mongo-container:27017/demo?authSource=admin
-------------------------------------------------- */
app.get("/container-db", async (_req, res) => {
  try {
    const uri = process.env.MONGO_CONTAINER_URI;
    if (!uri) {
      return res.status(400).json({ error: "MONGO_CONTAINER_URI not set" });
    }

    const conn = await connectToDatabase(uri);
    const Item = conn.model("Item", itemSchema);

    await Item.create({ name: "Hello from container DB" });
    const items = await Item.find();

    await conn.close();

    res.json({
      demo: "Container → Container (MongoDB) ✅",
      items,
    });
  } catch (error) {
    res.status(500).json({ error: "Container DB connection failed" });
  }
});

/* --------------------------------------------------
   Server
-------------------------------------------------- */
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});