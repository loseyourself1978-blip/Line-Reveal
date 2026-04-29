# Apple Store Submission & Compliance Document

This document outlines the design decisions and compliance measures for **Line Reveal**, ensuring it meets the rigorous standards of the App Store for the US market.

---

## 1. App Identity & Localization
- **App Name**: Line Reveal
- **Primary Language**: English (EN-US)
- **Target Market**: United States
- **Localization**: All UI elements, system dialogs, and game text have been fully localized to English to ensure a native experience for American users.

## 2. Content Rating (9+)

- **Content Rating Notice**: The application has been rated **9+** (Infrequent/Mild Cartoon or Fantasy Violence) in App Store Connect.
- **Compliance**: Age rating updated in v1.5.0 to align with the new Pinball Reveal mode, which includes mild arcade-style brick-breaking gameplay. The artistic imagery remains curated and appropriate for general audiences.
- **Safety**: No explicit violence, sexual content, or mature themes. Brick-breaking is cartoon-style with no graphic depictions.

## 3. Originality & Anti-Spam (4.3 Repetitive Content)
- **Innovative Mechanics**: Unlike generic "reveal" games, *Line Reveal* utilizes a **custom Sobel Edge Detection algorithm** to generate real-time silhouettes from images. This is a unique technical implementation.
- **Original Codebase**: The project is built from scratch using React, TypeScript, and Capacitor. It does not use "repackaged" frameworks or shared templates that often trigger the 4.3 Spam rejection.
- **Unique Assets**: All level configurations and UI layouts are custom-designed for this specific title.

## 4. Technical Compliance
- **Export Compliance (ITSAppUsesNonExemptEncryption)**: The app has been declared as **NOT** using non-exempt encryption in the `Info.plist`. This streamlines the US export regulation review.
- **Permissions**: The app uses native Capacitor APIs (@capacitor/share) for image saving to ensure system stability and user privacy compliance.
- **Dynamic Island Optimization**: The HUD is specifically offset (`pt-16`) to provide a clean layout on modern iPhone models (14 Pro, 15, 16) without overlapping the Dynamic Island or notch.

## 5. Independent Development Declaration
- This app is developed independently. It is not a clone or a "white-label" version of another product. All logic for area-splitting, spirit behavior, and rendering is proprietary to the *Line Reveal* project.

---
**Developer Note**: Please use the **"Ages 9+"** category when configuring the Store Listing in App Store Connect. v1.5.0+ requires 9+ rating to accommodate the arcade-style Pinball Reveal mode.
