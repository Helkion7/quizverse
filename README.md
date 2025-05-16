# Quizverse

An interactive, minimalist quiz platform built with Node.js, Express, MongoDB and EJS.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Running the App](#running-the-app)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

- Node.js >= 16
- MongoDB instance (local or hosted)

## Installation

1. Clone the repo
   ```bash
   git clone https://github.com/your-org/quizverse.git
   cd quizverse
   ```
2. Install dependencies
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` in the root with:

```
MONGODB_URI=your_mongo_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
PORT=3000
```

## Database Seeding

Populate initial data (users, quizzes, categories):

```bash
npm run seed
```

## Running the App

- Development mode (with hot reload):
  ```bash
  npm run dev
  ```
- Production mode:
  ```bash
  npm start
  ```

Visit http://localhost:3000

## Testing

Run unit/integration tests:

```bash
npm test
```

## Project Structure

```
/controllers   – request handlers
/models        – Mongoose schemas
/routes        – Express routers
/views         – EJS templates
/public        – static assets (CSS/JS)
/scripts/seed.js – database seeder
server.js      – app entry (HTTP & JWT setup)
```

## Contributing

1. Fork & branch off `main`
2. Commit with clear messages
3. Open a PR and await review

## License

MIT
