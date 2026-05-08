import { MongoClient } from "mongodb";

// Hospital Interface
export interface Doctor {
  name: string;
  type: string;
  department: string;
  schedule: string;
  priceRange: string;
  hmos: string[];
  contact: string;
  tags?: string[]; // Added tags for matching
}

export interface Hospital {
  id: string;
  numericId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  services: string[];
  referenceKey: string;
  level: string;
  doctors: Doctor[];
  operatingHours?: string;
  contactNumber?: string;
}

let hospitalCache: Hospital[] | null = null;
let client: MongoClient | null = null;

async function getMongoClient() {
  if (client) return client;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }
  
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000, // Wait 5 seconds before failing
    connectTimeoutMS: 10000,        // 10 seconds for initial connection
  });
  await client.connect();
  return client;
}

/**
 * Initializes the service by fetching data from MongoDB.
 */
export async function initExcelService(): Promise<void> {
  console.log("[DBService] Starting initialization...");
  try {
    const mongoClient = await getMongoClient();
    
    // Ping the database to verify connection
    console.log("[DBService] Pinging MongoDB...");
    await mongoClient.db("admin").command({ ping: 1 });
    console.log("[DBService] Ping successful!");

    const db = mongoClient.db(); // Default DB
    console.log(`[DBService] Using database: ${db.databaseName}`);
    
    const collection = db.collection<Hospital>("Hospital_DB");
    const data = await collection.find({}).toArray();
    hospitalCache = data;
    
    console.log(`[DBService] Successfully fetched ${hospitalCache.length} hospitals`);

  } catch (err: any) {
    console.error("[DBService] CRITICAL FAILURE:", err.message);
    if (err.message.includes("selection timeout")) {
      console.error("[DBService] Suggestion: Check your IP Whitelist in MongoDB Atlas (0.0.0.0/0)");
    }
    hospitalCache = [];
    throw err; // Re-throw to be caught by server.ts
  }
}


// Sync version for existing code compatibility
export function getHospitals(): Hospital[] {
  if (!hospitalCache) {
    // If cache is empty, we return empty array but trigger an async load
    // In a real serverless env, we should await initExcelService() in the handler
    initExcelService().catch(console.error);
    return [];
  }
  return [...hospitalCache];
}

export function findHospitalByNumericId(numericId: number): Hospital | undefined {
  return hospitalCache?.find(h => h.numericId === numericId);
}

export function findHospitalById(id: string): Hospital | undefined {
  return hospitalCache?.find(h => h.id === id || String(h.numericId) === id);
}

