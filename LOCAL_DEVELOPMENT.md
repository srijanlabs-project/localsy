# 💻 Local Development & Testing Guide

This guide details how to set up, run, and test this Yellow Pages application locally on your computer.

---

## 🛠️ 1. Prerequisites

Before starting, ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (Version **18.0.0** or higher is recommended)
*   A package manager like `npm` (which comes bundled with Node.js)
*   A terminal/code editor (such as Visual Studio Code)

---

## 🚀 2. Step-by-Step Local Setup

### Step 1: Export & Clone the Codebase
You can download the project files directly from the AI Studio editor via the top-right Settings menu as a **ZIP file**, or export it directly to **GitHub** and clone it locally:

```bash
# Direct Clone from your repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### Step 2: Install Dependencies
Install all package dependencies securely using `npm`:
```bash
npm install
```

### Step 3: Run the Development Server
Start the client-side dev server using the pre-configured script:
```bash
npm run dev
```

The output in your terminal will display the local and network URLs:
```text
  VITE v6.x.x  ready in X ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.XX:3000/
```

*   **Open your browser** and navigate to `http://localhost:3000` to interact with your application locally.
*   **Hot Reload (HMR):** Whenever you modify code files inside your text editor, standard hot module reloading works instantly, refreshing the local browser view.

---

## 🧪 3. Running Production Builds Logically

Before committing code or deploying to cloud infrastructure, always verify that your production bundle compiles with zero compilation errors:

```bash
# 1. Compile and bundle assets securely into the '/dist' directory
npm run build

# 2. Preview the production bundle locally to guarantee routing integrity
npm run preview
```

The local bundle preview will be hosted, letting you test the fast-loading, highly optimized client bundle exactly as it would operate when pushed to cloud engines like **Railway**.
