# DueNudge — Freelancer Invoicing & Automated Reminders

> **DueNudge** is an automated invoicing and payment reminder web app built for freelancers to manage clients, create branded invoices, download high-res PDFs, and send automated late-payment reminders without the awkwardness.

---

## 🚀 Tech Stack

- **Frontend & Backend**: Next.js (App Router) + TypeScript + Tailwind CSS (v4)
- **PDF Generation**: `jspdf` & `html2canvas` for vector high-resolution PDF generation and print stylesheets
- **Icons & UI Utilities**: Lucide React, `clsx`, `tailwind-merge`
- **Database, Auth & Storage**: Supabase
  - **Supabase Auth**: Passwordless Email Magic Link & Google OAuth
  - **Supabase PostgreSQL**: `users`, `business_profiles`, `clients`, `invoices`, and `invoice_items` with Row-Level Security (RLS)
  - **Supabase Storage**: `business-logos` bucket for business logos

---

## 📦 Project Structure

```text
duenudge/
├── src/
│   ├── app/
│   │   ├── auth/callback/route.ts   # Exchange OAuth & magic link tokens
│   │   ├── clients/page.tsx         # Client Management & CRUD
│   │   ├── invoices/
│   │   │   ├── page.tsx             # Filterable Invoices Dashboard & metrics
│   │   │   ├── new/page.tsx         # Interactive invoice creation form
│   │   │   └── [id]/
│   │   │       ├── page.tsx         # View Invoice & PDF Download
│   │   │       └── edit/page.tsx    # Edit existing invoice
│   │   ├── login/page.tsx           # Sign Up & Log In screen
│   │   ├── onboarding/page.tsx      # Freelancer Onboarding screen
│   │   ├── reminders/page.tsx       # Automated 3-stage reminder engine preview
│   │   ├── settings/page.tsx        # Business Profile & Invoicing Defaults
│   │   ├── globals.css              # Tailwind CSS styling
│   │   ├── layout.tsx               # Root layout & typography
│   │   └── page.tsx                 # Landing / Overview page
│   ├── components/
│   │   ├── AuthForm.tsx             # Magic link & Google auth form
│   │   ├── BusinessProfileForm.tsx  # Profile settings & live preview card
│   │   ├── ClientModal.tsx          # Add & Edit Client modal
│   │   ├── ClientsList.tsx          # Client directory table & search
│   │   ├── InvoiceForm.tsx          # Interactive invoice builder & tax calculator
│   │   ├── InvoicesDashboard.tsx    # Filterable dashboard & metrics banner
│   │   ├── InvoiceView.tsx          # High-res invoice view & PDF export
│   │   ├── Navbar.tsx               # Responsive header navigation & user avatar
│   │   └── SupabaseNotice.tsx       # Configuration banner and setup helper
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            # Client-side Supabase client (@supabase/ssr)
│   │   │   ├── middleware.ts        # Session refresh helper
│   │   │   └── server.ts            # Server-side Supabase client (@supabase/ssr)
│   │   └── utils.ts                 # Formatting, currency, date arithmetic, status badges
│   ├── middleware.ts                # Next.js request auth refresher
│   └── types/
│       └── database.ts              # TypeScript definitions for Supabase schema
├── supabase/
│   └── schema.sql                   # Complete SQL migrations, RLS & Storage policies
├── .env.example                     # Environment template
└── .env.local                       # Local environment variables
```

---

## ⚡ Quick Start

### 1. Configure Supabase

1. Open your project dashboard at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase project dashboard.
3. Open `supabase/schema.sql` from this repository, paste its contents into the SQL Editor, and click **Run**.
   - Creates `public.users`, `public.business_profiles`, `public.clients`, `public.invoices`, and `public.invoice_items`.
   - Enables Row-Level Security (RLS) on all tables with SELECT/INSERT/UPDATE/DELETE policies bound to `auth.uid() = user_id`.
   - Creates the `handle_new_user()` trigger for automated user profile provisioning.
   - Creates the `business-logos` Supabase storage bucket with public read and authenticated write access.

### 2. Set Environment Variables

In `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

### 3. Run the Development Server

```bash
npm run dev
```

Visit [https://duenudge-ruby.vercel.app/) in your browser.

---

## 🛡️ Core Requirements Implemented

### Phase 1: Authentication & Business Profile
- **Passwordless Auth**: Email Magic Link & Google OAuth with callback handling in `/auth/callback`.
- **Business Profile Settings**: Set business name, upload logo to Supabase Storage, default currency, default payment terms (due days), invoice prefix, and payment instructions (bank wire, PayPal, Stripe).
- **Live Client Preview**: Side-by-side reactive preview of invoice header and late-payment reminder email.

### Phase 2: Clients, Invoicing & PDF Generation
- **Client Management (`/clients`)**:
  - Full CRUD operations with modal: Contact Name, Billing Email, Company, Currency, Default Payment Terms (days), and Address.
  - Searchable client directory with quick action to issue an invoice directly to that client.
- **Interactive Invoice Builder (`/invoices/new` & `/invoices/[id]/edit`)**:
  - Select Client (automatically sets currency and computes due date based on client payment terms).
  - Dynamic line items (Description, Quantity, Rate, Amount).
  - Tax % input with automated calculations for Subtotal, Tax Amount, and Total Amount.
  - Custom notes and payment instructions prefilled from business profile.
  - Status management: Draft, Sent, Overdue, Paid.
- **Filterable Invoices Dashboard (`/invoices`)**:
  - Filter tabs: **All**, **Unpaid** (Draft, Sent, Overdue), **Overdue**, **Paid**.
  - Metrics summary banner: Total Invoiced, Outstanding / Unpaid, Overdue Amount, Total Paid.
  - Quick action menu for instant status changes and deletions.
- **PDF Invoice Generation (`/invoices/[id]`)**:
  - Print-accurate, high-resolution PDF download using `jspdf` and `html2canvas` (`Invoice-[invoice_number].pdf`).
  - Native print stylesheet (`window.print()`).
  - Interactive tab to preview the automated 3-tier late-payment reminder email sequence.
