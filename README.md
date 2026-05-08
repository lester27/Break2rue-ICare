# ICare+ (Bohol Health Navigator)

A web-based prototype designed to improve healthcare accessibility and health literacy in Tagbilaran, Bohol. It bridges the gap between urban medical infrastructure and residents by matching users with hospitals based on proximity and specific health needs.

## Problem

Despite a high level of awareness regarding available health programs among adult residents in Tagbilaran City, Bohol, there exists a significant gap in health literacy, particularly concerning disease prevention. While residents are informed that services exist, they face critical challenges in accessing, understanding, evaluating, and applying health information effectively to their personal medical needs. 

## Solution

The ICare+ platform is a localized health navigation solution specifically designed for Tagbilaran City, Bohol, to bridge the gap between high health program awareness and low functional health literacy among its residents. The system simplifies the process of accessing medical help for elderly users and those with low digital literacy who struggle to understand or apply complex health information. After a user completes a simple health profile, the platform automatically centers their location on a map of the Tagbilaran urban perimeter and deploys visual "flags" to identify the nearest hospitals qualified to treat their specific conditions. This automated discovery flow removes the cognitive burden of evaluating medical facilities, providing residents with immediate, culturally relevant guidance and direct access to essential healthcare services.

## Demo Flow

### Step 1: Onboarding & Health Profiling
The user begins by signing in and entering their basic health information to personalize the matching experience.
- **User Entry:** The resident "logs in" and fills out a simplified profile.  
- **Data Input:** The user selects or enters tags such as Blood Type, Allergies, Chronic Conditions (e.g., Asthma, Diabetes), and current Medications.

### Step 2: Real-time Geolocation (The "GPS Handshake")
Upon submitting the profile, the system determines the user's physical location to establish proximity.
- **Automatic Retrieval:** For the prototype, the system defaults to a mock location in **Barangay Cogon, Tagbilaran City**.
- **Boundary Check:** The system confirms the user is within the Tagbilaran City perimeter.

### Step 3: Auto-Centering & Map Rendering
The interface transitions to the interactive map, placing the user at the center of the experience.
- **Visual Focus:** The map (using Leaflet.js) automatically pans and zooms to center the user’s location pin.  
- **Perimeter Lock:** The map view is restricted to the Tagbilaran urban landscape to maintain prototype focus.
- **Visual Perimeter:** A 5km radius circle is rendered around the user to show immediate facility reach.

### Step 4: Smart Matching & Flag Deployment
The backend calculates the best medical matches based on the user's specific health profile.
- **Proximity Check:** Calculate the exact distance between the user and nearby facilities.  
- **The Results:** The markers appear on the map, representing only the nearest hospitals qualified to treat the user's specific needs.

### Step 5: Facility Engagement & AI Support
The user accesses detailed facility information or seeks further clarity via the AI agent.
- **Facility Deep-Dive:** Clicking a hospital flag reveals Phase 1 (Hover Look), Phase 2 (Quick Popup), and Phase 3 (Draggable Detail Panel).
- **HoFi AI Assistant:** A Gemini-powered Chat Widget that provides simplified, empathetic guidance. It generates interactive hospital chips and prioritizes suitable doctors based on identified needs.

## AI RAG Workflow

HoFi (the AI Assistant) utilizes a **Retrieval-Augmented Generation (RAG)** approach to provide accurate, localized medical guidance:

1.  **Symptom Retrieval**: The AI matches user input against a local `triage.json` dataset (based on ESI guidelines).
2.  **Specialty Mapping**: Symptoms are cross-referenced with `specialties.json` to identify the most suitable medical department (e.g., Cardiology, Pediatrics).
3.  **Facility Ingestion**: Real-time hospital metadata (distance, status, available services) is injected into the AI context.
4.  **Interactive Tagging**: The AI generates specific metadata tags:
    -   `[HOSPITAL:ID:NAME]`: Triggers interactive facility chips in the UI.
    -   `[SPECIALTY:NAME]`: Sorts and highlights the "Most Suitable" doctors in the facility panel.
5.  **Simplified Output**: The AI translates complex medical triage into empathetic, human-readable instructions, avoiding technical jargon like "ESI levels."

