# Nordic Botanical

A full-stack-ready Nordic plant marketplace and price-comparison interface built with React, Vite, Tailwind CSS and Base44.

## Included features

- Premium Scandinavian homepage
- Plant search and price comparison
- AI plant identification interface
- Plant marketplace and deals
- Auctions, bids and checkout pages
- Buyer and seller dashboards
- Admin dashboard and product management
- Seller directory and profiles
- Wishlists, alerts and price history
- SEO plant pages and blog
- Base44 entity definitions for products, auctions, users, orders and scraping workflows

## Run locally

1. Install Node.js 20 or newer.
2. Extract this project.
3. Open a terminal in the project folder.
4. Run:

```bash
npm install
npm run dev
```

Then open the local address shown by Vite, normally `http://localhost:5173`.

## Base44 configuration

Create `.env.local` in the project root:

```env
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=https://your-app.base44.app
```

Without a connected Base44 backend, static public pages can be reviewed, but login, live product data, AI processing, bidding and payments require backend configuration.

## Production requirements

Before launch, configure:

- Base44 or another secure backend
- Product data feeds or permitted scraper jobs
- Stripe payment keys and webhook processing
- Image storage
- Email notifications
- Seller verification workflow
- Legal pages, privacy policy and marketplace terms

## Main routes

- `/` homepage
- `/price-comparison` price comparison
- `/identify` AI plant identifier
- `/plants` plant database
- `/auctions` auctions
- `/dashboard` buyer dashboard
- `/seller/register` seller registration
- `/admin` admin dashboard
- `/products-admin` product management
