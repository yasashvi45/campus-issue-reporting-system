# 🎓 Campus Issue Reporting System

A modern, fully functional **Campus Issue Reporting System** built using **HTML, CSS, and JavaScript (Vanilla JS)**.
This application allows students to report campus issues and enables administrators to manage, track, and resolve them efficiently.

---

## 🚀 Live Demo

https://campus-issue-reporting-system.netlify.app/login.html

---

## 📌 Features

### 👨‍🎓 Student Features

* Register & Login (Student ID / Email)
* Report new issues with details
* Upload issue description (optional image support)
* Track issue status (Pending / In Progress / Resolved)
* View personal issue history
* Earn badges & performance points
* Activity timeline tracking
* Dark / Light mode support

---

### 👨‍💼 Admin Features

* Admin secure login (with security code)
* View all reported issues
* Assign staff to issues
* Update issue status
* Manage users (view registered students)
* Export issues data (CSV)
* Notifications system
* Real-time issue updates (via localStorage sync)

---

### 💬 Chat System (Per Issue)

* Chat between **student and admin**
* Messages linked to specific issue
* Stored using localStorage
* Auto-update chat UI

---

### 🔔 Notification System

* Notifications for:

  * New issue created
  * Status updates
  * New chat messages
* Click notification → opens **specific issue directly**

---

### 🤖 AI Features (No API Used)

* Smart category suggestion based on keywords
* Priority auto-detection (Low / Medium / High)
* Description improvement suggestion
* Basic analytics insights

---

## 🧠 Tech Stack

* HTML5
* CSS3 (Modern UI / Glassmorphism / Dark Mode)
* JavaScript (Vanilla JS)
* LocalStorage (Database simulation)

---

## 📁 Project Structure

```id="1a2b3c"
/campus-issue-reporting-system
│── index.html
│── login.html
│── register.html
│── dashboard.html
│── admin.html
│── css/
│   └── style.css
│── js/
│   ├── app.js
│   ├── auth.js
│   ├── issues.js
│   ├── admin.js
│   ├── ui.js
│── images/
```

---

## ⚙️ How to Run Locally

```id="run1"
1. Download the project ZIP
2. Extract files
3. Open index.html in browser
```

---

## 🌐 Deployment

### Netlify

* Upload project folder
* Set publish directory: `/`

### Vercel

* Import GitHub repo
* Framework: **Other**
* Build command: *(leave empty)*
* Output directory: `/`

---

## ⚠️ Important Notes

* No backend used — all data stored in **localStorage**
* Data will reset if browser storage is cleared
* Image uploads must use Base64 or local assets (avoid `/upload` paths)

---

## 🧪 Testing Flow

```id="test1"
1. Register as student
2. Login as student
3. Submit issue
4. Login as admin
5. Check issue in admin panel
6. Update status / chat
7. Verify updates in student dashboard
```

---

## 🎯 Future Improvements

* Backend integration (Firebase / Node.js)
* Real-time database
* Email notifications
* Role-based access control
* Mobile app version

---

## 👤 Author

**Yasashvi Chowdary Vallepalli**
📧 [yasashvichowdaryvallepalli@gmail.com](mailto:yasashvichowdaryvallepalli@gmail.com)
📍 Andhra Pradesh, India

---

## 📜 License

This project is created for academic and demonstration purposes.

---

⭐ If you like this project, give it a star!
