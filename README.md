Atmosphere Weather Web Application

Engineered with React 18, TypeScript, Tailwind CSS, Vite, and Open-Meteo APIs.
Created by Ankit Kumar.

Project Folder Structure

weather-app/
├── public/                 <-- Place your 4 background images here
│   ├── day image.jpg
│   ├── night image.webp
│   ├── images rain.jpg
│   └── images cloud.jpg
├── src/
│   ├── types/
│   │   └── weather.ts      <-- TypeScript definitions
│   ├── App.tsx             <-- Core weather dashboard application
│   ├── main.tsx            <-- React DOM bootstrap
│   └── index.css           <-- Tailwind directives & glassmorphic styling
├── index.html              <-- Main HTML template
├── package.json            <-- Project dependencies & scripts
├── postcss.config.js       <-- PostCSS configuration
├── tailwind.config.ts      <-- Tailwind CSS theme configuration
├── tsconfig.json           <-- Root TypeScript configuration
├── tsconfig.app.json       <-- React app TypeScript options
├── tsconfig.node.json      <-- Node/Vite TypeScript options
├── vercel.json             <-- 1-click Vercel deployment setup
├── start.bat               <-- Windows 1-click install & start script
└── README.md



Getting Started

Place your 4 background image files inside the public/ directory:

public/day image.jpg

public/night image.webp

public/images rain.jpg

public/images cloud.jpg

Open your terminal in the weather-app directory and run:

npm install
npm run dev



(Or double-click start.bat on Windows)

Open http://localhost:5173 in your browser.