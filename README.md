# Walk and Draw - Firebase Cloud Functions

This directory contains the Firebase Cloud Functions that power the backend of the Walk and Draw application.

## Features

- **AI-Powered Drawing Suggestions**: Uses Google's Gemini AI to generate creative drawing ideas
- **Drawing Storage**: Saves user drawings to MongoDB Atlas
- **Leaderboard Management**: Tracks and ranks users based on distance walked
- **User Authentication**: Integrates with Auth0 for secure user management

## Project Structure

- `functions/`: Contains the Firebase Cloud Functions code
  - `src/index.ts`: Main source code with all function implementations
  - `package.json`: Dependencies and scripts
  - `tsconfig.json`: TypeScript configuration

## Dependencies

- **firebase-admin**: Firebase Admin SDK
- **firebase-functions**: Firebase Functions framework
- **@google/generative-ai**: Google's Generative AI SDK for Gemini
- **mongodb**: MongoDB Node.js driver

## Licensing

This project is released under the [GNU General Public License v3.0](LICENSE) (GPL-3.0).

### Open Source Components

The code in this directory is released under the GPL-3.0, which allows you to freely use, modify, and distribute the code, provided that any derivative works are also released under the same license.

### Proprietary API Usage

These cloud functions interact with several proprietary APIs:

- **Google Gemini API**: Used for AI-powered drawing suggestions
- **MongoDB Atlas**: Used for data storage
- **Firebase**: Used as the hosting platform

Please setup API keys for these APIs.

## Getting Started

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Install dependencies: `cd functions && npm install`
4. Set up environment variables:
   - GEMINI_API_KEY: Your Google Gemini API key
   - MONGODB_ATLAS_URL: Your MongoDB Atlas connection string
5. Deploy to Firebase: `firebase deploy --only functions`

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

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