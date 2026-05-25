import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

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
  donorName?: string;
  amount: number;
  date: Date;
  trxId?: string;
  paymentMethod: "cash" | "bkash" | "nagad" | "bank" | "rocket" | "upay";
  category: string;
  isAnonymous: boolean;
  status: "pending" | "approved";
}

export interface Expense {
  id?: string;
  category: string;
  amount: number;
  date: Date;
  description: string;
  voucherUrl?: string;
}

export interface Notice {
  id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  date: Date;
}

// ==========================================
// 2. Helper Functions
// ==========================================

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
    donorName: data.donorName,
    amount: Number(data.amount) || 0,
    date: toDate(data.date),
    trxId: data.trxId,
    paymentMethod: data.paymentMethod,
    category: data.category || "General",
    isAnonymous: !!data.isAnonymous,
    status: data.status || "pending",
  };
}

function mapExpenseDoc(doc: QueryDocumentSnapshot<DocumentData>): Expense {
  const data = doc.data();
  return {
    id: doc.id,
    category: data.category || "General",
    amount: Number(data.amount) || 0,
    date: toDate(data.date),
    description: data.description || "",
    voucherUrl: data.voucherUrl,
  };
}

function mapNoticeDoc(doc: QueryDocumentSnapshot<DocumentData>): Notice {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title || "",
    content: data.content || "",
    imageUrl: data.imageUrl,
    date: toDate(data.date),
  };
}

// ==========================================
// 3. User & Authentication Utilities
// ==========================================

/**
 * Sets or updates a user profile and role in the database.
 */
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

/**
 * Fetches a user profile by email to verify administrative permissions.
 */
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
// 4. Donation Utilities (CRUD)
// ==========================================

/**
 * Submits a new donation. Default status is 'pending'.
 */
export async function addDonation(donation: Omit<Donation, "id" | "status" | "date"> & { date?: Date, status?: "pending" | "approved" }): Promise<string> {
  const donationsCollection = collection(db, "donations");
  const docRef = await addDoc(donationsCollection, {
    ...donation,
    status: donation.status || "pending",
    date: donation.date || new Date(),
  });
  return docRef.id;
}

/**
 * Changes a donation's status to 'approved'.
 */
export async function approveDonation(donationId: string): Promise<void> {
  const docRef = doc(db, "donations", donationId);
  await updateDoc(docRef, {
    status: "approved",
  });
}

/**
 * Fetches all donations of a specific status, ordered by date descending.
 */
export async function getDonations(status?: "pending" | "approved"): Promise<Donation[]> {
  const donationsCollection = collection(db, "donations");
  let q = query(donationsCollection);
  
  if (status) {
    q = query(donationsCollection, where("status", "==", status));
  }
  
  const snapshot = await getDocs(q);
  const mapped = snapshot.docs.map(mapDonationDoc);
  // Sort in JavaScript to avoid requiring composite indexes
  return mapped.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ==========================================
// 5. Expense Utilities (CRUD)
// ==========================================

/**
 * Adds a new expense record.
 */
export async function addExpense(expense: Omit<Expense, "id" | "date"> & { date?: Date }): Promise<string> {
  const expensesCollection = collection(db, "expenses");
  const docRef = await addDoc(expensesCollection, {
    ...expense,
    date: expense.date || new Date(),
  });
  return docRef.id;
}

/**
 * Fetches all expenses, ordered by date descending.
 */
export async function getExpenses(): Promise<Expense[]> {
  const expensesCollection = collection(db, "expenses");
  const q = query(expensesCollection);
  const snapshot = await getDocs(q);
  const mapped = snapshot.docs.map(mapExpenseDoc);
  // Sort in JavaScript to avoid requiring composite indexes
  return mapped.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ==========================================
// 6. Notice Board Utilities (CRUD)
// ==========================================

/**
 * Creates a new notice for the public/dashboard notice board.
 */
export async function addNotice(notice: Omit<Notice, "id" | "date"> & { date?: Date }): Promise<string> {
  const noticesCollection = collection(db, "notices");
  const docRef = await addDoc(noticesCollection, {
    ...notice,
    date: notice.date || new Date(),
  });
  return docRef.id;
}

/**
 * Fetches all notices, ordered by date descending.
 */
export async function getNotices(): Promise<Notice[]> {
  const noticesCollection = collection(db, "notices");
  const q = query(noticesCollection);
  const snapshot = await getDocs(q);
  const mapped = snapshot.docs.map(mapNoticeDoc);
  // Sort in JavaScript to avoid requiring composite indexes
  return mapped.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ==========================================
// 7. Aggregated Dashboard Stats (Analytics)
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

/**
 * Fetches aggregated financial summary data (income and expenses).
 * - Filters by optional startDate and endDate.
 * - Restricts income to only 'approved' donations.
 * - Groups income and expenses by category.
 */
export async function getDashboardStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
  const donationsCollection = collection(db, "donations");
  const expensesCollection = collection(db, "expenses");

  // Fetch approved donations and all expenses
  const donationsQuery = query(donationsCollection, where("status", "==", "approved"));
  const expensesQuery = query(expensesCollection);

  const [donationsSnapshot, expensesSnapshot] = await Promise.all([
    getDocs(donationsQuery),
    getDocs(expensesQuery),
  ]);

  // Process income (approved donations)
  let totalIncome = 0;
  const incomeByCategory: CategorySummary = {};

  donationsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const amount = Number(data.amount) || 0;
    const category = data.category || "General";
    const date = toDate(data.date);

    // Apply date filters in JavaScript
    if (startDate && date < startDate) return;
    if (endDate && date > endDate) return;
    
    totalIncome += amount;
    incomeByCategory[category] = (incomeByCategory[category] || 0) + amount;
  });

  // Process expenses
  let totalExpenses = 0;
  const expenseByCategory: CategorySummary = {};

  expensesSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const amount = Number(data.amount) || 0;
    const category = data.category || "General";
    const date = toDate(data.date);

    // Apply date filters in JavaScript
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
