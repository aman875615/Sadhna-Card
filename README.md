# Sadhna-Card

ISKCON Sadhana Card Progressive Web App (PWA) with **Raw Time-Based Calculation Engine**, **Role-Specific Self Entry**, **Hierarchical Tree Structure (Admin $\to$ Counsellor $\to$ Brahmachari $\to$ Student)**, and **Interval-Aware Date-Range Reporting**.

## 🌟 Key Features

1. **Strict Time-Based Raw Storage (No Point Entry)**
   - Database stores actual timings (`22:05`, `03:45`, `07:10`) and actual durations in minutes (`60m`, `180m`).
   - Scoring engine dynamically evaluates marks and percentages using Excel rules (`sadhana Card_Brahamcharis.xls` and `sadhana Card_bace.xls`).

2. **Role-Specific Self-Sadhana Entry**
   - **Student (Card S2)**: BACE In/Out timing, 3 attendance slots, 3.5 hrs/week Pathan & Sravan, 6 hrs/week Seva.
   - **Brahmachari (Card S1)**: 4 attendance slots (Guru Puja), 7 hrs/week Pathan & Sravan, 42 hrs/week Seva.
   - **Counsellor**: Monitoring & guidance role across down-tree Brahmacharis and Students.

3. **Hierarchical Tree Explorer (`/counsellor/tree`)**
   - Tree navigation: Counsellors $\to$ Brahmacharis $\to$ Students.
   - Direct drill-down to any down-tree devotee's Sadhana Report.

4. **Dynamic Date-Range Reporting (`/reports`)**
   - Interval-aware target scaling (e.g. 14 days = 2 weeks = 14h Pathan target).
   - Daily expandable matrix showing raw inputs alongside derived scores.
   - Shareable authorized URLs.

5. **MongoDB Atlas & PWA Support**
   - MongoDB database with Prisma ORM.
   - Offline-ready Progressive Web App with manifest and service worker.

## 🛠️ Tech Stack
- **Framework**: Next.js 16+ (App Router), React 19, TypeScript
- **Database**: MongoDB Atlas with Prisma ORM
- **Styling**: Tailwind CSS with custom glassmorphism
- **Authentication**: JWT tokens with bcrypt password hashing
- **Icons**: Lucide React

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file:
```env
DATABASE_URL="your-mongodb-connection-string"
JWT_SECRET="your-jwt-secret"
```

### 3. Setup Database
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
