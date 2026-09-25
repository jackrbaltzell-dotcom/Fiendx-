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

## 🔒 Environment Variables

Copy `.env.example` to `.env`:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="YOUR_APP_URL"
```

Firebase credentials are automatically read from `firebase-applet-config.json` with security rules deployed in `firestore.rules`.
