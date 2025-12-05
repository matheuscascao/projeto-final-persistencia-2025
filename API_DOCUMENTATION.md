# 🎉 Tourism API - Complete Documentation

## ✅ All Features Implemented!

### Base URL
```
http://localhost:3000
```

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "login": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "login": "johndoe",
    "email": "john@example.com",
    "role": "USER"
  },
  "token": "jwt_token_here"
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as register

### Get Current User
```http
GET /auth/me
Authorization: Bearer {token}
```

---

## 🗺️ Tourist Spots Endpoints

### List All Spots (with Pagination & Filters)
```http
GET /spots?page=1&limit=10&city=Rio&minRating=4&search=beach&sortBy=rating&sortOrder=desc
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 10) - Items per page
- `city` - Filter by city (partial match)
- `state` - Filter by state
- `country` - Filter by country
- `minRating` - Minimum rating filter
- `search` - Search in name and description
- `sortBy` - Sort by: `name`, `rating`, `createdAt` (default: `createdAt`)
- `sortOrder` - Sort order: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### Get Single Spot
```http
GET /spots/:id
```

### Create Spot (Requires Authentication)
```http
POST /spots
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Copacabana Beach",
  "description": "Famous beach in Rio",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "country": "Brazil",
  "lat": -22.971177,
  "lng": -43.182543,
  "address": "Av. Atlântica"
}
```

### Update Spot (Requires Authentication & Ownership/Admin)
```http
PUT /spots/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated name",
  ...
}
```

### Delete Spot (Requires Authentication & Ownership/Admin)
```http
DELETE /spots/:id
Authorization: Bearer {token}
```

---

## ⭐ Ratings Endpoints

### Get Ratings for a Spot
```http
GET /ratings/spot/:spotId
```

### Get My Rating for a Spot
```http
GET /ratings/spot/:spotId/my-rating
Authorization: Bearer {token}
```

### Create/Update Rating (Atomic Average Calculation)
```http
POST /ratings/spot/:spotId
Authorization: Bearer {token}
Content-Type: application/json

{
  "score": 5,
  "summaryComment": "Amazing place!"
}
```

**Note:** Creates new rating or updates if user already rated. Automatically recalculates spot's average rating atomically.

### Delete Rating
```http
DELETE /ratings/spot/:spotId
Authorization: Bearer {token}
```

---

## 💬 Comments Endpoints (MongoDB)

### Get Comments for a Spot
```http
GET /comments/spot/:spotId
```

### Create Comment
```http
POST /comments/spot/:spotId
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "This place is wonderful!",
  "metadata": {
    "device": "mobile",
    "language": "en"
  }
}
```

### Update Comment
```http
PUT /comments/:commentId
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Updated comment text"
}
```

### Delete Comment
```http
DELETE /comments/:commentId
Authorization: Bearer {token}
```

### Add Reply to Comment
```http
POST /comments/:commentId/reply
Authorization: Bearer {token}
Content-Type: application/json

{
  "text": "Great point!"
}
```

---

## 📸 Photos Endpoints (File Upload)

### Get Photos for a Spot
```http
GET /photos/spot/:spotId
```

### Upload Photo (Max 10 per spot)
```http
POST /photos/spot/:spotId
Authorization: Bearer {token}
Content-Type: multipart/form-data

photo: [file]
title: "Beautiful sunset"
```

**Supported formats:** JPEG, PNG, WebP

### Delete Photo
```http
DELETE /photos/:photoId
Authorization: Bearer {token}
```

---

## 🏨 Lodgings Endpoints

### Get Lodgings for a Spot
```http
GET /lodgings/spot/:spotId
```

### Get Single Lodging
```http
GET /lodgings/:id
```

### Create Lodging
```http
POST /lodgings
Authorization: Bearer {token}
Content-Type: application/json

