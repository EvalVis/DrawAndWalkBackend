import {onCall, CallableRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {GoogleGenerativeAI} from "@google/generative-ai";

// Define the Gemini API key as a secret
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// Function to handle Gemini API calls
export const callGemini = onCall(
  {secrets: [GEMINI_API_KEY]},
  async (request: CallableRequest<{query: string}>) => {
    try {
      // Extract the query from the request data
      const {query} = request.data;
      if (!query || typeof query !== "string") {
        throw new Error(
          "The function must be called with a 'query' parameter of type string."
        );
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
      return {response: text};
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error(
        "An error occurred while calling the Gemini API."
      );
    }
  }
);
