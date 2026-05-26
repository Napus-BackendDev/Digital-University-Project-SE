# 💻 MFU E-Questionnaires Frontend Client

This is the premium frontend client for the **Digital University E-Questionnaires Platform**. Built on top of **Vue 2** and styled using the **CoreUI Pro Bootstrap Admin Template**, it delivers a highly responsive, modern, and multilingual survey experience.

---

## ✨ Core Features

* 📋 **Dynamic Questionnaire Filler**: Multilingual form renderer supporting diverse question formats (Short answer, Paragraphs, Multiple choice, Checkboxes, Star ratings, File uploads, Images).
* 🛠️ **Form Builder & Manager**: A complete administrative control board to create, update, delete, schedule, and assign collaborators (Editors, Viewers) to specific forms.
* 📊 **Interactive Analytics**: Real-time response telemetry displaying visual bar charts, pie charts, and completion stats via Chart.js integration.
* 👥 **User Role Sandbox Switcher**: A development-helper utility in the sidebar allowing developers and QA engineers to instantly switch between active mock users and test different academic permission levels.
* 🌐 **Full Multilingual Localization**: Supports instant switching between English (`en`) and Thai (`th`) throughout the app.

---

## 🛠️ Tech Stack & Dependencies

* **Framework**: Vue.js `^2.6.11`
* **Admin Layout Template**: CoreUI Pro Bootstrap Vue template
* **State Management**: Vuex Store (highly modularized structure)
* **Routing**: Vue Router
* **HTTP Client**: Axios (configured with customized API interceptors)
* **Custom Dropdowns**: Vue-select (utilized in user switching and dynamic lookups)
* **Icons**: CoreUI Icons (SVG-driven)

---

## 📁 Source Code Directory Structure

The frontend application code is clean and highly modularized:

```text
frontend/
├── public/                 # Static public resources (index.html, icons, manifest)
└── src/
    ├── assets/             # Brand logos, global stylesheets, and SCSS variables
    ├── containers/         # CoreUI layout wrappers (Sidebar, Header, Main Container)
    ├── projects/           # Custom survey platform business features
    │   ├── components/     # Reusable UI widgets (Answer tables, tab navigation)
    │   ├── service/        # Axios API client definition (`api.js`)
    │   ├── styles/         # Custom styling for forms and grids
    │   └── views/          # Primary feature pages
    │       ├── Forms.vue         # Main user dashboard showing active surveys
    │       ├── ManageForms.vue   # Administrative panel to build/manage forms
    │       ├── Responsedetail.vue# Visual detail page for review of submissions
    │       ├── Analytics.vue     # Analytical graphs and statistical telemetry
    │       └── page/             # Sub-pages (FormFill.vue dynamic renderer)
    ├── router/             # URL path routing configuration maps
    ├── store/              # Modularized Vuex stores for robust state caching
    │   ├── modules/        # Separate modules (User, Form, Questions, Responses, Settings)
    │   └── store.js        # Vuex store bootstrap config
    └── main.js             # Vue app bootstrap entry point
```

---

## ⚙️ Vuex Store Modules (State Architecture)

The global state in `src/store/modules/` is separated cleanly to maintain state synchronization with backend database collections:

1. **`User`**: Tracks the current active logged-in user, their roles, permissions, and organization.
2. **`Form`**: Manages the loaded forms list, visibility states, and creator permissions.
3. **`Questions`**: Manages form questions list, ordering, configurations, and dynamic file upload states.
4. **`Responses`**: Stores and processes survey submission records.
5. **`Organizations`**: Caches academic units (e.g. School of IT, School of Science) used to restrict form access.
6. **`Roles`**: Holds permission sets linked to respective admin, teacher, or student accounts.
7. **`Setting`**: Stores dynamic settings (Message templates, email settings, status configurations).

---

## 🚀 Installation & Local Development

To run the Vue frontend client locally on your computer:

### 1. Prerequisites
Ensure you have **Node.js** (version 18 or newer recommended) and **npm** installed.

### 2. Configure Environment Variables
Create a `.env` file in the `frontend` folder:
```env
# Define the API endpoint of your backend
VUE_APP_API_BASE_URL=http://localhost:8081/api/v1/

# Enable or disable the dropdown testing user-switcher in the sidebar
VUE_APP_ENABLE_USER_SWITCHER=true

VUE_APP_TITLE=MFU E-Questionnaires
VUE_APP_VERSION=1.0.0
```

### 3. Install Dependencies
Install all required npm libraries using the standard CoreUI conflict resolver flag:
```bash
npm install --legacy-peer-deps
```

### 4. Start Development Server
Boot up the local hot-reload web server:
```bash
npm run serve
```
Open [http://localhost:8080](http://localhost:8080) in your browser to interact with the application.

---

## 📦 Production Deployment

To package the frontend into minified production assets ready to be served by Nginx:
```bash
npm run build
```
This generates a static `/dist` directory. Serve this `/dist` folder with Nginx using the static configuration provided in `nginx.conf`.
