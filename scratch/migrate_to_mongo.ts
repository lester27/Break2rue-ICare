import "dotenv/config";
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI not found in .env file");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("Connected successfully!");

    const db = client.db("icare_db");
    const collection = db.collection("hospitals");

    // Load local JSON data
    const jsonPath = path.resolve(process.cwd(), "public", "hospital_db.json");
    if (!fs.existsSync(jsonPath)) {
      throw new Error(`Could not find ${jsonPath}`);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    console.log(`Read ${data.length} hospitals from JSON file.`);

    // Clear existing data (optional, but good for a fresh start)
    console.log("Cleaning up existing collection...");
    await collection.deleteMany({});

    // Insert data
    console.log("Uploading to MongoDB...");
    const result = await collection.insertMany(data);
    console.log(`Successfully migrated ${result.insertedCount} hospitals to MongoDB Atlas!`);

  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await client.close();
  }
}

migrate();
