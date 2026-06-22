# ThinkKre8tive Enterprise Portal

Welcome to the **ThinkKre8tive Enterprise Portal** repository. This is an all-in-one business management portal (ERP) and public branding showcase for Ghana's premium print and branding agency, **ThinkKre8tive**.

This system manages everything from large-format prints, office setups, illuminated 3D signage logs, to client quotations, automated invoices, payment reconciliation, SMS notifications, and financial reporting.

---

## 🏗️ System Architecture

The project is structured as a modern **Yarn Workspaces Monorepo** (`yarn@4.12.0`). This architecture separates the core application code from our deployment and asset-publishing pipelines, keeping dependencies highly modular.

```mermaid
graph TD
    Client[Web Browser Client] <-->|HTTP / React Query / Pages| AppRouter[Next.js App Router <br> apps/web]
    AppRouter <-->|Session / Bearer Token Auth| BetterAuth[Better Auth <br> src/lib/auth.ts]
    AppRouter <-->|SQL Queries / transactions| SQLHelper[SQL Utility <br> sql.ts]
    BetterAuth -->|Pg Pool Connection| NeonDB[(Neon Serverless Postgres)]
    SQLHelper -->|WebSockets / HTTPS| NeonDB
    
    subgraph Deployment Infrastructure (OpenNext)
        CloudFront[AWS CloudFront CDN]
        Lambda[AWS Lambda - Serverless Compute]
        S3[AWS S3 - Asset Bucket & ISR Cache]
    end

    Client <--> CloudFront
    CloudFront <--> Lambda
    CloudFront <--> S3
    Lambda <--> S3
```

