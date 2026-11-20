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
| `cafe 1260 @prakriti` | Sender and Prakriti share |
| `drinks 1000 paid by Shreyash` | Shreyash paid, everyone shares |
| `dinner 2400 no rohit` | Rohit left out |
| `paragliding 1500 each` | 1500 × people sharing, flagged for a check |
| `sent 500 to aman` | Transfer: only Aman bears it |

AI reads the language. Plain code does the maths. If AI isn't available, a rule-based reader takes over and flags more for review.

## Stack

A single `index.html`: HTML, CSS and vanilla JavaScript, with JSZip from cdnjs for `.zip` exports. Fonts: Fraunces, Roboto Mono and Caveat from Google Fonts.

When it runs as a Claude artifact, it uses Claude to read chats and stores splits in the artifact's database. Anywhere else it falls back to the rule-based reader and browser storage. A hosted version needs a small backend for shareable links and an AI endpoint.

## Run locally

Open `index.html` in a browser, or serve the folder:

```
npx serve .
```
