# Mushaira & Kavi Sammelan Platform

**Built by Aeronex Technologies**  
First Client: [Jashn-e-Urdu](https://jashneurdu.org)

---

## Platform Overview

A production-grade cultural and literary event management system for Mushaira and Kavi Sammelan events.

### Features
- WhatsApp OTP Authentication
- Family Registration System
- QR-based Gate Validation (100 scans/sec)
- Organiser Approval Workflow
- Real-time Gate Monitoring
- Notification Engine (WhatsApp + Email)
- Super Admin Multi-Tenant Platform

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native, Expo, TypeScript |
| Organiser Admin | Next.js 14, Tailwind, ShadCN UI |
| Super Admin | Next.js 14, Tailwind, ShadCN UI |
| Backend | NestJS, TypeScript, PostgreSQL, Prisma |
| Cache/Queue | Redis, BullMQ |
| Auth | JWT, WhatsApp OTP |
| Infra | Docker, Nginx, AWS/GCP |

---

## Project Structure

```
mushaira-platform/
  apps/
    mobile-app/         # React Native (Expo)
    organiser-admin/    # Next.js Organiser Dashboard
    super-admin/        # Next.js Super Admin
    qr-scanner/         # QR Scanner App
  services/
    api-server/         # NestJS Backend
  packages/
    ui-components/      # Shared React components
    shared-types/       # Shared TypeScript types
  infra/
    docker/             # Docker configurations
    nginx/              # Nginx reverse proxy
  docs/                 # Documentation
```

---

## Quick Start

```bash
# Install dependencies
yarn install

# Setup environment
cp services/api-server/.env.example services/api-server/.env

# Run database migrations
yarn db:migrate

# Start backend
yarn dev:api
```

---

## Phase 1 MVP Build Plan

- [x] Step 1 — Backend Core Setup
- [x] Step 2 — WhatsApp OTP Authentication
- [x] Step 3 — User Profile Module
- [x] Step 4 — Family Member Module
- [x] Step 5 — Event Engine
- [x] Step 6 — Event Registration
- [x] Step 7 — QR Pass Engine
- [x] Step 8 — Gate Scanner System
- [x] Step 9 — Mobile App Screens
- [x] Step 10 — Organiser Admin Dashboard
- [x] Step 11 — Super Admin Platform
- [x] Step 12 — Notification Engine

---

## Theme

| Variable | Value |
|----------|-------|
| Primary | `#5B2C83` (Purple) |
| Background | `#FFFFFF` (White) |
| Accent | `#D4AF37` (Gold - Premium) |
| Headings | Playfair Display |
| Body | Inter |