### Monorepo Workspaces:
1. **`apps/web`** ([apps/web/package.json](file:///c:/Projects/ThinkKre8tive/apps/web/package.json)): The primary Next.js web application encompassing public marketing routes and the secure back-office admin system.
2. **`publisher`** ([publisher/package.json](file:///c:/Projects/ThinkKre8tive/publisher/package.json)): The publishing pipeline wrapper configuration utilizing OpenNext to build, bundle, and package the Next.js application for serverless AWS deployment.

---

## 🛠️ Technology Stack

The stack is curated to offer maximum speed, type safety, serverless scalability, and local ease of deployment.

| Layer | Technology | Usage & Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | Powers both the fast SSR/ISR public web pages and the heavy client-side admin portals using React Server Components. |
| **Styling** | **Tailwind CSS v4** | Utilizes the latest CSS-native theme parameters for rapid development of consistent, high-end interfaces. |
| **UI Components** | **Radix UI & Base UI** | Primitive, unstyled, accessible UI components for robust accessibility (WAI-ARIA compliance) without styling limitations. |
| **Icons** | **Lucide React** | A clean, modern icon library for clear UI navigation indicators. |
| **State & Caching** | **TanStack React Query** | Manages client-side asynchronous data fetching, mutation operations, caching, and state validation. |
| **Authentication** | **Better Auth** | Standardized authentication library supporting email/password credential login, social OAuth integrations, and API Bearer Token authorization. |
| **Database** | **Neon Serverless Postgres** | Cloud-native PostgreSQL with auto-scaling, branching capabilities, and serverless-friendly connection mechanisms. |
| **Query Builder / Client** | **Neon Driver & Kysely** | Raw SQL utility (`sql`) for speed and flexibility; Kysely Type-Safe Adapter for relational mapping of user schemas. |
| **Password Hashing** | **Argon2 WebAssembly** | `argon2-wasm-edge` is used for ultra-secure, resource-efficient password verification on Edge/Serverless computing runtimes. |
| **Build & Deploy** | **OpenNext (`@opennextjs/aws`)** | Resolves assets, implements cache interception, and outputs an AWS Lambda/S3 bundle directly from standard Next.js build output. |

---

## ⚙️ Core System Logic & Workflows

The portal handles a complete business flow from initial prospect quote requests to finalized invoices and payment receipts.

### 1. The Quote-to-Payment Lifecycle
```
[Client Quote Request] ➜ [Admin Review / Quotation] ➜ [Convert to Pending Invoice]
                                                                │
[Payment Approval / Status Update] 🖎 [Record Payment Receipt] 🖎 [Invoice Approval]
```

1. **Quotation Request**:
   - Clients use the interactive estimator tool on the public `/quote` page to requests estimates.
   - Quotations are saved as `draft` or `sent` status in the [Quotations Admin Panel](file:///c:/Projects/ThinkKre8tive/apps/web/src/app/admin/quotations/page.tsx).
2. **Invoice Conversion**:
   - Approved quotations are converted into **Invoices** (stored with initial `approval_status = 'pending'`).
   - The invoice remains locked and inactive until an authorized administrator updates the invoice status to active.
3. **Approval**:
   - Managers approve pending invoices in the [Invoices API](file:///c:/Projects/ThinkKre8tive/apps/web/src/app/api/invoices/route.ts), publishing them and updating logs.
4. **Payment Recording & Verification**:
   - When the client settles their bill (via Mobile Money or Bank Transfer), an admin records the payment, generating a pending **Receipt** ([Receipts API](file:///c:/Projects/ThinkKre8tive/apps/web/src/app/api/receipts/route.ts)).
   - Finance validates the transaction. Once approved, the receipt status becomes `approved`.
   - The invoice balance is dynamically updated:
     - `amount_paid` increases.
     - `balance_due` decreases.
     - Status updates automatically: `unpaid` ➜ `partial` ➜ `paid`.

### 2. Automated SMS Notification Triggers
* Managed in the [SMS API Route](file:///c:/Projects/ThinkKre8tive/apps/web/src/app/api/sms/route.ts).
* Tracks current credit balances inside `app_settings` under the `default` key.
* Deducts credits per-recipient and inserts records into `sms_logs` and audit-trail `activity_logs`.

---

## 🧠 Technical Rationale: Why we chose these tools

* **Next.js App Router (over Standard React)**:
  - Perfect for a dual-purpose site. Public pages benefit from Search Engine Optimization (SEO) via Static Generation, while private dashboards leverage React Server Components (RSC) to access the database directly without building custom intermediate API layers.
* **Better Auth (over NextAuth / Clerk / Auth0)**:
  - Keeps user credentials and session data entirely inside the **Neon Database** instead of outsourcing to expensive SaaS providers (Clerk/Auth0).
  - Offers custom hook middlewares (e.g. backfilling `name` from email to keep signups simple) and supports standard `Authorization: Bearer <token>` authorization headers for mobile application wrappers out of the box.
* **Neon Serverless Postgres (over Self-Hosted/RDS Postgres)**:
  - Designed for serverless architectures: scales compute down to zero when inactive, saving hosting costs during off-peak hours.
  - Enables instant database branching, allowing the dev team to test schema migrations in staging environments without impacting production.
* **OpenNext + AWS (over Vercel)**:
  - Vercel hosting pricing becomes highly restrictive at scale. OpenNext converts standard Next.js outputs into native CloudFront, S3, and AWS Lambda resources, giving us full control of our infrastructure at a fraction of the cost.
* **Kysely DB Adapter (for Auth) + Raw SQL Utility (for Operations)**:
  - Using a heavy ORM (like Prisma) introduces connection pooling and execution latency issues in serverless functions.
  - For authentication, Kysely provides type-safe structural definitions. For our business routers, direct template literals (`sql` queries) provide raw SQL performance with Zero overhead.

---

## 🚀 Running the Project Locally

### Prerequisites
Make sure you have Node.js (v18+) and Corepack enabled.

1. **Enable Corepack** (if not done globally):
   ```bash
   corepack enable
   ```
2. **Install Dependencies**:
   ```bash
   corepack yarn install
   ```
3. **Configure Environments**:
   Create a `.env` file inside `apps/web/.env` with your Neon database credentials and auth options.
4. **Start Development Server**:
   You can run this directly from the root folder:
   ```bash
   npm run dev
   ```
   *(This triggers `corepack yarn workspace web dev` under the hood).*
