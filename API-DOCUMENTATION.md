# AI Tools Organizer - REST API Documentation 🔗

Access your AI tools data programmatically from any application!

## Overview

The AI Tools Organizer provides multiple ways to access your data:

1. **Firebase REST API** - Direct access to your Firebase database
2. **Export Endpoints** - Get data in JSON/CSV/Excel formats
3. **Web Standards** - Standard HTTP methods (GET, POST, PUT, DELETE)

---

## Firebase REST API 🔥

Your tools are stored in Firebase Realtime Database and accessible via REST API.

### Base URL

```
https://[YOUR-PROJECT-ID].firebaseio.com/
```

For the default setup:
```
https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/
```

### Authentication

**Public Mode** (current setup):
- No authentication required
- Anyone with URL can read/write
- ⚠️ Only for testing!

**Secure Mode** (recommended for production):
- Requires Firebase Auth token
- Add `auth=[TOKEN]` parameter
- See "Security" section below

---

## API Endpoints

### Get All Tools

**Request:**
```http
GET https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools.json
```

**Response:**
```json
{
  "tool-id-1": {
    "id": "1234567890",
    "name": "ChatGPT",
    "url": "https://chatgpt.com",
    "description": "AI chatbot",
    "category": "Assistent",
    "price": "freemium",
    "rating": 5,
    "tags": ["ai", "chatbot"],
    "notes": "Very useful",
    "dateAdded": "2025-01-15T10:30:00.000Z"
  },
  "tool-id-2": { ... }
}
```

### Get Single Tool

**Request:**
```http
GET https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/[TOOL-ID].json
```

**Example:**
```bash
curl "https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/tool-id-1.json"
```

### Add New Tool

**Request:**
```http
POST https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools.json
Content-Type: application/json

{
  "name": "New AI Tool",
  "url": "https://example.com",
  "description": "Description here",
  "category": "Assistent",
  "price": "free",
  "rating": 4,
  "tags": ["ai", "new"],
  "notes": "",
  "dateAdded": "2025-01-20T12:00:00.000Z"
}
```

**Response:**
```json
{
  "name": "generated-tool-id-123"
}
```

### Update Tool

**Request:**
```http
PATCH https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/[TOOL-ID].json
Content-Type: application/json

{
  "rating": 5,
  "notes": "Updated notes"
}
```

### Delete Tool

**Request:**
```http
DELETE https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/[TOOL-ID].json
```

---

## Query Parameters

### Filtering

**Get tools by category:**
```http
GET /tools.json?orderBy="category"&equalTo="Assistent"
```

**Get tools with rating >= 4:**
```http
GET /tools.json?orderBy="rating"&startAt=4
```

**Limit results:**
```http
GET /tools.json?limitToFirst=10
```

### Ordering

```http
GET /tools.json?orderBy="dateAdded"
GET /tools.json?orderBy="rating"
GET /tools.json?orderBy="name"
```

---

## Code Examples

### JavaScript / Fetch API

```javascript
// Get all tools
async function getAllTools() {
  const response = await fetch(
    'https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools.json'
  );
  const tools = await response.json();
  return Object.values(tools);
}

// Add new tool
async function addTool(toolData) {
  const response = await fetch(
    'https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools.json',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolData)
    }
  );
  return await response.json();
}

// Update tool
async function updateTool(toolId, updates) {
  const response = await fetch(
    `https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/${toolId}.json`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }
  );
  return await response.json();
}

// Delete tool
async function deleteTool(toolId) {
  await fetch(
    `https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/${toolId}.json`,
    { method: 'DELETE' }
  );
}
```

### Python

```python
import requests

BASE_URL = "https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app"

# Get all tools
def get_all_tools():
    response = requests.get(f"{BASE_URL}/tools.json")
    tools = response.json()
    return list(tools.values()) if tools else []

# Add tool
def add_tool(tool_data):
    response = requests.post(
        f"{BASE_URL}/tools.json",
        json=tool_data
    )
    return response.json()

# Update tool
def update_tool(tool_id, updates):
    response = requests.patch(
        f"{BASE_URL}/tools/{tool_id}.json",
        json=updates
    )
    return response.json()

# Delete tool
def delete_tool(tool_id):
    requests.delete(f"{BASE_URL}/tools/{tool_id}.json")
```

### cURL

```bash
# Get all tools
curl "https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools.json"

# Add tool
curl -X POST \
  "https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools.json" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Tool",
    "url": "https://example.com",
    "description": "A great AI tool",
    "category": "Assistent",
    "price": "free",
    "rating": 5,
    "tags": ["ai"],
    "dateAdded": "2025-01-20T12:00:00.000Z"
  }'

# Update tool
curl -X PATCH \
  "https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/TOOL-ID.json" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'

# Delete tool
curl -X DELETE \
  "https://aior-abb56-default-rtdb.europe-west1.firebasedatabase.app/tools/TOOL-ID.json"
```

---

## Integration Examples

### Notion Integration

