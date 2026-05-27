import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export const dynamic = 'force-dynamic';

function getAdminApp() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin SDK environment configuration variables.");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return admin;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { uid, newPassword } = body;

    if (!uid || !newPassword) {
      return NextResponse.json({ error: 'Missing uid or newPassword' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const firebaseAdmin = getAdminApp();

    let targetUid = uid;
    // If the provided uid is an email address, resolve the actual Auth UID first
    if (uid.includes('@')) {
      try {
        const userRecord = await firebaseAdmin.auth().getUserByEmail(uid);
        targetUid = userRecord.uid;
      } catch (err: any) {
        return NextResponse.json({ error: `User with email ${uid} not found: ${err.message}` }, { status: 404 });
      }
    }

    await firebaseAdmin.auth().updateUser(targetUid, { password: newPassword });
    return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error("Error force-updating password via admin SDK:", error);
    return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
  }
}
