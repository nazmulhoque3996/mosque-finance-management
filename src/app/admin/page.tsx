"use client";

import { useState, useEffect, useRef } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  where,
  setDoc,
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "@/lib/firebase";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getUserProfile,
  setUserProfile,
  approveDonation,
  rejectDonation,
  addExpense,
  updateExpense,
  deleteExpense,
  addNotice,
  updateNotice,
  deleteNotice,
  addDonation,
  updateDonation,
  deleteDonation,
  getDonations,
  getExpenses,
  getNotices,
  getDashboardStats,
  toDate,
  getAuditLogs,
  addAuditLog,
  convertFileToBase64,
  getSystemSettings,
  updateSystemSettings,
  generateReceiptId,
  UserProfile,
  Donation,
  Expense,
  Notice,
  DashboardStats,
  UserRole,
  AuditLog,
  SystemSettings,
} from "@/lib/firestoreUtils";
import { translateCategory } from "../page";

// Sleek SVG Icons from Lucide-React
import {
  Globe,
  MapPin,
  Shield,
  Coins,
  Receipt,
  Bell,
  Users,
  BarChart3,
  Loader2,
  Check,
  X,
  PlusCircle,
  Trash2,
  Download,
  AlertCircle,
  Calendar,
  CheckCircle2,
  User,
  Info,
  Lock,
  LogOut,
  Edit,
  Activity,
  FileText,
  Search,
  UploadCloud,
  FileDown,
  Settings
} from "lucide-react";

// Recharts vectors for dashboard
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// ==========================================
// 1. Translation System Dictionary
// ==========================================

const translations = {
  bn: {
    masjidName: "সুবেদার জামে মসজিদ আল খাওয়ারী",
    masjidAddress: "দক্ষিণ মীরের খীল, হাটহাজারী, চট্টগ্রাম",
    adminDashboardTitle: "মসজিদ অ্যাডমিন ড্যাশবোর্ড",
    langToggle: "English",
    logoutBtn: "লগআউট",
    
    // Login Screen
    loginTitle: "অ্যাডমিন লগইন প্যানেল",
    loginDesc: " mosque management system-এ প্রবেশ করতে আপনার ক্রেডেনশিয়ালস দিন।",
    emailLabel: "ইমেইল এড্রেস",
    emailPlaceholder: "admin@masjid.com",
    passwordLabel: "পাসওয়ার্ড",
    passwordPlaceholder: "••••••••",
    loginBtn: "লগইন করুন",
    loggingInBtn: "লগইন হচ্ছে...",
    loginError: "ইমেইল বা পাসওয়ার্ড সঠিক নয় অথবা আপনার অ্যাডমিন অ্যাক্সেস নেই!",
    testCredsNotice: "টেস্ট লগইন ক্রেডেনশিয়ালস (অনুপস্থিত থাকলে অটো-রেজিস্টার হবে): ইমেইল: superadmin@masjid.com অথবা admin@masjid.com, পাসওয়ার্ড: masjid123",

    // Tabs
    tabPending: "যাচাইাধীন দান",
    tabManualIncome: "নগদ দান সংযুক্তি",
    tabExpense: "খরচসমূহ",
    tabNotice: "মসজিদ নোটিশ প্রকাশ",
    tabSuperAdmin: "অ্যাক্সেস কন্ট্রোল",
    tabReports: "প্রতিবেদন",
    tabAuditLogs: "অ্যাক্টিভিটি ও অডিট লগ",

    // Audit Queue
    auditTitle: "যাচাইাধীন দানের তালিকা (Pending Donation Audit Queue)",
    auditDesc: "ব্যবহারকারীদের দাখিল করা পেমেন্টগুলো চেক করুন, TrxID মিলিয়ে অনুমোদন করুন বা প্রত্যাখ্যান করুন।",
    approveBtn: "অনুমোদন করুন",
    rejectBtn: "প্রত্যাখ্যান",
    approvingBtn: "অনুমোদন হচ্ছে...",
    editAmountBtn: "টাকা পরিবর্তন",
    auditDate: "তারিখ",
    auditDonor: "দাতার নাম",
    auditAmount: "পরিমাণ",
    auditMethod: "মাধ্যম",
    auditTrx: "TrxID / রেফারেন্স",
    auditCategory: "খাত",
    auditNoData: "কোনো যাচাইাধীন দান পাওয়া যায়নি।",
    rejectedClaimsTitle: "প্রত্যাখ্যাত দানের তালিকা (Rejected claims Log)",
    rejectedClaimsDesc: "Super Admin শুধুমাত্র এই তালিকা দেখতে পারেন। প্রত্যাখ্যানকৃত দানগুলো এখানে সংরক্ষিত রয়েছে।",

    // Tab 2: Manual Income
    manualTitle: "নগদ বা ক্যাশ দান সরাসরি লিপিবদ্ধকরণ",
    manualDesc: "কমিটির হাতে সরাসরি ক্যাশ আসা বা জুমার বাক্স কালেকশনের দানের হিসাব সরাসরি যুক্ত করুন।",
    donorLabel: "দাতার নাম",
    donorPlaceholder: "দাতার নাম লিখুন (খালি রাখলে নাম প্রকাশে অনিচ্ছুক দেখাবে)",
    anonymousOpt: "নাম প্রকাশে অনিচ্ছুক (Anonymous)",
    amountLabel: "টাকার পরিমাণ (৳)",
    amountPlaceholder: "৫০০",
    categoryLabel: "দানের খাত",
    categorySelect: "খাত নির্বাচন করুন",
    catJumma: "জুমা আদায়",
    catGeneral: "সাধারণ দান (লিল্লাহ)",
    catDevelopment: "মসজিদ উন্নয়ন",
    addIncomeBtn: "দানের তথ্য সংরক্ষণ করুন",

    // Tab 3: Expense
    expenseTitle: "নতুন খরচ লিপিবদ্ধকরণ ফরম",
    expenseDesc: "সম্মানী, বিদ্যুৎ বিল, মেরামত বা অন্যান্য খরচের হিসাব যুক্ত করুন। ভাউচার ছবি আপলোড করতে পারেন।",
    expCategoryLabel: "খরচের খাত",
    expCategorySelect: "খাত নির্বাচন করুন",
    catSalary: "ভাতা / সম্মানী (Salary)",
    catUtility: "বিদ্যুৎ / ইউটিলিটি বিল (Utilities)",
    catMaintenance: "মেরামত ও রক্ষণাবেক্ষণ (Maintenance)",
    catMisc: "অন্যান্য খরচ (Miscellaneous)",
    expAmountLabel: "খরচের পরিমাণ (৳)",
    expAmountPlaceholder: "৫০০০",
    expDescLabel: "খরচের বিবরণ / বিলের বর্ণনা",
    expDescPlaceholder: "যেমন: মে মাসের বিদ্যুৎ বিল পরিশোধ",
    voucherLabel: "ভাউচার রসিদ ইমেজ (ছবি আপলোড করুন)",
    addExpenseBtn: "খরচের তথ্য সংরক্ষণ করুন",

    // Tab 4: Notice
    noticeTitle: "নতুন নোটিশ বা বিজ্ঞপ্তি প্রকাশ",
    noticeDesc: "বিশেষ ঘোষণা, নামাজের সময়সূচী সরাসরি পাবলিক নোটিশ বোর্ডে প্রকাশ করুন।",
    noticeTitleLabel: "নোটিশের শিরোনাম",
    noticeTitlePlaceholder: "যেমন: জুমার নামাজের নতুন সময়সূচী",
    noticeContentLabel: "নোটিশের বিস্তারিত তথ্য",
    noticeContentPlaceholder: "মুসল্লিদের উদ্দেশ্যে বিস্তারিত ঘোষণাটি এখানে লিখুন...",
    publishBtn: "নোটিশ প্রকাশ করুন",

    // Tab 5: Super Admin Controls
    superTitle: "সিস্টেম অ্যাডমিন প্যানেল কন্ট্রোল",
    superDesc: "শুধুমাত্র Super Admin-দের জন্য দৃশ্যমান। নতুন অ্যাডমিনদের ইমেইল যুক্ত করুন বা অপসারণ করুন।",
    addAdminTitle: "নতুন অ্যাডমিন সংযুক্তকরণ",
    adminEmailLabel: "অ্যাডমিন ইমেইল",
    adminEmailPlaceholder: "newadmin@masjid.com",
    adminRoleLabel: "নির্ধারিত রোল (Role)",
    roleAdmin: "সাধারণ অ্যাডমিন (Admin)",
    roleSuperAdmin: "সুপার অ্যাডমিন (Super Admin)",
    addAdminBtn: "অ্যাডমিন অ্যাক্সেস দিন",
    adminListTitle: "বর্তমান অ্যাডমিনদের তালিকা",
    removeBtn: "অপসারণ",

    // Tab 6: Reports & PDF
    reportsTitle: "মসজিদ আর্থিক বিশ্লেষণ ও প্রতিবেদন",
    reportsDesc: "Weekly, Monthly, Yearly এবং Custom তারিখের হিসাবের রিপোর্ট জেনারেট করুন ও PDF আকারে সংগ্রহ করুন।",
    downloadPdfBtn: "পিডিএফ স্টেটমেন্ট (PDF Statement)",
    downloadingPdfBtn: "রিপোর্ট প্রস্তুত হচ্ছে...",
    pdfSuccessToast: "পিডিএফ রিপোর্ট প্রস্তুত হয়েছে এবং ডাউনলোড ফোল্ডারে পাঠানো হয়েছে।",
    filterLabel: "তারিখের ফিল্টার:",
    filterWeekly: "গত ৭ দিন (Weekly)",
    filterMonthly: "গত ৩০ দিন (Monthly)",
    filterYearly: "গত ১ বছর (Yearly)",
    filterCustom: "নির্দিষ্ট সময়সীমা (Custom Range)",

    // Tab 7: Audit Logs
    auditLogsTitle: "অ্যাডমিন অ্যাক্টিভিটি ও অডিট লগ",
    auditLogsDesc: "মসজিদ তহবিলের সর্বোচ্চ জবাবদিহিতা নিশ্চিত করতে সকল অ্যাডমিনদের কার্যক্রমের রেকর্ড।",
    logFilterEmail: "অ্যাডমিন ফিল্টার:",
    logFilterAll: "সকল অ্যাডমিন",
    logNoData: "কোনো অ্যাক্টিভিটি রেকর্ড পাওয়া যায়নি।",

    // Base Labels
    savingBtn: "সংরক্ষণ হচ্ছে...",
    saveSuccess: "তথ্যটি সফলভাবে সংরক্ষণ করা হয়েছে!",
    saveError: "তথ্য সংরক্ষণে ভুল হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।",
    toastAmountMin: "টাকার পরিমাণ ০ এর চেয়ে বেশি হতে হবে!",
    loadingData: "তথ্য লোড হচ্ছে...",
    anonymousName: "নাম প্রকাশে অনিচ্ছুক",
    accessDenied: "প্রведения অ্যাক্সেস সংরক্ষিত! আপনার অ্যাডমিন অ্যাক্সেস নেই।",
    superAdminBadge: "সুপার অ্যাডমিন",
    adminBadge: "অ্যাডমিন",
    downloadReceiptBtn: "রশিদ ডাউনলোড (PDF)"
  },
  en: {
    masjidName: "Subedar Jame Masjid Al Khawari",
    masjidAddress: "South Mirer Khil, Hathazari, Chattogram",
    adminDashboardTitle: "Masjid Admin Dashboard",
    langToggle: "বাংলা",
    logoutBtn: "Logout",
    
    // Login Screen
    loginTitle: "Admin Login Panel",
    loginDesc: "Enter your credentials to log in to the digital mosque management system.",
    emailLabel: "Email Address",
    emailPlaceholder: "admin@masjid.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    loginBtn: "Log In",
    loggingInBtn: "Logging In...",
    loginError: "Invalid email/password, or you do not have administrative access!",
    testCredsNotice: "Test credentials (auto-registers if missing): Email: superadmin@masjid.com or admin@masjid.com, Password: masjid123",

    // Tabs
    tabPending: "Pending Audits",
    tabManualIncome: "Manual Income",
    tabExpense: "Expenses",
    tabNotice: "Publish Notice",
    tabSuperAdmin: "Access Control",
    tabReports: "Reports",
    tabAuditLogs: "Accountability Logs",

    // Audit Queue
    auditTitle: "Pending Donation Audit Queue",
    auditDesc: "Audit user-submitted claims, crosscheck MFS TrxIDs, and approve claims or reject them.",
    approveBtn: "Approve",
    rejectBtn: "Reject Claim",
    approvingBtn: "Approving...",
    editAmountBtn: "Edit Amount",
    auditDate: "Date",
    auditDonor: "Donor Name",
    auditAmount: "Amount",
    auditMethod: "Method",
    auditTrx: "TrxID / Reference",
    auditCategory: "Category",
    auditNoData: "No pending donations found.",
    rejectedClaimsTitle: "Rejected Donations Claims Log",
    rejectedClaimsDesc: "Strictly visible only to Super Admins. Disputed or invalid digital donation claims are archived here.",

    // Tab 2: Manual Income
    manualTitle: "Record Cash Income Manually",
    manualDesc: "Log Jumma collections, anonymous donation box cash, or handovers directly as approved funds.",
    donorLabel: "Donor Name",
    donorPlaceholder: "Enter donor name (Leave blank to keep anonymous)",
    anonymousOpt: "Keep Name Anonymous",
    amountLabel: "Amount (৳)",
    amountPlaceholder: "500",
    categoryLabel: "Donation Category",
    categorySelect: "Select Category",
    catJumma: "Jumma Collection",
    catGeneral: "General Donation (Lillah)",
    catDevelopment: "Mosque Development",
    addIncomeBtn: "Save Cash Record",

    // Tab 3: Expense
    expenseTitle: "Record Mosque Expense",
    expenseDesc: "Log salaries, utility bills, repairs, and maintenance. Upload voucher receipt images directly.",
    expCategoryLabel: "Expense Category",
    expCategorySelect: "Select Category",
    catSalary: "Allowance / Salary",
    catUtility: "Electricity / Utilities",
    catMaintenance: "Repairs & Maintenance",
    catMisc: "Miscellaneous Expenses",
    expAmountLabel: "Expense BDT Amount (৳)",
    expAmountPlaceholder: "5000",
    expDescLabel: "Expense Description / Details",
    expDescPlaceholder: "e.g. Paid electricity bill for the month of May",
    voucherLabel: "Upload Voucher Receipt File (Optional Image)",
    addExpenseBtn: "Save Expense Record",

    // Tab 4: Notice
    noticeTitle: "Publish Announcements",
    noticeDesc: "Create notice board publications regarding daily timings, congregations, or declarations.",
    noticeTitleLabel: "Notice Title",
    noticeTitlePlaceholder: "e.g. Change in Jumma Prayer Timings",
    noticeContentLabel: "Notice Description / Content",
    noticeContentPlaceholder: "Draft detailed announcement for musallis here...",
    publishBtn: "Publish Notice",

    // Tab 5: Super Admin Controls
    superTitle: "System Super Admin Panel",
    superDesc: "Visible strictly to Super Admins. Create, edit, and assign administrative profiles.",
    addAdminTitle: "Create New Administrator Account",
    adminEmailLabel: "Admin Email",
    adminEmailPlaceholder: "newadmin@masjid.com",
    adminRoleLabel: "Assigned Authority Role",
    roleAdmin: "Regular Admin",
    roleSuperAdmin: "Super Admin",
    addAdminBtn: "Grant Admin Access",
    adminListTitle: "Active Administrators Profiles",
    removeBtn: "Revoke",

    // Tab 6: Reports & PDF
    reportsTitle: "Masjid Financial Statement Reports",
    reportsDesc: "Generate weekly/monthly/yearly analytical breakdowns and download print-ready audit PDFs.",
    downloadPdfBtn: "PDF Statement",
    downloadingPdfBtn: "Compiling BDT PDF...",
    pdfSuccessToast: "PDF statement report successfully compiled and sent to your downloads folder.",
    filterLabel: "Time Range Filter:",
    filterWeekly: "Last 7 Days (Weekly)",
    filterMonthly: "Last 30 Days (Monthly)",
    filterYearly: "Last 1 Year (Yearly)",
    filterCustom: "Select Custom Dates Range",

    // Tab 7: Audit Logs
    auditLogsTitle: "Super Admin Security & Audit Log",
    auditLogsDesc: "Comprehensive cryptographic audit trails of all administrative actions for absolute transparency.",
    logFilterEmail: "Filter by Admin Email:",
    logFilterAll: "All Administrative Profiles",
    logNoData: "No actions logged under this filter.",

    // Base Labels
    savingBtn: "Saving...",
    saveSuccess: "Financial data successfully committed!",
    saveError: "Error saving record! Please check fields and retry.",
    toastAmountMin: "Amount must be greater than 0!",
    loadingData: "Loading details...",
    anonymousName: "Anonymous Donor",
    accessDenied: "Access Restricted! Administrative clearance required.",
    superAdminBadge: "Super Admin",
    adminBadge: "Admin",
    downloadReceiptBtn: "Download Receipt (PDF)"
  }
};

