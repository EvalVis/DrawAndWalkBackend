# Firebase Functions for Walk and Draw App

This directory contains Firebase Functions for the Walk and Draw app, including a function to handle Gemini API calls.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up the Gemini API key as a secret in Firebase:
   ```
   firebase functions:secrets:set GEMINI_API_KEY
   ```
   When prompted, enter your Gemini API key.

3. Build the functions:
   ```
   npm run build
   ```

4. Deploy the functions:
   ```
   npm run deploy
   ```

## Available Functions

### `callGemini`

A callable function that accepts a query string and returns a response from the Gemini API.

**Request format:**
```json
{
  "query": "Your question or prompt for Gemini"
}
```

**Response format:**
```json
{
  "response": "The response from Gemini API"
}
```

**Example usage in Flutter:**
```dart
final functions = FirebaseFunctions.instance;
final result = await functions.httpsCallable('callGemini').call({
  'query': 'What should I draw today?'
});
final response = result.data['response'];
```

## Local Development

To run the functions locally:

```
npm run serve
```

This will start the Firebase emulators and allow you to test the functions locally. 