# Apple Store Submission & Compliance Document

This document outlines the design decisions and compliance measures for **Line Reveal**, ensuring it meets the rigorous standards of the App Store for the US market.

---

## 1. App Identity & Localization
- **App Name**: Line Reveal
- **Primary Language**: English (EN-US)
- **Target Market**: United States
- **Localization**: All UI elements, system dialogs, and game text have been fully localized to English to ensure a native experience for American users.

## 2. Content Rating (17+ Mature)
- **Adult Content Notice**: The application contains suggestive/artistic mature imagery integrated into its core "reveal" puzzle mechanics.
- **Compliance**: The app must be submitted with a **17+ Age Rating** (Infrequent/Mild Sexual Content and Nudity) in App Store Connect.
- **Safety**: No illicit or illegal explicit content is included; images are curated for an adult artistic puzzle experience.

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
**Developer Note**: Please use the "Mature/17+" category when configuring the Store Listing in App Store Connect.
