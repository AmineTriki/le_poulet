# iOS Setup Guide

This guide covers everything needed to build, test, and publish Le Poulet to the iOS App Store.

---

## Prerequisites

- macOS Ventura 13+ or Sonoma 14+
- Xcode 15.3+ (download from the Mac App Store)
- An [Apple Developer account](https://developer.apple.com/programs/) ($99/year)
- [EAS CLI](https://docs.expo.dev/eas/cli/) installed globally: `npm install -g eas-cli`
- Node 20+ and pnpm 9+

---

## Step 1 — Apple Developer Account Setup

### 1.1 Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/enroll/
2. Sign in with your Apple ID
3. Select "Individual" or "Organization"
4. Pay the $99 USD annual fee
5. Wait for approval (usually instant for individuals, 2–5 days for organizations)

### 1.2 Gather your identifiers

Once enrolled, note these values — you'll need them in `eas.json`:

- **Apple ID**: your Apple account email (e.g. `amine.mahmoud.triki@gmail.com`)
- **Team ID**: found at https://developer.apple.com/account → Membership → Team ID
  (format: 10 uppercase alphanumeric characters, e.g. `AB12CD34EF`)
- **App Store Connect App ID** (ascAppId): created in Step 4 below

---

## Step 2 — Bundle Identifier

The bundle identifier for Le Poulet is `gg.lepoulet.app`. This is already set in `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "gg.lepoulet.app"
    }
  }
}
```

### Register the identifier

1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click **+** to add a new identifier
3. Select **App IDs** → Continue
4. Select **App** → Continue
5. Fill in:
   - **Description**: Le Poulet
   - **Bundle ID**: Explicit → `gg.lepoulet.app`
6. Under **Capabilities**, enable:
   - **Push Notifications** (required for game alerts)
   - **Associated Domains** (optional, for deep links)
7. Click **Continue** → **Register**

---

## Step 3 — Background Location Entitlements

Background location is required for GPS tracking during the hunt.

### 3.1 App.json configuration (already done)

The `app.json` already includes:

```json
{
  "ios": {
    "infoPlist": {
      "NSLocationAlwaysAndWhenInUseUsageDescription": "Le Poulet needs your location to show your team on the map and help you hunt the chicken.",
      "NSLocationWhenInUseUsageDescription": "Le Poulet needs your location to show your team on the map.",
      "UIBackgroundModes": ["location", "fetch"]
    }
  },
  "plugins": [
    ["expo-location", {
      "locationAlwaysAndWhenInUsePermission": "Le Poulet tracks your location for the hunt.",
      "isIosBackgroundLocationEnabled": true
    }]
  ]
}
```

### 3.2 Apple Developer entitlement

Background location requires the `com.apple.developer.location.background` entitlement which is automatically handled by `expo-location` when `isIosBackgroundLocationEnabled: true` is set.

EAS Build handles generating the entitlements file from your `app.json` configuration.

### 3.3 App Store Review guidance

When submitting, you must describe the background location use in the App Review Information:
> "Le Poulet is a city-wide game where players track each other on a map in real time. Background location is required so that players can see their teammates' positions even when the app is minimized."

---

## Step 4 — App Store Connect Setup

### 4.1 Create the app record

1. Go to https://appstoreconnect.apple.com
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: Le Poulet
   - **Primary Language**: English (or French)
   - **Bundle ID**: `gg.lepoulet.app` (select from dropdown after registration)
   - **SKU**: `le-poulet-ios` (internal reference, not shown to users)
4. Click **Create**

### 4.2 Get the App Store Connect App ID

After creating the app:
1. Go to your app → **App Information**
2. Look for **Apple ID** in the General Information section
3. Copy this number (e.g. `1234567890`)
4. Update `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "amine.mahmoud.triki@gmail.com",
        "ascAppId": "1234567890",
        "appleTeamId": "AB12CD34EF"
      }
    }
  }
}
```

---

## Step 5 — EAS Configuration

### 5.1 Log in to EAS

```bash
eas login
# Enter your Expo account credentials
```

If you don't have an Expo account: https://expo.dev/signup (free)

### 5.2 Link to project

```bash
cd apps/mobile
eas init
# Follow prompts — will create an EAS project and update app.json with projectId
```

### 5.3 Configure credentials

EAS can manage your certificates and provisioning profiles automatically:

```bash
eas credentials
# Select: iOS → Development → Manage Apple credentials
# EAS will create/update certificates in your Apple Developer account
```

For production builds, EAS handles:
- App Store distribution certificate
- App Store provisioning profile
- Push notification certificate (APNs)

---

## Step 6 — Local Development Build

To test on a real device with background location (Expo Go doesn't support background location):

```bash
cd apps/mobile

# Build development client for device
eas build --platform ios --profile development --local
# or for simulator:
eas build --platform ios --profile development
```

Install the `.ipa` file on your device via Xcode or Apple Configurator.

---

## Step 7 — TestFlight Distribution

### 7.1 Build for TestFlight

```bash
cd apps/mobile
eas build --platform ios --profile preview
```

This creates a `preview` build (internal distribution). The `eas.json` preview profile:

```json
{
  "build": {
    "preview": {
      "distribution": "internal"
    }
  }
}
```

### 7.2 Submit to TestFlight

```bash
eas submit --platform ios --profile preview
# EAS will upload to App Store Connect automatically
```

### 7.3 Invite testers

1. Go to App Store Connect → your app → **TestFlight**
2. Wait for the build to process (5–20 minutes)
3. Under **Internal Testing**, add your Apple Developer team members
4. Under **External Testing**, create a test group and add testers by email
5. External testers require a brief review by Apple (1–3 days for first submission)

---

## Step 8 — Production Build

### 8.1 Build

```bash
cd apps/mobile
eas build --platform ios --profile production
```

This uses your App Store distribution certificate and provisioning profile.

### 8.2 Submit to App Store

```bash
eas submit --platform ios --profile production
# or use the URL from the build output:
eas submit --platform ios --url https://expo.dev/artifacts/eas/...
```

### 8.3 App Store listing

Before submitting for review, complete in App Store Connect:

1. **App Information**
   - Category: Games > Family
   - Content Rights: check "This app does not contain third-party content"

2. **Pricing and Availability**
   - Price: Free
   - Availability: All territories (or select specific ones)

3. **App Privacy**
   - Location: Used while app is in use + Background use
   - Camera: Yes (for challenges)
   - Microphone: Yes (for video challenges)
   - Identifiers (User ID): Yes (player tokens)

4. **Version Information**
   - Screenshots: required for 6.7" iPhone (iPhone 15 Pro Max) and 5.5" (iPhone 8 Plus)
   - App Preview: optional but recommended
   - Description: see below
   - Keywords: chicken, hunt, game, montreal, gps, city, friends, bar
   - Support URL: https://lepoulet.gg/support
   - Privacy Policy URL: https://lepoulet.gg/privacy

### App Store description (English)

```
Le Poulet — The ultimate city-wide chicken hunt.

One player hides at a bar somewhere in the city. You have to find them.

HOW IT PLAYS:
• The Chicken gets a 30-minute head start to find the perfect hiding spot at any bar in the city
• Teams use GPS tracking, a shrinking zone circle, and their instincts to close in
• Complete photo and video challenges along the way to earn points and chaos weapons
• First team to find the Chicken wins — but everyone earns points for challenges

FEATURES:
• Real-time GPS tracking with live map
• Shrinking zone circle that narrows every 15 minutes
• 60+ photo and video challenges
• 6 chaos weapons: spy, air strike, decoy, booby trap, steal, silence
• Bilingual: English and French
• Works in Montreal, Paris, London, New York, and Tunis
• Completely free — no ads, no purchases

Made for groups of 6–30 players. Best played on a Friday or Saturday night.
```

---

## Step 9 — App Store Submission Checklist

Complete every item before submitting for review:

- [ ] App tested on physical device (not just simulator)
- [ ] Background location tested — GPS updates received when app is backgrounded
- [ ] Push notifications tested — alerts received for circle shrink and chicken found
- [ ] Camera challenge tested — photo captured and submitted successfully
- [ ] Game flow tested end-to-end: create → join → lobby → start → hunt → find → results
- [ ] Both English and French language flows tested
- [ ] All 6 weapons tested
- [ ] App does not crash on cold launch
- [ ] App handles no network gracefully (error messages, not blank screens)
- [ ] Screenshots prepared for 6.7" and 5.5" displays
- [ ] App description written and reviewed
- [ ] Privacy policy live at the URL provided
- [ ] Support URL live and responsive
- [ ] App Privacy section completed in App Store Connect
- [ ] `eas.json` updated with correct `ascAppId` and `appleTeamId`
- [ ] Production build tested via TestFlight with at least 5 external testers
- [ ] Bundle version incremented from previous submission
- [ ] `app.json` `buildNumber` incremented

---

## Troubleshooting

### "Missing Push Notification Entitlement"
Run `eas credentials` and ensure APNs credentials are configured for the production profile.

### "Location updates not received in background"
Verify `UIBackgroundModes` includes `"location"` in the built app's `Info.plist`. Check via:
```bash
# Extract and inspect the built IPA
unzip -o /path/to/app.ipa -d /tmp/extracted
cat /tmp/extracted/Payload/LePoulet.app/Info.plist | grep -A2 UIBackgroundModes
```

### "EAS build fails with 'No bundle identifier'"
Ensure `app.json` has `ios.bundleIdentifier` set and matches the registered identifier in your Apple Developer account.

### "Build takes too long"
EAS builds run on Expo's infrastructure. Add `--local` flag to build on your Mac if you have Xcode installed. Local builds are faster but require macOS.

### "Cannot find module 'expo-device' in push notification hook"
Install the missing package:
```bash
cd apps/mobile
npx expo install expo-device
```
