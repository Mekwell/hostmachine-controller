# Hostmachine Controller

## Overview

This repository contains the backend service for the Hostmachine platform. The Hostmachine Controller acts as the central brain of the entire game server hosting operation. It is responsible for managing game server nodes, processing customer orders, queuing commands for the agents, and providing data to the frontend dashboards.

It implements core business logic and provides a secure API for both the frontend application and the node agents.

## Key Technologies

-   **Framework:** [NestJS](https://nestjs.com/) (Node.js / TypeScript)
-   **Database:** [SQLite](https://sqlite.org/) (for development/prototype) via [TypeORM](https://typeorm.io/)
-   **API Security:** Internal Guard (`X-Internal-Secret`) for Frontend, API Key Guard for Agent.
-   **Process Management:** [PM2](https://pm2.io/) for production deployment.

## Features

-   **Node Management:** Register, list, and delete physical/virtual nodes.
-   **Command Queuing:** Schedules tasks (e.g., "Start Server") for Node Agents.
-   **Plan Management:** CRUD operations for service plans (RAM, CPU, Price).
-   **Billing (Mock):** Handles subscription logic for users.

## Local Development Setup

### Prerequisites

-   Node.js (v20 LTS recommended)
-   npm
-   Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Mekwell/hostmachine-controller.git
    cd hostmachine-controller
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:** Create a `.env` file in the project root based on `.env.example` (if provided, or manually create):
    ```env
    PORT=3000
    ENROLLMENT_SECRET=change_me_to_something_secure_random_token_for_agent_enrollment
    INTERNAL_API_SECRET=super_secret_key_only_nextjs_server_knows
    DATABASE_FILE=hostmachine.sqlite
    ```
    **IMPORTANT:** Ensure `ENROLLMENT_SECRET` and `INTERNAL_API_SECRET` are strong, randomly generated values in production.

### Running the Application

```bash
# development mode (with hot-reloads)
npm run start:dev

# production mode (builds and runs)
npm run start:prod
```
The API will be available at `http://localhost:3000` (or the PORT specified in `.env`).

## Deployment

Deployment to an Ubuntu 24.04 server is automated using the `deploy.sh` script located in this repository.

To deploy:

1.  SSH into your fresh Ubuntu server.
2.  Clone this repository to `/opt/hostmachine-controller`.
3.  Run the `deploy.sh` script:
    ```bash
    cd /opt/hostmachine-controller
    sudo ./deploy.sh
    ```
    This script will install Node.js, PM2, configure environment variables, and start the application.

### Auto-Updates

This project is configured for automatic updates. A cron job will be set up by `deploy.sh` to regularly fetch changes from the `main` branch, rebuild, and restart the application if updates are available. The update logic is handled by `scripts/update.sh`.

## Full Documentation

For a comprehensive understanding of the Hostmachine project architecture, security strategy, operational procedures, and more, please refer to the dedicated documentation repository:

[Mekwell/hostmachine-docs](https://github.com/Mekwell/hostmachine-docs)

---

## License

[MIT licensed](LICENSE)