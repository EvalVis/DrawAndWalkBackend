import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {GoogleGenerativeAI} from "@google/generative-ai";

// Define the Gemini API key as a secret
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Function to handle Gemini API calls
export const callGemini = onRequest(
  {
    secrets: [GEMINI_API_KEY],
  },
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
      const model = genAI.getGenerativeModel({model: "gemini-2.0-flash"});

      const result = await model.generateContent(query);
      const response = await result.response;
      const text = response.text();

      res.status(200).json({response: text});
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      res.status(500).json({
        error: "An error occurred while calling the Gemini API",
      });
    }
  }
);
