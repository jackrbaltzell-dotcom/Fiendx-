# FindX — Find Everything. Connect Everyone.

FindX is an all-in-one discovery and connection full-stack web platform combining an interactive OpenStreetMap engine, universal search, property marketplace, product commerce, business directory, verified service & professional hub, job board, freelance marketplace, local communities, real-time messaging, and Google Gemini AI intelligence.

---

## 🌟 Core Features

1. **Interactive OpenStreetMap**
   - Open-source mapping with category pins (Property, Product, Service, Business, Jobs).
   - "Near Me" GPS browser geolocation button.
   - Live listing popups and directions.

2. **Real Authentication & Multi-Role Profiles**
   - Firebase Auth (Google Sign-In and Email/Password).
   - Unique `@username` digital business cards with QR/share links.
   - Multi-role support on single accounts: Personal, Business, Service Provider, Freelancer, Employer, Seller, Property Owner.
   - Verified badges (Identity, Business, Professional, Phone, Email).

3. **Universal Search & Marketplaces**
   - Real-time search across all database entities.
   - **Property Marketplace**: Rent, Sale, Lease with bedrooms, bathrooms, area, amenities.
   - **Product Marketplace**: Buy/sell electronics, mobiles, furniture, vehicles.
   - **Services & Professionals**: Doctors, technicians, electricians, plumbers with booking.
   - **Job Board**: Job posts with 1-click applications and applicant management.
   - **Freelancing Hub**: Project posts with proposal bidding.
   - **"I Need" Requests**: Two-sided board where users post needs and providers quote.

4. **Real-Time Communication & Social**
   - 1-to-1 direct chat with Firestore real-time snapshots.
   - Event-driven notifications (follows, likes, messages, bookings, quotes).
   - Social feed with post creation, image uploads, likes, and comments.
   - Local Community Hubs and Event meetups with RSVP.

5. **FindX Gemini AI Studio Intelligence**
   - **Google Maps Grounding** (`gemini-3.5-flash` with `googleMaps`): Local business and clinic search.
   - **Google Search Grounding** (`gemini-3.5-flash` with `googleSearch`): Real-time market prices and trends.
   - **AI Listing Enhancer** (`gemini-3.5-flash` / `gemini-3.1-pro-preview` / `gemini-3.1-flash-lite`): 1-click SEO title, description, and safety tips.
   - **Visual Creator & Editor** (`gemini-3.1-flash-image-preview`): Text prompt image generation.
   - **Photo Inspector & Deep Analysis** (`gemini-3.1-pro-preview`): Image understanding, condition inspection, and authenticity verification.
   - **Text-to-Speech (TTS)** (`gemini-3.8-flash-tts`): Realistic speech synthesis for listings and navigation.
   - **Voice Assistant**: Natural voice conversation queries.

6. **Safety, Moderation & Admin Panel**
   - Report system (scam, fake listing, wrong price).
   - Admin hub for verification approvals, moderation queues, and listings management.

7. **Multi-Language Support**
   - Seamless English and Bengali (বাংলা) localization.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Leaflet (OpenStreetMap)
- **Backend**: Node.js, Express / Vite middleware, `@google/genai`
- **Database & Auth**: Firebase Authentication & Cloud Firestore
- **AI Models**: `gemini-3.5-flash`, `gemini-3.1-pro-preview`, `gemini-3.1-flash-lite`, `gemini-3.1-flash-image`, `gemini-3.8-flash-tts`

---

## 🚀 Installation & Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Lint / Typecheck
npm run lint

# Production build
npm run build
```

---

## 🌐 Deploying to GitHub Pages

### Why the page was blank and how it is fixed:
By default, Vite builds assets with absolute paths (`/assets/...`). When deployed to GitHub Pages under a subfolder repository (`https://<username>.github.io/<repo-name>/`), the browser looks for `/assets/...` on the root domain (`https://<username>.github.io/assets/...`), which returns `404 Not Found`, causing a blank white page.

1. **Relative Base URL**: We configured `base: './'` in `vite.config.ts`, so assets are referenced as `./assets/...`.
2. **SPA Routing 404 Fallback**: `vite.config.ts` automatically generates `dist/404.html` so direct navigation and page reloads work smoothly on GitHub Pages.
3. **Runtime Error Boundary**: Added an `ErrorBoundary` so any unforeseen exception displays a recovery console instead of a blank white screen.

### Deployment Steps:
1. Build the production files:
   ```bash
   npm run build
   ```
2. Deploy the generated `dist/` directory to your repository's `gh-pages` branch (or select `/dist` as the GitHub Pages root in repository Settings > Pages).
3. **Firebase Auth on GitHub Pages**:
   - Go to [Firebase Console](https://console.firebase.google.com/) > Your Project > **Authentication** > **Settings** > **Authorized domains**.
   - Add `<your-username>.github.io` so Google Sign-in popups are authorized on your GitHub Pages domain.
4. **Backend AI Features on GitHub Pages**:
   - GitHub Pages only serves static files (HTML/CSS/JS).
   - If you want the server-side Gemini AI features (Maps grounding, Search grounding, AI listing polish, etc.) to function on GitHub Pages, host your backend proxy (e.g., on Cloud Run, Render, or Railway) and set `VITE_API_URL="https://your-backend-service.run.app"` in your GitHub Pages build environment variables.

---

## 🔒 Environment Variables

Copy `.env.example` to `.env`:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="YOUR_APP_URL"
```

Firebase credentials are automatically read from `firebase-applet-config.json` with security rules deployed in `firestore.rules`.
