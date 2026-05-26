import {
  collection,
  addDoc,
  updateDoc,
  setDoc,
  doc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";

// ==========================================
// 1. TypeScript Interfaces & Data Models
// ==========================================

export type UserRole = "superadmin" | "admin";

export interface UserProfile {
  id?: string;
  email: string;
  role: UserRole;
}

export interface Donation {
  id?: string;
  receiptId?: string;
  donorName?: string;
  amount: number;
  date: Date;
  trxId?: string;
  paymentMethod: "cash" | "bkash" | "nagad" | "bank" | "rocket" | "upay";
  category: string; // Standardized Keys: "jumma_collection", "general_fund", "mosque_development"
  isAnonymous: boolean;
  status: "pending" | "approved" | "rejected";
}

export interface SystemSettings {
  presidentSignatureUrl: string | null;
  treasurerSignatureUrl: string | null;
}

export interface Expense {
  id?: string;
  category: string; // Standardized Keys: "salary", "utilities", "maintenance", "miscellaneous"
  amount: number;
  date: Date;
  description: string;
  voucherUrl?: string | null;
}

export interface Notice {
  id?: string;
  title: string;
  content: string;
  date: Date;
}

export interface AuditLog {
  id?: string;
  adminEmail: string;
  actionType: "approve" | "create" | "update" | "delete" | "reject";
  collectionName: "donations" | "expenses" | "notices";
  details: string;
  timestamp: Date;
}

// ==========================================
// 2. Helper Functions
// ==========================================

/**
 * Generates a unique 6-character uppercase alphanumeric Receipt ID (e.g. REC-A7B8C9)
 */
export function generateReceiptId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `REC-${result}`;
}

/**
 * Safely converts a Firestore Timestamp (or any date representation) to a standard JS Date.
 * Essential for Next.js SSR serialization to prevent hydration errors.
 */
export function toDate(dateVal: any): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal.toDate === "function") return dateVal.toDate();
  if (dateVal.seconds) return new Timestamp(dateVal.seconds, dateVal.nanoseconds).toDate();
  return new Date(dateVal);
}

/**
 * Converts a Firestore Document Snapshot into a typed object with standard JS Dates.
 */
function mapDonationDoc(doc: QueryDocumentSnapshot<DocumentData>): Donation {
  const data = doc.data();
  return {
    id: doc.id,
    receiptId: data.receiptId || `REC-${doc.id.substring(0, 6).toUpperCase()}`,
    donorName: data.donorName,
    amount: Number(data.amount) || 0,
    date: toDate(data.date),
    trxId: data.trxId,
    paymentMethod: data.paymentMethod,
    category: data.category || "general_fund",
    isAnonymous: !!data.isAnonymous,
    status: data.status || "pending",
  };
}

function mapExpenseDoc(doc: QueryDocumentSnapshot<DocumentData>): Expense {
  const data = doc.data();
  return {
    id: doc.id,
    category: data.category || "miscellaneous",
    amount: Number(data.amount) || 0,
    date: toDate(data.date),
    description: data.description || "",
    voucherUrl: data.voucherUrl || null,
  };
}

function mapNoticeDoc(doc: QueryDocumentSnapshot<DocumentData>): Notice {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || "",
    content: data.content || "",
    date: toDate(data.date),
  };
}

// ==========================================
// 3. User & Authentication Utilities
// ==========================================

export async function setUserProfile(email: string, role: UserRole): Promise<void> {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("email", "==", email.toLowerCase()));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const userDocId = snapshot.docs[0].id;
    await updateDoc(doc(db, "users", userDocId), { role });
  } else {
    await addDoc(usersCollection, {
      email: email.toLowerCase(),
      role,
    });
  }
}

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  const usersCollection = collection(db, "users");
  const q = query(usersCollection, where("email", "==", email.toLowerCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  return {
    id: snapshot.docs[0].id,
    email: data.email,
    role: data.role as UserRole,
  };
}

// ==========================================
// 4. Audit Log Utilities
// ==========================================

/**
 * Creates an accountability audit log in the database.
 */
export async function addAuditLog(log: Omit<AuditLog, "id" | "timestamp">): Promise<string> {
  const auditLogsCol = collection(db, "auditLogs");
  const docRef = await addDoc(auditLogsCol, {
    ...log,
    timestamp: new Date(),
  });
  return docRef.id;
}

/**
 * Fetches all audit logs, sorted chronologically descending.
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  const auditLogsCol = collection(db, "auditLogs");
  const snapshot = await getDocs(auditLogsCol);
  const mapped = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      adminEmail: d.adminEmail || "Unknown Admin",
      actionType: d.actionType as any,
      collectionName: d.collectionName as any,
      details: d.details || "",
      timestamp: toDate(d.timestamp),
    };
  });
  return mapped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ==========================================
// 5. Firebase Storage Utilities
// ==========================================

/**
 * Uploads a voucher image directly to Firebase Storage and returns the downloadURL.
 * Wraps uploadBytes inside a robust 12-second timeout to prevent UI hangs.
 */
export async function uploadVoucherImage(file: File): Promise<string> {
  try {
    const fileRef = ref(storage, `vouchers/${Date.now()}_${file.name}`);
    
    const uploadPromise = uploadBytes(fileRef, file);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Firebase Storage Upload Timeout (12s limit reached)")), 12000)
    );

    const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.error("Firebase Storage upload failed or timed out:", error);
    throw error;
  }
}

