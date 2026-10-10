# ABC College — Event Management System

A full-stack college mini-project: students browse and register for campus events, admins manage events, students, registrations, announcements and view reports. "ABC College" is fictional.

## Features
- **Public:** home (hero, stats, featured/upcoming events, categories, announcements), events browser (search, category/status/date filters, sort, pagination), event details, about, contact.
- **Students:** register/login (JWT), dashboard, browse & register, cancel registration, my events + status, edit profile (with image), change password, feedback on completed events.
- **Admin:** dashboard with charts (registrations by category, monthly), CRUD events with image upload, manage students, approve/reject/cancel registrations, announcements (Normal/Important/Urgent), reports with average ratings.
- **Rules enforced server-side:** no duplicate registration (unique DB index), no registration after the deadline, none when full, none for cancelled/completed events. Role-based access (`student` / `admin`).
- Categories are stored in MongoDB (`EventCategory` model + `/api/categories` CRUD API).

## Technologies
HTML5, CSS3, JavaScript, Bootstrap 5, Bootstrap Icons, Chart.js · Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Multer.

## Installation
1. Install [Node.js 18+](https://nodejs.org) and MongoDB (local Community Server, or a free MongoDB Atlas cluster).
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

## MongoDB configuration
Edit `backend/.env` (an example is in `.env.example`):
```
MONGODB_URI=mongodb://127.0.0.1:27017/abc_college_events   # or your Atlas URI
JWT_SECRET=use_a_long_random_string
PORT=5000
ADMIN_EMAIL=admin@abccollege.edu
ADMIN_PASSWORD=Admin@123
```
Never commit the real `.env`.

## Load sample data + admin login setup
```bash
cd backend
npm run seed
```
This **clears the database** and creates 15 categories, 12 events, 5 students, registrations, feedback, announcements, and the admin account from `.env`.

| Role    | Email                          | Password     |
|---------|--------------------------------|--------------|
| Admin   | admin@abccollege.edu           | Admin@123    |
| Student | aarav@student.abccollege.edu   | Student@123  |

Admins can only be created by the seed script (public registration always creates students). To add another admin, change `ADMIN_*` in `.env` and re-run the seed, or set `role: "admin"` on a user in MongoDB.

## Start the backend
```bash
cd backend
npm start        # or: npm run dev  (auto-reload with nodemon)
```
API runs at `http://localhost:5000` (health check: `/api/health`).

## Run the frontend
The frontend is static. Serve the `frontend/` folder, e.g.:
- VS Code **Live Server** (default `http://127.0.0.1:5500`), or
- `cd frontend && npx serve -l 5500`

Then open `http://127.0.0.1:5500/index.html`. If you use a different port, add that origin to `CLIENT_ORIGIN` in `.env`. If the backend is on another host/port, change `API_BASE` and `UPLOADS_BASE` in `frontend/js/config.js`.

## API documentation
Auth: `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | public | Register student |
| POST | /api/auth/login | public | Login (student or admin) |
| GET | /api/auth/me | user | Current user |
| GET | /api/events | public | List (query: search, category, status, date, sort, page, limit) |
| GET | /api/events/:id | public | Event + seats + `alreadyRegistered` if logged in |
| POST | /api/events | admin | Create (multipart, field `image`) |
| PUT | /api/events/:id | admin | Update |
| DELETE | /api/events/:id | admin | Delete |
| POST | /api/events/:id/register | student | Register for event |
| GET | /api/registrations/my | student | My registrations |
| DELETE | /api/registrations/:id | owner/admin | Cancel registration |
| GET | /api/admin/students | admin | List/search students |
| DELETE | /api/admin/students/:id | admin | Remove student |
| GET | /api/admin/registrations | admin | List (search, status, event, department) |
| PUT | /api/admin/registrations/:id/status | admin | Approve/Reject/Cancel |
| GET | /api/admin/dashboard-stats | admin | Dashboard numbers + chart data |
| GET | /api/admin/reports | admin | Per-event report |
| GET/POST | /api/announcements | public / admin | List / create |
| DELETE | /api/announcements/:id | admin | Delete |
| POST | /api/feedback | student | Submit (completed events only, one per event) |
| GET | /api/feedback/:eventId | admin | Feedback + average rating |
| GET/POST/PUT/DELETE | /api/categories | public / admin | Category CRUD |
| PUT | /api/users/profile, /api/users/password | user | Update profile / password |
| GET | /api/stats | public | Homepage counts |

## Project structure
```
frontend/  index, events, event-details, login, register, about, contact (.html)
           student/ (dashboard, my-events, profile, feedback, event-registration)
           admin/   (dashboard, events, students, registrations, announcements, reports)
           css/style.css  js/{config,main,auth,events,student,admin}.js  assets/
backend/   server.js, config/, models/, controllers/, routes/, middleware/, utils/seed.js, uploads/
```

## Notes
- Admin UI has no category-management page; categories are managed via the `/api/categories` endpoints (add a page in `admin/` if your evaluator wants one in the UI).
- Event images use a placeholder from placehold.co when none is uploaded (needs internet).
- Everything is untested against a live MongoDB in the build environment; run the seed script first and report any errors.