```javascript
// Sync tools to Notion database
async function syncToNotion() {
  const tools = await getAllTools();

  for (const tool of tools) {
    await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        Name: { title: [{ text: { content: tool.name } }] },
        URL: { url: tool.url },
        Category: { select: { name: tool.category } },
        Rating: { number: tool.rating }
      }
    });
  }
}
```

### Airtable Integration

```javascript
// Sync tools to Airtable
async function syncToAirtable() {
  const tools = await getAllTools();

  const records = tools.map(tool => ({
    fields: {
      Name: tool.name,
      URL: tool.url,
      Description: tool.description,
      Category: tool.category,
      Rating: tool.rating
    }
  }));

  await airtable('AI Tools').create(records);
}
```

### Zapier/Make.com Webhooks

```javascript
// Trigger on new tool added (using Firebase realtime listener)
firebase.database().ref('tools').on('child_added', (snapshot) => {
  const newTool = snapshot.val();

  // Send to Zapier webhook
  fetch('https://hooks.zapier.com/hooks/catch/YOUR-HOOK/', {
    method: 'POST',
    body: JSON.stringify(newTool)
  });
});
```

---

## Local Export API

The web app also provides export functionality:

### JSON Export

**Endpoint:** Built-in button in app
**Format:** JSON array
**Usage:** For backups, migrations

### CSV Export

**Endpoint:** Built-in button in app
**Format:** CSV with headers
**Usage:** Excel, Google Sheets, data analysis

### Excel Export

**Endpoint:** Built-in button in app
**Format:** .xlsx with formatting
**Usage:** Professional reports, sharing

---

## Security 🔒

### Current Setup (Test Mode)

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **Warning:** Anyone can read/write your data!

### Recommended Production Rules

**Option 1: Authenticated Users Only**

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

**Option 2: Per-User Data**

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

**Option 3: API Key Based**

1. Generate API key in Firebase Console
2. Store in environment variable
3. Add to requests:

```javascript
const API_KEY = 'YOUR-API-KEY';
const url = `${BASE_URL}/tools.json?auth=${API_KEY}`;
```

### Implementing Authentication

```javascript
// Using Firebase Auth
import { getAuth, signInAnonymously } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInAnonymously(auth);
const token = await userCredential.user.getIdToken();

// Use token in API requests
const url = `${BASE_URL}/tools.json?auth=${token}`;
```

---

## Rate Limits

Firebase Realtime Database limits:

- **Free Tier (Spark):**
  - 100 simultaneous connections
  - 1 GB stored
  - 10 GB/month downloaded
  - No credit card required

- **Paid Tier (Blaze):**
  - 200,000 simultaneous connections
  - $5/GB stored
  - $1/GB downloaded
  - Pay as you go

---

## CORS

Firebase supports CORS by default. All origins are allowed.

For custom domains, add in Firebase Console:
1. Hosting → Advanced
2. Add domain to CORS origins

---

## Webhooks & Real-time

### Real-time Updates

```javascript
// Listen for changes
firebase.database().ref('tools').on('value', (snapshot) => {
  const tools = snapshot.val();
  console.log('Tools updated:', tools);
});

// Listen for new tools
firebase.database().ref('tools').on('child_added', (snapshot) => {
  const newTool = snapshot.val();
  console.log('New tool added:', newTool);
});

// Listen for updates
firebase.database().ref('tools').on('child_changed', (snapshot) => {
  const updatedTool = snapshot.val();
  console.log('Tool updated:', updatedTool);
});
```

### Custom Webhooks

Use Firebase Cloud Functions to trigger webhooks:

```javascript
exports.onToolAdded = functions.database
  .ref('/tools/{toolId}')
  .onCreate((snapshot, context) => {
    const tool = snapshot.val();

    // Send to your webhook
    return fetch('https://your-webhook-url.com', {
      method: 'POST',
      body: JSON.stringify(tool)
    });
  });
```

---

## GraphQL (Optional)

Wrap Firebase REST API in GraphQL using Hasura or Apollo:

```graphql
type Tool {
  id: ID!
  name: String!
  url: String
  description: String
  category: String
  price: String
  rating: Int
  tags: [String]
  dateAdded: String
}

type Query {
  tools: [Tool]
  tool(id: ID!): Tool
}

type Mutation {
  addTool(input: ToolInput!): Tool
  updateTool(id: ID!, input: ToolInput!): Tool
  deleteTool(id: ID!): Boolean
}
```

---

## Support

Questions about the API?

- Check Firebase REST API docs: https://firebase.google.com/docs/database/rest/start
- Test endpoints with Postman
- Use browser DevTools Network tab
- Check Firebase Console for database structure

---

## Best Practices

1. **Use environment variables** for database URL and API keys
2. **Implement authentication** for production
3. **Cache responses** to reduce API calls
4. **Handle errors** gracefully (network issues, auth failures)
5. **Validate data** before sending to API
6. **Use batch operations** for multiple updates
7. **Monitor usage** in Firebase Console
8. **Set up alerts** for quota limits

---

## Changelog

### v1.0.0
- Initial REST API via Firebase
- CRUD operations for tools
- Query parameters for filtering
- Real-time updates
- Cross-origin support

---

**Happy integrating!** 🚀