// ==========================================
// 2. Helper Formats
// ==========================================

function formatCurrency(amount: number, lang: "bn" | "en"): string {
  const formatted = amount.toLocaleString(lang === "bn" ? "bn-BD" : "en-US");
  return `৳ ${formatted}`;
}

function formatDate(date: Date, lang: "bn" | "en"): string {
  return date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Color Palette for Recharts
const CHART_COLORS = ["#047857", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminPage() {
  // --- Hydration Gating ---
  const [mounted, setMounted] = useState(false);

  // --- Auth & Access States ---
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [adminProfile, setAdminProfile] = useState<UserProfile | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // --- Login Form States ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // --- Dashboard Active states ---
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // --- Data States ---
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [rejectedDonations, setRejectedDonations] = useState<Donation[]>([]);
  const [manualIncomes, setManualIncomes] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allAdmins, setAllAdmins] = useState<UserProfile[]>([]);

  // --- Filter states ---
  const [reportsFilter, setReportsFilter] = useState<"weekly" | "monthly" | "yearly" | "all" | "custom">("monthly");
  const [repStartDate, setRepStartDate] = useState("");
  const [repEndDate, setRepEndDate] = useState("");
  
  const [logFilterEmail, setLogFilterEmail] = useState("all");
  const [logFilterAction, setLogFilterAction] = useState("all");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");

  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    incomeByCategory: {},
    expenseByCategory: {},
  });

  // --- Form: Manual Income ---
  const [manDonorName, setManDonorName] = useState("");
  const [manIsAnonymous, setManIsAnonymous] = useState(false);
  const [manAmount, setManAmount] = useState("");
  const [manCategory, setManCategory] = useState("");

  // --- Form: Expense ---
  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDesc, setExpDesc] = useState("");
  const [expFile, setExpFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Form: Notice ---
  const [notTitle, setNotTitle] = useState("");
  const [notContent, setNotContent] = useState("");

  // --- Form: SuperAdmin Manage ---
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<UserRole>("admin");
  const [newAdminPassword, setNewAdminPassword] = useState("");

  // --- Edit Modals States ---
  const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  
  // Pending Claims Edit state
  const [claimEditTarget, setClaimEditTarget] = useState<Donation | null>(null);
  const [claimEditAmount, setClaimEditAmount] = useState("");

  // --- Success Manual Cash Modal State (For Receipt download) ---
  const [recentSavedCash, setRecentSavedCash] = useState<Donation | null>(null);

  // --- Reporting PDF state ---
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<string | null>(null);

  // --- Global settings, all donations, global search & PDF states ---
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [globalSettings, setGlobalSettings] = useState<SystemSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [presSigFile, setPresSigFile] = useState<File | null>(null);
  const [treasSigFile, setTreasSigFile] = useState<File | null>(null);
  const presSigInputRef = useRef<HTMLInputElement>(null);
  const treasSigInputRef = useRef<HTMLInputElement>(null);
  const [pdfReceiptData, setPdfReceiptData] = useState<Donation | null>(null);

  // --- Toast ---
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const t = translations[lang];

  const triggerToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  // Safe Hydration Mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Monitor Auth Status & Load Seed Users ---
  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCheckingAuth(true);
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.email || "");
        if (profile && (profile.role === "admin" || profile.role === "superadmin")) {
          setUser(firebaseUser);
          setAdminProfile(profile);
        } else {
          await signOut(auth);
          setUser(null);
          setAdminProfile(null);
          setLoginError(t.loginError);
        }
      } else {
        setUser(null);
        setAdminProfile(null);
      }
      setCheckingAuth(false);
    });

    const seedAdminUsers = async () => {
      try {
        const usersCol = collection(db, "users");
        const snapshot = await getDocs(usersCol);
        if (snapshot.empty) {
          await Promise.all([
            setUserProfile("superadmin@masjid.com", "superadmin"),
            setUserProfile("admin@masjid.com", "admin"),
          ]);
        }
      } catch (err) {
        console.error("Error seeding roles database:", err);
      }
    };
    seedAdminUsers();

    return () => unsubscribe();
  }, [mounted, lang]);

  // --- Live Data Listeners ---
  useEffect(() => {
    if (!mounted || !user || !adminProfile) return;

    setLoading(true);

    const localMapDonation = (docSnap: any): Donation => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        receiptId: data.receiptId || `REC-${docSnap.id.substring(0, 6).toUpperCase()}`,
        donorName: data.donorName,
        amount: Number(data.amount) || 0,
        date: toDate(data.date),
        trxId: data.trxId,
        paymentMethod: data.paymentMethod,
        category: data.category || "general_fund",
        isAnonymous: !!data.isAnonymous,
        status: data.status || "pending",
      };
    };

    const localMapExpense = (docSnap: any): Expense => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        category: data.category || "miscellaneous",
        amount: Number(data.amount) || 0,
        date: toDate(data.date),
        description: data.description || "",
        voucherUrl: data.voucherUrl || null,
      };
    };

    const localMapNotice = (docSnap: any): Notice => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || "",
        content: data.content || "",
        date: toDate(data.date),
      };
    };

    const localMapAuditLog = (docSnap: any): AuditLog => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        adminEmail: d.adminEmail || "Unknown Admin",
        actionType: d.actionType as any,
        collectionName: d.collectionName as any,
        details: d.details || "",
        timestamp: toDate(d.timestamp),
      };
    };

    // 1. Donations Listener
    const donationsCol = collection(db, "donations");
    const unsubDonations = onSnapshot(donationsCol, (snapshot) => {
      const list = snapshot.docs.map(localMapDonation);
      setAllDonations(list);

      // Filter pending donations
      const pending = list.filter(d => d.status === "pending");
      setPendingDonations(pending.sort((a, b) => b.date.getTime() - a.date.getTime()));

      // Filter rejected donations
      const rejected = list.filter(d => d.status === "rejected");
      setRejectedDonations(rejected.sort((a, b) => b.date.getTime() - a.date.getTime()));

      // Filter manual cash donations (approved cash)
      const cashList = list.filter(d => d.paymentMethod === "cash" && d.status === "approved");
      setManualIncomes(cashList.sort((a, b) => b.date.getTime() - a.date.getTime()));
      setLoading(false);
    }, (error) => {
      console.error("Error listening to donations:", error);
      setLoading(false);
    });

    // 2. Expenses Listener
    const expensesCol = collection(db, "expenses");
    const unsubExpenses = onSnapshot(expensesCol, (snapshot) => {
      const list = snapshot.docs.map(localMapExpense);
      setExpenses(list.sort((a, b) => b.date.getTime() - a.date.getTime()));
    }, (error) => {
      console.error("Error listening to expenses:", error);
    });

    // 3. Notices Listener
    const noticesCol = collection(db, "notices");
    const unsubNotices = onSnapshot(noticesCol, (snapshot) => {
      const list = snapshot.docs.map(localMapNotice);
      setNotices(list.sort((a, b) => b.date.getTime() - a.date.getTime()));
    }, (error) => {
      console.error("Error listening to notices:", error);
    });

    // 4. Settings Listener
    const settingsDoc = doc(db, "settings", "global");
    const unsubSettings = onSnapshot(settingsDoc, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGlobalSettings({
          presidentSignatureUrl: data.presidentSignatureUrl || null,
          treasurerSignatureUrl: data.treasurerSignatureUrl || null,
        });
      }
    });

    // 5. Audit Logs Listener (only for superadmin)
    let unsubAuditLogs = () => {};
    if (adminProfile.role === "superadmin") {
      const auditLogsCol = collection(db, "auditLogs");
      unsubAuditLogs = onSnapshot(auditLogsCol, (snapshot) => {
        const list = snapshot.docs.map(localMapAuditLog);
        setAuditLogs(list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      }, (error) => {
        console.error("Error listening to audit logs:", error);
      });
    }

    // 6. Admins Profiles Listener (only for superadmin)
    let unsubAdmins = () => {};
    if (adminProfile.role === "superadmin") {
      const usersCol = collection(db, "users");
      unsubAdmins = onSnapshot(usersCol, (snapshot) => {
        const adminProfiles: UserProfile[] = snapshot.docs.map(docSnap => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            email: d.email,
            role: d.role as UserRole
          };
        });
        setAllAdmins(adminProfiles);
      }, (error) => {
        console.error("Error listening to admin profiles:", error);
      });
    }

    return () => {
      unsubDonations();
      unsubExpenses();
      unsubNotices();
      unsubSettings();
      unsubAuditLogs();
      unsubAdmins();
    };
  }, [mounted, user, adminProfile]);

  // --- Real-time statistics calculator inside React memory ---
  useEffect(() => {
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;
    const now = new Date();

    if (reportsFilter === "weekly") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (reportsFilter === "monthly") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (reportsFilter === "yearly") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (reportsFilter === "custom" && repStartDate) {
      startDate = new Date(repStartDate);
      if (repEndDate) endDate = new Date(repEndDate + "T23:59:59");
    }

    let totalIncome = 0;
    const incomeByCategory: Record<string, number> = {};
    allDonations.forEach((d) => {
      if (d.status !== "approved") return;
      if (startDate && d.date < startDate) return;
      if (endDate && d.date > endDate) return;
      totalIncome += d.amount;
      incomeByCategory[d.category] = (incomeByCategory[d.category] || 0) + d.amount;
    });

    let totalExpenses = 0;
    const expenseByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      if (startDate && e.date < startDate) return;
      if (endDate && e.date > endDate) return;
      totalExpenses += e.amount;
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });

    setStats({
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      incomeByCategory,
      expenseByCategory,
    });
  }, [allDonations, expenses, reportsFilter, repStartDate, repEndDate]);

  // Keep as a safe mock dummy function for backwards compatibility with historical handlers
  const loadAdminData = async () => {};

  // --- Handle Login ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password;

    try {
      await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
    } catch (err: any) {
      if (
        (targetEmail === "superadmin@masjid.com" || targetEmail === "admin@masjid.com") &&
        targetPassword === "masjid123" &&
        (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-login-credentials")
      ) {
        try {
          await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
        } catch (regErr: any) {
          console.error("Auth register seeding error:", regErr);
          setLoginError(t.loginError);
        }
      } else {
        setLoginError(t.loginError);
      }
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAdminProfile(null);
    setEmail("");
    setPassword("");
  };

  // --- Approve Claim ---
  const handleApproveDonation = async (id: string) => {
    if (!adminProfile) return;
    try {
      setSubmitting(true);
      await approveDonation(id, adminProfile.email);
      triggerToast("success", t.saveSuccess, lang === "bn" ? "দানটি অনুমোদিত হয়েছে এবং পাবলিক লেজারে যুক্ত হয়েছে।" : "Donation approved and published to ledger.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Reject Claim (Soft-Delete) ---
  const handleRejectDonation = async (id: string) => {
    if (!adminProfile) return;
    try {
      setSubmitting(true);
      await rejectDonation(id, adminProfile.email);
      triggerToast("success", lang === "bn" ? "প্রত্যাখ্যাত!" : "Rejected!", lang === "bn" ? "দানটি প্রত্যাখ্যান করা হয়েছে এবং আর্কাইভ করা হয়েছে।" : "Donation claims rejected and soft-deleted.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Edit Claim Amount Pre-Approval ---
  const handleSaveClaimAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimEditTarget || !claimEditTarget.id || !adminProfile) return;
    const parsedAmount = Number(claimEditAmount);

    if (!parsedAmount || parsedAmount <= 0) {
      triggerToast("error", t.saveError, t.toastAmountMin);
      return;
    }

    try {
      setSubmitting(true);
      await updateDonation(claimEditTarget.id, { amount: parsedAmount }, adminProfile.email);
      triggerToast("success", t.saveSuccess, lang === "bn" ? "টাকার পরিমাণ পরিবর্তন করা হয়েছে।" : "Claim BDT amount corrected.");
      setClaimEditTarget(null);
      setClaimEditAmount("");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Add Manual Income (Cash) ---
  const handleAddManualIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    const parsedAmount = Number(manAmount);

    if (!parsedAmount || parsedAmount <= 0) {
      triggerToast("error", t.saveError, t.toastAmountMin);
      return;
    }

    if (!manCategory) {
      triggerToast("error", t.saveError, lang === "bn" ? "খাত নির্বাচন করুন।" : "Please select category.");
      return;
    }

    const finalDonor = manIsAnonymous ? "" : manDonorName.trim();

    try {
      setSubmitting(true);
      const donationObj = {
        donorName: finalDonor,
        amount: parsedAmount,
        category: manCategory,
        paymentMethod: "cash" as const,
        isAnonymous: manIsAnonymous,
        status: "approved" as const,
      };

      const docId = await addDonation(donationObj, adminProfile.email);
      
      const savedDocObj = {
        id: docId,
        ...donationObj,
        date: new Date()
      };

      // Set state to trigger instant receipt download success window
      setRecentSavedCash(savedDocObj);

      setManDonorName("");
      setManAmount("");
      setManIsAnonymous(false);
      setManCategory("");

      triggerToast("success", t.saveSuccess, t.saveSuccess);
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Add Expense ---
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;
    const parsedAmount = Number(expAmount);

    if (!parsedAmount || parsedAmount <= 0) {
      triggerToast("error", t.saveError, t.toastAmountMin);
      return;
    }

    if (!expCategory) {
      triggerToast("error", t.saveError, lang === "bn" ? "খাত নির্বাচন করুন।" : "Please select category.");
      return;
    }

    if (!expDesc.trim()) {
      triggerToast("error", t.saveError, lang === "bn" ? "খরচের বিবরণ দিন।" : "Please enter expense description.");
      return;
    }

    try {
      setSubmitting(true);
      let voucherUrl: string | null = null;
      
      if (expFile) {
        if (expFile.size > 500 * 1024) {
          triggerToast(
            "error",
            t.saveError,
            lang === "bn"
              ? "ভাউচার ফাইলের সাইজ ৫০০KB এর কম হতে হবে।"
              : "Voucher file must be under 500KB!"
          );
          setSubmitting(false);
          return;
        }
        voucherUrl = await convertFileToBase64(expFile);
      }

      await addExpense({
        category: expCategory,
        amount: parsedAmount,
        description: expDesc.trim(),
        voucherUrl,
      }, adminProfile.email);

      setExpCategory("");
      setExpAmount("");
      setExpDesc("");
      setExpFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      triggerToast("success", t.saveSuccess, t.saveSuccess);
      await loadAdminData();
    } catch (err: any) {
      console.error("Error adding expense:", err);
      triggerToast(
        "error",
        t.saveError,
        err.message || (lang === "bn" ? "খরচ সংরক্ষণ করতে ব্যর্থ হয়েছে।" : "Failed to add expense.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // --- Add Notice (Simplified strictly to Title/Content) ---
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile) return;

    if (!notTitle.trim() || !notContent.trim()) {
      triggerToast("error", t.saveError, lang === "bn" ? "শিরোনাম ও বিবরণ আবশ্যক!" : "Title and content are mandatory!");
      return;
    }

    try {
      setSubmitting(true);
      await addNotice({
        title: notTitle.trim(),
        content: notContent.trim(),
      }, adminProfile.email);

      setNotTitle("");
      setNotContent("");

      triggerToast("success", t.saveSuccess, t.saveSuccess);
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- SuperAdmin: Add Admin Email ---
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = newAdminEmail.trim().toLowerCase();

    if (!targetEmail) {
      triggerToast("error", t.saveError, lang === "bn" ? "ইমেইল দিন।" : "Please enter email.");
      return;
    }

    try {
      setSubmitting(true);
      await setUserProfile(targetEmail, newAdminRole);
      setNewAdminEmail("");
      triggerToast("success", t.saveSuccess, lang === "bn" ? "অ্যাডমিন সফলভাবে যুক্ত হয়েছে।" : "Admin successfully added.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- html2canvas-based dynamic Cash Receipt Generator ---
  const handleDownloadReceiptPdfDirectly = async (d: Donation) => {
    if (!mounted) return;
    setDownloadingReceiptId(d.id || null);

    triggerToast(
      "success",
      lang === "bn" ? "রশিদ প্রস্তুত হচ্ছে..." : "Preparing Receipt...",
      lang === "bn" ? "অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।" : "Please wait while we render your receipt."
    );

    try {
      setPdfReceiptData(d);
      await new Promise((resolve) => setTimeout(resolve, 350)); // let DOM paint

      const element = document.getElementById("receipt-pdf-template");
      if (!element) throw new Error("Receipt template container not found!");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5"
      });

      pdf.addImage(imgData, "PNG", 0, 0, 148, 210);
      pdf.save(`Masjid-CashReceipt-${d.receiptId || d.id?.substring(0, 6).toUpperCase() || "CASH"}.pdf`);

      triggerToast(
        "success",
        lang === "bn" ? "রশিদ ডাউনলোড সম্পন্ন হয়েছে!" : "Generated Successfully",
        lang === "bn" ? "আপনার দান রশিদটি সফলভাবে সংরক্ষণ করা হয়েছে।" : "Donation receipt has been successfully saved."
      );
    } catch (error) {
      console.error("Receipt generation failed:", error);
      triggerToast("error", lang === "bn" ? "রশিদ প্রস্তুতকরণে ব্যর্থতা!" : "Download Failed", lang === "bn" ? "রশিদ পিডিএফ জেনারেট করতে সমস্যা হয়েছে।" : "Failed to compile the receipt PDF.");
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  // --- html2canvas-based Dynamic A4 Statement Generator ---
  const handleDownloadPdfReport = async () => {
    if (!mounted) return;
    setDownloadingPdf(true);

    triggerToast(
      "success",
      lang === "bn" ? "বিবরণী প্রস্তুত হচ্ছে..." : "Preparing Statement...",
      lang === "bn" ? "অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।" : "Generating pixel-perfect PDF statement."
    );

    try {
      await new Promise((resolve) => setTimeout(resolve, 400)); // let DOM paint

      const element = document.getElementById("statement-pdf-template");
      if (!element) throw new Error("Statement template container not found!");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      
      const startFmt = repStartDate ? repStartDate : "Inception";
      const endFmt = repEndDate ? repEndDate : new Date().toLocaleDateString("en-US");
      pdf.save(`Masjid-Statement-${startFmt}-${endFmt}.pdf`);

      triggerToast(
        "success",
        lang === "bn" ? "বিবরণী ডাউনলোড সম্পন্ন হয়েছে!" : "Generated Successfully",
        lang === "bn" ? "আর্থিক বিবরণী বিবরণ সফলভাবে সংরক্ষণ করা হয়েছে।" : "Mosque financial statement report saved successfully."
      );
    } catch (error) {
      console.error("Statement generation failed:", error);
      triggerToast("error", lang === "bn" ? "বিবরণী প্রস্তুতকরণে ব্যর্থতা!" : "Download Failed", lang === "bn" ? "বিবরণী পিডিএফ জেনারেট করতে সমস্যা হয়েছে।" : "Failed to compile the statement PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // --- Upload and Update Signature Settings ---
  const handleSaveSignatures = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminProfile || adminProfile.role !== "superadmin") return;

    try {
      setSavingSettings(true);
      let presidentSignatureUrl = globalSettings?.presidentSignatureUrl || null;
      let treasurerSignatureUrl = globalSettings?.treasurerSignatureUrl || null;

      if (presSigFile) {
        if (presSigFile.size > 500 * 1024) {
          triggerToast("error", t.saveError, lang === "bn" ? "সভাপতির স্বাক্ষর ৫০০KB এর বেশি হতে পারবে না!" : "President signature must be < 500KB!");
          setSavingSettings(false);
          return;
        }
        presidentSignatureUrl = await convertFileToBase64(presSigFile);
      }

      if (treasSigFile) {
        if (treasSigFile.size > 500 * 1024) {
          triggerToast("error", t.saveError, lang === "bn" ? "ক্যাশিয়ারের স্বাক্ষর ৫০০KB এর বেশি হতে পারবে না!" : "Treasurer signature must be < 500KB!");
          setSavingSettings(false);
          return;
        }
        treasurerSignatureUrl = await convertFileToBase64(treasSigFile);
      }

      await updateSystemSettings({
        presidentSignatureUrl,
        treasurerSignatureUrl
      });

      setPresSigFile(null);
      setTreasSigFile(null);
      if (presSigInputRef.current) presSigInputRef.current.value = "";
      if (treasSigInputRef.current) treasSigInputRef.current.value = "";

      triggerToast("success", t.saveSuccess, lang === "bn" ? "স্বাক্ষর সফলভাবে সংরক্ষিত হয়েছে!" : "Signatures saved successfully!");
    } catch (err: any) {
      console.error("Error saving signatures:", err);
      triggerToast(
        "error",
        t.saveError,
        err.message || (lang === "bn" ? "সংরক্ষণ করতে সমস্যা হয়েছে!" : "Failed to save signatures!")
      );
    } finally {
      setSavingSettings(false);
    }
  };

  // --- SuperAdmin: Remove Admin Role ---
  const handleRemoveAdmin = async (adminId: string, email: string) => {
    if (email.toLowerCase() === "superadmin@masjid.com" || email.toLowerCase() === adminProfile?.email.toLowerCase()) {
      triggerToast("error", t.saveError, lang === "bn" ? "প্রধান বা সক্রিয় সুপার অ্যাডমিনকে অপসারণ করা যাবে না!" : "Cannot remove core/active superadmin!");
      return;
    }

    try {
      setSubmitting(true);
      const userRef = doc(db, "users", adminId);
      await deleteDoc(userRef);
      
      // Audit Logging
      if (adminProfile) {
        await addAuditLog({
          adminEmail: adminProfile.email,
          actionType: "delete",
          collectionName: "notices" as any,
          details: `Deleted admin account: ${email}`
        });
      }

      triggerToast("success", t.saveSuccess, lang === "bn" ? "অ্যাডমিন অপসারণ করা হয়েছে।" : "Admin removed successfully.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- SuperAdmin: Toggle Admin Role ---
  const handleToggleAdminRole = async (adm: UserProfile) => {
    if (adm.email.toLowerCase() === "superadmin@masjid.com" || adm.email.toLowerCase() === adminProfile?.email.toLowerCase()) {
      triggerToast("error", t.saveError, lang === "bn" ? "প্রধান বা সক্রিয় সুপার অ্যাডমিনের ভূমিকা পরিবর্তন করা যাবে না!" : "Cannot change role of core/active superadmin!");
      return;
    }

    try {
      setSubmitting(true);
      const newRole: UserRole = adm.role === "superadmin" ? "admin" : "superadmin";
      await setUserProfile(adm.email, newRole);

      // Audit Logging
      if (adminProfile) {
        await addAuditLog({
          adminEmail: adminProfile.email,
          actionType: "update",
          collectionName: "notices" as any,
          details: `Updated role of admin ${adm.email} from ${adm.role} to ${newRole}`
        });
      }

      triggerToast("success", t.saveSuccess, lang === "bn" ? "অ্যাডমিনের ভূমিকা সফলভাবে পরিবর্তন করা হয়েছে।" : "Admin role changed successfully.");
      await loadAdminData();
    } catch (err: any) {
      triggerToast("error", t.saveError, err.message || t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- SuperAdmin: Send Admin Password Reset Email ---
  const handleResetAdminPassword = async (email: string) => {
    try {
      setSubmitting(true);
      await sendPasswordResetEmail(auth, email);

      // Audit Logging
      if (adminProfile) {
        await addAuditLog({
          adminEmail: adminProfile.email,
          actionType: "update",
          collectionName: "notices" as any,
          details: `Triggered password reset email for admin: ${email}`
        });
      }

      triggerToast("success", lang === "bn" ? "রিসেট ইমেইল পাঠানো হয়েছে!" : "Reset Email Sent", lang === "bn" ? "পাসওয়ার্ড রিসেট ইমেইল সফলভাবে পাঠানো হয়েছে।" : "Password reset email sent successfully.");
    } catch (err: any) {
      triggerToast("error", t.saveError, err.message || t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Full CRUD: Updates ---
  const handleUpdateDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonation || !editingDonation.id || !adminProfile) return;
    
    try {
      setSubmitting(true);
      const payload = { ...editingDonation };
      delete payload.id;
      await updateDonation(editingDonation.id, payload, adminProfile.email);
      triggerToast("success", t.saveSuccess, t.saveSuccess);
      setEditingDonation(null);
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editingExpense.id || !adminProfile) return;

    try {
      setSubmitting(true);
      const payload = { ...editingExpense };
      delete payload.id;
      await updateExpense(editingExpense.id, payload, adminProfile.email);
      triggerToast("success", t.saveSuccess, t.saveSuccess);
      setEditingExpense(null);
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice || !editingNotice.id || !adminProfile) return;

    try {
      setSubmitting(true);
      const payload = { ...editingNotice };
      delete payload.id;
      await updateNotice(editingNotice.id, payload, adminProfile.email);
      triggerToast("success", t.saveSuccess, t.saveSuccess);
      setEditingNotice(null);
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Full CRUD: Deletions ---
  const handleDeleteDonationSubmit = async (id: string) => {
    if (!window.confirm(lang === "bn" ? "আপনি কি এই দান রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?" : "Are you sure you want to permanently delete this donation record?")) return;
    if (!adminProfile) return;

    try {
      setSubmitting(true);
      await deleteDonation(id, adminProfile.email);
      triggerToast("success", lang === "bn" ? "ডিলিট সফল!" : "Deleted!", lang === "bn" ? "রেকর্ডটি মুছে ফেলা হয়েছে।" : "Donation deleted.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpenseSubmit = async (id: string) => {
    if (!window.confirm(lang === "bn" ? "আপনি কি এই খরচ রেকর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?" : "Are you sure you want to permanently delete this expense record?")) return;
    if (!adminProfile) return;

    try {
      setSubmitting(true);
      await deleteExpense(id, adminProfile.email);
      triggerToast("success", lang === "bn" ? "ডিলিট সফল!" : "Deleted!", lang === "bn" ? "রেকর্ডটি মুছে ফেলা হয়েছে।" : "Expense deleted.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNoticeSubmit = async (id: string) => {
    if (!window.confirm(lang === "bn" ? "আপনি কি এই নোটিশ বোর্ডটি স্থায়ীভাবে মুছে ফেলতে চান?" : "Are you sure you want to permanently delete this notice?")) return;
    if (!adminProfile) return;

    try {
      setSubmitting(true);
      await deleteNotice(id, adminProfile.email);
      triggerToast("success", lang === "bn" ? "ডিলিট সফল!" : "Deleted!", lang === "bn" ? "নোটিশ বোর্ডটি মুছে ফেলা হয়েছে।" : "Notice deleted.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // Safe SSR gate while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Formatting Pie Data
  const pieDataIncome = Object.entries(stats.incomeByCategory).map(([cat, amt]) => ({
    name: translateCategory(cat, lang),
    value: amt
  }));

  const pieDataExpense = Object.entries(stats.expenseByCategory).map(([cat, amt]) => ({
    name: translateCategory(cat, lang),
    value: amt
  }));

  // Filtering audit logs inside the client visually
  const filteredAuditLogs = auditLogs.filter(log => {
    if (logFilterEmail !== "all" && log.adminEmail.toLowerCase() !== logFilterEmail.toLowerCase()) return false;
    if (logFilterAction !== "all" && log.actionType.toLowerCase() !== logFilterAction.toLowerCase()) return false;
    if (logStartDate && log.timestamp < new Date(logStartDate)) return false;
    if (logEndDate && log.timestamp > new Date(logEndDate + "T23:59:59")) return false;
    return true;
  });

  // Derived state: Filtered approved donations & expenses by reports date range
  const getReportsDateRange = () => {
    let startDate: Date | undefined = undefined;
    let endDate: Date | undefined = undefined;
    const now = new Date();

    if (reportsFilter === "weekly") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (reportsFilter === "monthly") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (reportsFilter === "yearly") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    } else if (reportsFilter === "custom" && repStartDate) {
      startDate = new Date(repStartDate);
      if (repEndDate) endDate = new Date(repEndDate + "T23:59:59");
    }
    return { startDate, endDate };
  };

  const { startDate: reportStart, endDate: reportEnd } = getReportsDateRange();

  const filteredApprovedDonationsForReport = allDonations.filter((d) => {
    if (d.status !== "approved") return false;
    if (reportStart && d.date < reportStart) return false;
    if (reportEnd && d.date > reportEnd) return false;
    return true;
  });

  const filteredExpensesForReport = expenses.filter((e) => {
    if (reportStart && e.date < reportStart) return false;
    if (reportEnd && e.date > reportEnd) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-12 transition-colors duration-300">
      
      {/* ==========================================
          HEADER SECTION (Bilingual, Role Status)
          ========================================== */}
      <header className="relative bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-950 text-white shadow-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="w-full max-w-[98%] xl:max-w-[95%] mx-auto px-4 md:px-8 py-6 relative flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{t.adminDashboardTitle}</h1>
              <p className="text-xs text-emerald-200/80 font-bold">{t.masjidName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.langToggle}</span>
            </button>

            {user && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 active:scale-95 text-xs font-bold transition-all cursor-pointer shadow-sm shadow-red-950/20"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.logoutBtn}</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ==========================================
          TOAST MODALS
          ========================================== */}
      {toast && (
        <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-50 animate-bounce">
          <div className={`p-4 rounded-2xl bg-white shadow-2xl border ${
            toast.type === "success" ? "border-emerald-200" : "border-red-200"
          }`}>
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              }`}>
                {toast.type === "success" ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900">{toast.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 p-1 self-start cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          1. UNAUTHENTICATED LOGIN BOARD
          ========================================== */}
      {!user ? (
        <main className="max-w-md mx-auto px-4 mt-12">
          <div className="bg-white rounded-3xl p-6 border border-emerald-100/40 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-50/40 rounded-full -mr-8 -mt-8 blur-lg"></div>

            <div className="text-center border-b border-gray-100 pb-5 mb-5">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-3">{t.loginTitle}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-semibold">{t.loginDesc}</p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.emailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400 shadow-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.passwordLabel}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400 shadow-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer font-sans"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t.loggingInBtn}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>{t.loginBtn}</span>
                  </>
                )}
              </button>

            </form>
            
            <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-150 text-[10px] text-slate-500 font-semibold leading-relaxed flex gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <p>{t.testCredsNotice}</p>
            </div>

          </div>
        </main>
      ) : (
        
        // ==========================================
        // 2. AUTHENTICATED ADMIN CONTROL dashboard
        // ==========================================
        <main className="w-full max-w-[98%] xl:max-w-[95%] mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Left panel sidebar tabs */}
          <section className="md:col-span-1 space-y-2">
            
            <div className="p-4 rounded-3xl bg-white border border-emerald-100/40 shadow-sm text-center space-y-2">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto font-black text-sm uppercase">
                {adminProfile?.email.substring(0, 2)}
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 truncate leading-none">{adminProfile?.email}</h4>
                <span className="inline-block mt-2 text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-800 text-white leading-none shadow-sm shadow-emerald-950/20">
                  {adminProfile?.role === "superadmin" ? t.superAdminBadge : t.adminBadge}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-3 border border-emerald-100/40 shadow-sm flex flex-col gap-1">
              
              <button
                onClick={() => setActiveTab("pending")}
                className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "pending" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                <PlusCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{t.tabPending}</span>
              </button>

              <button
                onClick={() => setActiveTab("manual")}
                className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "manual" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                <Coins className="w-4.5 h-4.5 shrink-0" />
                <span>{t.tabManualIncome}</span>
              </button>

              <button
                onClick={() => setActiveTab("expense")}
                className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "expense" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                <Receipt className="w-4.5 h-4.5 shrink-0" />
                <span>{t.tabExpense}</span>
              </button>

              <button
                onClick={() => setActiveTab("notice")}
                className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "notice" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                <Bell className="w-4.5 h-4.5 shrink-0" />
                <span>{t.tabNotice}</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "reports" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                <BarChart3 className="w-4.5 h-4.5 shrink-0" />
                <span>{t.tabReports}</span>
              </button>

              <button
                onClick={() => setActiveTab("receipt_verification")}
                className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "receipt_verification" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                }`}
              >
                <Search className="w-4.5 h-4.5 shrink-0" />
                <span>{lang === "bn" ? "রশিদ যাচাইকরণ" : "Receipt Verification"}</span>
              </button>

              {/* SuperAdmin Gated Sidebar selectors */}
              {adminProfile?.role === "superadmin" && (
                <>
                  <button
                    onClick={() => setActiveTab("auditLogs")}
                    className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                      activeTab === "auditLogs" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    <Activity className="w-4.5 h-4.5 shrink-0 text-emerald-800" />
                    <span>{t.tabAuditLogs}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("superadmin")}
                    className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                      activeTab === "superadmin" ? "bg-emerald-50 text-emerald-800 shadow-inner animate-pulse" : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="w-4.5 h-4.5 shrink-0 text-emerald-800" />
                    <span>{t.tabSuperAdmin}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("settings")}
                    className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                      activeTab === "settings" ? "bg-emerald-50 text-emerald-800 shadow-inner" : "text-slate-600 hover:bg-gray-50"
                    }`}
                  >
                    <Settings className="w-4.5 h-4.5 shrink-0 text-emerald-800" />
                    <span>{lang === "bn" ? "স্বাক্ষরসমূহ" : "Signatures"}</span>
                  </button>
                </>
              )}

            </div>
          </section>

          {/* Right main panel display boards */}
          <section className="md:col-span-3">
            <div className="bg-white rounded-3xl p-6 border border-emerald-100/40 shadow-xl shadow-emerald-950/5 min-h-[460px]">
              
              {/* ========================================================
                  TAB: RECEIPT VERIFICATION (Global Quick Lookup Panel)
                  ======================================================== */}
              {activeTab === "receipt_verification" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Search className="w-5.5 h-5.5 text-emerald-600" />
                      <span>{lang === "bn" ? "রশিদ যাচাইকরণ" : "Receipt Verification"}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      {lang === "bn"
                        ? "যেকোনো দান বা ক্যাশ রশিদের আইডি (যেমন: REC-XXXXXX) দিয়ে সরাসরি তথ্য খুঁজুন"
                        : "Find any automated or cash receipt details using receipt ID (e.g. REC-XXXXXX)"}
                    </p>
                  </div>

                  <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200/60 shadow-inner flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                            {lang === "bn" ? "রশিদ আইডি অনুসন্ধান" : "Receipt ID Quick Lookup"}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            {lang === "bn"
                              ? "যেকোনো দান বা ক্যাশ রশিদের আইডি (যেমন: REC-XXXXXX) দিয়ে সরাসরি তথ্য খুঁজুন"
                              : "Find any automated or cash receipt details using receipt ID (e.g. REC-XXXXXX)"}
                          </p>
                        </div>
                      </div>
                      <div className="relative max-w-xs w-full">
                        <input
                          type="text"
                          placeholder={lang === "bn" ? "রশিদ আইডি (যেমন: REC-A7B8C9)..." : "Receipt ID (e.g., REC-A7B8C9)..."}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-slate-400 text-slate-800 transition-all shadow-sm"
                        />
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-2.5 w-4 h-4 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Display matched record in a premium card */}
                    {searchQuery.trim() !== "" && (() => {
                      const cleanedQuery = searchQuery.trim().toUpperCase();
                      const matchedRecord = allDonations.find(
                        (d) => d.receiptId?.toUpperCase() === cleanedQuery || d.id?.toUpperCase() === cleanedQuery
                      );

                      if (!matchedRecord) {
                        return (
                          <div className="p-3.5 text-center bg-white border border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 animate-pulse">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            <span>
                              {lang === "bn"
                                ? "কোনো ম্যাচিং রশিদ খুঁজে পাওয়া যায়নি।"
                                : "No matching transaction record found."}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm relative overflow-hidden transition-all hover:shadow-md animate-fadeIn">
                          {/* Background branding badge */}
                          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-emerald-50/30 rounded-full blur-xl pointer-events-none"></div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-100/80">
                                  {matchedRecord.receiptId}
                                </span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                  matchedRecord.status === "approved"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                                    : matchedRecord.status === "pending"
                                    ? "bg-amber-50 text-amber-700 border-amber-150"
                                    : "bg-red-50 text-red-700 border-red-150"
                                }`}>
                                  {matchedRecord.status === "approved"
                                    ? (lang === "bn" ? "অনুমোদিত" : "Approved")
                                    : matchedRecord.status === "pending"
                                    ? (lang === "bn" ? "যাচাইাধীন" : "Pending Review")
                                    : (lang === "bn" ? "প্রত্যাখ্যাত" : "Rejected")}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5 text-xs">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {lang === "bn" ? "দাতার নাম" : "Donor Name"}
                                  </p>
                                  <p className="font-extrabold text-slate-900 mt-0.5">
                                    {matchedRecord.isAnonymous ? (lang === "bn" ? "নাম প্রকাশে অনিচ্ছুক" : "Anonymous Donor") : matchedRecord.donorName || (lang === "bn" ? "নাম প্রকাশে অনিচ্ছুক" : "Anonymous Donor")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {lang === "bn" ? "দানের পরিমাণ" : "Donation Amount"}
                                  </p>
                                  <p className="font-black text-slate-950 mt-0.5">
                                    {formatCurrency(matchedRecord.amount, lang)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {lang === "bn" ? "দানের খাত" : "Category"}
                                  </p>
                                  <p className="font-bold text-emerald-800 mt-0.5">
                                    {translateCategory(matchedRecord.category, lang)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    {lang === "bn" ? "পেমেন্ট মাধ্যম" : "Payment Method"}
                                  </p>
                                  <p className="font-bold text-slate-500 uppercase mt-0.5 text-[10px]">
                                    {matchedRecord.paymentMethod} {matchedRecord.trxId && `(TrxID: ${matchedRecord.trxId})`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons on matched card */}
                            <div className="flex items-center gap-2 shrink-0">
                              {matchedRecord.status === "pending" && (
                                <>
                                  <button
                                    onClick={async () => {
                                      await handleApproveDonation(matchedRecord.id!);
                                    }}
                                    disabled={submitting}
                                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{lang === "bn" ? "অনুমোদন করুন" : "Approve"}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setClaimEditTarget(matchedRecord);
                                      setClaimEditAmount(matchedRecord.amount.toString());
                                    }}
                                    disabled={submitting}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                    <span>{lang === "bn" ? "টাকা সংশোধন" : "Edit Amount"}</span>
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await handleRejectDonation(matchedRecord.id!);
                                    }}
                                    disabled={submitting}
                                    className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>{lang === "bn" ? "প্রত্যাখ্যান" : "Reject"}</span>
                                  </button>
                                </>
                              )}
                              {matchedRecord.status === "approved" && (
                                <button
                                  onClick={async () => {
                                    await handleDownloadReceiptPdfDirectly(matchedRecord);
                                  }}
                                  disabled={downloadingReceiptId !== null}
                                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-[10px] flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                                >
                                  {downloadingReceiptId === matchedRecord.id ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>{lang === "bn" ? "ডাউনলোড হচ্ছে..." : "Downloading..."}</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileDown className="w-3.5 h-3.5" />
                                      <span>{lang === "bn" ? "রশিদ ডাউনলোড" : "Download PDF"}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 1: PENDING AUDIT LOGS & REJECTED CLAIMS
                  ======================================================== */}
              {activeTab === "pending" && (
                <div className="space-y-6">
                  
                  {/* Pending Audits Queue */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-150 pb-4 mb-4">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.auditTitle}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">{t.auditDesc}</p>
                    </div>

                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                        <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                        <p className="text-xs font-semibold">{t.loadingData}</p>
                      </div>
                    ) : pendingDonations.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 font-bold text-xs space-y-1">
                        <p>🎉</p>
                        <p>{t.auditNoData}</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-gray-150 text-slate-400 font-bold">
                              <th className="pb-3 px-2 font-semibold text-center">{t.auditDate}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.auditDonor}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.auditAmount}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.auditCategory}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.auditMethod}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.auditTrx}</th>
                              <th className="pb-3 px-2 font-semibold text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {pendingDonations.map((d) => (
                              <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-2 text-slate-500 whitespace-nowrap text-center">
                                  {formatDate(d.date, lang)}
                                </td>
                                <td className="py-3 px-2 font-bold text-slate-950 text-center">
                                  {d.isAnonymous ? t.anonymousName : d.donorName}
                                </td>
                                <td className="py-3 px-2 font-black text-slate-900 text-center">
                                  {formatCurrency(d.amount, lang)}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {translateCategory(d.category, lang)}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-center whitespace-nowrap uppercase font-bold text-slate-500 text-[10px]">
                                  {d.paymentMethod}
                                </td>
                                <td className="py-3 px-2 text-center font-mono font-bold text-slate-900 select-all">
                                  {d.trxId || "N/A"}
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <div className="flex justify-center gap-1.5">
                                    <button
                                      onClick={() => handleApproveDonation(d.id!)}
                                      disabled={submitting}
                                      className="px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-all active:scale-[0.97] cursor-pointer"
                                    >
                                      {t.approveBtn}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setClaimEditTarget(d);
                                        setClaimEditAmount(d.amount.toString());
                                      }}
                                      className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold transition-all active:scale-[0.97] cursor-pointer flex items-center gap-0.5"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>{t.editAmountBtn}</span>
                                    </button>
                                    <button
                                      onClick={() => handleRejectDonation(d.id!)}
                                      disabled={submitting}
                                      className="px-2 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition-all active:scale-[0.97] cursor-pointer"
                                    >
                                      {t.rejectBtn}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Super Admin Only: Rejected Logs Board View */}
                  {adminProfile?.role === "superadmin" && (
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                      <div className="pb-3 border-b border-gray-150">
                        <h2 className="text-base font-extrabold text-red-800 flex items-center gap-1.5">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span>{t.rejectedClaimsTitle}</span>
                        </h2>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">{t.rejectedClaimsDesc}</p>
                      </div>

                      {rejectedDonations.length === 0 ? (
                        <p className="text-center py-6 text-xs text-slate-400 font-bold">No rejected claims archived.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-center text-xs">
                            <thead>
                              <tr className="border-b border-gray-150 text-slate-400 font-semibold">
                                <th className="pb-2 px-1 font-semibold text-center">{t.auditDate}</th>
                                <th className="pb-2 px-1 font-semibold text-center">{t.auditDonor}</th>
                                <th className="pb-2 px-1 font-semibold text-center">{t.auditAmount}</th>
                                <th className="pb-2 px-1 font-semibold text-center">{t.auditCategory}</th>
                                <th className="pb-2 px-1 font-semibold text-center">{t.auditMethod}</th>
                                <th className="pb-2 px-1 font-semibold text-center">{t.auditTrx}</th>
                                <th className="pb-2 px-1 font-semibold text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {rejectedDonations.map((d) => (
                                <tr key={d.id} className="hover:bg-red-50/20 transition-colors">
                                  <td className="py-2.5 px-1 text-slate-500 whitespace-nowrap text-center">
                                    {formatDate(d.date, lang)}
                                  </td>
                                  <td className="py-2.5 px-1 font-bold text-slate-900 text-center">
                                    {d.isAnonymous ? t.anonymousName : d.donorName}
                                  </td>
                                  <td className="py-2.5 px-1 font-black text-red-700 text-center">
                                    {formatCurrency(d.amount, lang)}
                                  </td>
                                  <td className="py-2.5 px-1 text-center">
                                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                      {translateCategory(d.category, lang)}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-1 text-center uppercase font-bold text-slate-400">
                                    {d.paymentMethod}
                                  </td>
                                  <td className="py-2.5 px-1 text-center font-mono font-bold text-slate-900 select-all">
                                    {d.trxId || "N/A"}
                                  </td>
                                  <td className="py-2.5 px-1 text-center">
                                    <button
                                      onClick={() => handleDeleteDonationSubmit(d.id!)}
                                      className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* ========================================================
                  TAB 2: MANUAL CASH INCOME FORM & CRUD LEDGER
                  ======================================================== */}
              {activeTab === "manual" && (
                <div className="space-y-6">
                  
                  {/* Centered Form Layout */}
                  <div className="max-w-xl mx-auto space-y-4">
                    <div className="border-b border-gray-150 pb-4 mb-4 text-center">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.manualTitle}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">{t.manualDesc}</p>
                    </div>

                    <form onSubmit={handleAddManualIncome} className="space-y-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.donorLabel}</label>
                          <label className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={manIsAnonymous}
                              onChange={(e) => {
                                setManIsAnonymous(e.target.checked);
                                if (e.target.checked) setManDonorName("");
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{t.anonymousOpt}</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={manIsAnonymous ? "" : manDonorName}
                          disabled={manIsAnonymous}
                          onChange={(e) => setManDonorName(e.target.value)}
                          placeholder={manIsAnonymous ? t.anonymousName : t.donorPlaceholder}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400"
                          required={!manIsAnonymous}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.amountLabel}</label>
                          <input
                            type="number"
                            value={manAmount}
                            onChange={(e) => setManAmount(e.target.value)}
                            placeholder={t.amountPlaceholder}
                            className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400 shadow-sm"
                            min="1"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.categoryLabel}</label>
                          <select
                            value={manCategory}
                            onChange={(e) => setManCategory(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal text-slate-700 cursor-pointer"
                            required
                          >
                            <option value="" disabled>{t.categorySelect}</option>
                            <option value="jumma_collection">{t.catJumma}</option>
                            <option value="general_fund">{t.catGeneral}</option>
                            <option value="mosque_development">{t.catDevelopment}</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>{submitting ? t.savingBtn : t.addIncomeBtn}</span>
                      </button>
                    </form>
                  </div>

                  {/* Manual Cash Records CRUD list table */}
                  <div className="space-y-3 pt-6 border-t border-gray-150">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Manual Ledger Records</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-gray-150 text-slate-400 font-bold">
                            <th className="pb-3 px-2 font-semibold text-center">{t.auditDate}</th>
                            <th className="pb-3 px-2 font-semibold text-center">{t.auditDonor}</th>
                            <th className="pb-3 px-2 font-semibold text-center">{t.auditAmount}</th>
                            <th className="pb-3 px-2 font-semibold text-center">{t.auditCategory}</th>
                            <th className="pb-3 px-2 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {manualIncomes.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-2 text-slate-500 whitespace-nowrap text-center">
                                {formatDate(d.date, lang)}
                              </td>
                              <td className="py-3 px-2 font-bold text-slate-950 text-center">
                                {d.isAnonymous ? t.anonymousName : d.donorName}
                              </td>
                              <td className="py-3 px-2 font-black text-slate-900 text-center">
                                {formatCurrency(d.amount, lang)}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {translateCategory(d.category, lang)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleDownloadReceiptPdfDirectly(d)}
                                    className="text-emerald-600 hover:text-emerald-800 p-1 flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <FileDown className="w-4 h-4" />
                                    <span className="text-[10px] font-bold">PDF</span>
                                  </button>
                                  <button
                                    onClick={() => setEditingDonation(d)}
                                    className="text-slate-600 hover:text-slate-800 p-1 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDonationSubmit(d.id!)}
                                    className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================
                  TAB 3: EXPENSE MANAGEMENT WITH STORAGE UPLOADS
                  ======================================================== */}
              {activeTab === "expense" && (
                <div className="space-y-6">
                  
                  {/* Centered Form Layout */}
                  <div className="max-w-xl mx-auto space-y-4">
                    <div className="border-b border-gray-150 pb-4 mb-4 text-center">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.expenseTitle}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">{t.expenseDesc}</p>
                    </div>

                    <form onSubmit={handleAddExpense} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.expCategoryLabel}</label>
                          <select
                            value={expCategory}
                            onChange={(e) => setExpCategory(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal text-slate-700 cursor-pointer"
                            required
                          >
                            <option value="" disabled>{t.expCategorySelect}</option>
                            <option value="salary">{t.catSalary}</option>
                            <option value="utilities">{t.catUtility}</option>
                            <option value="maintenance">{t.catMaintenance}</option>
                            <option value="miscellaneous">{t.catMisc}</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.expAmountLabel}</label>
                          <input
                            type="number"
                            value={expAmount}
                            onChange={(e) => setExpAmount(e.target.value)}
                            placeholder={t.expAmountPlaceholder}
                            className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400 shadow-sm"
                            min="1"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.expDescLabel}</label>
                        <textarea
                          value={expDesc}
                          onChange={(e) => setExpDesc(e.target.value)}
                          placeholder={t.expDescPlaceholder}
                          className="w-full h-24 p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400 shadow-sm"
                          required
                        />
                      </div>

                      {/* File Upload Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.voucherLabel}</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                              <p className="mb-1.5 text-xs text-slate-500 font-semibold">
                                {expFile ? expFile.name : "Click to select voucher image"}
                              </p>
                              <p className="text-[10px] text-slate-400">PNG, JPG or JPEG only</p>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setExpFile(e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>{submitting ? t.savingBtn : t.addExpenseBtn}</span>
                      </button>
                    </form>
                  </div>

                  {/* Expense Records CRUD list table */}
                  <div className="space-y-3 pt-6 border-t border-gray-150">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">Expense Records</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-gray-150 text-slate-400 font-bold">
                            <th className="pb-3 px-2 font-semibold text-center">{t.auditDate}</th>
                            <th className="pb-3 px-2 font-semibold text-center">{t.expDescLabel}</th>
                            <th className="pb-3 px-2 font-semibold text-center">{t.expAmountLabel}</th>
                            <th className="pb-3 px-2 font-semibold text-center">{t.expCategoryLabel}</th>
                            <th className="pb-3 px-2 font-semibold text-center">Voucher</th>
                            <th className="pb-3 px-2 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {expenses.map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3 px-2 text-slate-500 whitespace-nowrap text-center font-medium">
                                {formatDate(e.date, lang)}
                              </td>
                              <td className="py-3 px-2 font-semibold text-slate-900 text-center leading-relaxed">
                                {e.description}
                              </td>
                              <td className="py-3 px-2 font-black text-red-600 text-center">
                                - {formatCurrency(e.amount, lang)}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                  {translateCategory(e.category, lang)}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center font-mono">
                                {e.voucherUrl ? (
                                  <a
                                    href={e.voucherUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-600 hover:underline font-bold text-[10px] flex items-center justify-center gap-0.5"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>View</span>
                                  </a>
                                ) : (
                                  <span className="text-slate-400 font-semibold">N/A</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => setEditingExpense(e)}
                                    className="text-slate-600 hover:text-slate-800 p-1 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteExpenseSubmit(e.id!)}
                                    className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================
                  TAB 4: PUBLISH NOTICE BOARD FORM & CRUD TABLE
                  ======================================================== */}
              {activeTab === "notice" && (
                <div className="space-y-6">
                  
                  {/* Centered Form Layout */}
                  <div className="max-w-xl mx-auto space-y-4">
                    <div className="border-b border-gray-150 pb-4 mb-4 text-center">
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.noticeTitle}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">{t.noticeDesc}</p>
                    </div>

                    <form onSubmit={handleAddNotice} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.noticeTitleLabel}</label>
                        <input
                          type="text"
                          value={notTitle}
                          onChange={(e) => setNotTitle(e.target.value)}
                          placeholder={t.noticeTitlePlaceholder}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400 shadow-sm"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.noticeContentLabel}</label>
                        <textarea
                          value={notContent}
                          onChange={(e) => setNotContent(e.target.value)}
                          placeholder={t.noticeContentPlaceholder}
                          className="w-full h-32 p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400 shadow-sm"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
                      >
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-4 h-4" />}
                        <span>{submitting ? t.savingBtn : t.publishBtn}</span>
                      </button>
                    </form>
                  </div>

                  {/* Notice Board list CRUD table */}
                  <div className="space-y-3 pt-6 border-t border-gray-150">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published Notices</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-gray-150 text-slate-400 font-bold">
                            <th className="pb-3 px-2 font-semibold text-center">{t.auditDate}</th>
                            <th className="pb-3 px-2 font-semibold text-center">{t.noticeTitleLabel}</th>
                            <th className="pb-3 px-2 font-semibold text-center w-1/2">{t.noticeContentLabel}</th>
                            <th className="pb-3 px-2 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {notices.map((n) => (
                            <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="py-3.5 px-2 text-slate-500 whitespace-nowrap text-center font-medium">
                                {formatDate(n.date, lang)}
                              </td>
                              <td className="py-3.5 px-2 font-bold text-slate-900 text-center leading-relaxed">
                                {n.title}
                              </td>
                              <td className="py-3.5 px-2 text-slate-600 text-center leading-relaxed max-w-xs truncate">
                                {n.content}
                              </td>
                              <td className="py-3.5 px-2 text-center">
                                <div className="flex justify-center gap-1.5">
                                  <button
                                    onClick={() => setEditingNotice(n)}
                                    className="text-slate-600 hover:text-slate-800 p-1 cursor-pointer"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNoticeSubmit(n.id!)}
                                    className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================
                  TAB 5: REPORTS & ANALYTICS UPGRADED (RECHARTS & Real PDF)
                  ======================================================== */}
              {activeTab === "reports" && (
                <div className="space-y-6">
                  <div className="border-b border-gray-150 pb-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.reportsTitle}</h2>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">{t.reportsDesc}</p>
                    </div>

                    {/* Filters and PDF statement action trigger side-by-side */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-stretch xl:self-auto flex-wrap">
                      <div className="flex flex-wrap gap-1">
                        {(["weekly", "monthly", "yearly", "all", "custom"] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setReportsFilter(filter)}
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                              reportsFilter === filter
                                ? "bg-emerald-600 text-white shadow-sm border border-emerald-650"
                                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {filter === "weekly" && t.filterWeekly}
                            {filter === "monthly" && t.filterMonthly}
                            {filter === "yearly" && t.filterYearly}
                            {filter === "all" && (lang === "bn" ? "সর্বমোট (All Time)" : "All Time")}
                            {filter === "custom" && t.filterCustom}
                          </button>
                        ))}
                      </div>

                      {reportsFilter === "custom" && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <input
                            type="date"
                            value={repStartDate}
                            onChange={(e) => setRepStartDate(e.target.value)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold max-w-[110px]"
                          />
                          <span className="text-slate-400 font-bold">-</span>
                          <input
                            type="date"
                            value={repEndDate}
                            onChange={(e) => setRepEndDate(e.target.value)}
                            className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-bold max-w-[110px]"
                          />
                        </div>
                      )}

                      <button
                        onClick={handleDownloadPdfReport}
                        disabled={downloadingPdf}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shrink-0"
                      >
                        {downloadingPdf ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{t.downloadingPdfBtn}</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-emerald-300" />
                            <span>{t.downloadPdfBtn}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Financial Overview Positions */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-50/40 rounded-full -mr-6 -mt-6"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Income</span>
                      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{formatCurrency(stats.totalIncome, lang)}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-red-100 shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-red-50/40 rounded-full -mr-6 -mt-6"></div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</span>
                      <p className="text-xl sm:text-2xl font-black text-red-600 mt-1">{formatCurrency(stats.totalExpenses, lang)}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-white/5 rounded-full -mr-6 -mt-6"></div>
                      <span className="text-[10px] font-bold text-emerald-200/80 uppercase tracking-wider">Net Balance BDT</span>
                      <p className="text-xl sm:text-2xl font-black mt-1">{formatCurrency(stats.netBalance, lang)}</p>
                    </div>
                  </div>

                  {/* Graphical Vector Charts Suite using Recharts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    
                    {/* Bar Chart: Collections vs Expenses by category keys */}
                    <div className="p-4 bg-white rounded-3xl border border-gray-150 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-gray-100 pb-2">Collections vs Expenses Breakdown</h4>
                      <div className="h-60 flex items-center justify-center">
                        {stats.totalIncome === 0 && stats.totalExpenses === 0 ? (
                          <p className="text-xs text-slate-400 font-bold">No BDT records to chart.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { name: "Collections", amount: stats.totalIncome },
                                { name: "Expenses", amount: stats.totalExpenses }
                              ]}
                              margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                              <Tooltip formatter={(value) => [`৳ ${Number(value).toLocaleString()}`, "Amount"]} />
                              <Bar dataKey="amount" fill="#047857" radius={[8, 8, 0, 0]} barSize={40}>
                                <Cell fill="#047857" />
                                <Cell fill="#b91c1c" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    {/* Pie Chart: Distributions of collections categories */}
                    <div className="p-4 bg-white rounded-3xl border border-gray-150 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-gray-100 pb-2">Collections Category Distributions</h4>
                      <div className="h-60 flex items-center justify-center">
                        {pieDataIncome.length === 0 ? (
                          <p className="text-xs text-slate-400 font-bold">No collections to distribute.</p>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieDataIncome}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }: any) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                                outerRadius={70}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {pieDataIncome.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `৳ ${Number(value).toLocaleString()}`} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Category-wise Tabular Breakdown Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-fadeIn">
                    {/* Collections Category List */}
                    <div className="p-4 bg-white rounded-3xl border border-slate-150 shadow-sm space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>{lang === "bn" ? "আদায়ের খাতওয়ারী তালিকা" : "Collections Category Breakdown"}</span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                          {lang === "bn" ? "মোট আয়" : "Total Income"}
                        </span>
                      </h4>
                      <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                              <th className="py-2.5 px-3 font-semibold">{lang === "bn" ? "খাত" : "Category"}</th>
                              <th className="py-2.5 px-3 font-semibold text-right">{lang === "bn" ? "পরিমাণ" : "Amount"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {[
                              { key: "jumma_collection", label: lang === "bn" ? "জুমা আদায়" : "Jumma Collection" },
                              { key: "general_fund", label: lang === "bn" ? "সাধারণ দান (লিল্লাহ)" : "General Donation" },
                              { key: "mosque_development", label: lang === "bn" ? "মসজিদ উন্নয়ন" : "Mosque Development" }
                            ].map((cat) => {
                              const amount = stats.incomeByCategory[cat.key] || 0;
                              return (
                                <tr key={cat.key} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-2 px-3 font-extrabold text-slate-800">{cat.label}</td>
                                  <td className="py-2 px-3 font-black text-slate-900 text-right">{formatCurrency(amount, lang)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Expenses Category List */}
                    <div className="p-4 bg-white rounded-3xl border border-slate-150 shadow-sm space-y-3">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span>{lang === "bn" ? "খরচের খাতওয়ারী তালিকা" : "Expenses Category Breakdown"}</span>
                        <span className="text-[10px] text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100/50">
                          {lang === "bn" ? "মোট ব্যয়" : "Total Expenses"}
                        </span>
                      </h4>
                      <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                              <th className="py-2.5 px-3 font-semibold">{lang === "bn" ? "খাত" : "Category"}</th>
                              <th className="py-2.5 px-3 font-semibold text-right">{lang === "bn" ? "পরিমাণ" : "Amount"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {[
                              { key: "salary", label: lang === "bn" ? "ভাতা / সম্মানী" : "Allowance / Salary" },
                              { key: "utilities", label: lang === "bn" ? "বিদ্যুৎ / ইউটিলিটি বিল" : "Utilities" },
                              { key: "maintenance", label: lang === "bn" ? "মেরামত ও রক্ষণাবেক্ষণ" : "Repairs & Maintenance" },
                              { key: "miscellaneous", label: lang === "bn" ? "অন্যান্য খরচ" : "Miscellaneous" }
                            ].map((cat) => {
                              const amount = stats.expenseByCategory[cat.key] || 0;
                              return (
                                <tr key={cat.key} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-2 px-3 font-extrabold text-slate-800">{cat.label}</td>
                                  <td className="py-2 px-3 font-black text-red-600 text-right">{formatCurrency(amount, lang)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 7: ACTIVITY & AUDIT LOGS (Super Admin Accountability)
                  ======================================================== */}
              {activeTab === "auditLogs" && adminProfile?.role === "superadmin" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-5.5 h-5.5 text-emerald-600" />
                      <span>{t.auditLogsTitle}</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.auditLogsDesc}</p>
                  </div>

                  {/* Audit Logs Filter Dashboard */}
                  <div className="p-4 bg-gray-50 border border-gray-150 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    
                    {/* Admin Dropdown Filter */}
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-600 block">{t.logFilterEmail}</span>
                      <select
                        value={logFilterEmail}
                        onChange={(e) => setLogFilterEmail(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-gray-200 bg-white font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="all">{t.logFilterAll}</option>
                        {allAdmins.map(adm => (
                          <option key={adm.id} value={adm.email}>{adm.email}</option>
                        ))}
                      </select>
                    </div>

                    {/* Action Type Dropdown Filter */}
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-600 block">{lang === "bn" ? "অ্যাকশন টাইপ ফিল্টার:" : "Action Type:"}</span>
                      <select
                        value={logFilterAction}
                        onChange={(e) => setLogFilterAction(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-gray-200 bg-white font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="all">{lang === "bn" ? "সকল অ্যাকশন" : "All Actions"}</option>
                        <option value="create">{lang === "bn" ? "যোগ করা (Create)" : "Create"}</option>
                        <option value="update">{lang === "bn" ? "পরিবর্তন করা (Update)" : "Update"}</option>
                        <option value="delete">{lang === "bn" ? "অপসারণ করা (Delete)" : "Delete"}</option>
                        <option value="approve">{lang === "bn" ? "অনুমোদন (Approve)" : "Approve"}</option>
                        <option value="reject">{lang === "bn" ? "প্রত্যাখ্যান (Reject)" : "Reject"}</option>
                      </select>
                    </div>

                    {/* Date logs filters */}
                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-600 block">Log Start Date:</span>
                      <input
                        type="date"
                        value={logStartDate}
                        onChange={(e) => setLogStartDate(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-gray-200 bg-white font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="font-extrabold text-slate-600 block">Log End Date:</span>
                      <input
                        type="date"
                        value={logEndDate}
                        onChange={(e) => setLogEndDate(e.target.value)}
                        className="w-full h-9 px-2 rounded-lg border border-gray-200 bg-white font-bold"
                      />
                    </div>

                  </div>

                  {/* Audit Logs chronological listing */}
                  {filteredAuditLogs.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-bold text-xs space-y-1">
                      <p>📋</p>
                      <p>{t.logNoData}</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l-2 border-emerald-100 space-y-6 ml-3 py-2">
                      {filteredAuditLogs.map((log) => (
                        <div key={log.id} className="relative group animate-fadeIn">
                          {/* Timeline node icon */}
                          <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                            log.actionType === "approve" ? "border-emerald-650 ring-4 ring-emerald-50" :
                            log.actionType === "create" ? "border-sky-650 ring-4 ring-sky-50" :
                            log.actionType === "update" ? "border-purple-650 ring-4 ring-purple-50" :
                            log.actionType === "reject" ? "border-amber-650 ring-4 ring-amber-50" :
                            "border-red-650 ring-4 ring-red-50"
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              log.actionType === "approve" ? "bg-emerald-600" :
                              log.actionType === "create" ? "bg-sky-600" :
                              log.actionType === "update" ? "bg-purple-600" :
                              log.actionType === "reject" ? "bg-amber-650" :
                              "bg-red-600"
                            }`}></div>
                          </div>

                          {/* Log content bubble */}
                          <div className="p-4 rounded-2xl bg-white border border-slate-150 shadow-sm hover:shadow-md hover:border-emerald-150 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-black text-slate-900 block truncate">{log.adminEmail}</span>
                                <span className={`text-[8.5px] px-2 py-0.5 rounded-full font-black uppercase ${
                                  log.actionType === "approve" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                  log.actionType === "create" ? "bg-sky-50 text-sky-700 border border-sky-100" :
                                  log.actionType === "update" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                  log.actionType === "reject" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                  "bg-red-50 text-red-700 border border-red-100"
                                }`}>
                                  {log.actionType}
                                </span>
                                <span className="text-slate-400 font-semibold uppercase text-[9px]">{log.collectionName}</span>
                              </div>
                              <p className="text-slate-600 font-semibold leading-relaxed">{log.details}</p>
                            </div>

                            <div className="text-slate-400 font-bold uppercase tracking-wider text-[9px] shrink-0 whitespace-nowrap self-start sm:self-center flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.timestamp.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* ========================================================
                  TAB 8: SUPER ADMIN AUTHORITY ACCOUNT ROLES MANAGER
                  ======================================================== */}
              {activeTab === "superadmin" && adminProfile?.role === "superadmin" && (
                <div className="space-y-6">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.superTitle}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.superDesc}</p>
                  </div>

                  {/* Add Admin Mappings */}
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 max-w-4xl mx-auto">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">{t.addAdminTitle}</h3>
                    <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder={t.adminEmailPlaceholder}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400"
                          required
                        />
                      </div>

                      <div className="flex-1">
                        <input
                          type="password"
                          value={newAdminPassword}
                          onChange={(e) => setNewAdminPassword(e.target.value)}
                          placeholder={lang === "bn" ? "পাসওয়ার্ড দিন" : "Enter Password"}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-normal placeholder-slate-400"
                          required
                        />
                      </div>
                      
                      <div className="w-full">
                        <select
                          value={newAdminRole}
                          onChange={(e) => setNewAdminRole(e.target.value as any)}
                          className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-slate-700 shadow-sm"
                        >
                          <option value="admin">{t.roleAdmin}</option>
                          <option value="superadmin">{t.roleSuperAdmin}</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                      >
                        <User className="w-4 h-4" />
                        <span>{t.addAdminBtn}</span>
                      </button>
                    </form>
                  </div>

                  {/* List Mapped Admins */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.adminListTitle}</h3>
                    {loading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
                        {allAdmins.map((adm) => (
                          <div key={adm.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-slate-900">{adm.email}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                adm.role === "superadmin" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {adm.role === "superadmin" ? "Super" : "Admin"}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2.5 flex-wrap">
                              {/* Toggle Role Button */}
                              <button
                                onClick={() => handleToggleAdminRole(adm)}
                                disabled={submitting}
                                className="text-xs font-bold text-slate-600 hover:text-emerald-750 px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title={lang === "bn" ? "ভূমিকা পরিবর্তন করুন" : "Change Role"}
                              >
                                <Shield className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{lang === "bn" ? "ভূমিকা পরিবর্তন" : "Change Role"}</span>
                              </button>

                              {/* Reset Password Button */}
                              <button
                                onClick={() => handleResetAdminPassword(adm.email)}
                                disabled={submitting}
                                className="text-xs font-bold text-slate-600 hover:text-sky-750 px-2 py-1 rounded-lg border border-slate-200 hover:border-sky-200 hover:bg-sky-50 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title={lang === "bn" ? "পাসওয়ার্ড রিসেট ইমেইল পাঠান" : "Send Reset Email"}
                              >
                                <Lock className="w-3.5 h-3.5 text-sky-700" />
                                <span>{lang === "bn" ? "পাসওয়ার্ড রিসেট" : "Reset Password"}</span>
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => handleRemoveAdmin(adm.id!, adm.email)}
                                disabled={submitting}
                                className="text-xs font-bold text-red-650 hover:text-red-800 px-2 py-1 rounded-lg border border-red-100 hover:border-red-200 hover:bg-red-50 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                <span>{t.removeBtn}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 9: SUPER ADMIN SYSTEM SETTINGS & DIGITAL SIGNATURES
                  ======================================================== */}
              {activeTab === "settings" && adminProfile?.role === "superadmin" && (
                <div className="space-y-6">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {lang === "bn" ? "সিস্টেম সেটিংস ও ডিজিটাল স্বাক্ষর" : "System Settings & Digital Signatures"}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">
                      {lang === "bn"
                        ? "সুপার অ্যাডমিনদের জন্য। মসজিদ কমিটির সভাপতি ও ক্যাশিয়ারের ডিজিটাল স্বাক্ষর ছবি আপলোড করুন।"
                        : "For Super Admins. Upload dynamic signature images for the Committee President & Treasurer."}
                    </p>
                  </div>

                  <form onSubmit={handleSaveSignatures} className="space-y-6 max-w-xl mx-auto">
                    {/* President Signature Image */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        {lang === "bn" ? "মসজিদ কমিটি সভাপতির স্বাক্ষর (সর্বোচ্চ ৫০০KB)" : "Mosque Committee President Signature (Max 500KB)"}
                      </label>
                      
                      {globalSettings?.presidentSignatureUrl && (
                        <div className="p-3 border border-emerald-100 rounded-xl bg-emerald-50/20 max-w-[200px] mb-2">
                          <p className="text-[9px] font-bold text-emerald-800 mb-1 uppercase tracking-wider">Active Signature:</p>
                          <img src={globalSettings.presidentSignatureUrl} alt="President Active Sig" className="h-10 object-contain" />
                        </div>
                      )}

                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden">
                          <div className="flex flex-col items-center justify-center pt-4 pb-4">
                            <UploadCloud className="w-7 h-7 mb-2 text-slate-400" />
                            <p className="mb-1 text-xs text-slate-500 font-semibold">
                              {presSigFile ? presSigFile.name : (lang === "bn" ? "সভাপতির স্বাক্ষর ফাইল নির্বাচন করুন" : "Click to select President's signature")}
                            </p>
                            <p className="text-[9px] text-slate-400">PNG, JPG or JPEG only (&lt; 500KB)</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={presSigInputRef}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                if (file.size > 500 * 1024) {
                                  triggerToast("error", t.saveError, lang === "bn" ? "ফাইলের সাইজ ৫০০KB এর কম হতে হবে!" : "File size must be less than 500KB!");
                                } else {
                                  setPresSigFile(file);
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Treasurer Signature Image */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        {lang === "bn" ? "মসজিদ কোষাধ্যক্ষ / ক্যাশিয়ারের স্বাক্ষর (সর্বোচ্চ ৫০০KB)" : "Mosque Treasurer / Cashier Signature (Max 500KB)"}
                      </label>
                      
                      {globalSettings?.treasurerSignatureUrl && (
                        <div className="p-3 border border-emerald-100 rounded-xl bg-emerald-50/20 max-w-[200px] mb-2">
                          <p className="text-[9px] font-bold text-emerald-800 mb-1 uppercase tracking-wider">Active Signature:</p>
                          <img src={globalSettings.treasurerSignatureUrl} alt="Treasurer Active Sig" className="h-10 object-contain" />
                        </div>
                      )}

                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden">
                          <div className="flex flex-col items-center justify-center pt-4 pb-4">
                            <UploadCloud className="w-7 h-7 mb-2 text-slate-400" />
                            <p className="mb-1 text-xs text-slate-500 font-semibold">
                              {treasSigFile ? treasSigFile.name : (lang === "bn" ? "ক্যাশিয়ারের স্বাক্ষর ফাইল নির্বাচন করুন" : "Click to select Treasurer's signature")}
                            </p>
                            <p className="text-[9px] text-slate-400">PNG, JPG or JPEG only (&lt; 500KB)</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={treasSigInputRef}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                if (file.size > 500 * 1024) {
                                  triggerToast("error", t.saveError, lang === "bn" ? "ফাইলের সাইজ ৫০০KB এর কম হতে হবে!" : "File size must be less than 500KB!");
                                } else {
                                  setTreasSigFile(file);
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 disabled:cursor-not-allowed text-white font-bold text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {savingSettings ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{lang === "bn" ? "স্বাক্ষর সংরক্ষণ হচ্ছে..." : "Saving Signatures..."}</span>
                        </>
                      ) : (
                        <span>{lang === "bn" ? "স্বাক্ষর ফাইল সংরক্ষণ করুন" : "Save Signature Configurations"}</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </section>

        </main>
      )}

      {/* ========================================================
          EDIT MODAL: DONATION (MANUAL CASH RECORD)
          ======================================================== */}
      {editingDonation && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setEditingDonation(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 border-b border-gray-150 pb-3 mb-4">Edit Manual Donation Record</h3>
            <form onSubmit={handleUpdateDonationSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Donor Name</label>
                <input
                  type="text"
                  value={editingDonation.donorName || ""}
                  disabled={editingDonation.isAnonymous}
                  onChange={(e) => setEditingDonation({ ...editingDonation, donorName: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 font-normal placeholder-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Amount (৳)</label>
                  <input
                    type="number"
                    value={editingDonation.amount}
                    onChange={(e) => setEditingDonation({ ...editingDonation, amount: Number(e.target.value) })}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 font-normal"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Category</label>
                  <select
                    value={editingDonation.category}
                    onChange={(e) => setEditingDonation({ ...editingDonation, category: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 text-xs font-normal"
                    required
                  >
                    <option value="jumma_collection">{t.catJumma}</option>
                    <option value="general_fund">{t.catGeneral}</option>
                    <option value="mosque_development">{t.catDevelopment}</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL: EXPENSE RECORD
          ======================================================== */}
      {editingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setEditingExpense(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 border-b border-gray-150 pb-3 mb-4">Edit Expense Record</h3>
            <form onSubmit={handleUpdateExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Category</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 text-xs font-normal"
                    required
                  >
                    <option value="salary">{t.catSalary}</option>
                    <option value="utilities">{t.catUtility}</option>
                    <option value="maintenance">{t.catMaintenance}</option>
                    <option value="miscellaneous">{t.catMisc}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Amount (৳)</label>
                  <input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 font-normal"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Description</label>
                <textarea
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full h-24 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 font-normal"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT MODAL: NOTICE BOARD announcement
          ======================================================== */}
      {editingNotice && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setEditingNotice(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 border-b border-gray-150 pb-3 mb-4">Edit Published Notice</h3>
            <form onSubmit={handleUpdateNoticeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Notice Title</label>
                <input
                  type="text"
                  value={editingNotice.title}
                  onChange={(e) => setEditingNotice({ ...editingNotice, title: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 font-normal"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Content / Declaration</label>
                <textarea
                  value={editingNotice.content}
                  onChange={(e) => setEditingNotice({ ...editingNotice, content: e.target.value })}
                  className="w-full h-32 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 font-normal"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving changes..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT CLAIM AMOUNT BEFORE APPROVAL
          ======================================================== */}
      {claimEditTarget && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 relative">
            <button
              onClick={() => setClaimEditTarget(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 border-b border-gray-150 pb-3 mb-4 flex items-center gap-1.5">
              <Edit className="w-5 h-5 text-emerald-600" />
              <span>Correct Claim Amount BDT</span>
            </h3>
            
            <form onSubmit={handleSaveClaimAmount} className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Donor Claimant:</span>
                <p className="text-xs font-bold text-slate-900 bg-gray-50 p-2 rounded-lg border border-gray-150">
                  {claimEditTarget.isAnonymous ? t.anonymousName : claimEditTarget.donorName}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Correct Amount (৳)</label>
                <input
                  type="number"
                  value={claimEditAmount}
                  onChange={(e) => setClaimEditAmount(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 font-normal text-sm"
                  min="1"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Corrected Amount"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: MANUAL CASH SAVED SUCCESS (Instant Receipt pdf)
          ======================================================== */}
      {recentSavedCash && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-emerald-100 text-center space-y-4 relative">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <Check className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">Cash Record Committed!</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                The manual cash record has been officially registered and verified in the transparent ledger.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-150 rounded-2xl text-xs space-y-1 font-bold text-slate-700 max-w-xs mx-auto">
              <p>Amount: {formatCurrency(recentSavedCash.amount, lang)}</p>
              <p className="text-[10px] text-slate-400 font-semibold">Category: {translateCategory(recentSavedCash.category, lang)}</p>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  handleDownloadReceiptPdfDirectly(recentSavedCash);
                }}
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadReceiptBtn}</span>
              </button>
              <button
                onClick={() => setRecentSavedCash(null)}
                className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Hidden A4 HTML template for high-fidelity PDF Financial Statement generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div
            id="statement-pdf-template"
            className="w-[794px] p-8 flex flex-col font-sans"
            style={{ minHeight: "1123px", backgroundColor: "#ffffff", color: "#1e293b", border: "1px solid #e5e7eb" }}
          >
            {/* Header (Green Background) */}
            <div className="p-6 rounded-t-xl text-center" style={{ backgroundColor: "#065f46", color: "#ffffff" }}>
              <h1 className="text-2xl font-bold tracking-wide uppercase">Subedar Jame Masjid Al Khawari</h1>
              <p className="text-xs mt-1 font-normal" style={{ color: "#a7f3d0" }}>South Mirer Khil, Hathazari, Chattogram, Bangladesh</p>
            </div>

            {/* Statement Body */}
            <div className="flex-grow p-6 flex flex-col space-y-6">
              {/* Title Block */}
              <div className="text-center mt-2">
                <div className="py-3 rounded-lg font-extrabold tracking-widest text-base uppercase" style={{ backgroundColor: "#065f46", color: "#ffffff" }}>
                  Financial Statement Report
                </div>
              </div>

              {/* Sub-header Row */}
              <div className="flex justify-between items-center text-xs font-semibold p-4 rounded-xl" style={{ color: "#475569", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <span>REPORT PERIOD: <strong style={{ color: "#0f172a" }}>{reportsFilter === "weekly" ? "Last 7 Days" : reportsFilter === "monthly" ? "Last 30 Days" : reportsFilter === "yearly" ? "Last 365 Days" : reportsFilter === "custom" ? `Custom: ${repStartDate || "Inception"} to ${repEndDate || "Present"}` : "All Time"}</strong></span>
                <span>Download Date: <strong style={{ color: "#0f172a" }}>{(() => { const today = new Date(); const dd = String(today.getDate()).padStart(2, '0'); const mm = String(today.getMonth() + 1).padStart(2, '0'); const yyyy = today.getFullYear(); return `${dd}-${mm}-${yyyy}`; })()}</strong></span>
              </div>

              {/* Stat Boxes */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl text-center space-y-1.5" style={{ border: "1px solid #ccfbf1", backgroundColor: "rgba(240, 253, 250, 0.3)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#115e59" }}>Total Income</span>
                  <span className="text-base font-black block" style={{ color: "#0d9488" }}>৳{stats.totalIncome.toLocaleString()}.00</span>
                </div>
                <div className="p-4 rounded-2xl text-center space-y-1.5" style={{ border: "1px solid #fee2e2", backgroundColor: "rgba(254, 242, 242, 0.2)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#991b1b" }}>Total Expense</span>
                  <span className="text-base font-black block" style={{ color: "#dc2626" }}>৳{stats.totalExpenses.toLocaleString()}.00</span>
                </div>
                <div className="p-4 rounded-2xl text-center space-y-1.5" style={{ border: "1px solid #e2e8f0", backgroundColor: "#065f46", color: "#ffffff" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "#d1fae5" }}>Net Balance</span>
                  <span className="text-base font-black block">৳{stats.netBalance.toLocaleString()}.00</span>
                </div>
              </div>

              {/* Breakdown Tables (Collections & Expenditures) */}
              <div className="grid grid-cols-2 gap-6 pt-2">
                {/* Income Breakdown */}
                <div className="space-y-3">
                  <div className="py-2 px-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-center" style={{ backgroundColor: "#065f46", color: "#ffffff" }}>
                    Collections Category Breakdown
                  </div>
                  <table className="w-full text-left text-xs" style={{ tableLayout: "fixed" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                        <th className="py-2 font-bold uppercase" style={{ width: "65%" }}>Category Name</th>
                        <th className="py-2 text-right font-bold uppercase" style={{ width: "35%" }}>BDT Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.incomeByCategory).map(([cat, amt]) => (
                        <tr key={cat} style={{ borderBottom: "1px solid rgba(241, 245, 249, 0.5)" }}>
                          <td className="py-2.5 font-medium truncate" style={{ color: "#475569" }}>{translateCategory(cat, "en")}</td>
                          <td className="py-2.5 text-right font-bold" style={{ color: "#1e293b" }}>৳{amt.toLocaleString()}</td>
                        </tr>
                      ))}
                      {Object.keys(stats.incomeByCategory).length === 0 && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center font-bold" style={{ color: "#94a3b8" }}>No collections in this range.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Expense Breakdown */}
                <div className="space-y-3">
                  <div className="py-2 px-3 rounded-lg text-xs font-extrabold uppercase tracking-wider text-center" style={{ backgroundColor: "#991b1b", color: "#ffffff" }}>
                    Expenditures Category Breakdown
                  </div>
                  <table className="w-full text-left text-xs" style={{ tableLayout: "fixed" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #f1f5f9", color: "#64748b" }}>
                        <th className="py-2 font-bold uppercase" style={{ width: "65%" }}>Expense Category</th>
                        <th className="py-2 text-right font-bold uppercase" style={{ width: "35%" }}>BDT Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.expenseByCategory).map(([cat, amt]) => (
                        <tr key={cat} style={{ borderBottom: "1px solid rgba(241, 245, 249, 0.5)" }}>
                          <td className="py-2.5 font-medium truncate" style={{ color: "#475569" }}>{translateCategory(cat, "en")}</td>
                          <td className="py-2.5 text-right font-bold" style={{ color: "#1e293b" }}>৳{amt.toLocaleString()}</td>
                        </tr>
                      ))}
                      {Object.keys(stats.expenseByCategory).length === 0 && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center font-bold" style={{ color: "#94a3b8" }}>No expenditures in this range.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs font-semibold mt-auto" style={{ color: "#475569" }}>
                <div className="flex flex-col items-center justify-end space-y-1">
                  {globalSettings?.treasurerSignatureUrl ? (
                    <img
                      src={globalSettings.treasurerSignatureUrl}
                      alt="Treasurer Signature"
                      className="h-12 object-contain mb-1 select-none pointer-events-none"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-12 w-3/4 mb-1" style={{ borderBottom: "1px dashed #cbd5e1" }} />
                  )}
                  <div className="w-full pt-1.5" style={{ borderTop: "1px solid #e2e8f0" }}>
                    <span className="block font-bold text-slate-800">Treasurer</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end space-y-1">
                  {globalSettings?.presidentSignatureUrl ? (
                    <img
                      src={globalSettings.presidentSignatureUrl}
                      alt="President Signature"
                      className="h-12 object-contain mb-1 select-none pointer-events-none"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-12 w-3/4 mb-1" style={{ borderBottom: "1px dashed #cbd5e1" }} />
                  )}
                  <div className="w-full pt-1.5" style={{ borderTop: "1px solid #e2e8f0" }}>
                    <span className="block font-bold text-slate-800">President</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 rounded-b-xl text-center text-[10px] leading-relaxed" style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", color: "#475569" }}>
              <p className="font-semibold">Subedar Jame Masjid Al Khawari Management Committee</p>
            </div>
          </div>
        </div>

        {/* Hidden A5 HTML template for high-fidelity PDF Cash Receipt generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div
            id="receipt-pdf-template"
            className="w-[595px] p-8 flex flex-col font-sans"
            style={{ minHeight: "842px", backgroundColor: "#ffffff", color: "#1e293b", border: "1px solid #e5e7eb" }}
          >
            {/* Header (Green Background) */}
            <div className="p-5 rounded-t-xl text-center" style={{ backgroundColor: "#065f46", color: "#ffffff" }}>
              <h1 className="text-xl font-bold tracking-wide uppercase">Subedar Jame Masjid Al Khawari</h1>
              <p className="text-[10px] mt-1 font-normal" style={{ color: "#a7f3d0" }}>South Mirer Khil, Hathazari, Chattogram, Bangladesh</p>
            </div>

            {/* Receipt Body */}
            <div className="flex-grow p-6 flex flex-col space-y-6">
              {/* Title Block */}
              <div className="text-center mt-2">
                <div className="py-2.5 rounded-lg font-extrabold tracking-wider text-sm uppercase" style={{ backgroundColor: "#065f46", color: "#ffffff" }}>
                  CASH RECEIPT
                </div>
              </div>

              {/* Sub-header Row */}
              <div className="flex justify-between items-center text-xs font-semibold p-3 rounded-lg" style={{ color: "#475569", backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <span>Receipt ID: <strong style={{ color: "#0f172a" }}>{pdfReceiptData ? pdfReceiptData.receiptId : ""}</strong></span>
                <span>Download Date: <strong style={{ color: "#0f172a" }}>{(() => { const today = new Date(); const dd = String(today.getDate()).padStart(2, '0'); const mm = String(today.getMonth() + 1).padStart(2, '0'); const yyyy = today.getFullYear(); return `${dd}-${mm}-${yyyy}`; })()}</strong></span>
              </div>

              {/* Grid/Table Details */}
              <div className="rounded-xl overflow-hidden shadow-sm" style={{ border: "1px solid #f1f5f9" }}>
                <table className="w-full text-xs text-left" style={{ borderCollapse: "collapse" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                      <td className="p-3.5 font-bold uppercase w-1/3" style={{ color: "#64748b" }}>Donor Name:</td>
                      <td className="p-3.5 font-semibold" style={{ color: "#1e293b" }}>
                        {pdfReceiptData ? (pdfReceiptData.isAnonymous ? "Anonymous Donor (Nam Prokash e Onicchuk)" : pdfReceiptData.donorName || "Anonymous") : ""}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="p-3.5 font-bold uppercase" style={{ color: "#64748b" }}>Donation Category:</td>
                      <td className="p-3.5 font-semibold" style={{ color: "#1e293b" }}>
                        {pdfReceiptData ? translateCategory(pdfReceiptData.category, "en") : ""}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                      <td className="p-3.5 font-bold uppercase" style={{ color: "#64748b" }}>Payment Method:</td>
                      <td className="p-3.5 font-semibold uppercase" style={{ color: "#1e293b" }}>
                        {pdfReceiptData ? pdfReceiptData.paymentMethod.toUpperCase() : ""}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="p-3.5 font-bold uppercase" style={{ color: "#64748b" }}>Transaction ID:</td>
                      <td className="p-3.5 font-mono font-semibold" style={{ color: "#1e293b" }}>
                        {pdfReceiptData ? (pdfReceiptData.trxId || "N/A (Cash Entry)") : ""}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
                      <td className="p-3.5 font-bold uppercase" style={{ color: "#64748b" }}>Payment Date:</td>
                      <td className="p-3.5 font-semibold" style={{ color: "#1e293b" }}>
                        {pdfReceiptData ? pdfReceiptData.date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : ""}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="p-3.5 font-bold uppercase" style={{ color: "#64748b" }}>Approval Date:</td>
                      <td className="p-3.5 font-semibold" style={{ color: "#1e293b" }}>
                        {pdfReceiptData ? pdfReceiptData.date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Amount Box */}
              <div className="rounded-xl p-4 text-center space-y-1.5" style={{ backgroundColor: "#f0fdfa", border: "2px solid #55b699", color: "#115e59" }}>
                <span className="text-[11px] font-bold uppercase tracking-wider block">Total Donation Amount</span>
                <span className="text-xl font-extrabold block">
                  ৳{pdfReceiptData ? pdfReceiptData.amount.toLocaleString() : "0"}.00
                </span>
              </div>

              {/* Verification */}
              <div className="flex justify-center mt-2">
                <div className="px-5 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 shadow-sm" style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#047857" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#059669" }} />
                  <span>Verified & Received</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-[10px] font-semibold mt-auto" style={{ color: "#475569" }}>
                <div className="flex flex-col items-center justify-end space-y-1">
                  {globalSettings?.treasurerSignatureUrl ? (
                    <img
                      src={globalSettings.treasurerSignatureUrl}
                      alt="Treasurer Signature"
                      className="h-12 object-contain mb-1 select-none pointer-events-none"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-12 w-3/4 mb-1" style={{ borderBottom: "1px dashed #cbd5e1" }} />
                  )}
                  <div className="w-full pt-1.5" style={{ borderTop: "1px solid #e2e8f0" }}>
                    <span className="block font-bold text-slate-800">Treasurer</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-end space-y-1">
                  {globalSettings?.presidentSignatureUrl ? (
                    <img
                      src={globalSettings.presidentSignatureUrl}
                      alt="President Signature"
                      className="h-12 object-contain mb-1 select-none pointer-events-none"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="h-12 w-3/4 mb-1" style={{ borderBottom: "1px dashed #cbd5e1" }} />
                  )}
                  <div className="w-full pt-1.5" style={{ borderTop: "1px solid #e2e8f0" }}>
                    <span className="block font-bold text-slate-800">President</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 rounded-b-xl text-center text-[9px] leading-relaxed" style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", color: "#64748b" }}>
              <p className="font-semibold">Thank you for your donation. Jazakallah Khairan.</p>
              <p className="text-[9px] mt-0.5" style={{ color: "#475569" }}>Subedar Jame Masjid Al Khawari Management Committee</p>
            </div>
          </div>
        </div>

    </div>
  );
}
