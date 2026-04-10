# ClearLoop

## The Problem

Small engineering teams have no structured way to track work, decisions, and context.

Features, bugs, PRs, client feedback, and release notes all live in different places — WhatsApp, email, Slack, random notes. When something breaks in production, nobody knows the history of why it was built that way, who changed what, or what was discussed.

The result:
- Work is invisible — managers don't know progress, developers don't know priorities
- No ownership — "who is doing this?" "is this done?"
- No context — why was this feature built? who decided it?
- No audit trail — when prod breaks, nobody can trace back what changed and why
- Trust breaks between manager and developer

## What ClearLoop Solves

ClearLoop gives small teams one place for everything that matters.

It is a context layer for small engineering teams that connects the dots between why something was built, who decided it, which PR changed it, and what broke because of it.

When a developer opens a PR on GitHub, ClearLoop automatically links it to the feature. When a release is tagged, release notes are generated automatically. When a bug is reported, it traces back to the feature and PR that caused it.

Developers work in GitHub as normal. ClearLoop listens and builds the context automatically. Zero friction.

## Who Is It For

Small engineering teams of 5 to 40 people — developers and managers who are tired of scattered work and invisible decisions.

## Core Features

- Feature tracking with owner, status, and the reason it was built
- GitHub PR auto-linked to features via webhook — no manual input
- Bug reports linked to features for full traceability
- Auto-generated release notes on deployment
- Full audit trail of every action on every feature
- Role based access — Admin, Manager, Developer
- Multi-tenant — each company gets their own isolated workspace

## Tech Stack

- Backend — NestJS
- Database — PostgreSQL with shared schema multi-tenancy
- ORM — Prisma
- Frontend — Next.js
- GitHub Integration — GitHub App with webhooks

## Architecture

Multi-tenant SaaS using shared schema approach. Every table has a `tenant_id` column. Every query is scoped to the tenant extracted from the JWT token. A tenant guard on every request ensures complete data isolation between companies.

RBAC is implemented via NestJS Guards. Role is embedded in the JWT token to avoid extra database calls per request.

GitHub integration uses a GitHub App installed on the company's organization, giving access to private repositories without exposing source code. Only PR metadata is captured — title, author, status, and linked feature ID.

## Project Structure

```
clearloop/
  clearloop-backend/   — NestJS API
  clearloop-frontend/  — Next.js app (coming soon)
```

## Running Locally

```bash
# start database
cd clearloop-backend
docker-compose up -d

# install dependencies
yarn install

# run migrations
npx prisma migrate dev

# start server
yarn start:dev
```
