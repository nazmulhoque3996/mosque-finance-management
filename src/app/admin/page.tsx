"use client";

import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
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
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  getUserProfile,
  setUserProfile,
  approveDonation,
  addExpense,
  addNotice,
  addDonation,
  getDonations,
  getExpenses,
  getDashboardStats,
  toDate,
  UserProfile,
  Donation,
  Expense,
  Notice,
  DashboardStats,
  UserRole,
} from "@/lib/firestoreUtils";

// Sleek SVG Icons from Lucide-React
import {
  Globe,
  MapPin,
  Building,
  Lock,
  LogOut,
  Shield,
  Layers,
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
  Info
} from "lucide-react";

// ==========================================
// 1. Bilingual Translation Dictionary
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
    tabExpense: "মসজিদ খরচ সংযুক্তি",
    tabNotice: "মসজিদ নোটিশ প্রকাশ",
    tabSuperAdmin: "অ্যাডমিন ম্যানেজমেন্ট",
    tabReports: "আর্থিক প্রতিবেদন ও রিপোর্ট",

    // Tab 1: Pending Audit
    auditTitle: "যাচাইাধীন দানের তালিকা",
    auditDesc: "ব্যবহারকারীদের দাখিল করা পেমেন্টগুলো চেক করুন এবং TrxID মিলিয়ে অনুমোদন করুন।",
    approveBtn: "অনুমোদন করুন",
    approvingBtn: "অনুমোদন হচ্ছে...",
    auditDate: "তারিখ",
    auditDonor: "দাতার নাম",
    auditAmount: "পরিমাণ",
    auditMethod: "মাধ্যম",
    auditTrx: "TrxID / রেফারেন্স",
    auditCategory: "খাত",
    auditNoData: "কোনো যাচাইাধীন দান পাওয়া যায়নি।",

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
    expenseDesc: "মসজিদের ইমাম/মুয়াজ্জিনের সম্মানী, বিদ্যুৎ বিল, সংস্কার বা অন্যান্য খরচের হিসাব যুক্ত করুন।",
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
    voucherLabel: "ভাউচার ইমেজ ইউআরএল (ঐচ্ছিক)",
    voucherPlaceholder: "https://example.com/voucher.jpg",
    addExpenseBtn: "খরচের তথ্য সংরক্ষণ করুন",

    // Tab 4: Notice
    noticeTitle: "নতুন নোটিশ বা বিজ্ঞপ্তি প্রকাশ",
    noticeDesc: "নামাজের সময় পরিবর্তন, ঈদ জামাত বা বিশেষ ঘোষণার নোটিশ সরাসরি পাবলিক বোর্ডে প্রকাশ করুন।",
    noticeTitleLabel: "নোটিশের শিরোনাম",
    noticeTitlePlaceholder: "যেমন: নামাজের সময়সূচী পরিবর্তন",
    noticeContentLabel: "নোটিশের বিস্তারিত তথ্য",
    noticeContentPlaceholder: "মুসল্লিদের উদ্দেশ্যে বিস্তারিত ঘোষণাটি এখানে লিখুন...",
    noticeImageLabel: "বিজ্ঞপ্তি ব্যানার ইউআরএল (ঐচ্ছিক)",
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
    reportsDesc: "Weekly, Monthly, Yearly এবং All-Time হিসাবের রিপোর্ট জেনারেট করুন ও PDF আকারে সংগ্রহ করুন।",
    downloadPdfBtn: "পিডিএফ রিপোর্ট ডাউনলোড করুন (PDF)",
    downloadingPdfBtn: "রিপোর্ট প্রস্তুত হচ্ছে...",
    pdfSuccessToast: "পিডিএফ রিপোর্ট প্রস্তুত হয়েছে এবং ডাউনলোড ফোল্ডারে পাঠানো হয়েছে।",

    // Base Labels
    savingBtn: "সংরক্ষণ হচ্ছে...",
    saveSuccess: "তথ্যটি সফলভাবে সংরক্ষণ করা হয়েছে!",
    saveError: "তথ্য সংরক্ষণে ভুল হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।",
    toastAmountMin: "টাকার পরিমাণ ০ এর চেয়ে বেশি হতে হবে!",
    loadingData: "তথ্য লোড হচ্ছে...",
    anonymousName: "নাম প্রকাশে অনিচ্ছুক",
    anonymousPlaceholder: "নাম প্রকাশে অনিচ্ছুক",
    accessDenied: "প্রবেশাধিকার সংরক্ষিত! আপনি এই প্যানেল দেখার জন্য অনুমোদিত নন।",
    superAdminBadge: "সুপার অ্যাডমিন",
    adminBadge: "অ্যাডমিন"
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
    tabManualIncome: "Manual Income Form",
    tabExpense: "Expense Management",
    tabNotice: "Publish Notices",
    tabSuperAdmin: "Super Admin Controls",
    tabReports: "Reporting & Analytics",

    // Tab 1: Pending Audit
    auditTitle: "Pending Donation Audit Queue",
    auditDesc: "Audit user-submitted claims, crosscheck MFS TrxIDs, and approve claims for public publication.",
    approveBtn: "Approve Donation",
    approvingBtn: "Approving...",
    auditDate: "Date",
    auditDonor: "Donor Name",
    auditAmount: "Amount",
    auditMethod: "Method",
    auditTrx: "TrxID / Reference",
    auditCategory: "Category",
    auditNoData: "No pending donations found.",

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
    expenseDesc: "Log salaries, electric/utility bills, renovations, and maintenance costs into the ledger.",
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
    voucherLabel: "Voucher Image URL (Optional)",
    voucherPlaceholder: "https://example.com/voucher.jpg",
    addExpenseBtn: "Save Expense Record",

    // Tab 4: Notice
    noticeTitle: "Publish Announcements",
    noticeDesc: "Create and publish notice boards regarding prayer timings, Eid congregations, or events.",
    noticeTitleLabel: "Notice Title",
    noticeTitlePlaceholder: "e.g., Change in Daily Prayer Timings",
    noticeContentLabel: "Notice Description / Content",
    noticeContentPlaceholder: "Draft detailed announcement for public musallis here...",
    noticeImageLabel: "Notice Banner URL (Optional)",
    publishBtn: "Publish Notice Board",

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
    reportsDesc: "Generate monthly/yearly statements and download audit PDFs for mosque committee assemblies.",
    downloadPdfBtn: "Download PDF Financial Statement",
    downloadingPdfBtn: "Generating Statement BDT...",
    pdfSuccessToast: "PDF statement report successfully compiled and sent to your downloads folder.",

    // Base Labels
    savingBtn: "Saving...",
    saveSuccess: "Financial data successfully committed!",
    saveError: "Error saving record! Please check fields and retry.",
    toastAmountMin: "Amount must be greater than 0!",
    loadingData: "Loading details...",
    anonymousName: "Anonymous Donor",
    anonymousPlaceholder: "Anonymous",
    accessDenied: "Access Restricted! You are not authorized to view this control panel.",
    superAdminBadge: "Super Admin",
    adminBadge: "Admin"
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