// ==========================================
// 6. Donation Utilities (CRUD with Accountability)
// ==========================================

export async function addDonation(
  donation: Omit<Donation, "id" | "status" | "date"> & { date?: Date; status?: "pending" | "approved" | "rejected"; receiptId?: string },
  adminEmail?: string
): Promise<string> {
  const donationsCollection = collection(db, "donations");
  const status = donation.status || "pending";
  const receiptId = donation.receiptId || generateReceiptId();
  const docRef = await addDoc(donationsCollection, {
    ...donation,
    receiptId,
    status,
    date: donation.date || new Date(),
  });

  if (adminEmail) {
    await addAuditLog({
      adminEmail,
      actionType: "create",
      collectionName: "donations",
      details: `Logged manual Cash donation of ৳${donation.amount} from ${donation.donorName || "Anonymous"} (${donation.category})`,
    });
  }
  return docRef.id;
}

export async function approveDonation(donationId: string, adminEmail: string): Promise<void> {
  const docRef = doc(db, "donations", donationId);
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();
  const amount = data ? Number(data.amount) || 0 : 0;
  const donor = data ? (data.isAnonymous ? "Anonymous" : data.donorName || "Anonymous") : "Unknown";

  await updateDoc(docRef, {
    status: "approved",
  });

  await addAuditLog({
    adminEmail,
    actionType: "approve",
    collectionName: "donations",
    details: `Approved donation claim of ৳${amount} by ${donor}`,
  });
}

export async function rejectDonation(donationId: string, adminEmail: string): Promise<void> {
  const docRef = doc(db, "donations", donationId);
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();
  const amount = data ? Number(data.amount) || 0 : 0;
  const donor = data ? (data.isAnonymous ? "Anonymous" : data.donorName || "Anonymous") : "Unknown";

  await updateDoc(docRef, {
    status: "rejected",
  });

  await addAuditLog({
    adminEmail,
    actionType: "reject",
    collectionName: "donations",
    details: `Rejected donation claim of ৳${amount} by ${donor} (Soft deleted into Rejected Logs)`,
  });
}

export async function updateDonation(donationId: string, donation: Partial<Donation>, adminEmail: string): Promise<void> {
  const docRef = doc(db, "donations", donationId);
  const snapshot = await getDoc(docRef);
  const oldData = snapshot.data();

  const updateData = { ...donation };
  delete updateData.id;

  await updateDoc(docRef, updateData);

  await addAuditLog({
    adminEmail,
    actionType: "update",
    collectionName: "donations",
    details: `Updated donation record: Amount: ৳${oldData?.amount || 0} -> ৳${donation.amount || oldData?.amount || 0}, Donor: "${oldData?.donorName || "Anonymous"}" -> "${donation.donorName || oldData?.donorName || "Anonymous"}"`,
  });
}

export async function deleteDonation(donationId: string, adminEmail: string): Promise<void> {
  const docRef = doc(db, "donations", donationId);
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();

  await deleteDoc(docRef);

  await addAuditLog({
    adminEmail,
    actionType: "delete",
    collectionName: "donations",
    details: `Deleted donation record of ৳${data?.amount || 0} by "${data?.isAnonymous ? "Anonymous" : data?.donorName || "Anonymous"}"`,
  });
}

