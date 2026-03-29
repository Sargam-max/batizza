# FoodReel - Full Stack Food Delivery App

## Overview
FoodReel is a comprehensive food delivery application that connects users with local restaurants. It offers an easy-to-use interface for browsing menus, placing orders, and tracking deliveries.

## Features
- **User Authentication**: Secure login and registration process for users.
- **Restaurant Listings**: A variety of restaurants with real-time menu updates.
- **Order Management**: Add items to cart, checkout, and payment processing.
- **Tracking**: Track orders from preparation to delivery.
- **Review System**: Rate and review restaurants and dishes.
- **Admin Dashboard**: For restaurant owners to manage their listings and orders.

## Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sargam-max/batizza.git
   cd batizza
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Database Setup**:
   - Create a `.env` file based on `.env.example`.
   - Set up the database according to the schema in `db/schema.sql`.
4. **Run Migrations**:
   ```bash
   npm run migrate
   ```

## Running in Development
1. Start the server:
   ```bash
   npm run dev
   ```
2. Open your browser and go to `http://localhost:3000`.

## Running in Production
1. Build the application:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm start
   ```

## API Reference
- **GET /api/restaurants**: List all restaurants
- **POST /api/orders**: Place a new order
- **GET /api/orders/:id**: Get order details

## Database Schema
- **Users**: `id`, `username`, `password`, `email`
- **Restaurants**: `id`, `name`, `menu`, `location`
- **Orders**: `id`, `user_id`, `restaurant_id`, `status`

## File Structure
```
batizza/
│
├── src/
│   ├── components/
│   ├── api/
│   ├── pages/
│   └── styles/
├── db/
│   └── schema.sql
├── .env.example
└── README.md
```

## Troubleshooting
- If you encounter issues during setup, ensure that all dependencies are installed and the database is correctly set up.
- Check console logs for any runtime errors.

## Contribution Guidelines
- Fork the repository and create a new branch (e.g., `feature-xyz`).
- Make your changes and submit a pull request.

Feel free to reach out if you have any questions!