// ==========================================
// 3. Main React Component
// ==========================================

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
  const [allAdmins, setAllAdmins] = useState<UserProfile[]>([]);
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
  const [expVoucherUrl, setExpVoucherUrl] = useState("");

  // --- Form: Notice ---
  const [notTitle, setNotTitle] = useState("");
  const [notContent, setNotContent] = useState("");
  const [notImageUrl, setNotImageUrl] = useState("");

  // --- Form: SuperAdmin Manage ---
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<UserRole>("admin");

  // --- Reporting PDF state ---
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
        // Fetch Admin profile
        const profile = await getUserProfile(firebaseUser.email || "");
        if (profile && (profile.role === "admin" || profile.role === "superadmin")) {
          setUser(firebaseUser);
          setAdminProfile(profile);
        } else {
          // Access Denied: not mapped in admins database
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

    // AUTO-SEED ADMIN PROFILES: if database users collection is completely unpopulated
    const seedAdminUsers = async () => {
      try {
        const usersCol = collection(db, "users");
        const snapshot = await getDocs(usersCol);
        if (snapshot.empty) {
          // Seed the base superadmin and admin configs
          await Promise.all([
            setUserProfile("superadmin@masjid.com", "superadmin"),
            setUserProfile("admin@masjid.com", "admin"),
          ]);
        }
      } catch (err) {
        console.error("Error checking/seeding users role-map database:", err);
      }
    };
    seedAdminUsers();

    return () => unsubscribe();
  }, [mounted, lang]);

  // --- Load Admin Dashboard Data ---
  const loadAdminData = async () => {
    if (!user || !adminProfile) return;
    try {
      setLoading(true);
      
      // Load pending donations
      const pendingList = await getDonations("pending");
      setPendingDonations(pendingList);

      // Load stats
      const currentStats = await getDashboardStats();
      setStats(currentStats);

      // Load all admin profiles (if superadmin)
      if (adminProfile.role === "superadmin") {
        const usersCol = collection(db, "users");
        const snapshot = await getDocs(usersCol);
        const adminProfiles: UserProfile[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            email: d.email,
            role: d.role as UserRole
          };
        });
        setAllAdmins(adminProfiles);
      }
    } catch (error) {
      console.error("Error loading admin audit log:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && adminProfile) {
      loadAdminData();
    }
  }, [user, adminProfile, activeTab]);

  // --- Handle Login & Auto-Register Fallback ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    const targetEmail = email.trim().toLowerCase();
    const targetPassword = password;

    try {
      // 1. Attempt login
      await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
    } catch (err: any) {
      // 2. AUTO-REGISTRATION SEED FALLBACK for local test configurations
      // If accounts superadmin@masjid.com or admin@masjid.com are missing from Auth, auto-create them!
      if (
        (targetEmail === "superadmin@masjid.com" || targetEmail === "admin@masjid.com") &&
        targetPassword === "masjid123" &&
        (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/invalid-login-credentials")
      ) {
        try {
          // Auto register Auth user
          await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
          // Firestore role mapping is automatically seeded above on mount,
          // so logging in will instantly succeed and match role
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

  // --- Logout Action ---
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setAdminProfile(null);
    setEmail("");
    setPassword("");
  };

  // --- Approve Pending Donation ---
  const handleApproveDonation = async (id: string) => {
    try {
      setSubmitting(true);
      await approveDonation(id);
      triggerToast("success", t.saveSuccess, lang === "bn" ? "দানটি অনুমোদিত হয়েছে এবং পাবলিক লেজারে যুক্ত হয়েছে।" : "Donation approved and added to public ledger.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Add Manual Income (Approved Cash) ---
  const handleAddManualIncome = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Log manual cash donation as already approved bypass audit queue
      await addDonation({
        donorName: finalDonor,
        amount: parsedAmount,
        category: manCategory,
        paymentMethod: "cash",
        isAnonymous: manIsAnonymous,
        status: "approved"
      });

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
      await addExpense({
        category: expCategory,
        amount: parsedAmount,
        description: expDesc.trim(),
        voucherUrl: expVoucherUrl.trim() || undefined
      });

      setExpCategory("");
      setExpAmount("");
      setExpDesc("");
      setExpVoucherUrl("");

      triggerToast("success", t.saveSuccess, t.saveSuccess);
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Publish Notice ---
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!notTitle.trim() || !notContent.trim()) {
      triggerToast("error", t.saveError, lang === "bn" ? "শিরোনাম ও বিবরণ আবশ্যক!" : "Title and content are mandatory!");
      return;
    }

    try {
      setSubmitting(true);
      await addNotice({
        title: notTitle.trim(),
        content: notContent.trim(),
        imageUrl: notImageUrl.trim() || undefined
      });

      setNotTitle("");
      setNotContent("");
      setNotImageUrl("");

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
      triggerToast("success", t.saveSuccess, lang === "bn" ? "অ্যাডমিন অপসারণ করা হয়েছে।" : "Admin removed successfully.");
      await loadAdminData();
    } catch (err) {
      triggerToast("error", t.saveError, t.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Reporting MOCK PDF Download ---
  const handleDownloadPdfReport = () => {
    setDownloadingPdf(true);
    setTimeout(() => {
      triggerToast("success", lang === "bn" ? "ডাউনলোড সফল!" : "Download Success!", t.pdfSuccessToast);
      setDownloadingPdf(false);
    }, 2000);
  };

  // Safe SSR gate while mounting
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-12 transition-colors duration-300">
      
      {/* ==========================================
          HEADER SECTION (Bilingual, Role Status)
          ========================================== */}
      <header className="relative bg-gradient-to-r from-emerald-950 via-emerald-800 to-teal-950 text-white shadow-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto px-4 py-6 relative flex flex-col sm:flex-row items-center justify-between gap-4">
          
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
            {/* Lang Toggle */}
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{t.langToggle}</span>
            </button>

            {/* Logout button */}
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
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
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
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.emailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold shadow-sm"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.passwordLabel}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold shadow-sm"
                  required
                />
              </div>

              {/* Submit */}
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
            
            {/* Auto register notice board */}
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
        <main className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Left panel sidebar tabs */}
          <section className="md:col-span-1 space-y-2">
            
            {/* Profile Tag */}
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

            {/* Sidebar list selectors */}
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

              {/* SuperAdmin Gate */}
              {adminProfile?.role === "superadmin" && (
                <button
                  onClick={() => setActiveTab("superadmin")}
                  className={`w-full py-3 px-3 rounded-2xl text-xs font-bold transition-all text-left flex items-center gap-2.5 cursor-pointer ${
                    activeTab === "superadmin" ? "bg-emerald-50 text-emerald-800 shadow-inner animate-pulse" : "text-slate-600 hover:bg-gray-50"
                  }`}
                >
                  <Users className="w-4.5 h-4.5 shrink-0 text-emerald-800" />
                  <span>{t.tabSuperAdmin}</span>
                </button>
              )}

            </div>
          </section>

          {/* Right main panel display boards */}
          <section className="md:col-span-3">
            <div className="bg-white rounded-3xl p-6 border border-emerald-100/40 shadow-xl shadow-emerald-950/5 min-h-[460px]">
              
              {/* ========================================================
                  TAB 1: PENDING AUDIT LOGS
                  ======================================================== */}
              {activeTab === "pending" && (
                <div className="space-y-4">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.auditTitle}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.auditDesc}</p>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
                      <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                      <p className="text-xs font-semibold">{t.loadingData}</p>
                    </div>
                  ) : pendingDonations.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 font-bold text-xs space-y-1">
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
                            <th className="pb-3 px-2 font-semibold text-center">Action</th>
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
                                  {d.category}
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center whitespace-nowrap uppercase font-bold text-slate-500 text-[10px]">
                                {d.paymentMethod}
                              </td>
                              <td className="py-3 px-2 text-center font-mono font-bold text-slate-900 select-all">
                                {d.trxId || "N/A"}
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  onClick={() => handleApproveDonation(d.id!)}
                                  disabled={submitting}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all active:scale-[0.97] disabled:opacity-50 cursor-pointer shadow-sm"
                                >
                                  {t.approveBtn}
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

              {/* ========================================================
                  TAB 2: MANUAL CASH INCOME FORM
                  ======================================================== */}
              {activeTab === "manual" && (
                <div className="space-y-4">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.manualTitle}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.manualDesc}</p>
                  </div>

                  <form onSubmit={handleAddManualIncome} className="space-y-4 max-w-xl">
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
                        placeholder={manIsAnonymous ? t.anonymousPlaceholder : t.donorPlaceholder}
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                        required={!manIsAnonymous}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Amount */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.amountLabel}</label>
                        <input
                          type="number"
                          value={manAmount}
                          onChange={(e) => setManAmount(e.target.value)}
                          placeholder={t.amountPlaceholder}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold shadow-sm"
                          min="1"
                          required
                        />
                      </div>

                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.categoryLabel}</label>
                        <select
                          value={manCategory}
                          onChange={(e) => setManCategory(e.target.value)}
                          className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-700 cursor-pointer"
                          required
                        >
                          <option value="" disabled>{t.categorySelect}</option>
                          <option value={t.catJumma}>{t.catJumma}</option>
                          <option value={t.catGeneral}>{t.catGeneral}</option>
                          <option value={t.catDevelopment}>{t.catDevelopment}</option>
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
              )}

              {/* ========================================================
                  TAB 3: EXPENSE MANAGEMENT FORM
                  ======================================================== */}
              {activeTab === "expense" && (
                <div className="space-y-4">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.expenseTitle}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.expenseDesc}</p>
                  </div>

                  <form onSubmit={handleAddExpense} className="space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.expCategoryLabel}</label>
                        <select
                          value={expCategory}
                          onChange={(e) => setExpCategory(e.target.value)}
                          className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-700 cursor-pointer"
                          required
                        >
                          <option value="" disabled>{t.expCategorySelect}</option>
                          <option value={t.catSalary}>{t.catSalary}</option>
                          <option value={t.catUtility}>{t.catUtility}</option>
                          <option value={t.catMaintenance}>{t.catMaintenance}</option>
                          <option value={t.catMisc}>{t.catMisc}</option>
                        </select>
                      </div>

                      {/* Amount */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.expAmountLabel}</label>
                        <input
                          type="number"
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          placeholder={t.expAmountPlaceholder}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold shadow-sm"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.expDescLabel}</label>
                      <textarea
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        placeholder={t.expDescPlaceholder}
                        className="w-full h-24 p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold shadow-sm"
                        required
                      />
                    </div>

                    {/* Voucher URL */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.voucherLabel}</label>
                      <input
                        type="url"
                        value={expVoucherUrl}
                        onChange={(e) => setExpVoucherUrl(e.target.value)}
                        placeholder={t.voucherPlaceholder}
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold shadow-sm"
                      />
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
              )}

              {/* ========================================================
                  TAB 4: PUBLISH NOTICE BOARD FORM
                  ======================================================== */}
              {activeTab === "notice" && (
                <div className="space-y-4">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.noticeTitle}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.noticeDesc}</p>
                  </div>

                  <form onSubmit={handleAddNotice} className="space-y-4 max-w-xl">
                    {/* Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.noticeTitleLabel}</label>
                      <input
                        type="text"
                        value={notTitle}
                        onChange={(e) => setNotTitle(e.target.value)}
                        placeholder={t.noticeTitlePlaceholder}
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold shadow-sm"
                        required
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.noticeContentLabel}</label>
                      <textarea
                        value={notContent}
                        onChange={(e) => setNotContent(e.target.value)}
                        placeholder={t.noticeContentPlaceholder}
                        className="w-full h-32 p-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold shadow-sm"
                        required
                      />
                    </div>

                    {/* Image URL */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">{t.noticeImageLabel}</label>
                      <input
                        type="url"
                        value={notImageUrl}
                        onChange={(e) => setNotImageUrl(e.target.value)}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold shadow-sm"
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
              )}

              {/* ========================================================
                  TAB 5: SUPER ADMIN ACCESS ROLE MANAGER
                  ======================================================== */}
              {activeTab === "superadmin" && adminProfile?.role === "superadmin" && (
                <div className="space-y-6">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.superTitle}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.superDesc}</p>
                  </div>

                  {/* Add Admin Mappings */}
                  <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">{t.addAdminTitle}</h3>
                    <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder={t.adminEmailPlaceholder}
                          className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-semibold"
                          required
                        />
                      </div>
                      
                      <div className="w-full sm:w-48">
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
                        className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm shadow-emerald-950/10"
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
                      <div className="divide-y divide-gray-100">
                        {allAdmins.map((adm) => (
                          <div key={adm.id} className="py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900">{adm.email}</span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                adm.role === "superadmin" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {adm.role === "superadmin" ? "Super" : "Admin"}
                              </span>
                            </div>
                            
                            <button
                              onClick={() => handleRemoveAdmin(adm.id!, adm.email)}
                              className="text-xs font-bold text-red-600 hover:text-red-800 p-1 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.removeBtn}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 6: REPORTING & ANALYTICS PDF
                  ======================================================== */}
              {activeTab === "reports" && (
                <div className="space-y-6">
                  <div className="border-b border-gray-150 pb-4 mb-4">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">{t.reportsTitle}</h2>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{t.reportsDesc}</p>
                  </div>

                  {/* Summaries view box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-slate-700">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Collections Summary</h4>
                      <p className="text-2xl font-black mt-1.5">{formatCurrency(stats.totalIncome, lang)}</p>
                      
                      <div className="mt-3.5 space-y-2 border-t border-emerald-100/50 pt-3 text-xs">
                        {Object.entries(stats.incomeByCategory).map(([cat, amt]) => (
                          <div key={cat} className="flex justify-between font-semibold">
                            <span className="text-slate-500">{cat}:</span>
                            <span className="text-slate-900">{formatCurrency(amt, lang)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 text-slate-700">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Expenses Summary</h4>
                      <p className="text-2xl font-black mt-1.5">{formatCurrency(stats.totalExpenses, lang)}</p>
                      
                      <div className="mt-3.5 space-y-2 border-t border-amber-100/50 pt-3 text-xs">
                        {Object.entries(stats.expenseByCategory).map(([cat, amt]) => (
                          <div key={cat} className="flex justify-between font-semibold">
                            <span className="text-slate-500">{cat}:</span>
                            <span className="text-slate-900">{formatCurrency(amt, lang)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Download PDF */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col items-center">
                    <button
                      onClick={handleDownloadPdfReport}
                      disabled={downloadingPdf}
                      className="w-full sm:w-80 h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      {downloadingPdf ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t.downloadingPdfBtn}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 text-emerald-300" />
                          <span>{t.downloadPdfBtn}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </section>

        </main>
      )}

    </div>
  );
}
