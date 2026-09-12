# HTCO ERP — Production Deployment Guide

## Architecture
- **Frontend**: React 18 + Vite (static SPA → deploy to any CDN/web server)
- **Backend**: Node.js + Express + TypeScript (deploy to cPanel Node.js App / VPS / cloud)
- **Database**: MySQL 8+

---

## 1. Required Environment Variables

### Backend `.env` (on production server)
```
PORT=5000
NODE_ENV=production
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_strong_password
DB_NAME=gaptm
JWT_SECRET=<64-char random string>
JWT_REFRESH_SECRET=<64-char random string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-frontend-domain.com
```

### Frontend `.env.production` (before building)
```
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
```

---

## 2. Backend Build & Deploy

```bash
cd backend
npm install --omit=dev        # production deps only
npm run build                 # compiles TypeScript → dist/
node dist/app.js              # start production server
# or via PM2:
pm2 start dist/app.js --name htco-backend
```

The server auto-runs database migrations on first startup.

---

## 3. Frontend Build & Deploy

```bash
cd frontend
# Edit .env.production: set VITE_API_BASE_URL to your backend URL
npm install
npm run build                 # creates dist/
```

Upload the `frontend/dist/` folder to your web server's public directory.

**IMPORTANT**: The app is a SPA. Configure your web server to redirect all requests to `index.html`:

### Nginx
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

### Apache `.htaccess`
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### cPanel
Use the `.htaccess` approach above in the `public_html` folder.

---

## 4. Database Setup

1. Create a MySQL database named `gaptm` (or your preferred name)
2. Import `gaptm.sql` for the initial schema
3. Set `DB_NAME` in `.env` to match
4. The backend auto-runs migrations on startup

---

## 5. CORS Configuration

Set `CORS_ORIGIN` in backend `.env` to **exactly** the URL your frontend is served from.

Examples:
- Single domain: `CORS_ORIGIN=https://erp.htco.in`
- Multiple domains: `CORS_ORIGIN=https://erp.htco.in,https://www.htco.in`
- All origins (insecure): `CORS_ORIGIN=*`

---

## 6. Production Checklist

- [ ] `NODE_ENV=production` set in backend `.env`
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` set to strong random values (64+ chars)
- [ ] `DB_PASSWORD` set to a strong password
- [ ] `CORS_ORIGIN` set to actual frontend domain
- [ ] `VITE_API_BASE_URL` set to actual backend URL before building frontend
- [ ] Database imported and accessible
- [ ] Backend health check responds: `GET /health` → `{"status":"ok"}`
- [ ] Frontend SPA routing configured (try_files / .htaccess)
- [ ] HTTPS enabled on both frontend and backend
