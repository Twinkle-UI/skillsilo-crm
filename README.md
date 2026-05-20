# Skills E-Learnings CRM (Full Stack)

Complete CRM application — **React + Vite frontend** with **Express + Node.js + MongoDB Atlas backend**.

## 📁 Project Structure

```
skillsilo-crm/
├── backend/              # Express + Mongoose + MongoDB Atlas
│   ├── src/
│   │   ├── config/db.js
│   │   ├── models/       # Lead, FollowUp, CallLog
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── server.js     # Entry point
│   │   └── seed.js       # Sample data generator
│   ├── .env.example
│   └── package.json
│
└── frontend/             # React + Vite
    ├── src/
    │   ├── pages/        # DashboardPage, LeadsPage, FollowUpsPage
    │   ├── components/   # All UI components
    │   ├── services/api.js  # API service layer
    │   ├── hooks/        # useMediaQuery, useCountdown
    │   └── App.jsx
    ├── .env
    └── package.json
```

## 🚀 Setup Instructions

### Step 1: MongoDB Atlas Setup

1. Go to https://cloud.mongodb.com — create a free account
2. Create a new **Cluster** (M0 free tier)
3. **Database Access** → Add a user with password
4. **Network Access** → Add `0.0.0.0/0` (or your IP)
5. **Connect** → "Connect your application" → copy the connection string

It will look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/skillsdb?retryWrites=true&w=majority
```

### Step 2: Backend Setup

```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and paste your MongoDB Atlas URI
```

Edit `backend/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/skillsdb?retryWrites=true&w=majority
PORT=5000
CLIENT_URL=http://localhost:3000
```

**Seed sample data** (200 leads, 50 follow-ups, 1500 call logs):
```bash
npm run seed
```

**Start the backend:**
```bash
npm run dev
# Backend runs on http://localhost:5000
```

### Step 3: Frontend Setup

In a **new terminal**:
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

Browser auto-opens — dashboard live data ke saath load hoga! 🎉

## 🔌 API Endpoints

### Dashboard
| Method | Endpoint                    | Description                  |
|--------|----------------------------|------------------------------|
| GET    | `/api/dashboard/stats`      | Real-time aggregated stats   |

### Leads
| Method | Endpoint                       | Description                              |
|--------|-------------------------------|------------------------------------------|
| GET    | `/api/leads`                   | List with `?filter=&search=&page=&limit=` |
| GET    | `/api/leads/filters/counts`    | Filter chip counts                       |
| GET    | `/api/leads/:id`               | Single lead                              |
| POST   | `/api/leads`                   | Create new lead                          |
| PUT    | `/api/leads/:id`               | Update lead                              |
| DELETE | `/api/leads/:id`               | Delete lead                              |

### Follow-Ups
| Method | Endpoint                          | Description                              |
|--------|----------------------------------|------------------------------------------|
| GET    | `/api/followups`                  | List with `?filter=today/tomorrow/planed/missed` |
| GET    | `/api/followups/filters/counts`   | Filter counts                            |
| POST   | `/api/followups`                  | Create follow-up                         |
| PUT    | `/api/followups/:id`              | Update                                   |
| DELETE | `/api/followups/:id`              | Delete                                   |

## 🎯 Key Features

### Backend
- ✅ **Real-time aggregations** using MongoDB `$group` and `$project`
- ✅ **Parallel queries** with `Promise.all` for fast dashboard loads
- ✅ **Indexes** on commonly queried fields (stage, source, dueAt)
- ✅ **Validation** at schema level with Mongoose
- ✅ **Pagination** built into list endpoints
- ✅ **Search** across multiple fields with regex
- ✅ **Time-based filters** (today/tomorrow/missed) for follow-ups
- ✅ **CORS** configured for frontend
- ✅ **Error handling** middleware

### Frontend
- ✅ **Centralized API service** (`src/services/api.js`)
- ✅ **Loading & error states** for all data fetches
- ✅ **Search debouncing** (300ms) — no API spam while typing
- ✅ **Live countdown** for follow-ups (updates every second)
- ✅ **Cleanup on unmount** to prevent memory leaks
- ✅ **Fully responsive** — desktop, tablet, mobile
- ✅ **Multi-page routing** without external library

## 🧪 Testing the API

After backend starts, test endpoints with curl or Postman:

```bash
# Health check
curl http://localhost:5000/

# Dashboard stats
curl http://localhost:5000/api/dashboard/stats

# Leads list
curl "http://localhost:5000/api/leads?filter=All%20Leads&limit=5"

# Filter counts
curl http://localhost:5000/api/leads/filters/counts

# Today's follow-ups
curl "http://localhost:5000/api/followups?filter=today"
```

## 🛠️ Troubleshooting

### "MongoDB connection failed"
- Atlas Network Access mein `0.0.0.0/0` whitelist karein
- `.env` mein `<password>` ko URL-encode karein agar special characters hain
- Database user ka password sahi hai check karein

### "CORS error" in browser
- Backend ka `CLIENT_URL` env var frontend URL se match karein
- Default: `http://localhost:3000`

### "No data showing"
- Backend running hai? `http://localhost:5000` open karke check karein
- Seed run kiya? `cd backend && npm run seed`
- Browser console errors check karein (F12)

### Frontend can't reach backend
- Frontend `.env` mein `VITE_API_URL=http://localhost:5000/api` set hai check karein
- Vite restart karein after `.env` changes (`npm run dev`)

## 📝 Customization

### Add a new lead via API:
```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TEST USER",
    "contact": "+919876543210",
    "inquiredFor": "Vikrant University",
    "stage": "New Leads",
    "source": "Whatsapp"
  }'
```

### Future Enhancements
- JWT authentication (admin login)
- File upload for bulk import (CSV/Excel)
- WebSocket for real-time notifications
- Redis caching for dashboard stats
- Production deployment (Vercel + Railway/Render)
