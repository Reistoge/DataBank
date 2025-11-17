# Databank
**Data-Bank** is a full-stack banking simulation platform designed to demonstrate complex transaction handling, account management, and a sophisticated **Fraud Detection System**. The system utilizes a hybrid database architecture with **MongoDB** for transactional data and **Neo4j** for graph-based relationship analysis and fraud pattern detection.
 
 [doc](https://docs.google.com/document/d/1qJwkj68HOp2WV_NTjYjJDgEB8n-_47j6r3HtbazvcbY/edit?tab=t.0).
 
🚀 Features
-----------

### 🛡️ Fraud Detection System

The core of the application. Transactions are analyzed in real-time against a set of heuristic rules and graph patterns:

*   **Fast Travel Detection:** Identifies physically impossible transactions based on time and distance between locations (velocity checks).
*   **Account Drain:** Flags transactions that deplete a significant percentage of the account balance (Moderate, High, Extreme levels).
*   **High Frequency:** Detects abnormal spikes in transaction frequency using Z-score statistical analysis.
*   **Geographical Anomalies:**
    *   _TxFarFromSender_: Transaction occurs far from the user's registered location.
    *   _SenderFarFromReceiver_: Unusual distance between transacting parties.
*   **Low Amount Probing:** Detects micro-transactions often used to test card validity.

### 🏦 Banking Operations

*   **Account Management:** Creation of Savings, Checking, and Business accounts.
*   **Card Management:** Issue virtual debit/credit cards, set spending limits, and freeze cards.
*   **Transactions:** Secure fund transfers between accounts.
*   **Payment Simulation:** E-commerce "Shop" interface to simulate product purchases and checkout flows.

### 👤 User & Security

*   **Authentication:** Secure Login/Register with JWT (JSON Web Token) and Bcrypt password hashing.
*   **Role-Based Access Control (RBAC):** Support for Client and Admin roles.
*   **Admin Panel:** interface for administrators to view all accounts and manage user statuses.

🛠️ Tech Stack
--------------

### Backend

*   **Framework:** 
    [NestJS](https://nestjs.com/)
     (Node.js)
*   **Databases:**
    *   **MongoDB:** (via Mongoose) Primary store for Users, Accounts, Cards, and Transaction logs.
    *   **Neo4j:** (via nest-neo4j) Graph database for modeling relationships and executing Cypher queries for fraud analysis.
*   **External APIs:** Nominatim (OpenStreetMap) for geolocation and geocoding.
*   **Documentation:** Swagger / OpenAPI (implied by NestJS structure).

### Frontend

*   **Framework:** 
    [React](https://react.dev/)
     + 
    [Vite](https://vitejs.dev/)
*   **Styling:** 
    [Tailwind CSS](https://tailwindcss.com/)
     + Framer Motion (animations).
*   **State Management:** React Context API + Reducers.
*   **Routing:** React Router DOM.

### Infrastructure

*   **Docker:** Containerization of services.
*   **Docker Compose:** Orchestration of Backend, MongoDB, and Neo4j containers.

* * *

📦 Installation & Setup
-----------------------

### Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop)
     installed and running.
*   [Node.js](https://nodejs.org/)
     (v18+ recommended) for local frontend development.

### 1\. Clone the Repository

```
git clone https://github.com/Reistoge/reistoge-databank.git
cd reistoge-databank
```

### 2\. Backend & Database Setup (Docker)

The backend, MongoDB, and Neo4j services are configured via Docker Compose.

1.  Navigate to the root directory.
2.  Start the services:
    ```
    docker-compose up --build
    ```
    _This will start:_
    *   **MongoDB** on port `38130` (mapped to internal 27017)
    *   **Neo4j** on ports `7474` (HTTP) and `7687` (Bolt)
    *   **Backend API** on port `5000`

### 3\. Database Seeding (Optional but Recommended)

The project includes a seeder to populate the database with initial users, merchants, and products.

In a separate terminal, while the containers are running:

```
cd backend-data-bank
npm install
npm run seed
```

_This creates default users (e.g., `admin@databank.com`) and test merchants._

### 4\. Frontend Setup (Local)

To run the frontend locally for development:

1.  Navigate to the frontend directory:
    ```
    cd frontend-data-bank
    ```
2.  Install dependencies:
    ```
    npm install
    ```
3.  Start the development server:
    ```
    npm run dev
    ```
4.  Access the application at `http://localhost:3000`.

* * *

🔧 Environment Variables
------------------------

Ensure a `.env` file exists in `backend-data-bank` with the following configurations (defaults provided for local dev):

```
# Server
PORT=5000

# MongoDB
DATABASE_URL=mongodb://databank:password1234@localhost:38130/databank-db?authSource=admin

# Neo4j
NEO4J_SCHEME=bolt
NEO4J_HOST=localhost
NEO4J_PORT=7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password1234

# Security
JWT_SECRET=your_super_secret_key
ADMIN_ACCESS=secret_admin_token
```

* * *

🧪 Testing
----------

### Backend

Run unit tests for services and controllers:

```
cd backend-data-bank
npm run test
```

Run End-to-End (e2e) tests:

```
npm run test:e2e
```

### Manual Fraud Testing

To trigger the fraud detection system manually:

1.  Login to the application.
2.  Navigate to **Transfer**.
3.  **Simulate Fast Travel:** Perform a transaction with location "New York", then immediately perform another with location "Tokyo".
4.  **Simulate Account Drain:** Attempt to transfer 95% of your total balance in a single transaction.
5.  Check the **Dashboard** history to see if the transaction was flagged or blocked.

* * *

📂 Directory Structure
----------------------

```
reistoge-databank/
├── backend-data-bank/       # NestJS Backend
│   ├── src/
│   │   ├── account/         # Account logic
│   │   ├── card/            # Card logic
│   │   ├── fraud-system/    # Fraud detection engine & Validators
│   │   ├── users/           # User & Admin logic
│   │   └── ...
│   ├── dockerfile
│   └── ...
├── frontend-data-bank/      # React Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application views
│   │   ├── services/        # API integration
│   │   └── ...
│   └── ...
├── docker-compose.yml       # Container orchestration
└── README.md
```

📝 License
----------

This project is for educational purposes.

* * *

**Author:** Ferran Rojas (
[@Reistoge](https://github.com/Reistoge)
)

 
 
 
