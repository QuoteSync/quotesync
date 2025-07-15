# QuoteSync: Centralized Platform for the Management, Organization, and Documentary Integration of Literary Quotes

## Table of Contents

1. [What is QuoteSync?](#what-is-quotesync)
2. [Key Features](#key-features)
3. [Architecture & Technologies](#architecture--technologies)
4. [Repository Structure](#repository-structure)
5. [Installation & Usage](#installation--usage)
    - [Prerequisites](#prerequisites)
    - [Environment Setup](#environment-setup)
    - [Backend (Django)](#backend-django)
    - [Frontend (Vuejs)](#frontend-vuejs)
    - [Database (PostgreSQL)](#database-postgresql)
    - [Running with Docker](#running-with-docker)
6. [AI Integration (Claude/Anthropic)](#ai-integration-claudeanthropic)
7. [Importing & Organizing Quotes](#importing--organizing-quotes)
8. [Collaboration & Social Features](#collaboration--social-features)
9. [Export & Advanced Search](#export--advanced-search)

---

## What is QuoteSync?

QuoteSync is a web platform that centralizes the management, organization, and retrieval of literary quotes and annotations from multiple digital ecosystems (Kindle, Google Play Books, Apple Books, etc.). Its goal is to eliminate the fragmentation of literary knowledge, allowing readers, researchers, and writers to store, tag, search, and reuse their quotes efficiently, acting as a true "second brain."

---

## Key Features

- **Centralized Quotes:** Unifies quotes and annotations from various platforms into a single repository.
- **AI-powered Smart Tagging:** Analyzes quote content and suggests relevant thematic tags using AI models like Claude (Anthropic).
- **Contextual Insertion in Documents:** Suggests relevant quotes for automatic insertion into imported documents, based on thematic context.
- **Personalized Organization:** Create thematic collections, lists, and groups of quotes for different projects or interests.
- **Collaboration:** Share and collaborate on quote collections with other users.
- **Direct Import:** Supports importing quotes from Kindle, Google Play Books, Apple Books, and other formats.
- **Advanced Search:** Search by multiple criteria (author, book, tags, text, etc.).
- **Export:** Export quotes and collections for use in academic or personal documents.
- **Visual Cover Management:** Automatically update and manage book covers from OpenLibrary.

---

## Architecture & Technologies

- **Backend:** [Django](https://www.djangoproject.com/) (Python) with Django REST Framework.
- **Frontend:** [Vue.js](https://vuejs.org/) (modern SPA, responsive).
- **Database:** [PostgreSQL](https://www.postgresql.org/).
- **AI & Tagging:** Integration with [Claude (Anthropic)](https://console.anthropic.com/) and other services.
- **Containers:** Support for [Docker](https://www.docker.com/) and `docker-compose`.
- **Other:** OpenLibrary API for covers, Redis (optional), cloud deployment (see `/docs/ideas/cloud_deployment_options.md`).

---

## Repository Structure

```
quotesync/
│
├── backend/                # Django backend (API, models, services)
│   ├── api/                # Main app: models, views, urls, services
│   ├── accounts/           # User management and authentication
│   ├── media/              # Uploaded files (covers, avatars, etc.)
│   ├── requirements.txt    # Python dependencies
│   ├── manage.py           # Django main command
│   └── ...                 # Other files and configs
│
├── frontend/               # Vue.js frontend (SPA)
│   ├── src/                # Vue source code, components, services
│   ├── public/             # Static resources
│   ├── package.json        # Node.js dependencies
│   └── ...                 # Config and assets
│
├── docs/                   # Additional documentation
│
├── docker-compose.yml      # Docker orchestration
├── setup_database.sql      # Database initialization script
├── README.md               # This file
└── ...                     # Other scripts and utilities
```

---

## Installation & Usage

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+
- (Optional) Docker and Docker Compose
- (Optional) Redis

### Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/youruser/quotesync.git
   cd quotesync
   ```

2. **Environment variables:**
   - Copy the sample file and edit with your credentials:
     ```bash
     cp backend/.env.sample backend/.env
     ```
   - Add your Anthropic API key if you want to use AI:
     ```
     ANTHROPIC_API_KEY=your_api_key
     ```

### Backend (Django)

1. **Install dependencies:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Migrations and superuser:**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

3. **Run the server:**
   ```bash
   python manage.py runserver
   ```

### Frontend (Vuejs)

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the app:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:5173](http://localhost:5173) (or your configured port).

### Database (PostgreSQL)

- You can use the `setup_database.sql` script to initialize the database.
- If using Docker, the database is started automatically.

### Running with Docker

1. **Start all services:**
   ```bash
   docker-compose up --build
   ```
   This will start backend, frontend, and database in containers.

---

## AI Integration (Claude/Anthropic)

QuoteSync allows you to generate smart tags for quotes using advanced AI:

1. **Get an Anthropic API key:**  
   [https://console.anthropic.com/](https://console.anthropic.com/)

2. **Configure the key in the backend:**  
   Add to `backend/.env`:
   ```
   ANTHROPIC_API_KEY=your_api_key
   ```

3. **Restart the backend.**

4. **In the UI, select "Claude" when generating tags.**

This enables more accurate and relevant tag suggestions, especially for complex or specialized texts.

---

## Importing & Organizing Quotes

- **Import your quotes** from Kindle, Google Play Books, Apple Books, `.json`, `.txt`, or `.docx` files from the import section.
- **Organize** your quotes into lists, groups, and thematic collections.
- **Edit and tag** each quote manually or using AI.
- **Manage book covers** automatically from OpenLibrary.

---

## Collaboration & Social Features

- **Share collections** of quotes with other users or research groups.
- **Collaborate** on organizing and tagging quotes.
- **Track group activity** and receive notifications of changes.

---

## Export & Advanced Search

- **Export** your quotes and collections in formats suitable for academic or personal documents.
- **Perform advanced searches** by author, book, tags, text, date, etc.
- **Automatically insert quotes** into imported documents, with contextual suggestions.

---

**Questions or suggestions?**  
Author: Francisco Javier Jiménez Ríos  
Advisor: Francisco Javier Jaén Martínez  
Academic Year: 2024-2025

---

> _QuoteSync: Transform your literary knowledge into a centralized, intelligent, and always accessible resource._

---

**Welcome to smart literary quote management!** 
