# Sharm Go Green — Eco-Tourism & Adventure Booking Platform

A full-stack **MERN** web application built for **Sharm Go Green**, an eco-friendly desert safari and Red Sea watersports hub in **Sharm El Sheikh, Egypt**. The platform enables travelers to explore zero-emission tours, customize equipment/tent options, book online, and leave verified reviews, while giving administrators complete control over tours, bookings, and customer feedback.

---

##  Key Features

###  Traveler Experience
- **Activity Catalog & Category Filtering:** Browse 9+ eco-adventures across *Safari & Desert*, *Water Sports*, and *Eco Rides* with real-time star ratings.
- **Interactive Booking & Equipment Customization:** Select specific equipment, tent sizes, guest counts, and preferred dates with instant dynamic price calculation.
- **User Accounts & Booking History:** Secure JWT-based authentication (`Sign Up` / `Login`) allowing users to track their reservations and booking statuses (`Pending` / `Confirmed`) under *My Bookings*.
- **Customer Reviews & Ratings:** Submit and view real-time activity reviews with automatic average rating calculation.
- **Direct Contact & Maps:** One-click WhatsApp integration and direct links to Google Maps & Yandex Maps locations.

###  Admin Dashboard
- **Protected Admin Portal:** Password-authenticated management dashboard.
- **Tour & Equipment Management:** Create, edit, delete, or one-click seed all 9 signature Sharm Go Green eco-tours.
- **Booking Management:** View customer reservations, guest counts, and toggle booking statuses between *Pending* and *Confirmed*.
- **Review Moderation:** Monitor and moderate user-submitted reviews.

---

##  Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Lucide React Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JSON Web Tokens (JWT), bcryptjs |

---

##  Project Structure

```text
go-green-sharm/
├── backend/          # Express REST API, Mongoose models, auth & seeding routes
├── frontend/         # React + Vite client, AdminDashboard, ActivityDetails
├── .gitignore        # Excludes node_modules, build artifacts, and .env secrets
└── README.md         # Project documentation