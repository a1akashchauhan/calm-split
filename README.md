# CalmSplit

The calmest way to settle your group expenses.

CalmSplit is for the friend who always ends up doing the hisaab after a trip. Export the trip's WhatsApp group chat and drop it in. CalmSplit reads every spend (who paid, how much, who was in), lets you check and fix it, then works out who pays whom with the fewest payments. You can also start fresh and enter spends yourself.

No sign-up, no app download.

## How it works

1. The group chats as usual: `petrol 2770`, `dinner 2400 no rohit`, `sent 500 to aman`.
2. Export the chat on your phone (⋮ → More → Export chat → Without media) and upload the `.txt` or `.zip`.
3. AI fills in the dashboard. Untick anyone who wasn't in, press **Calculate and save**, and share the link.

## Reading rules

| Message | How it's read |
| --- | --- |
| `petrol 2770` | Sender paid, everyone shares |
| `cafe 1260 @shreyash` | Sender and Shreyash share |
| `drinks 1000 paid by Shreyash` | Shreyash paid, everyone shares |
| `dinner 2400 no rohit` | Rohit left out |
| `paragliding 1500 each` | 1500 × people sharing, flagged for a check |
| `sent 500 to aman` | Transfer: only Aman bears it |

AI reads the language. Plain code does the maths. If AI isn't available, a rule-based reader takes over and flags more for review.

## Shareable links

On the web, **Calculate and save** stores the split and gives it a link like `calmsplit.vercel.app/s/Ab3dEf7hJk2m`. Anyone with the link can open the same dashboard, fix entries and save again. No sign-up.

- Splits are stored in Upstash Redis for a year after their last save.
- Saves use a version check: if someone saved while you were editing, you choose between loading their version or saving yours over it.
- Each save is logged with the editor's name.

### Set it up on Vercel

1. Import this repo in Vercel. No build settings are needed.
2. In the project, open **Storage** (or the Marketplace), add **Upstash for Redis**, and connect it to the project. It adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`), and the API reads either.
3. Redeploy.

API: `POST /api/splits` creates a split, `GET /api/splits/:id` reads it, `PUT /api/splits/:id` with `baseVersion` saves it.

## Stack

A single `index.html` (HTML, CSS and vanilla JavaScript, with JSZip from cdnjs for `.zip` exports) plus two small Vercel functions in `api/`. Fonts: Fraunces, Roboto Mono and Caveat from Google Fonts.

When it runs as a Claude artifact, it uses Claude to read chats and stores splits in the artifact's database. On the web it saves through the API above and reads chats with the rule-based reader. An AI endpoint for the web version is next.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```
