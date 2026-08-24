# Foodzy RESTful API Engine

Foodzy Backend is a server-side application built with NestJS and MongoDB. It powers the Foodzy food delivery ecosystem by handling complex order state machines, secure authentication, media uploads, and business logic.

## Core Features

* **Modular Architecture:** Fully decoupled modules for Auth, Users, Products, Orders, and Blogs.
* **Secure Authentication:** JWT-based stateless auth coupled with bcrypt for password hashing.
* **Database & ODM:** High-performance schemas designed using Mongoose and MongoDB.
* **File Processing:** Native disk uploads for user avatars and blog banners using Multer.
* **Advanced Order Workflows:** Automated price calculations, automated user address updating, and status constraint validations via OrderStatus.
* **Automated Linting:** Strict typescript-eslint rules integrated to guarantee zero syntax or formatting issues during commits.

## Tech Stack

* **Framework:** NestJS v11
* **Language:** TypeScript
* **Database ODM:** Mongoose, MongoDB
* **Security:** JSON Web Tokens (JWT), Bcrypt
* **Tools:** ESLint, Prettier, Multer

## Getting Started

### Prerequisites
Node.js (v18 or higher) and a running instance of MongoDB.

### Installation
```bash
npm install