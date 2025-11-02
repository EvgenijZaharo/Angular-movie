# Mooovie

A movie application where you can search for movies, read reviews, and leave comments. Users can register and login to rate movies and add comments.

## Tech Stack

- Angular 20
- Express.js
- JSON file database
- OMDb API for movie data
- Tailwind CSS

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

First, install dependencies for the main project:

```bash
npm install
```

Then install dependencies for the server:

```bash
cd server
npm install
cd ..
```

## Running the Project

You need to run both the backend server and the Angular frontend.

### Start the Backend Server

Open a terminal and run:

```bash
cd server
npm start
```

The server will run on http://localhost:3000

### Start the Frontend

Open another terminal and run:

```bash
npm start
```

The application will open at http://localhost:4200

Make sure both servers are running at the same time.

## Project Structure

- `src/app` - Main Angular application
- `src/pages` - Page components (main, catalog, authorization, movie page)
- `src/services` - API services for movies, users, reviews, comments
- `src/store` - State management using signals
- `src/shared` - Shared components (header, input field, movie comments)
- `server` - Express backend server with JSON database

## Features

- User registration and login
- Movie search using OMDb API
- Movie catalog with details
- User reviews and ratings
- Comments on movies
- Protected routes for authenticated users
