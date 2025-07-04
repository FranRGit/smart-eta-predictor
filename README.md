# 🚀 Smart ETA Predictor

**Smart ETA Predictor** es una solución integral para estimar el tiempo de llegada (ETA) de conductores en tiempo real. Este sistema combina aprendizaje automático, microservicios, APIs REST y aplicaciones móviles para brindar una experiencia precisa y fluida tanto para conductores como para usuarios.

---

## 🧩 Arquitectura del Proyecto

smart-eta-predictor/
│
├── microservice/ # Modelo de predicción (SVR + Flask)
├── backend/ # Backend Express.js (Node.js)
├── app_usuaruio/ # App móvil del usuario (Flutter)
├── app_conductor/ # App móvil del conductor (Android Studio)
└── README.md # Este archivo


---

## 🧠 Componentes

### 1. Modelo SVR + Microservicio Flask
- Entrena un modelo de regresión SVR para predecir la ETA.
- Expone un microservicio REST (`/predict`) para que otros componentes consulten el modelo.

### 2. Backend Express.js
- Gestiona la lógica del negocio y conecta la app móvil con el microservicio de predicción.
- También administra endpoints para usuarios y conductores.

### 3. App de Usuario (Flutter)
- Permite a los usuarios ver la ETA en tiempo real y solicitar servicios.

### 4. App de Conductor (Android Studio)
- Los conductores comparten su ubicación y reciben información de ETA.

---

## 📦 Tecnologías Utilizadas

- 🐍 **Python**, **scikit-learn**, **Flask** — *Machine Learning*
- 🟩 **Node.js**, **Express.js** — *Backend REST*
- 📱 **Flutter** — *App móvil para usuario*
- 🚗 **Android SDK** — *App móvil para conductor*
- 🔎 **Postman** — *Testing de APIs*
- 📋 **GitHub Projects** — *Gestión del proyecto*
