
/**
 * FIREBASE CLOUD FUNCTION: Google Sheets & Access Code Integration
 * 
 * This function triggers automatically when a new registration is submitted.
 * It generates a unique 6-digit code and logs the business details to Google Sheets.
 * 
 * Setup Instructions:
 * 1. Create a Google Sheet and copy its ID from the URL.
 * 2. Create a Google Service Account in Google Cloud Console.
 * 3. Share your Google Sheet with the Service Account email (Editor permissions).
 * 4. Place your service account JSON file in the functions folder as `service-account.json`.
 * 5. Set the Sheet ID in Firebase config: `firebase functions:config:set sheets.id="YOUR_SHEET_ID_HERE"`
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

admin.initializeApp();

const db = admin.firestore();

// Load Credentials
const creds = require("./service-account.json");
const SHEET_ID = functions.config().sheets.id;

export const onNewRegistration = functions.firestore
  .document("PendingRequests/{requestId}")
  .onCreate(async (snapshot, context) => {
    const data = snapshot.data();
    if (!data) return null;

    // 1. Generate unique 6-digit Access Code
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      // 2. Update the Request with the generated code
      await snapshot.ref.update({
        status: "Approved",
        accessCode: accessCode,
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Create entry in AuthorizedUsers for login verification
      await db.collection("AuthorizedUsers").doc(context.params.requestId).set({
        firmName: data.firmName,
        phone: data.phone,
        gst: data.gst,
        accessCode: accessCode,
        authorizedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Append to Google Sheets (Admin Dashboard)
      const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
      await doc.loadInfo();
      
      // Ensure the first sheet has these headers: 
      // Firm Name, GST, Phone, Access Code, Status, Timestamp
      const sheet = doc.sheetsByIndex[0];

      await sheet.addRow({
        "Firm Name": data.firmName,
        "GST": data.gst,
        "Phone": data.phone,
        "Access Code": accessCode,
        "Status": "Approved",
        "Timestamp": new Date().toISOString(),
      });

      console.log(`Successfully logged registration for: ${data.firmName}`);
    } catch (error) {
      console.error("Cloud Function Error:", error);
    }

    return null;
  });
