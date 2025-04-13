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
      const {email, username, distance, timestamp} = req.body;

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

      // First, find the existing record for this user
      const existingRecord = await collection.findOne({email});

      // Calculate the new total distance
      const currentDistance = existingRecord?.distance ?? 0;
      const newTotalDistance = currentDistance + distance;

      // Use the username from the request, or fallback to existing username or "Anonymous"
      const displayUsername = username || existingRecord?.username || "Anonymous";

      // Update or insert the distance record
      const result = await collection.updateOne(
        {email},
        {
          $set: {
            email,
            username: displayUsername,
            distance: newTotalDistance,
            lastUpdated: timestamp || new Date().toISOString(),
          },
        },
        {upsert: true}
      );

      // Return success
      res.status(200).json({
        success: true,
        message: result.upsertedCount > 0 ? "Record created" : "Record updated",
        totalDistance: newTotalDistance,
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

// Function to save a drawing
export const saveDrawing = onRequest(
  {secrets: [MONGODB_ATLAS_URL]},
  async (req, res) => {
    let client;
    try {
      // Extract data from the request body
      const {email, username, coordinates, timestamp} = req.body;

      if (!email || typeof email !== "string") {
        res.status(400).json({
          error: "Request must include an 'email' parameter of type string",
        });
        return;
      }

      if (!coordinates || !Array.isArray(coordinates)) {
        res.status(400).json({
          error: "Request must include a 'coordinates' parameter of type array",
        });
        return;
      }

      // Connect to MongoDB with options
      const connectionString = MONGODB_ATLAS_URL.value();
      client = new MongoClient(connectionString, mongoOptions);
      await client.connect();

      // Get the database and collection
      const db = client.db("Distances");
      const collection = db.collection("Drawings");

      // Create a new drawing document
      const drawing = {
        email,
        username: username || "Anonymous",
        coordinates,
        createdAt: timestamp || new Date().toISOString(),
      };

      // Insert the drawing
      const result = await collection.insertOne(drawing);

      // Return success with the drawing ID
      res.status(200).json({
        success: true,
        message: "Drawing saved successfully",
        drawingId: result.insertedId,
      });
    } catch (error) {
      console.error("Error saving drawing:", error);
      res.status(500).json({
        error: "An error occurred while saving the drawing",
      });
    } finally {
      // Close the MongoDB connection
      if (client) {
        await client.close();
      }
    }
  },
);

// Function to get drawings for a user
export const getDrawings = onRequest(
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
      const collection = db.collection("Drawings");

      // Find all drawings, sorted by creation date (newest first)
      const drawings = await collection
        .find({})
        .sort({createdAt: -1})
        .limit(100) // Limit to 100 drawings to prevent excessive data transfer
        .toArray();

      // Transform the drawings to remove MongoDB-specific fields
      const transformedDrawings = drawings.map((drawing) => ({
        id: drawing._id.toString(),
        username: drawing.username,
        coordinates: drawing.coordinates,
        createdAt: drawing.createdAt,
      }));

      // Return the drawings
      res.status(200).json(transformedDrawings);
    } catch (error) {
      console.error("Error getting drawings:", error);
      res.status(500).json({
        error: "An error occurred while getting the drawings",
      });
    } finally {
      // Close the MongoDB connection
      if (client) {
        await client.close();
      }
    }
  },
);