{
  "spotId": "spot-uuid",
  "name": "Copacabana Palace",
  "address": "Av. Atlântica, 1702",
  "phone": "+55 21 2548-7070",
  "avgPrice": "850.00",
  "type": "Hotel",
  "bookingLink": "https://example.com"
}
```

**Lodging Types:** `Hotel`, `Hostel`, `Inn`

### Update Lodging
```http
PUT /lodgings/:id
Authorization: Bearer {token}
Content-Type: application/json
```

### Delete Lodging
```http
DELETE /lodgings/:id
Authorization: Bearer {token}
```

---

## 🧭 Directions Endpoint

### Get Directions to a Spot
```http
GET /directions/spot/:spotId
```

**Response:**
```json
{
  "spotId": "uuid",
  "name": "Christ the Redeemer",
  "coordinates": {
    "latitude": -22.951916,
    "longitude": -43.210487
  },
  "address": "Parque Nacional da Tijuca",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "country": "Brazil",
  "textDirections": [
    "Navigate to Christ the Redeemer...",
    "Address: ...",
    "Coordinates: ...",
    "You can use GPS navigation..."
  ],
  "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=-22.951916,-43.210487",
  "appleMapsUrl": "http://maps.apple.com/?ll=-22.951916,-43.210487&q=Christ%20the%20Redeemer"
}
```

---

## 📥📤 Export/Import Endpoints

### Export Tourist Spots
```http
GET /export/spots?format=json
GET /export/spots?format=csv
GET /export/spots?format=xml
```

**Formats:** `json`, `csv`, `xml`

**Response:** Downloads file in requested format

### Import Tourist Spots (Admin Only)
```http
POST /import/spots
Authorization: Bearer {admin_token}
Content-Type: multipart/form-data

file: [json/csv/xml file]
format: "json" | "csv" | "xml"
```

**Response:**
```json
{
  "message": "Import completed",
  "results": {
    "successful": 10,
    "failed": 2,
    "errors": [
      {
        "spot": "Invalid Spot",
        "error": "Validation error..."
      }
    ]
  }
}
```

---

## 🔒 Authentication & Authorization

### Required Headers
Most protected endpoints require:
```http
Authorization: Bearer {your_jwt_token}
```

### User Roles
- **USER**: Can create spots, rate, comment, upload photos
- **ADMIN**: Can delete any content, import/export data

### Permissions
- Users can only edit/delete their own content
- Admins can edit/delete any content
- Ratings: One per user per spot

---

## 📊 Data Models

### PostgreSQL Tables
- **users**: User accounts
- **tourist_spots**: Tourist destinations
- **lodgings**: Accommodations
- **ratings**: User ratings (1-5 stars)
- **favorites**: User favorites

### MongoDB Collections
- **comments**: Detailed comments with replies
- **photos**: Photo metadata (files stored in `/uploads`)

---

## 🧪 Testing Examples

### Register and Login
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"login":"testuser","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

### Create a Tourist Spot
```bash
curl -X POST http://localhost:3000/spots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Ipanema Beach",
    "description": "Beautiful beach",
    "city": "Rio de Janeiro",
    "state": "RJ",
    "country": "Brazil",
    "lat": -22.983889,
    "lng": -43.205556,
    "address": "Ipanema"
  }'
```

### Rate a Spot
```bash
curl -X POST http://localhost:3000/ratings/spot/SPOT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"score":5,"summaryComment":"Amazing!"}'
```

### Export Data
```bash
# JSON
curl http://localhost:3000/export/spots?format=json > spots.json

# CSV
curl http://localhost:3000/export/spots?format=csv > spots.csv

# XML
curl http://localhost:3000/export/spots?format=xml > spots.xml
```

---

## ✅ Implemented Features Checklist

- ✅ User authentication (signup/login) with JWT and bcrypt
- ✅ Full CRUD operations for tourist spots with permissions
- ✅ Pagination and filters (city, state, rating, search, sorting)
- ✅ Photo upload with disk storage and MongoDB metadata (max 10 per spot)
- ✅ Ratings system with atomic average calculation (1-5 stars)
- ✅ Comments system with MongoDB and replies support
- ✅ Lodgings CRUD (name, address, phone, price, type, booking link)
- ✅ Directions endpoint (lat/lng, text directions, maps URLs)
- ✅ Export data in JSON, CSV, and XML formats
- ✅ Import data from JSON, CSV, and XML files (admin only)
- ✅ Role-based access control (USER/ADMIN)
- ✅ Permission checks (ownership and admin override)

---

## 🚀 Getting Started

1. **Start the API server:**
   ```bash
   cd apps/api
   bun run dev
   ```

2. **Start the frontend:**
   ```bash
   cd apps/web
   bun run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - API: http://localhost:3000
   - Health Check: http://localhost:3000/health

---

## 📚 Additional Resources

- See `SUCCESS.md` for setup details
- See `README.md` for project overview
- All routes are CORS-enabled
- SSL/TLS configured for database connections

**Your complete Tourism API is ready to use!** 🎉

