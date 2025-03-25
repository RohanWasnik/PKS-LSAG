# PKS-LSAG
# 🚀 Linkable Anonymous Signature Group (LSAG) & Public Key Signature (PKS)  

## 📌 Overview  
This project implements Linkable Anonymous Signature Group (LSAG) and Public Key Signature (PKS) for secure cryptographic signing. It provides a React + Vite frontend and a Node.js + Express backend.

## 🛠 Features  
✅ Generate & Verify LSAG Signatures  
✅ Generate & Verify PKS Signatures  
✅ Database Support (Optional: Drizzle ORM)  
✅ Frontend UI for Signing & Verification  
✅ TailwindCSS for Styling  
✅ React + Vite for Fast Development  
✅ Node.js + Express for API  

---

## 📁 Project Structure  

### 1️⃣ Root Directory (`PublicKeySignature/`)  
- `.gitignore` → Ignores unnecessary files.  
- `drizzle.config.ts` → Database migration configuration.  
- `generated-icon.png` → Project logo or icon.  
- `package.json` → Dependencies & scripts.  
- `tsconfig.json` → TypeScript config.  
- `vite.config.ts` → Vite configuration for React frontend.  
- `tailwind.config.ts` → Tailwind CSS setup.  
- `theme.json` → UI theme settings.  
- `postcss.config.js` → PostCSS settings.  

---

### 2️⃣ Backend (`server/`)  
Located in `PublicKeySignature/server/`, the backend is a **Node.js + Express API** responsible for:  
- Handling cryptographic operations.  
- Managing signatures (LSAG & PKS).  
- Storing/verifying digital signatures.  
- Providing endpoints for the frontend.  

#### 📌 Important Files  
- `server/index.ts` → **Main server file**, starts Express on port `5000`.  
- `server/routes/` → API routes for cryptographic operations.  
- `server/controllers/` → Handles LSAG & PKS logic.  
- `server/utils/` → Helper functions for cryptographic operations.  
- `server/middleware/` → Middleware for authentication, error handling, etc.  
- `server/db/` → Database connection & models (if used).  

#### 🚀 How to Start the Backend  
```sh
npm run dev
```
Runs the backend on http://localhost:5000
