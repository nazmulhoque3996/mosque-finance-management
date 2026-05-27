import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, email, newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    let targetUid = uid;

    // Look up UID by email if UID was not explicitly passed or is passed as email
    if (!targetUid && email) {
      const userRecord = await admin.auth().getUserByEmail(email);
      targetUid = userRecord.uid;
    } else if (targetUid && targetUid.includes("@")) {
      const userRecord = await admin.auth().getUserByEmail(targetUid);
      targetUid = userRecord.uid;
    }

    if (!targetUid) {
      return NextResponse.json(
        { error: "A valid UID or email is required to identify the target admin." },
        { status: 400 }
      );
    }

    // Force update the Auth password using Firebase Admin SDK
    await admin.auth().updateUser(targetUid, { password: newPassword });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating user password via Firebase Admin:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update target administrator password." },
      { status: 500 }
    );
  }
}
