# Installing Le Poulet on Your iPhone (Beta)

No App Store. No TestFlight wait. Direct install in 3 steps.

---

## Step 1 — Register your device (one time only)

Open this link **on your iPhone in Safari** (not Chrome):

> **[DEVICE_REGISTRATION_URL]**
> *(Amine will share this link before you start)*

Follow the prompts. This registers your iPhone with our developer account.
Takes about 30 seconds.

---

## Step 2 — Install the app

After your device is registered, open this link **on your iPhone in Safari**:

> **[INSTALL_URL]**
> *(Amine will share this after your device is registered)*

Tap **"Install"** when prompted.

---

## Step 3 — Trust the developer certificate

Go to: **Settings → General → VPN & Device Management**

Tap the certificate under **"Developer App"** → tap **"Trust"**

---

## You're in. BWAK. 🐔

The app will appear on your home screen. Open it, join a game with your 6-letter code, and hunt.

---

## For Amine — How to add a new tester

```bash
# 1. Generate device registration link
npx eas-cli device:create

# 2. Send the link to your friend — they open it on their iPhone in Safari

# 3. After they register, resign the existing build (no full rebuild needed)
npx eas-cli build:resign --platform ios --profile preview

# 4. The new install URL is printed — share it with them
```

**Limits:** Up to 100 devices per year on a paid Apple Developer account.
