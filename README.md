# Credex Frontend

The user interface for the Credex Credit Default Prediction system. Built with **Next.js 15** and **React 19**, this application provides a modern, responsive dashboard for real-time credit risk assessment.

## 🚀 Features

- **Risk Calculator**: Interactive form for entering customer financial data (14 key features).
- **Real-time Analysis**: Connects to the Flask/XGBoost backend for instant default probability predictions.
- **Visual Explanations**:
  - **Waterfall Chart**: Dynamic breakdown of how each feature contributed to a _specific_ prediction (Red = Risk Increase, Green = Risk Decrease).
  - **Global Importance**: Bar chart showing the overall most impactful features in the model.
- **Responsive Design**: Fully optimized for mobile and desktop using Tailwind CSS.
- **Sample Data**: One-click loading of high-risk sample profiles for demonstration.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/) for SHAP visualizations
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup

Create a `.env.local` file in the `frontend` directory to configure the backend connection:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000/predict
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📂 Project Structure

- `src/app/page.tsx`: The main application logic, containing the calculator form, state management, and visualization components.
- `src/app/globals.css`: Global styles and Tailwind directives.
- `public/`: Static assets.

## 🎨 Customization

- **Feature Configuration**: The input form is dynamically generated from the `FEATURES` constant in `page.tsx`.
- **Theme**: Dark mode aesthetic is enforced via Tailwind classes in `page.tsx` and `globals.css`.
