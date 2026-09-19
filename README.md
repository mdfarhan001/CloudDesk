# ☁ CloudDesk — Build • Manage • Grow

A complete 3-Tier productivity web application built to practically learn
Docker, Flask, MySQL, Nginx, REST APIs, JWT Authentication and AWS EC2 deployment.

---

## 1. Features

- Login / Register with JWT authentication
- Password hashing (Werkzeug) — no plain-text passwords, ever
- Dashboard with live stats (Projects, Tasks, Completed Tasks, Team Members)
- Projects, Tasks, Notes — full CRUD via REST API
- Team members list
- Files page (placeholder — AWS S3 integration planned)
- Responsive sidebar + top navbar UI

---

## 2. Architecture (3-Tier)

```
USER
  |
  v
┌───────────────┐
│     NGINX      │   Tier 1 — Presentation (HTML/CSS/JS)
└───────┬───────┘
        | REST API (JWT)
        v
┌───────────────┐
│     FLASK      │   Tier 2 — Application (Auth + REST API)
└───────┬───────┘
        | SQL (parameterized queries)
        v
┌───────────────┐
│     MYSQL      │   Tier 3 — Data
└───────────────┘
```

**Rule:** Frontend never talks to MySQL directly. Only Flask does.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Fetch API), Nginx |
| Backend | Python 3, Flask, Flask-CORS, Flask-JWT-Extended, PyMySQL, Gunicorn |
| Database | MySQL 8 |
| Containers | Docker, Docker Compose |
| Cloud | AWS EC2 (Ubuntu) |

---

## 4. Folder Structure

```
clouddesk/
├── frontend/
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── style.css
│   ├── script.js
│   ├── auth.js
│   ├── Dockerfile
│   └── nginx.conf
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── routes/
│   │   ├── auth.py
│   │   ├── projects.py
│   │   ├── tasks.py
│   │   ├── notes.py
│   │   └── misc.py       (users, dashboard, activity)
│   └── utils/
│       └── db.py
├── database/
│   └── init.sql
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 5. API Endpoints

**Auth**
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me        (JWT required)
POST /api/auth/logout    (JWT required)
```

**Dashboard**
```
GET /api/dashboard        (JWT required)
GET /api/activity         (JWT required)
```

**Projects**
```
GET    /api/projects
GET    /api/projects/<id>
POST   /api/projects
PUT    /api/projects/<id>
DELETE /api/projects/<id>
```

**Tasks**
```
GET    /api/tasks
GET    /api/tasks/<id>
POST   /api/tasks
PUT    /api/tasks/<id>
DELETE /api/tasks/<id>
```

**Notes**
```
GET    /api/notes
GET    /api/notes/<id>
POST   /api/notes
PUT    /api/notes/<id>
DELETE /api/notes/<id>
```

**Users / Health**
```
GET /api/users
GET /health
```

All protected routes require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 6. Local Setup

### Step 1 — Clone the repo
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd clouddesk
```

### Step 2 — Create your .env file
```bash
cp .env.example .env
```
Then open `.env` and change the passwords/secret to your own values.

### Step 3 — Build and run
```bash
docker compose build
docker compose up -d
```

### Step 4 — Check containers are running
```bash
docker ps
```
Expected: `cloud-desk-frontend`, `cloud-desk-backend`, `cloud-desk-mysql` all `Up`.

### Step 5 — Open the app
```
http://localhost
```

### Demo login (from seed data)
```
Email: demo@clouddesk.com
Password: password123
```

---

## 7. MySQL Testing

```bash
docker exec -it cloud-desk-mysql mysql -u root -p
```
```sql
SHOW DATABASES;
USE clouddesk_db;
SHOW TABLES;
SELECT * FROM users;
```

---

## 8. API Testing (curl)

**Register**
```bash
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'
```

**Login**
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

**Dashboard (protected)**
```bash
curl http://localhost/api/dashboard \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN_RESPONSE>"
```

---

## 9. Docker Network

```bash
docker network ls
docker network inspect clouddesk-network
```

Frontend reaches backend using the Docker service name `backend` (not `localhost`).
Backend reaches MySQL using the service name `mysql`. Docker's internal DNS
resolves these service names automatically inside the `clouddesk-network`.

---

## 10. AWS EC2 Deployment (Summary)

1. Launch an Ubuntu EC2 instance.
2. Security Group: allow **SSH (22)** from your IP and **HTTP (80)** publicly. Do **NOT** open 3306.
3. SSH into the instance.
4. Install Docker, Docker Compose, and Git.
5. `git clone <repo>` and `cd clouddesk`
6. `cp .env.example .env` and edit secrets.
7. `docker compose build && docker compose up -d`
8. Open `http://<EC2_PUBLIC_IP>` in your browser.

---

## 11. Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Port already allocated | Something else uses port 80 | `docker ps` to find it, stop it, or change the port mapping |
| MySQL connection refused | Backend started before MySQL was ready | The `depends_on: condition: service_healthy` handles this; if it still fails, `docker compose logs mysql` |
| Nginx 502 Bad Gateway | Backend container crashed or not running | `docker compose logs backend` |
| CORS errors | Frontend calling backend from wrong origin | Should not happen here since Nginx proxies `/api/`; confirm `nginx.conf` is correct |
| JWT errors (401) | Token expired or missing | Log in again to get a fresh token |
| Database data not saving | `init.sql` only runs on a **fresh** volume | Remove the volume with `docker compose down -v` and restart (⚠ this deletes data) |

---

## 12. Security Notes

- Passwords are hashed with Werkzeug (`scrypt`), never stored in plain text.
- MySQL and the backend are **not** exposed to the public internet — only Nginx (port 80) is.
- All SQL queries use parameterized statements (no SQL injection).
- Secrets live in `.env`, which is git-ignored.

---

## 13. Future Improvements

- AWS S3 for real file uploads
- AWS RDS instead of self-hosted MySQL
- HTTPS/SSL via Let's Encrypt or an Application Load Balancer
- CI/CD with GitHub Actions
- CloudWatch monitoring, Auto Scaling
