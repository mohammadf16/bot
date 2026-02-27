# Deploy Backend on cPanel (Node.js App + MySQL)

This backend is ready for production deployment on cPanel.

## 1) Create MySQL Database and User
In `cPanel > MySQL Databases`:
1. Create a database.
2. Create a database user.
3. Add the user to the database with `ALL PRIVILEGES`.

Example names:
- `cpuser_carapp`
- `cpuser_caruser`

## 2) Configure Node.js App in cPanel
In `cPanel > Setup Node.js App`:
- Node.js version: `20.x` or newer
- Application mode: `Production`
- Application root: `backend`
- Application URL: for example `https://api.yourdomain.com`
- Startup file: `app.js`

Note: `app.js` will create the `uploads` directory and then load `dist/index.js`.

## 3) Install and Build
Run inside the Node.js app terminal:

```bash
npm install
npm run build
```

## 4) Set Environment Variables
In `cPanel > Setup Node.js App > Environment Variables`, set:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=4000

JWT_ACCESS_SECRET=replace-with-strong-secret-min-24
JWT_REFRESH_SECRET=replace-with-strong-secret-min-24
SEED_ENCRYPTION_KEY=replace-with-random-32-plus-chars

CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
API_HARDENING_ENABLED=true
API_STRICT_HOST_CHECK=true
API_ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,api.yourdomain.com
API_GATEWAY_ENFORCE=false

BOOTSTRAP_ADMIN_EMAIL=admin@yourdomain.com
BOOTSTRAP_ADMIN_PASSWORD=StrongAdminPassword_ChangeMe
BOOTSTRAP_SEED_DATA=false

MYSQL_ENABLED=true
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=cpanel_db_user
MYSQL_PASSWORD=cpanel_db_password
MYSQL_DATABASE=cpanel_db_name
MYSQL_AUTO_CREATE_DATABASE=false
MYSQL_STATE_TABLE=app_state_snapshots
MYSQL_SSL_REQUIRED=false
MYSQL_STRICT=true

PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
UPLOADS_DIR=uploads
UPLOAD_IMAGE_MAX_BYTES=8388608
CARD_TO_CARD_DESTINATION_CARD=6037-9979-0000-1234
```

## 5) Start or Restart the App
Click `Restart` in cPanel Node.js App.

## 6) Verify Deployment
- Health endpoint:
  - `https://api.yourdomain.com/api/v1/health`
- Database status endpoint:
  - `https://api.yourdomain.com/api/v1/database/status`

## 7) Frontend API Base URL
Set this in your frontend environment:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## Production Notes
- In production, backend exits if `MYSQL_ENABLED=false`.
- On shared cPanel hosting, keep `MYSQL_AUTO_CREATE_DATABASE=false`.
- If running behind reverse proxy, make sure API host is present in both:
  - `API_ALLOWED_HOSTS`
  - `CORS_ORIGINS`
