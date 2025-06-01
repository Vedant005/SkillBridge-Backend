# SkillBridge

A full-stack freelancing platform connecting clients and freelancers with intelligent ML-powered features for personalized gig experiences, real-time communication, and seamless UI/UX.

[![Frontend Repository](https://img.shields.io/badge/GitHub-Frontend-blue?logo=github)](https://github.com/Vedant005/SkillBridge-Frontend)
[![Backend Repository](https://img.shields.io/badge/GitHub-Backend-blue?logo=github)](https://github.com/Vedant005/SkillBridge-Backend)
[![ML Repository](https://img.shields.io/badge/GitHub-ML-blue?logo=github)](https://github.com/Vedant005/Skillbridge-ML)

---

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB

---

## 📁 Project Setup

```
gh repo clone Vedant005/SkillBridge-Backend
```

```
cd SkillBridge-Backend
npm install
```

- Setup .env folder in the root directory ( Check for .env.example for reference)

- You need to create a cloudinary account to get the api key
- You need to also create a hugging face api for the chatbot

```
CORS_ORIGIN=http://localhost:5173
PORT=8000
DB_NAME=databse

MONGODB_URI= mongodb+srv://user:password@cluster0.ewweehr.mongodb.net

HUGGINGFACE_API_KEY=abc

ACCESS_TOKEN_SECRET=abcd
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=abcd
REFRESH_TOKEN_EXPIRY=10d


CLOUDINARY_CLOUD_NAME=abcde
CLOUDINARY_API_KEY=abcdef
CLOUDINARY_API_SECRET=abcdefg
```

- To run

```
npm run dev

```

## API Endpoints

### Client Endpoints

#### Authentication Endpoints

- `POST /api/v1/client/register` : Create new account

* `POST /api/v1/client/login` : Login to the registered account and generate access and refresh tokens

- `POST /api/v1/client/logout` : Logout from the account

* `POST /api/v1/client/refresh-token` : Refresh the access token until the refresh token expires

#### Client CRUD & gig management

- `GET /api/v1/client/` : Fetches all client's data

* `GET /api/v1/client/:id` : Fetches single client data

- `PUT /api/v1/client/:id` : Update client information

* `PUT /api/v1/client/:id/add-gig` : Add gigs under the client id

- `PUT /api/v1/client/remove-gig` : Remove gigs under client

* `DELETE /api/v1/client/:id` : Delete client account

### Freelancer Endpoints

#### Authentication Endpoints

- `POST /api/v1/freelancer/register`: Create new account

* `POST /api/v1/freelancer/login` : Login to the registered account and generate access and refresh tokens

- `POST /api/v1/freelancer/logout` : Logout from the account

* `POST /api/v1/freelancer/refresh-token` : Refresh the access token until the refresh token expires

#### Other Endpoints

- `PATCH /api/v1/freelancer/update-details` : Update user details

* `GET /api/v1/freelancer/:id` : Fet single freelancer details

- `PATCH /api/v1/freelancer/upload-resume` : Upload resume

### Gigs Endpoints

- `GET /api/v1/gigs/chat` : Talk to chatbot

* `GET /api/v1/gigs/` : Get all gigs

- `PUT /api/v1/gigs/:id` : Get single gig

* `DELETE /api/v1/gigs/predict-price` : Predict Gig price
