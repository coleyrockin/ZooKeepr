# ZooKeepr

![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat&logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=flat&logo=node.js&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-28.x-C21325?style=flat&logo=jest&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue?style=flat)

## About

ZooKeepr is a server-side API built with Express.js that powers a zoo management application. The API handles animal catalog data with full CRUD operations, route parameterization, data validation, and middleware — serving a polished front-end interface for browsing and managing zoo animals and zookeepers.

## Features

- **RESTful API** — Modular route handling with Express Router for animals and zookeepers
- **Data Validation** — Server-side input validation and filtering with custom helper functions
- **Static File Serving** — Express middleware serves the complete front-end application
- **Parameterized Routes** — Query string filtering and dynamic route parameters
- **Test Suite** — Jest-based unit tests for data validation and API logic
- **Modular Architecture** — Separation of concerns across routes, data, and utility layers

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | 17.x |
| Framework | Express.js | 4.x |
| Testing | Jest | 28.x |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/coleyrockin/ZooKeepr.git

# Install dependencies
npm install

# Start the server
npm start

# Run tests
npm test
```

## Project Structure

```
ZooKeepr/
├── __tests__/          # Jest test suites
├── data/               # JSON data store for animals and zookeepers
├── lib/                # Helper and validation utilities
├── public/             # Front-end static assets (HTML, CSS, JS)
├── routes/             # Express Router modules (apiRoutes, htmlRoutes)
├── server.js           # Express server entry point
├── package.json        # Dependencies and scripts
└── README.md
```

---

Built by [Boyd Roberts](https://github.com/coleyrockin)
