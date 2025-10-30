Server README - Express + MongoDB (Atlas)

1) Copy `.env.example` to `.env` and fill:
   - MONGODB_URI: your Atlas connection string
   - JWT_SECRET: a long random secret
   - ADMIN_USER / ADMIN_PASS: (default admin / pass) — used by the seed script to create an admin user in DB

2) Install and run:

   npm install
   npm run dev   # requires nodemon, or npm start

3) (Important) Create the admin user in DB:

   cd server
   npm run seed-admin

   This will connect to the `MONGODB_URI` and create a user with username `ADMIN_USER` and password `ADMIN_PASS` (hashed with bcrypt). After seeding you may remove `ADMIN_PASS` from your .env for security if you wish.

4) API endpoints (after server runs on PORT, default 3000):
   - POST /api/login  { username, password } -> { token }
   - GET  /api/news   -> list of news
   - POST /api/news   -> create (Authorization: Bearer <token>)
   - PUT  /api/news/:id -> update (Authorization required)
   - DELETE /api/news/:id -> delete (Authorization required)

Note: This is a minimal MVP server to use with the static frontend. For production you must secure credentials and host server behind HTTPS. JWT secret must be strong.
