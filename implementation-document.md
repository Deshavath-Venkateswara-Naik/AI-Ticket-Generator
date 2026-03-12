# Project Implementation Document (Memory)

This document serves as the single source of truth for the AI Ticket Generator project. It records all features, architectural decisions, and changes made to the system.

## Core Functionality

### 1. Ticket Extraction from Text
- **Backend**: `/generate-ticket` endpoint in `ticket_router.py`. Uses `llm_service.py` with `gpt-4o-mini`.
- **Frontend**: Text input mode in `TicketGenerator.jsx`.

### 2. Ticket Extraction from Images (OCR)
- **Backend**: `/generate-tickets-from-image` endpoint.
- **OCR Engine**: Migrated from PaddleOCR to **GPT-4o Vision** for improved accuracy and reduced dependency footprint.
- **Flow**: Image upload -> Base64 encoding -> GPT-4o Vision API -> Text splitting -> LLM field extraction.

### 3. Ticket Extraction from Voice (Audio)
- **Backend**: `/generate-ticket-audio` endpoint.
- **Transcription**: OpenAI Whisper API (`whisper-1`).
- **Frontend**: Voice mode with manual controls (Start, Stop, Pause, Resume, Transcribe, Generate).

### 4. Category Management
- **System**: Uses a predefined list of `ALLOWED_CATEGORIES` in `app/utils/categories.py`.
- **Validation**: Backend applies fuzzy matching to LLM-suggested categories to ensure they match the allowed list.

## Architectural Decisions

### OCR Migration (2026-03-12)
- Replaced local PaddleOCR with OpenAI GPT-4o Vision.
- **Reason**: Higher accuracy on messy/handwritten text, simplified deployment by removing large C++ and Python dependencies (PaddlePaddle, PaddleOCR).
- **Files Affected**: `ocr_service.py`, `requirements.txt`.

### UI Revamp & Onboarding (2026-03-12)
- **Target**: Holistic shift from complex dashboard to focused onboarding flow.
- **Onboarding Page**: Replaced vertical sidebar with a high-impact landing page featuring three large utility cards (Text, Image, Voice).
- **Branding**: Implemented "Turito Red" (#dc2626) and white aesthetic throughout the application.
- **Accessibility**: Added immersive focused mode for individual capture tools with integrated "Back to Hub" navigation.
- **Dependencies Added**: `framer-motion`, `lucide-react`.

## Component Registry

### Frontend
- `App.jsx`: Main entry point.
- `TicketGenerator.jsx`: Dashboard layout and state management.
- `ResultCard.jsx`: Atomic component for ticket results.
- `services/api.js`: API wrapper.
- `hooks/useWhisper.js`: Browser recording hook.

### Backend
- `main.py`: FastAPI initialization.
- `routers/ticket_router.py`: API route definitions and high-level processing logic.
- `services/ocr_service.py`: Image text extraction (GPT-4o).
- `services/llm_service.py`: Text field extraction (GPT-4o-mini) and transcription (Whisper).
- `schemas/ticket_schema.py`: Pydantic models for validation.