## Project Structure

```text
/src
  /components
    ChatWidget.tsx          # HoFi AI Interface & Chip Rendering
    Dashboard.tsx           # Main App Layout & Discovery Logic
    HospitalDetailPanel.tsx # Draggable Phase 3 Detail Dashboard
    Map.tsx                 # Leaflet Map with Hover/Click/Zoom Logic
    Login.tsx               # User Onboarding & Profiling
  /services
    apiService.ts           # Backend Connectivity & Excel Data Fetching
    geminiService.ts        # HoFi AI Logic & RAG Prompting
  /data
    triage.json             # Clinical Triage Decision Logic
    specialties.json        # Medical Specialty Mapping
  /constants
    index.ts                # App Configuration & Tagbilaran Center
  /types
    index.ts                # TypeScript Definitions for Hospitals/Doctors
server.ts                   # Express Backend with Excel Service
```

## Main Features

### Smart Hospital Matching Engine
This core logic removes the difficulty residents face in evaluating and applying health information.
- **Medical Relevance Filtering:** Cross-references the user's personal health profile with facility metadata to find the most suitable medical department.  
- **Suitability Scoring:** Renders a list of medical facilities sorted by a combination of physical distance and specialization relevance.

### HoFi AI Assistant (Powered by Gemini API)
The AI agent acts as a centralized helpdesk designed to support elderly and non-tech-savvy users in navigating the local healthcare landscape.
- **Empathy-First Persona:** The agent is programmed with a friendly "nurse" persona to build trust and reduce technology anxiety.
- **Intelligent Doctor Prioritization:** Automatically sorts and highlights the most suitable doctors in the facility panel based on the conversation context.
- **Interactive Navigation:** Generates clickable cards that allow users to jump directly from a recommendation to a map location.

## Target Users

The target audience for the ICare+ platform includes all residents of Tagbilaran City, Bohol. The system is designed to support the general population who struggle to effectively evaluate or apply health information. It specifically serves:
-   **Elderly Users**: Who benefit from the simplified, persona-driven AI interface.
-   **Non-Tech Savvy Residents**: Who use the "GPS-first" flow to bypass complex search menus.
-   **Proactive Health Seekers**: Who need routine literacy resources and disease prevention guidance tailored to their profile.

## Tools

-   **Backend:** Node.js (Express.js), TypeScript, SheetJS (Excel Parsing)
-   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Leaflet.js (Map), Framer Motion (Animations)
-   **AI Integration:** Google Gemini API (gemini-1.5-flash / gemini-3-flash-preview)
-   **Data & Design:** Microsoft Excel (Database), Lucide Icons, Google Fonts
-   **Environment:** Git, GitHub, VS Code

## Implementation Details

### Lightweight Excel Database
The system uses **Microsoft Excel (`Hospital_DB.xlsx`)** as its primary data source. This allows medical administrators to update hospital and doctor records without technical knowledge. The Express backend uses `xlsx` (SheetJS) to parse these sheets in real-time and serve them via a RESTful API.

### Multi-Phase Discovery UI
The Map interface is engineered with three distinct user phases to minimize cognitive load:
-   **Phase 1 (Hover)**: A 600ms delayed "Quick Look" card for rapid scanning.
-   **Phase 2 (Click)**: A partial-info Leaflet popup for essential stats.
-   **Phase 3 (Dashboard)**: A full-screen, draggable `framer-motion` panel for deep engagement and doctor discovery.

### Environment & Security
Sensitive configurations, such as the `GEMINI_API_KEY`, are managed via a root-level `.env` file and injected into the Vite build process to ensure secure client-side AI communication.

## Deployment

### Prerequisites
-   **Node.js**: v18 or higher.
-   **Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/).

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root directory:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

### Running Locally
To start the integrated development server (Backend + Frontend):
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

### Production Deployment
The app is designed to be deployed as a unified Node.js application.
1.  **Build the Frontend**: `npm run build`
2.  **Deploy**: Host on a Node.js compatible platform (Heroku, Railway, or VPS).
3.  **Static Serving**: The Express server is configured to serve the Vite `dist` folder in production environments.