export async function getDonations(status?: "pending" | "approved" | "rejected"): Promise<Donation[]> {
  const donationsCollection = collection(db, "donations");
  let q = query(donationsCollection);

  if (status) {
    q = query(donationsCollection, where("status", "==", status));
  }

  const snapshot = await getDocs(q);
  const mapped = snapshot.docs.map(mapDonationDoc);
  return mapped.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ==========================================
// 7. Expense Utilities (CRUD with Accountability)
// ==========================================

export async function addExpense(expense: Omit<Expense, "id" | "date"> & { date?: Date }, adminEmail: string): Promise<string> {
  const expensesCollection = collection(db, "expenses");
  const docRef = await addDoc(expensesCollection, {
    ...expense,
    date: expense.date || new Date(),
  });

  await addAuditLog({
    adminEmail,
    actionType: "create",
    collectionName: "expenses",
    details: `Recorded expense of ৳${expense.amount} under category "${expense.category}" - "${expense.description}"`,
  });
  return docRef.id;
}

export async function updateExpense(expenseId: string, expense: Partial<Expense>, adminEmail: string): Promise<void> {
  const docRef = doc(db, "expenses", expenseId);
  const snapshot = await getDoc(docRef);
  const oldData = snapshot.data();

  const updateData = { ...expense };
  delete updateData.id;

  await updateDoc(docRef, updateData);

  await addAuditLog({
    adminEmail,
    actionType: "update",
    collectionName: "expenses",
    details: `Updated expense: Amount: ৳${oldData?.amount || 0} -> ৳${expense.amount || oldData?.amount || 0}, Details: "${oldData?.description || ""}" -> "${expense.description || oldData?.description || ""}"`,
  });
}

export async function deleteExpense(expenseId: string, adminEmail: string): Promise<void> {
  const docRef = doc(db, "expenses", expenseId);
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();

  await deleteDoc(docRef);

  await addAuditLog({
    adminEmail,
    actionType: "delete",
    collectionName: "expenses",
    details: `Deleted expense record of ৳${data?.amount || 0} ("${data?.description || ""}")`,
  });
}

export async function getExpenses(): Promise<Expense[]> {
  const expensesCollection = collection(db, "expenses");
  const q = query(expensesCollection);
  const snapshot = await getDocs(q);
  const mapped = snapshot.docs.map(mapExpenseDoc);
  return mapped.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ==========================================
// 8. Notice Board Utilities (CRUD with Accountability)
// ==========================================

export async function addNotice(notice: Omit<Notice, "id" | "date"> & { date?: Date }, adminEmail: string): Promise<string> {
  const noticesCollection = collection(db, "notices");
  const docRef = await addDoc(noticesCollection, {
    ...notice,
    date: notice.date || new Date(),
  });

  await addAuditLog({
    adminEmail,
    actionType: "create",
    collectionName: "notices",
    details: `Published notice: "${notice.title}"`,
  });
  return docRef.id;
}

export async function updateNotice(noticeId: string, notice: Partial<Notice>, adminEmail: string): Promise<void> {
  const docRef = doc(db, "notices", noticeId);
  const snapshot = await getDoc(docRef);
  const oldData = snapshot.data();

  const updateData = { ...notice };
  delete updateData.id;

  await updateDoc(docRef, updateData);

  await addAuditLog({
    adminEmail,
    actionType: "update",
    collectionName: "notices",
    details: `Updated notice: Title: "${oldData?.title || ""}" -> "${notice.title || oldData?.title || ""}"`,
  });
}

export async function deleteNotice(noticeId: string, adminEmail: string): Promise<void> {
  const docRef = doc(db, "notices", noticeId);
  const snapshot = await getDoc(docRef);
  const data = snapshot.data();

  await deleteDoc(docRef);

  await addAuditLog({
    adminEmail,
    actionType: "delete",
    collectionName: "notices",
    details: `Deleted notice: "${data?.title || ""}"`,
  });
}

export async function getNotices(): Promise<Notice[]> {
  const noticesCollection = collection(db, "notices");
  const q = query(noticesCollection);
  const snapshot = await getDocs(q);
  const mapped = snapshot.docs.map(mapNoticeDoc);
  return mapped.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ==========================================
// 9. Aggregated Dashboard Stats (Analytics)
// ==========================================

export interface CategorySummary {
  [category: string]: number;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeByCategory: CategorySummary;
  expenseByCategory: CategorySummary;
}

export async function getDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
  const donationsCollection = collection(db, "donations");
  const expensesCollection = collection(db, "expenses");

  const donationsQuery = query(donationsCollection, where("status", "==", "approved"));
  const expensesQuery = query(expensesCollection);

  const [donationsSnapshot, expensesSnapshot] = await Promise.all([
    getDocs(donationsQuery),
    getDocs(expensesQuery),
  ]);

  let totalIncome = 0;
  const incomeByCategory: CategorySummary = {};

  donationsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const amount = Number(data.amount) || 0;
    const category = data.category || "general_fund";
    const date = toDate(data.date);

    if (startDate && date < startDate) return;
    if (endDate && date > endDate) return;

    totalIncome += amount;
    incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
  });

  let totalExpenses = 0;
  const expenseByCategory: CategorySummary = {};

  expensesSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const amount = Number(data.amount) || 0;
    const category = data.category || "miscellaneous";
    const date = toDate(data.date);

    if (startDate && date < startDate) return;
    if (endDate && date > endDate) return;

    totalExpenses += amount;
    expenseByCategory[category] = (expenseByCategory[category] || 0) + amount;
  });

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    incomeByCategory,
    expenseByCategory,
  };
}

// ==========================================
// 10. Global System Settings Utilities
// ==========================================

/**
 * Fetches the global settings document.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const docRef = doc(db, "settings", "global");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        presidentSignatureUrl: data.presidentSignatureUrl || null,
        treasurerSignatureUrl: data.treasurerSignatureUrl || null,
      };
    }
    return {
      presidentSignatureUrl: null,
      treasurerSignatureUrl: null,
    };
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return {
      presidentSignatureUrl: null,
      treasurerSignatureUrl: null,
    };
  }
}

/**
 * Updates the global settings document. Creates it if it doesn't exist.
 */
export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  const docRef = doc(db, "settings", "global");
  await setDoc(docRef, settings, { merge: true });
}
