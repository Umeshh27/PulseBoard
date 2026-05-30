# PulseBoard 🚀

PulseBoard is a real-time collaboration and messaging platform backend built with Node.js, Express, and heavily powered by **Redis**. It demonstrates various Redis data structures and patterns to handle real-time presence, messaging, analytics, background jobs, and event streaming.

## ✨ Features

* **User Authentication & Profiles:** Basic auth and profile management.
* **Real-time Presence Tracking:** Track who is online/offline using Redis Sets/Keys.
* **Workspaces & Channels:** Join workspaces and participate in channels.
* **Real-time Messaging:** Publish messages to channels.
* **Activity Feed:** Get personalized activity feeds.
* **Analytics:** Track Daily Active Users (DAU) and Trending Channels using Redis HyperLogLog and Sorted Sets.
* **Background Jobs:** Asynchronous task processing (e.g., sending emails) using Redis Lists as a message queue.
* **Event Streaming:** Reliable event streaming and processing using Redis Streams and Consumer Groups.
* **Distributed Locking:** Ensure exclusive access to shared resources (e.g., report generation) using Redis locks.

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database / Cache / Message Broker:** Redis (v7)
* **Containerization:** Docker & Docker Compose (for Redis)

## 📋 Prerequisites

Before you begin, ensure you have met the following requirements:
* **Node.js** (v18+ recommended)
* **npm** or **yarn**
* **Docker** & **Docker Compose** (to run the local Redis instance)

## 🚀 Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository

```bash
git clone <repository-url>
cd PulseBoard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start Redis

The project includes a `docker-compose.yml` file to quickly spin up a Redis 7 instance.

```bash
docker-compose up -d
```

### 4. Run the Application

The application consists of two main parts: the API server and the background worker. You should run them in separate terminal windows.

**Start the API Server:**
```bash
npm start
```
*The server will start on port 3000 by default.*

**Start the Background Worker:**
```bash
npm run worker
```
*The worker processes background jobs and stream events from Redis.*

## 🏗️ Architecture

PulseBoard uses a multi-process architecture to separate API requests from background processing, ensuring high responsiveness.

* **API Server (`src/server.js`):** Handles incoming HTTP requests, performs synchronous operations, and enqueues background jobs or events into Redis.
* **Worker (`src/worker.js`):** Listens to Redis Lists and Streams. It picks up enqueued jobs and processes them asynchronously, ensuring the main API server remains unblocked.
* **Redis:** Acts as the central nervous system, serving as a cache, database, message broker (Pub/Sub, Lists, Streams), and locking mechanism.

## 📁 Project Structure

```text
PulseBoard/
├── docker-compose.yml    # Redis container configuration
├── package.json          # Project dependencies and scripts
└── src/
    ├── middleware/       # Express middleware (e.g., rateLimiter)
    ├── services/         # Core business logic interacting with Redis
    ├── server.js         # Express API Server entry point
    ├── worker.js         # Background worker entry point
    └── redisClient.js    # Redis connection setup
```

## 🔌 API Endpoints

A quick overview of the available REST API endpoints:

**Authentication**
* `POST /auth/login` - Login and get a session token
* `POST /auth/logout` - Logout

**Presence**
* `POST /presence/online` - Mark user as online
* `POST /presence/offline` - Mark user as offline
* `GET /presence` - Get all online users

**Workspaces**
* `POST /workspaces/:id/join` - Join a workspace
* `GET /workspaces/:id/members` - List workspace members

**Messaging & Feeds**
* `GET /feed` - Get user's activity feed
* `POST /channels/:id/messages` - Send a message to a channel

**Analytics**
* `GET /analytics/trending` - Get trending channels
* `POST /analytics/dau` - Record Daily Active User

**Jobs & Events**
* `POST /jobs/email` - Enqueue an email job
* `POST /events/system` - Enqueue a system event

**System**
* `POST /system/report` - Trigger a background report generation (uses distributed locking)

---
*Built with ❤️ using Node.js and Redis.*
