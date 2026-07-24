# AGENTS.md

# TeioOS

## Project Overview

TeioOS is an open-source Linux-based operating system and examination platform developed as an M.Sc. Computer Science research project.

**Project Title**

> Design and Development of TeioOS: An Accessible and Secure Linux-Based Operating System for Computer-Based Examinations

The objective is to create an integrated examination platform consisting of:

- A custom Debian-based Linux distribution (TeioOS)
- A secure examination server
- A React-based administrator dashboard
- A React-based student examination client
- Automated deployment using Docker and Ansible

The project is a proof-of-concept intended for educational institutions such as colleges, universities, coaching centers, and schools.

---

# Research Focus

Unlike existing solutions that primarily focus on security, TeioOS places equal emphasis on accessibility.

The research investigates how accessibility can be integrated into a secure Linux-based examination operating system while maintaining examination security, usability, and fairness.

Accessibility features may include:

- Screen reader support
- Keyboard-only navigation
- High contrast mode
- Adjustable font sizes
- Text-to-speech
- Focus indicators
- Orca screen reader compatibility
- Text-to-Speech (TTS)
- Speech-to-Text (STT)
- Accessible forms
- ARIA-compliant React interfaces
- Reduced motion support
- Configurable accessibility profiles

Security remains an important aspect but is not the sole contribution of this research.

---

# Project Architecture

The project consists of two deployable products.

## 1. TeioOS Exam Server

Contains:

- FastAPI Backend
- PostgreSQL Database
- Nginx
- React Admin Dashboard
- React Student Examination Client

The administrator should not require programming knowledge to install or operate the server.

---

## 2. TeioOS Client OS

A custom Debian-based Linux distribution that:

- Boots directly into the examination environment
- Uses Openbox
- Uses LightDM
- Automatically launches Firefox in kiosk mode
- Restricts unnecessary desktop access
- Connects to the examination server
- Includes accessibility tools where appropriate

---

# Repository Structure

```text
TeioOS/
├── AGENTS.md
├── assets/
├── docs/
├── server/
│   ├── backend/
│   ├── admin/
│   ├── exam-client/
│   └── nginx/
└── teioos/
```

Backend structure:

```text
app/
├── api/
├── core/
├── db/
├── schemas/
├── services/
└── utils/
```

---

# Technology Stack

## Operating System

- Debian

## Desktop

- Openbox
- LightDM

## Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic

## Database

- PostgreSQL

## Frontend

- React
- TypeScript
- Vite

## Deployment

- Docker
- Ansible

## Web Server

- Nginx

## Version Control

- Git
- GitHub

## Development Environment

- Arch Linux
- QEMU/KVM
- virt-manager

---

# Coding Principles

Generate clean, maintainable, production-quality code.

Prefer readability over cleverness.

Avoid unnecessary abstraction.

Follow SOLID principles where appropriate.

Separate business logic from API routes.

Use dependency injection where appropriate.

Use proper typing throughout the project.

Follow RESTful API design.

Never hardcode secrets or credentials.

Keep configuration inside configuration files or environment variables.

Write modular code.

Document public functions.

Prefer composition over inheritance when appropriate.

One module should have one clear responsibility.

---

# FastAPI Guidelines

Use:

- APIRouter
- Pydantic models
- SQLAlchemy ORM
- Alembic migrations
- Dependency Injection
- Proper HTTP status codes
- Structured error handling
- Logging

Avoid:

- Global mutable state
- Business logic inside API routes
- Direct database logic inside routes

API routes should delegate work to the service layer.

---

# Database Guidelines

Use SQLAlchemy ORM.

Use Alembic for all schema changes.

Prefer normalized schemas.

Avoid duplicated data.

Use UUID primary keys unless there is a strong reason not to.

Store timestamps in UTC.

Never store plaintext passwords.

Design the schema before implementing models.

---

# API Conventions

- Version all endpoints under `/api/v1`.
- Follow RESTful naming conventions.
- Use proper request and response schemas.
- Return appropriate HTTP status codes.
- Validate all incoming data.
- Keep routes thin.
- Perform business logic inside services.
- Use dependency injection for shared resources.

---

# React Guidelines

Use:

- Functional Components
- Hooks
- TypeScript
- React Router
- Component composition
- Context only when necessary

Keep components:

- Small
- Reusable
- Accessible

Avoid large monolithic components.

Accessibility is mandatory.

All interfaces should be keyboard navigable.

Use semantic HTML whenever possible.

Use ARIA attributes only when semantic HTML is insufficient.

---

# Accessibility Requirements

Accessibility is a primary objective of this research.

Accessibility should never be treated as an afterthought.

Whenever UI components are generated:

- Support keyboard navigation
- Maintain visible focus indicators
- Use semantic HTML
- Ensure proper label associations
- Maintain sufficient color contrast
- Support screen readers
- Avoid keyboard traps
- Prefer accessible React patterns
- Follow WCAG 2.1 AA where practical

When designing backend APIs or Linux components, consider how they affect accessible workflows.

---

# Linux Distribution

The custom operating system should:

- Be Debian-based
- Use Openbox
- Use LightDM
- Auto-login into the examination session
- Launch Firefox in kiosk mode
- Restrict unnecessary desktop access
- Include accessibility tools where appropriate
- Be lightweight
- Be reproducible

---

# Deployment Philosophy

The final administrator should never need to manually execute:

- npm
- uvicorn
- python commands

The final TeioOS Exam Server should behave like a normal installable application.

---

# Git Workflow

- Commit after each completed milestone.
- Keep commits focused on a single logical change.
- Use descriptive commit messages.
- Never commit secrets.
- Never commit generated cache files.
- Keep the main branch stable.

---

# Documentation

Generate documentation whenever appropriate.

Document architecture decisions.

Explain design trade-offs.

Provide comments only where they improve understanding.

Avoid redundant comments.

Document public APIs and reusable modules.

---

# Current Scope (Version 1)

Current implementation targets:

- MCQ-based examinations
- Descriptive examinations
- Single examination server
- PostgreSQL database
- Local network deployment
- React-based administrator dashboard
- React-based student client
- Secure examination sessions
- Accessibility-focused user experience

The following are considered future enhancements:

- Question bank
- Remote online proctoring
- AI-assisted invigilation
- Multi-server deployments
- Advanced analytics

---

# Long-Term Goal

Develop a complete proof-of-concept examination ecosystem that demonstrates:

- Linux customization
- Secure examination workflows
- Accessible user interfaces
- Backend engineering
- Modern web development
- Automated deployment
- Software engineering best practices

The resulting project should be suitable both as an M.Sc. dissertation and as a professional portfolio project.

Every architectural decision should prioritize:

1. Maintainability
2. Accessibility
3. Security
4. Simplicity
5. Extensibility