import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {GoogleGenerativeAI} from "@google/generative-ai";
import {MongoClient, MongoClientOptions} from "mongodb";

// Define secrets
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const MONGODB_ATLAS_URL = defineSecret("MONGODB_ATLAS_URL");

// MongoDB connection options
const mongoOptions: MongoClientOptions = {
  retryWrites: true,
  w: "majority",
  appName: "WalkAndDraw",
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
};

// Function to handle Gemini API calls
export const callGemini = onRequest(
  {secrets: [GEMINI_API_KEY]},
  async (req, res) => {
    try {
      // Extract the query from the request body
      const {query} = req.body;

      if (!query || typeof query !== "string") {
        res.status(400).json({
          error: "Request must include a 'query' parameter of type string",
        });
        return;
      }

      // Initialize the Gemini API with the secret key
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      // Get the generative model
      const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});
      // Generate content
      const result = await model.generateContent(query);
      const response = await result.response;
      const text = response.text();

      // Return the response
      res.status(200).json({response: text});
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({
        error: "An error occurred while calling the Gemini API",
      });
    }
  },
);

// Function to update distance
export const updateDistance = onRequest(
  {secrets: [MONGODB_ATLAS_URL]},
  async (req, res) => {
    let client;
    try {
      // Extract data from the request body
      const {email, distance, timestamp} = req.body;

      if (!email || typeof email !== "string") {
        res.status(400).json({
          error: "Request must include an 'email' parameter of type string",
        });
        return;
      }

      if (typeof distance !== "number") {
        res.status(400).json({
          error: "Request must include a 'distance' parameter of type number",
        });
        return;
      }

      // Connect to MongoDB with options
      const connectionString = MONGODB_ATLAS_URL.value();
      client = new MongoClient(connectionString, mongoOptions);
      await client.connect();

      // Get the database and collection
      const db = client.db("Distances");
      const collection = db.collection("Ink");

      // Update or insert the distance record
      const result = await collection.updateOne(
        {email},
        {
          $set: {
            email,
            distance,
            lastUpdated: timestamp || new Date().toISOString(),
          },
        },
        {upsert: true}
      );

      // Return success
      res.status(200).json({
        success: true,
        message: result.upsertedCount > 0 ? "Record created" : "Record updated",
      });
    } catch (error) {
      console.error("Error updating distance:", error);
      res.status(500).json({
        error: "An error occurred while updating the distance",
      });
    } finally {
      // Close the MongoDB connection
      if (client) {
        await client.close();
      }
    }
  },
);

// Function to get leaderboard
export const getLeaderboard = onRequest(
  {secrets: [MONGODB_ATLAS_URL]},
  async (req, res) => {
    let client;
    try {
      // Connect to MongoDB with options
      const connectionString = MONGODB_ATLAS_URL.value();
      client = new MongoClient(connectionString, mongoOptions);
      await client.connect();

      // Get the database and collection
      const db = client.db("Distances");
      const collection = db.collection("Ink");

      // Find all distances sorted by distance (descending)
      const results = await collection
        .find({})
        .sort({distance: -1})
        .limit(100)
        .toArray();

      // Transform results to only include username and distance
      const privacySafeResults = results.map((result) => ({
        username: result.username,
        distance: result.distance,
      }));

      // Return the leaderboard with privacy protection
      res.status(200).json(privacySafeResults);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({
        error: "An error occurred while getting the leaderboard",
      });
    } finally {
      // Close the MongoDB connection
      if (client) {
        await client.close();
      }
    }
  },
);
