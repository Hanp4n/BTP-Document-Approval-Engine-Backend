# BTP Document Approval Engine API

A robust backend built with **Node.js**, **TypeScript**, and **Express** for managing document approval workflows. This API bridges your frontend and SAP Build Process Automation.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | Express.js |
| **Database** | PostgreSQL (Prisma ORM) |
| **HTTP Client** | Axios |
| **Deployment** | Railway |

## Getting Started

### Installation

```bash
npm install
```

### Database Setup

Configure your `.env` file with your PostgreSQL instance:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/dbname"
```

Generate the Prisma client:

```bash
npx prisma generate
```

### Run the Server

```bash
npm run dev
```

## API Reference

### Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/documents` | Retrieve all documents |
| `GET` | `/documents/:id` | Get document details by ID |
| `POST` | `/documents` | Create a new document (DRAFT status) |

#### Create Document Example

```json
{
    "supplierName": "Global Tech Corp",
    "amount": 2500,
    "date": "2024-06-15",
    "description": "Compra de hardware"
}
```

### Approval Workflow

- **`POST /documents/:id/submit`** — Submit for approval based on amount:
    - **< 1000**: Auto-approved
    - **1000–5000**: Level 1 approval required
    - **> 5000**: Level 2 approval required

- **`POST /documents/:id/approve`** — Advance the approval step. Status changes to `APPROVED` when all levels complete.

- **`POST /documents/:id/reject`** — Immediately set status to `REJECTED`.

## Security

### CORS Policy

Access restricted to:
- `http://localhost:5173` (Development)
- `https://btp-document-approval-engine.netlify.app` (Production)

### SAP Build Integration

OAuth2 authentication is handled automatically:

| Component | Value |
|-----------|-------|
| **OAuth Endpoint** | `https://b331c56btrial.authentication.us10.hana.ondemand.com/oauth/token` |
| **Workflow API** | `https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com/workflow/rest/v1/workflow-instances` |
| **Process ID** | `us10.b331c56btrial.btpdocumentapprovalworkflow.approvalProcess` |

