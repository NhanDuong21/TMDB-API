# TMDB Integration API

An independent, stateless external adapter that retrieves, aggregates, and normalizes movie data from The Movie Database (TMDB) for the Movie Booking System.

## Features

- **Concurrent Data Fetching:** Utilizes `Promise.all()` to gather movie details, credits, images, videos, and more simultaneously.
- **Data Normalization:** Restructures TMDB data into a single, clean JSON structure required by the Movie Service.
- **Caching:** Implements in-memory Node Cache with a 1-hour TTL to reduce redundant TMDB API calls.
- **Error Handling & Resilience:** Axios client includes retry logic and timeout handling.
- **Security:** Integrated `helmet`, `cors`, and `express-rate-limit`.

## Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Provide your `TMDB_TOKEN`.

## Running the API

Start in development mode (with auto-reload):
```bash
npm run dev
```

Start in production mode:
```bash
npm start
```

## API Documentation

Swagger UI is available at:
`http://localhost:9001/api-docs`

### Example Endpoints

- **Health Check:** `GET /health`
- **Search:** `GET /api/import/search?keyword=Inception&page=1`
- **Preview (Aggregate):** `GET /api/import/preview/27205`
- **Person:** `GET /api/import/person/287`
- **Genres:** `GET /api/import/genres`
- **Popular Movies:** `GET /api/import/popular`

## Folder Structure

```
src/
├── cache/            # Node-cache implementation
├── clients/          # Axios TMDB Client setup
├── config/           # Configuration and Environment variable loader
├── controllers/      # Route handlers
├── middlewares/      # Error handler, Validation middleware
├── routes/           # API routes definition
├── services/         # TMDB interaction and aggregation logic
├── swagger/          # Swagger UI configuration
└── utils/            # Data normalization helpers
```
#
