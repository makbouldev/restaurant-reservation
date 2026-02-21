# Creative Restaurant Web App (React + Bootstrap + Node)

## Stack
- Frontend: React (Vite) + Bootstrap 5
- Backend: Node.js + Express + SQLite
- Real persistent data in: `backend/data/restaurant.db`

## Features
- Client page with creative design + real plates from DB
- Reservation form that saves to DB
- Admin Dashboard:
  - Add plate
  - Category selection from dropdown (predefined + existing DB categories)
  - Upload up to 4 local photos per plate
  - Edit plate
  - Delete plate
  - View reservations
  - Update reservation status (`pending`, `confirmed`, `cancelled`)
  - Delete reservation

## Run Backend
```bash
cd backend
npm install
npm run dev
```
Backend URL: `http://localhost:5000`

## Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend URL: `http://localhost:5173`

## API Endpoints
### Plates
- `GET /api/menu`
- `GET /api/menu/categories`
- `GET /api/menu/:id`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`

### Specials
- `GET /api/specials`

### Reservations
- `GET /api/reservations`
- `POST /api/reservations`
- `PUT /api/reservations/:id/status`
- `DELETE /api/reservations/:id`

## Admin Access
- Admin page is hidden from the client UI.
- Open directly: `http://localhost:5173/admin`
- Login required:
  - Default email: `admin@neonbite.com`
  - Default password: `Admin123!`
- You can override credentials with backend env vars:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

## Free Hosting (Easiest)
### 1) Deploy Backend (Render)
- Push project to GitHub.
- In Render: **New > Web Service**.
- Connect repo and set:
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
- Add env vars in Render dashboard:
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
- After deploy, copy your backend URL (example: `https://your-api.onrender.com`).

### 2) Deploy Frontend (Netlify)
- In Netlify: **Add new site > Import from Git**.
- Select repo and set:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `dist`
- Add env var:
  - `VITE_API_BASE=https://your-api.onrender.com/api`
- Deploy.

### 3) Important Notes
- `frontend/netlify.toml` is included for SPA route support.
- `frontend/src/App.jsx` now reads API URL from `VITE_API_BASE`.
- Render free services can sleep when idle (first request may be slower).
