Site1 — MVP with Express + MongoDB (Atlas)

What this contains
- Static frontend (index.html, about.html, news.html, admin panel) in the project root
- `server/` — Express backend scaffold (API) that connects to MongoDB (Atlas)

Goal
- Allow running a local server that serves the frontend and exposes API endpoints to store news in MongoDB Atlas.

Quick start
1) Copy server/.env.example to server/.env and fill the values (MONGODB_URI, JWT_SECRET). Example:

   PORT=3000
   MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/site1?retryWrites=true&w=majority
   JWT_SECRET=change_this_to_a_long_random_value
   ADMIN_USER=admin
   ADMIN_PASS=pass

2) Install server dependencies and run:

   cd server
   npm install
   npm run dev   # or npm start

3) Open http://localhost:3000 in your browser. Admin login: username `admin`, password `pass` (or whatever you set in .env).

Notes
- This is a minimal MVP. Do NOT use the example JWT secret or admin password in production.
- If MongoDB connection fails, the server still serves static files and the frontend will fall back to localStorage for news.

If you want, I can:
- Deploy the server to a small host or Docker image
- Wire a signup for admin users stored in DB
- Harden authentication (hashed passwords, account management)

## Docker & CI/CD (Quick guide)

This project includes a Dockerfile and docker-compose to run the server and (optionally) a local MongoDB. It also includes GitHub Actions workflows to build and publish a Docker image to Docker Hub and a template to deploy to a VPS via SSH.

1) Using Docker Compose (local MongoDB)

- Copy `server/.env.example` to `server/.env` and edit if needed. If you want to use MongoDB Atlas instead, set `MONGODB_URI` to your Atlas connection string in `server/.env` and you can skip the local `mongo` service.

- From project root (PowerShell on Windows):

  cd C:\Users\MERT\Desktop\Site1
  docker-compose up --build

This will build the server image and start `app` on port 3000 and a local `mongo` service. Open http://localhost:3000.

2) Using MongoDB Atlas (recommended for production)

- Get your Atlas connection string and set it in `server/.env` as `MONGODB_URI`. Example format:

  mongodb+srv://<user>:<pass>@cluster0.mongodb.net/site1?retryWrites=true&w=majority

- Then run only the app (no local mongo):

  cd server
  docker build -t site1-app:latest .
  docker run -p 3000:3000 --env-file .env site1-app:latest

3) Publishing image on push (GitHub Actions)

- Create a Docker Hub account and a repository (or use GitHub Container Registry). Set repository name (we used `site1`).
- Add repository secrets in GitHub: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (access token). Push to `main` branch to trigger `.github/workflows/docker-publish.yml` which builds and pushes the server image.

4) Deploy to VPS (template)

- The `deploy-to-vps.yml` workflow provides a starting point to SSH into your server and run `docker-compose up -d`. You must configure secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (private key), `DOCKERHUB_USERNAME`.
- Alternatively you can `ssh` into your server and run the same docker-compose commands as in the local instructions.

Notes & Security
- Keep `.env` out of source control (already in .gitignore).
- Use a strong `JWT_SECRET` and a secure admin password when using a real MongoDB.
- For production consider adding: HTTPS (reverse proxy like Caddy/Nginx), process monitoring, backups for MongoDB, and proper secret management.

Default placeholder image
-------------------------
The project now prefers a PNG placeholder file at `assets/images/default.png`. A small generator script is included that writes this file for you from an embedded base64 image.

To create the PNG locally (Node must be installed):

```powershell
node tools\generate-default-png.js
```

After running that, `assets/images/default.png` will exist and the admin panel will use it as the default preview image.

Resize an image by 50%
----------------------
If you want to resize a photo (for example the attached profile image) by 50%, there's a small tool included using `sharp`.

1. Save the original image into the project, for example:

```powershell
# from project root (PowerShell)
Copy-Item <path-to-downloaded-attachment> assets\images\profile-original.png
```

2. Install the tool and run the resize (50%):

```powershell
cd tools
npm install
node resize-image.js ../assets/images/profile-original.png ../assets/images/profile-small.png 0.5
```

3. After running, `assets/images/profile-small.png` will be created at half the original dimensions. You can then update `index.html` or other pages to use the resized file if you prefer.

Try it locally (PowerShell)
---------------------------
If you want to run the server and frontend locally on Windows PowerShell, follow these steps from the project root:

```powershell
# 1. Copy example env and edit
Copy-Item server\.env.example server\.env
# then open server\.env and set MONGODB_URI and secrets

# 2. Install server deps
cd server
npm install

# 3. Run dev server (auto-reloads with nodemon if installed)
npm run dev

# 4. Open http://localhost:3000 in your browser
```

If you prefer Docker (recommended for parity with production), run from the project root:

```powershell
docker-compose up --build
```

If you see any errors about Node/npm not found, install Node.js from https://nodejs.org/ (LTS recommended), then re-run the steps above.
