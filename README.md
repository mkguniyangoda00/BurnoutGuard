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
- The synthetic target pipeline now prefers `harmonized_risk_norm` from `harmonize_datasets.py` and bins it into four risk bands, rather than re-deriving a second weighted score from the same raw features.
- The leave-one-feature-out sensitivity check in `ml-service/experiments/leave_one_out.py` can be used to confirm the model is not simply parroting the label construction recipe.

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
