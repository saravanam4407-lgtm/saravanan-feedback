# AuraFeedback Backend API

A clean REST API server built specifically for the **AuraFeedback** system.

---

## 🚀 Quick Start

You can run this backend using **Node.js** or **Python** without installing extra packages (zero third-party dependencies required).

### Option 1: Run with Node.js
```bash
# In the backend directory:
node server.js
```
*Or using npm:*
```bash
npm start
```

### Option 2: Run with Python
```bash
# In the backend directory:
python server.py
```

The server will automatically start at:  
👉 **`http://localhost:5000`**

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health status and uptime |
| `GET` | `/api/products` | Retrieve all products available for review |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `GET` | `/api/feedbacks` | Fetch reviews (supports `search`, `category`, `rating`, `sentiment`, `page`, `limit`) |
| `GET` | `/api/feedbacks/stats` | Real-time analytics (NPS, CSAT, sentiment breakdown, rating distribution) |
| `GET` | `/api/feedbacks/:id` | Retrieve single review by ticket ID |
| `POST` | `/api/feedbacks` | Submit new review (calculates sentiment and creates ticket ID) |
| `PUT` | `/api/feedbacks/:id` | Update feedback item status / notes |
| `POST` | `/api/feedbacks/:id/reply` | Add official support reply to ticket |
| `DELETE`| `/api/feedbacks/:id` | Permanently remove feedback ticket |
| `POST` | `/api/feedbacks/reset` | Restore demo seed reviews |
| `GET` | `/api/tags` | List tag recommendations by category |

---

## 📝 Request & Response Examples

### 1. Submit New Feedback
**`POST /api/feedbacks`**

**Request Body:**
```json
{
  "name": "Sarah Connor",
  "email": "sarah@example.com",
  "rating": 5,
  "category": "Product Quality",
  "comment": "Exceptional audio clarity and seamless Bluetooth pairing. Love the sleek design!",
  "tags": ["High Quality", "Clean Design"],
  "product": {
    "id": "prod-1",
    "name": "Zenith Noise-Cancelling Headphones",
    "category": "Electronics"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "feedback": {
    "id": "AF-49201-TKT",
    "name": "Sarah Connor",
    "email": "sarah@example.com",
    "rating": 5,
    "category": "Product Quality",
    "comment": "Exceptional audio clarity and seamless Bluetooth pairing. Love the sleek design!",
    "tags": ["High Quality", "Clean Design"],
    "sentiment": "positive",
    "date": "2026-10-25T21:48:52.000Z",
    "status": "open",
    "product": {
      "id": "prod-1",
      "name": "Zenith Noise-Cancelling Headphones",
      "category": "Electronics"
    },
    "replies": []
  }
}
```

---

### 2. Fetch Analytics & Stats
**`GET /api/feedbacks/stats`**

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total": 5,
    "avgRating": 3.0,
    "npsScore": -20,
    "csatScore": 40,
    "sentiment": {
      "positive": 2,
      "neutral": 1,
      "negative": 2,
      "positivePct": 40,
      "neutralPct": 20,
      "negativePct": 40
    },
    "ratingDistribution": {
      "1": 1,
      "2": 1,
      "3": 1,
      "4": 1,
      "5": 1
    },
    "categoryBreakdown": {
      "Product Quality": 2,
      "Delivery": 1,
      "Pricing": 1,
      "Customer Service": 1
    }
  }
}
```

---

### 3. Filter Reviews
**`GET /api/feedbacks?search=headphones&rating=5&sentiment=positive`**

---

### 4. Admin Reply to a Review
**`POST /api/feedbacks/:id/reply`**

**Request Body:**
```json
{
  "author": "Customer Success Manager",
  "replyText": "Thank you for the wonderful feedback! We are thrilled to hear your review."
}
```

---

## 🗄️ Database
Data is persistently stored in JSON format inside the [data/](file:///c:/Users/Saravanan%20M/Dropbox/the%20project/saravanan%20feedback/backend/data) folder:
- `data/products.json` - Product catalog
- `data/feedbacks.json` - Customer feedback entries and ticket histories
