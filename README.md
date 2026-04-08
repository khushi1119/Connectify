# Connectify 🎥

**Connectify** is a real-time video conferencing application inspired by Zoom and Google Meet.
It allows users to create and join video meetings, communicate in real time, and collaborate seamlessly.

This project is built using the **MERN stack** and **WebRTC** to provide real-time peer-to-peer video communication.

---

## 🚀 Features

- Real-time video calling using **WebRTC**
- Create and join meeting rooms
- Multiple participant support
- Camera and microphone toggle
- Secure backend APIs
- Real-time signaling using **Socket.IO**
- MongoDB database integration
- Responsive UI

---

## 🛠 Tech Stack

### Frontend

- React.js
- JavaScript
- CSS / Tailwind

### Backend

- Node.js
- Express.js
- Socket.IO

### Database

- MongoDB Atlas
- Mongoose

### Real-time Communication

- WebRTC
- Socket.IO

---

## 📁 Project Structure

Connectify
│
├── backend
│ ├── src
│ │ ├── controllers
│ │ ├── models
│ │ ├── routes
│ │ └── app.js
│ ├── package.json
│ └── .env
│
├── frontend
│ ├── src
│ └── package.json
│
├── .env.example
├── .gitignore
└── README.md

---

## ⚙️ Installation & Setup

### 2️⃣ Install backend dependencies

cd backend
npm install

---

### 3️⃣ Install frontend dependencies

cd ../frontend
npm install

---

## 🔐 Environment Variables

Create a **`.env` file inside the backend folder** and add the following variables:

PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000

You can refer to **`.env.example`** for required environment variables.

---

## ▶️ Running the Application

### Start Backend Server

cd backend
npm run dev

### Start Frontend

cd frontend
npm start

Backend runs on:

http://localhost:8000

Frontend runs on:

http://localhost:3000

---

## 🌐 Future Improvements

Planned features to improve the platform:

- Screen sharing
- Meeting chat
- Meeting recording
- Authentication system
- Meeting history dashboard
- Scheduling meetings
- Deployment (Vercel + Render)

---
## 🌐 Live Demo

Coming soon...

## 🤝 Contributing

Contributions are welcome!

If you'd like to improve this project:

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Submit a pull request

---

## 👩‍💻 Author

**Khushi Tiwari**

AI & Machine Learning Student | Full Stack Developer

---

## ⭐ Support

If you like this project, consider giving it a **star on GitHub** ⭐
