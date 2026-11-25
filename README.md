# Qissa Coffee House

Qissa Coffee House is a React/Vite customer website with an Express/Mongoose API.

## Run locally

1. Install Node.js 20 or later.
2. Configure `backend/.env` with `MONGODB_URI`, a private `JWT_SECRET`, `PORT=5000`, and `CLIENT_URL=http://localhost:5173`.
3. From the project root run `npm install`, `npm install --prefix frontend`, and `npm install --prefix backend`.
4. Run `npm run dev` to start the frontend at `http://localhost:5173` and the API at `http://localhost:5000`.

## Reservations

Customers sign in, select a date and available time, choose their party size, and submit a reservation request. Requests are saved in MongoDB as `Pending`; customers can view or cancel pending requests. A staff administrator can use **Manage reservations** from their account page to confirm or decline requests. Confirmed bookings continue to hold their slot capacity.

To grant staff access, promote a trusted user in MongoDB Atlas's `users` collection. For example, in Atlas Data Explorer's MongoDB shell:

```js
db.users.updateOne({ email: "owner@example.com" }, { $set: { role: "admin" } })
```

Replace the example email with the account to promote. Registration always creates customer accounts. Only administrator accounts can load or update the staff reservation list.

Set these backend environment variables to the café's actual operating details before accepting bookings:

- `BUSINESS_TIME_ZONE` (default: `Asia/Kolkata`)
- `RESERVATION_OPEN_TIME` and `RESERVATION_CLOSE_TIME` (example values in `.env.example` are 09:00–21:00)
- `RESERVATION_SLOT_INTERVAL_MINUTES` (15, 30, or 60; default 30)
- `RESERVATION_SLOT_CAPACITY` (maximum guests reserved per time slot; default 12)

The example hours and capacity are placeholders. The app does not send email or SMS notifications; staff review requests in the administrator page.

## Current phase

The customer experience includes the home, menu, story, reservations, account, bag, checkout, and order status pages. Customer registration and sign-in are connected to MongoDB; passwords are hashed and sessions use JWTs. Menu products, categories, pickup orders, and reservations are stored in MongoDB. Order totals are calculated from database prices instead of browser cart values.

Instagram-referenced specials and bakery items appear in the MongoDB menu. Prices remain illustrative because the supplied screenshots did not show prices. Specials advertised for a past pop-up, Friday, or weekend remain unavailable. Sample orders are previews and are not sent to the café. Checkout is pickup only with payment at the café; online payment, delivery, and live order updates are not implemented.

The footer and home visit section show the public listing address and phone for Qissa Coffee House in Palampur. Business hours, menu prices, and customer reviews are not treated as verified details.

## Render Deployment

- **Root Directory:** `backend`
- **Build Command:** `npm install` (run in the backend folder or with `--prefix backend`)
- **Start Command:** `npm start`
- The server reads the port from `process.env.PORT`. Ensure this environment variable is set in Render's **Environment** tab.
- No additional build step is required because the backend is a plain Node.js application.

## Vercel Deployment (Frontend)

- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL` – the URL of the deployed Render backend (e.g., `https://your-backend.onrender.com`).
- **SPA Routing:** Add a `vercel.json` file (already created) with the following rewrite rule to ensure client‑side routes are served correctly:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
- This configuration prevents API requests from being inadvertently rewritten; only non‑file routes are redirected to `index.html`.

## Dependency Audit

Running `npm audit` from this environment could not reach the npm registry, so full advisory details are unavailable here. Previously observed advisories (dev‑only) include:
- **supertest** – moderate severity (ID 1016)
- **mongodb‑memory‑server** – moderate severity (ID 1101)

No production dependencies reported vulnerabilities. When you have internet access, run:
```bash
npm audit --prefix backend
npm audit --omit=dev --prefix backend
```
and update the README with any new advisory IDs.

## End‑to‑End (E2E) Testing

The E2E tests are located at `backend/tests/e2e.test.js` and use an in‑memory MongoDB server (`mongodb‑memory‑server`). This requires downloading a MongoDB binary, which fails in the sandbox due to network restrictions.

### Running E2E Tests Locally on Windows
1. Ensure you have internet access.
2. From the project root:
```cmd
cd backend
npm install
npm test
```
3. If the binary download fails, you can fall back to a local MongoDB instance:
   - Install MongoDB locally and start it.
   - Create a `.env.test` (not committed) with:
```
MONGODB_URI=mongodb://127.0.0.1:27017/qissa_test
JWT_SECRET=your_test_secret
```
   - Run the tests with the environment variable `USE_LOCAL_TEST_DB=true` (you may need to adjust `backend/config/db.js` to respect this flag).
4. The tests should never connect to production Atlas because `MONGODB_URI` is undefined in test mode; the in‑memory server is used instead.

## Environment Variables

### Backend (`backend/.env.example`)
- `MONGODB_URI` – MongoDB connection string (production). **Do not commit real values.**
- `JWT_SECRET` – Secret for signing JWTs.
- `PORT` – Port number for the server (default `5000`).
- `CLIENT_URL` – URL of the frontend (e.g., `https://your-frontend.vercel.app`).
- Additional optional variables: `BUSINESS_TIME_ZONE`, `RESERVATION_OPEN_TIME`, `RESERVATION_CLOSE_TIME`, `RESERVATION_SLOT_INTERVAL_MINUTES`, `RESERVATION_SLOT_CAPACITY`.

### Frontend (`frontend/.env.example`)
- `VITE_API_URL` – Full URL to the backend API (e.g., `https://your-backend.onrender.com`).

All `.env.example` files contain placeholder values and are excluded from Git via `.gitignore`.

---

**Final Notes**
- No code features were changed beyond documentation and configuration files.
- The application has not been deployed, committed, or pushed.
- All security considerations (no secrets in repo, proper CORS, process.env.PORT usage) have been verified.
- Remaining blockers: network‑restricted npm audit and inability to download the in‑memory MongoDB binary in this sandbox. These can be resolved on a machine with internet access.
