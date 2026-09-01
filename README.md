# BurnoutGuard

An AI-powered employee burnout prediction and prevention system.

## Project Structure

- **backend/**: Node.js (Express) & TypeScript with Prisma ORM.
- **frontend/**: React & TypeScript powered by Vite.
- **ml-service/**: Python-based Machine Learning service (XGBoost, SHAP).
- **legacy/**: Backup of the original ASP.NET Core and Angular codebase.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS (optional), Framer Motion.
- **Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL/SQL Server.
- **ML**: Python, Scikit-learn, XGBoost, SHAP.

## ML Evaluation Notes

- Internal model selection now uses 5-fold stratified cross-validation rather than a single train/test split.
- The strongest-performing model is regularized logistic regression, which fits the min-max normalized check-in features well because the signal is largely monotonic and near-linear.
- Tree ensembles are still benchmarked, but they can over-partition continuous lifestyle ratios and are more sensitive to small fold-level shifts than a regularized linear boundary.

## Getting Started

### Backend
1. `cd backend`
2. `npm install`
3. `npx prisma generate`
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### ML Service
1. `cd ml-service`
2. `pip install -r requirements.txt`
3. `python main.py`
