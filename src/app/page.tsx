"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import {
  addDonation,
  getDonations,
  getExpenses,
  getNotices,
  getDashboardStats,
  Donation,
  Expense,
  Notice,
  DashboardStats,
} from "@/lib/firestoreUtils";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Sleek SVG Icons from Lucide-React
import {
  Globe,
  MapPin,
  DollarSign,
  Receipt,
  TrendingUp,
  Check,
  X,
  PlusCircle,
  Layers,
  Bell,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info,
  Filter,
  User,
  UserX,
  ArrowRight,
  TrendingDown,
  Building,
  Wallet,
  Search,
  FileText,
  Download
} from "lucide-react";

// ==========================================
// 1. Bilingual Translation Dictionary
// ==========================================

const translations = {
  bn: {
    masjidName: "সুবেদার জামে মসজিদ আল খাওয়ারী",
    masjidAddress: "দক্ষিণ মীরের খীল, হাটহাজারী, চট্টগ্রাম",
    transparencyPortal: "ডিজিটাল মসজিদ ম্যানেজমেন্ট সিস্টেম",
    langToggle: "English",
    
    // Time Filters
    filterLabel: "সময়সীমা ফিল্টার:",
    filterWeekly: "গত ৭ দিন (সাপ্তাহিক)",
    filterMonthly: "গত ৩০ দিন (মাসিক)",
    filterYearly: "গত ১ বছর (বার্ষিক)",
    filterAll: "সর্বমোট (আজ পর্যন্ত)",
    
    // Stats Counter
    totalCollections: "মোট সংগ্রহ (অনুমোদিত)",
    totalExpenses: "মোট খরচ",
    netBalance: "বর্তমান তহবিল",
    loadingStats: "হিসাব লোড হচ্ছে...",
    bdtSymbol: "৳",
    
    // Donation Form
    claimTitle: "দান রশিদ দাবি ফরম",
    claimDesc: "বিকাশ, নগদ, রকেট, উপায় অথবা ব্যাংক ট্রান্সফারের মাধ্যমে দান করার পর রশিদের জন্য তথ্য দিন। যাচাই শেষে তা প্রকাশ করা হবে।",
    donorNameLabel: "দাতার নাম",
    donorNamePlaceholder: "দাতার পুরো নাম লিখুন",
    anonymousCheckbox: "নাম প্রকাশে অনিচ্ছুক থাকতে টিক দিন",
    anonymousPlaceholder: "নাম প্রকাশে অনিচ্ছুক",
    amountLabel: "দানের পরিমাণ (টাকা)",
    amountPlaceholder: "টাকার পরিমাণ লিখুন (যেমন: ৫০০)",
    categoryLabel: "দানের খাত",
    categorySelect: "খাত নির্বাচন করুন",
    catJumma: "জুমা আদায়",
    catGeneral: "সাধারণ দান (লিল্লাহ)",
    catDevelopment: "মসজিদ উন্নয়ন",
    methodLabel: "পেমেন্ট মাধ্যম",
    methodSelect: "মাধ্যম নির্বাচন করুন",
    methodBkash: "বিকাশ (bKash)",
    methodNagad: "নগদ (Nagad)",
    methodRocket: "রকেট (Rocket)",
    methodUpay: "উপায় (Upay)",
    methodBank: "ব্যাংক ট্রান্সফার (Bank)",
    trxIdLabel: "ট্রানজেকশন আইডি (TrxID)",
    trxIdPlaceholder: "TrxID বা ট্রানজেকশন রেফারেন্স দিন (যেমন: K8F9H7J5)",
    submitBtn: "দানের তথ্য জমা দিন",
    submittingBtn: "জমা হচ্ছে...",

    // Receipt Tracking
    trackTitle: "রশিদ ট্র্যাক ও ডাউনলোড",
    trackDesc: "পেমেন্টের TrxID দিয়ে দান রশিদের অনুমোদন অবস্থা চেক করুন এবং ডিজিটাল রশিদ ডাউনলোড করুন।",
    trackLabel: "ট্রানজেকশন আইডি (TrxID)",
    trackPlaceholder: "এখানে TrxID লিখুন (যেমন: BK894J92L)",
    trackBtn: "রশিদ অনুসন্ধান করুন",
    trackSearching: "অনুসন্ধান করা হচ্ছে...",
    trackFoundTitle: "রশিদ পাওয়া গেছে!",
    trackFoundMsg: "আপনার দান রশিদটি সফলভাবে যাচাই করা হয়েছে এবং সিস্টেমে অনুমোদিত রয়েছে।",
    trackPendingTitle: "দাবি প্রক্রিয়াধীন রয়েছে",
    trackPendingMsg: "আপনার দান দাবিটি কমিটির কাছে প্রক্রিয়াধীন রয়েছে। অনুমোদন সাপেক্ষে শীঘ্রই রশিদ ডাউনলোড করতে পারবেন।",
    trackNotFoundTitle: "কোনো তথ্য পাওয়া যায়নি",
    trackNotFoundMsg: "দুঃখিত, এই ট্রানজেকশন আইডি দিয়ে কোনো রেকর্ড পাওয়া যায়নি। অনুগ্রহ করে TrxID চেক করুন বা নতুন দাবি ফরম পূরণ করুন।",
    trackDownloadBtn: "রশিদ ডাউনলোড করুন (PDF)",
    
    // Tabs
    tabCollections: "সাম্প্রতিক দানসমূহ",
    tabExpenses: "সাম্প্রতিক খরচসমূহ",
    tabNotices: "মসজিদ নোটিশ বোর্ড",
    
    // List/Table Labels
    noData: "কোনো তথ্য পাওয়া যায়নি",
    loadingData: "তথ্য লোড হচ্ছে...",
    verifiedBadge: "অনুমোদিত",
    pendingBadge: "যাচাইাধীন",
    anonymousName: "নাম প্রকাশে অনিচ্ছুক",
    tableDate: "তারিখ",
    tableDonor: "দাতা",
    tableAmount: "পরিমাণ",
    tableCategory: "খাত",
    tableMethod: "পেমেন্ট",
    tableTrx: "TrxID",
    tableExpense: "খরচের খাত / বিবরণ",
    tableNoticeDate: "প্রকাশিত",
    
    // Toasts & Messages
    toastSuccessTitle: "দাখিল সফল হয়েছে!",
    toastSuccessMsg: "আপনার দানের তথ্যটি সংরক্ষিত হয়েছে। মসজিদ কমিটির অডিট শেষে এটি স্বয়ংক্রিয়ভাবে অনুমোদিত তালিকায় যুক্ত হবে, ইনশাআল্লাহ।",
    toastErrorTitle: "ভুল হয়েছে!",
    toastErrorMsg: "অনুগ্রহ করে ফর্মের সকল তথ্য সঠিকভাবে পূরণ করুন।",
    toastTrxRequired: "পেমেন্ট সম্পন্ন করার জন্য TrxID বা রেফারেন্স আইডি আবশ্যক!",
    toastAmountMin: "দানের পরিমাণ ০ এর চেয়ে বেশি হতে হবে!",
    
    // Transparency Banner
    transparencyBanner: "মসজিদ তহবিল ১০০% স্বচ্ছ রাখতে এই পোর্টালটি তৈরি করা হয়েছে। দান ও খরচের সকল হিসাব সরাসরি প্রকাশ করা হয়।"
  },
  en: {
    masjidName: "Subedar Jame Masjid Al Khawari",
    masjidAddress: "South Mirer Khil, Hathazari, Chattogram",
    transparencyPortal: "Digital Mosque Management System",
    langToggle: "বাংলা",
    
    // Time Filters
    filterLabel: "Time Range Filter:",
    filterWeekly: "Last 7 Days (Weekly)",
    filterMonthly: "Last 30 Days (Monthly)",
    filterYearly: "Last 1 Year (Yearly)",
    filterAll: "All Time (Cumulative)",
    
    // Stats Counter
    totalCollections: "Total Collections (Approved)",
    totalExpenses: "Total Expenses",
    netBalance: "Net Available Fund",
    loadingStats: "Loading statistics...",
    bdtSymbol: "৳",
    
    // Donation Form
    claimTitle: "Claim Donation Receipt",
    claimDesc: "Submit transaction details for bKash, Nagad, Rocket, Upay, or Bank transfers. Claims are verified by the committee.",
    donorNameLabel: "Donor Name",
    donorNamePlaceholder: "Enter donor's full name",
    anonymousCheckbox: "Keep name anonymous",
    anonymousPlaceholder: "Anonymous",
    amountLabel: "Donation Amount (BDT)",
    amountPlaceholder: "Enter BDT amount (e.g. 500)",
    categoryLabel: "Donation Category",
    categorySelect: "Select Category",
    catJumma: "Jumma Collection",
    catGeneral: "General (Lillah)",
    catDevelopment: "Mosque Development",
    methodLabel: "Payment Method",
    methodSelect: "Select Method",
    methodBkash: "bKash",
    methodNagad: "Nagad",
    methodRocket: "Rocket",
    methodUpay: "Upay",
    methodBank: "Bank Transfer",
    trxIdLabel: "Transaction ID (TrxID)",
    trxIdPlaceholder: "Enter TrxID or reference (e.g. K8F9H7J5)",
    submitBtn: "Submit Donation Details",
    submittingBtn: "Submitting...",

    // Receipt Tracking
    trackTitle: "Track & Download Receipt",
    trackDesc: "Enter payment TrxID to check receipt status and download digital copy.",
    trackLabel: "Transaction ID (TrxID)",
    trackPlaceholder: "Enter TrxID (e.g. BK894J92L)",
    trackBtn: "Search Receipt",
    trackSearching: "Searching...",
    trackFoundTitle: "Receipt Found!",
    trackFoundMsg: "Your donation has been verified and approved by the mosque committee.",
    trackPendingTitle: "Claim Pending Review",
    trackPendingMsg: "Your donation claim is currently under review. Receipt will be available post-committee approval.",
    trackNotFoundTitle: "No Records Found",
    trackNotFoundMsg: "No records found matching this Transaction ID. Please verify your TrxID or submit a new claim.",
    trackDownloadBtn: "Download Receipt (PDF)",
    
    // Tabs
    tabCollections: "Recent Collections",
    tabExpenses: "Recent Expenses",
    tabNotices: "Masjid Notice Board",
    
    // List/Table Labels
    noData: "No data available",
    loadingData: "Loading details...",
    verifiedBadge: "Approved",
    pendingBadge: "Pending Review",
    anonymousName: "Anonymous Donor",
    tableDate: "Date",
    tableDonor: "Donor",
    tableAmount: "Amount",
    tableCategory: "Category",
    tableMethod: "Payment",
    tableTrx: "TrxID",
    tableExpense: "Expense Description",
    tableNoticeDate: "Published",
    
    // Toasts & Messages
    toastSuccessTitle: "Submission Successful!",
    toastSuccessMsg: "Your donation claim has been recorded. It will automatically update in the public register post-verification, Insha'Allah.",
    toastErrorTitle: "Submission Failed!",
    toastErrorMsg: "Please fill out all mandatory fields correctly.",
    toastTrxRequired: "TrxID or transaction reference is mandatory!",
    toastAmountMin: "Donation amount must be greater than 0!",
    
    // Transparency Banner
    transparencyBanner: "This system is built to ensure 100% financial transparency. Financial entries are published directly upon audit approval."
  }
};

// ==========================================
// 2. Formatting Helpers
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

export function translateCategory(cat: string, lang: "bn" | "en"): string {
  const dictionary: Record<string, Record<"bn" | "en", string>> = {
    // Donations
    jumma_collection: { bn: "জুমা আদায়", en: "Jumma Collection" },
    general_fund: { bn: "সাধারণ দান (লিল্লাহ)", en: "General Donation (Lillah)" },
    mosque_development: { bn: "মসজিদ উন্নয়ন", en: "Mosque Development" },
    // Expenses
    salary: { bn: "ভাতা / সম্মানী", en: "Allowance / Salary" },
    utilities: { bn: "বিদ্যুৎ / ইউটিলিটি বিল", en: "Electricity / Utilities" },
    maintenance: { bn: "মেরামত ও রক্ষণাবেক্ষণ", en: "Repairs & Maintenance" },
    miscellaneous: { bn: "অন্যান্য খরচ", en: "Miscellaneous Expenses" },
  };

  return dictionary[cat]?.[lang] || cat;
}

// ==========================================
// 3. Main React Component
// ==========================================

export default function Home() {
  // --- Hydration Safety ---
  const [mounted, setMounted] = useState(false);

  // --- UI States ---
  const [lang, setLang] = useState<"bn" | "en">("bn");
  const [timeFilter, setTimeFilter] = useState<"weekly" | "monthly" | "yearly" | "all">("all");
  const [activeTab, setActiveTab] = useState<"collections" | "expenses" | "notices">("collections");
  const [loading, setLoading] = useState(true);
  
  // --- Form States ---
  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bkash" | "nagad" | "rocket" | "upay" | "bank" | "">("");
  const [trxId, setTrxId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Receipt Tracking States ---
  const [trackQuery, setTrackQuery] = useState("");
  const [searchingReceipt, setSearchingReceipt] = useState(false);
  const [searched, setSearched] = useState(false);
  const [trackResult, setTrackResult] = useState<Donation | null | "not_found">(null);
  
  // --- Live Data States ---
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    incomeByCategory: {},
    expenseByCategory: {},
  });
  const [donations, setDonations] = useState<Donation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  
  // --- Notification Toast ---
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // --- Translation Helper ---
  const t = translations[lang];

  // --- Show Toast Helper ---
  const triggerToast = (type: "success" | "error", title: string, message: string) => {
    setToast({ show: true, type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const handleDownloadReceiptPdf = (d: Donation) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a5"
    });

    // Green accent banner
    doc.setFillColor(6, 78, 59); // deep emerald
    doc.rect(0, 0, 148, 25, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Subedar Jame Masjid Al Khawari", 74, 10, { align: "center" });

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.text("South Mirer Khil, Hathazari, Chattogram", 74, 15, { align: "center" });
    doc.text("Digital Mosque Management System", 74, 19, { align: "center" });

    // Receipt Header
    doc.setTextColor(30, 41, 59);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("OFFICIAL DONATION RECEIPT", 74, 38, { align: "center" });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 42, 133, 42);

    const drawRow = (label: string, value: string, y: number) => {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, y);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(value, 60, y);
    };

    const formattedDate = d.date.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    const formattedCategory = translateCategory(d.category, "en");

    drawRow("Receipt ID:", `REC-${d.id?.substring(0, 6).toUpperCase() || "TEMP"}`, 52);
    drawRow("Date:", formattedDate, 60);
    drawRow("Donor Name:", d.isAnonymous ? "Anonymous Donor" : d.donorName || "Anonymous", 68);
    drawRow("Category:", formattedCategory, 76);
    drawRow("Payment Method:", d.paymentMethod.toUpperCase(), 84);
    drawRow("Transaction ID:", d.trxId || "N/A (Cash Entry)", 92);
    
    // Highlight Amount Box
    doc.setFillColor(240, 253, 250);
    doc.rect(20, 98, 108, 14, "F");
    doc.setDrawColor(204, 251, 241);
    doc.rect(20, 98, 108, 14, "S");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text("TOTAL AMOUNT RECEIVED:", 25, 107);
    doc.setFontSize(11);
    doc.text(`BDT ${d.amount.toLocaleString()}.00`, 85, 107);

    // Status Badge
    doc.setFillColor(220, 252, 231);
    doc.rect(54, 118, 40, 8, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(21, 128, 61);
    doc.text("VERIFIED & APPROVED", 74, 123, { align: "center" });

    // Committee Signatures
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    
    doc.line(20, 180, 55, 180);
    doc.text("Masjid Treasurer", 37, 184, { align: "center" });
    
    doc.line(93, 180, 128, 180);
    doc.text("Mosque Committee President", 110, 184, { align: "center" });

    // Footer bar
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 195, 148, 15, "F");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for your generous contribution. May Allah accept your donation.", 74, 201, { align: "center" });
    doc.text("This receipt was generated digitally by Subedar Jame Masjid Al Khawari digital management system.", 74, 204, { align: "center" });

    doc.save(`Masjid-Receipt-${d.id?.substring(0, 6).toUpperCase() || "CASH"}.pdf`);
  };

  // --- Safe Hydration Mount ---
  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Load Data with Filter Ranges & Seeding ---
  const loadData = async () => {
    try {
      setLoading(true);

      // Determine date ranges client-side based on UI selection
      let startDate: Date | undefined = undefined;
      const now = new Date();
      if (timeFilter === "weekly") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "monthly") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (timeFilter === "yearly") {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      }
      
      // Fetch initial metrics with optional date ranges
      let currentStats = await getDashboardStats(startDate);
      
      // AUTO-SEEDING: Seed realistic sample data to show off analytics beautifully if DB is completely empty
      if (currentStats.totalIncome === 0 && currentStats.totalExpenses === 0 && timeFilter === "all") {
        const donationsCol = collection(db, "donations");
        const expensesCol = collection(db, "expenses");
        const noticesCol = collection(db, "notices");

        const donationsCount = (await getDocs(donationsCol)).size;
        
        if (donationsCount === 0) {
          // 1. Add approved sample donations
          await Promise.all([
            addDoc(donationsCol, {
              donorName: "Haji Mohammad Yusuf",
              amount: 15000,
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
              category: "mosque_development",
              paymentMethod: "bank",
              trxId: "TXN1029384",
              isAnonymous: false,
              status: "approved",
            }),
            addDoc(donationsCol, {
              donorName: "",
              amount: 850,
              date: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
              category: "jumma_collection",
              paymentMethod: "bkash",
              trxId: "BK894J92L",
              isAnonymous: true,
              status: "approved",
            }),
            addDoc(donationsCol, {
              donorName: "Tasnim Rahman",
              amount: 3500,
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
              category: "general_fund",
              paymentMethod: "nagad",
              trxId: "NG908234D",
              isAnonymous: false,
              status: "approved",
            }),
            // Sample pending donation to demonstrate verify functionality
            addDoc(donationsCol, {
              donorName: "Shafiul Alam",
              amount: 2000,
              date: new Date(),
              category: "mosque_development",
              paymentMethod: "rocket",
              trxId: "RC849F01K",
              isAnonymous: false,
              status: "pending",
            })
          ]);

          // 2. Add approved sample expenses
          await Promise.all([
            addDoc(expensesCol, {
              category: "maintenance",
              amount: 3200,
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago (Within Week/Month)
              description: "Mosque Ceiling Fan Repair and Rewiring (মসজিদের সিলিং ফ্যান মেরামত ও ওয়ারিং বিল)",
            }),
            addDoc(expensesCol, {
              category: "salary",
              amount: 12000,
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago (Within Month)
              description: "Muazzin Monthly Allowance (মুয়াজ্জিন সাহেবের মাসিক সম্মানী ভাতা)",
            })
          ]);

          // 3. Add approved sample notices
          await Promise.all([
            addDoc(noticesCol, {
              title: "জুমার নামাজের নতুন সময়সূচী",
              content: "সুবেদার জামে মসজিদ আল খাওয়ারী-তে আগামী জুমা থেকে খুতবা দুপুর ১২:৪৫ মিনিটে এবং জামাত দুপুর ১:১৫ মিনিটে অনুষ্ঠিত হবে। সকল মুসল্লিকে যথাসময়ে উপস্থিত থাকার জন্য অনুরোধ করা হচ্ছে।",
              date: new Date(),
            }),
            addDoc(noticesCol, {
              title: "পবিত্র ঈদুল ফিতরের জামাত বিজ্ঞপ্তি",
              content: "সুবেদার জামে মসজিদ আল খাওয়ারী প্রাঙ্গণে ঈদুল ফিতরের একমাত্র জামাত সকাল ৭:৩০ মিনিটে অনুষ্ঠিত হবে। নামাজে ইমামতি করবেন সম্মানিত খতিব হাফেজ মাওলানা মোঃ ওসমান।",
              date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            })
          ]);

          // Recalculate stats after seeding
          currentStats = await getDashboardStats(startDate);
        }
      }

      // Fetch lists (keep them fully comprehensive chronologically)
      const [allDonations, allExpenses, allNotices] = await Promise.all([
        getDonations("approved"),
        getExpenses(),
        getNotices(),
      ]);

      setStats(currentStats);
      setDonations(allDonations);
      setExpenses(allExpenses);
      setNotices(allNotices);
    } catch (error) {
      console.error("Error loading transparent dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [lang, timeFilter, mounted]);

  // --- Handle Donation Claim Submission ---
  const handleSubmitDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = Number(amount);
    
    // Validations
    if (!parsedAmount || parsedAmount <= 0) {
      triggerToast("error", t.toastErrorTitle, t.toastAmountMin);
      return;
    }

    if (!category) {
      triggerToast("error", t.toastErrorTitle, lang === "bn" ? "অনুগ্রহ করে একটি দানের খাত নির্বাচন করুন।" : "Please select a donation category.");
      return;
    }

    if (!paymentMethod) {
      triggerToast("error", t.toastErrorTitle, lang === "bn" ? "অনুগ্রহ করে পেমেন্ট মাধ্যম নির্বাচন করুন।" : "Please select a payment method.");
      return;
    }

    // Require TrxID (all options are now digital)
    if (!trxId.trim()) {
      triggerToast("error", t.toastErrorTitle, t.toastTrxRequired);
      return;
    }

    const finalDonorName = isAnonymous ? "" : donorName.trim();
    if (!isAnonymous && !finalDonorName) {
      triggerToast("error", t.toastErrorTitle, lang === "bn" ? "দাতার নাম প্রদান করুন অথবা 'নাম প্রকাশে অনিচ্ছুক' অপশনটি বেছে নিন।" : "Please provide a donor name or check the anonymous option.");
      return;
    }

    try {
      setSubmitting(true);
      
      await addDonation({
        donorName: finalDonorName,
        amount: parsedAmount,
        category,
        paymentMethod,
        trxId: trxId.trim(),
        isAnonymous,
      });

      // Clear Form
      setDonorName("");
      setIsAnonymous(false);
      setAmount("");
      setCategory("");
      setPaymentMethod("");
      setTrxId("");

      triggerToast("success", t.toastSuccessTitle, t.toastSuccessMsg);
      
      // Reload lists and stats
      await loadData();
    } catch (error) {
      console.error("Error submitting claim:", error);
      triggerToast("error", t.toastErrorTitle, t.toastErrorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handle Receipt Search & Track ---
  const handleSearchReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const queryTerm = trackQuery.trim();
    if (!queryTerm) return;

    setSearchingReceipt(true);
    setSearched(false);
    
    // Simulate real-time database lookup delay (1.2s)
    setTimeout(() => {
      // Direct live lookup in the client-side array
      const match = donations.find(d => d.trxId?.toLowerCase() === queryTerm.toLowerCase());
      
      if (match) {
        setTrackResult(match);
      } else {
        setTrackResult("not_found");
      }
      setSearchingReceipt(false);
      setSearched(true);
    }, 1200);
  };

  // Safe SSR return while loading page shell configuration
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-800 font-sans pb-12 transition-colors duration-300">
      
      {/* ==========================================
          HEADER SECTION (Bilingual, Sleek Lucide Icons)
          ========================================== */}
      <header className="relative bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-white/10 blur-xl"></div>
        <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-emerald-500/20 blur-xl"></div>

        <div className="max-w-4xl mx-auto px-4 py-8 relative">
          
          {/* Top Row: Language Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setLang(lang === "bn" ? "en" : "bn")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs sm:text-sm font-semibold tracking-wide border border-white/10 shadow-sm cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-200" />
              <span>{t.langToggle}</span>
            </button>
          </div>

          {/* Header Identity Core */}
          <div className="text-center md:text-left flex flex-col md:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-md">
              <Building className="w-8 h-8 text-emerald-100" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                {t.masjidName}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1.5 flex items-center justify-center md:justify-start gap-1.5 font-semibold">
                <MapPin className="w-4 h-4 text-emerald-300" />
                <span>{t.masjidAddress}</span>
              </p>
              <div className="inline-flex items-center gap-1.5 mt-3.5 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-xs font-bold tracking-wider text-emerald-200 shadow-inner">
                <TrendingUp className="w-3.5 h-3.5 text-teal-300" />
                <span>{t.transparencyPortal}</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* ==========================================
          TOAST NOTIFICATION MODAL
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
              <button 
                onClick={() => setToast(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 self-start cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MAIN CONTAINER
          ========================================== */}
      <main className="max-w-4xl mx-auto px-4 mt-6 grid grid-cols-1 gap-6">
        
        {/* ==========================================
            STATS SECTION & FILTER TOGGLE
            ========================================== */}
        <section className="bg-white rounded-3xl p-6 border border-emerald-100/40 shadow-xl shadow-emerald-950/5 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50/40 rounded-full -mr-8 -mt-8 blur-lg"></div>

          {/* Filter Bar Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-5 gap-3">
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>{t.filterLabel}</span>
            </h3>
            
            {/* Filter Toggle Selector Dropdown */}
            <div className="relative w-full sm:w-60">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full h-10 pl-3.5 pr-8 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-slate-700 appearance-none shadow-sm cursor-pointer"
              >
                <option value="all">{t.filterAll}</option>
                <option value="weekly">{t.filterWeekly}</option>
                <option value="monthly">{t.filterMonthly}</option>
                <option value="yearly">{t.filterYearly}</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2.5">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs font-semibold">{t.loadingStats}</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* 1. Collections: White Card with thick green border left */}
                <div className="p-5 rounded-2xl bg-white border-l-4 border-emerald-600 border border-emerald-50/50 hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      {t.totalCollections}
                    </span>
                    <span className="text-2xl font-black text-emerald-700 block mt-1 tracking-tight">
                      {formatCurrency(stats.totalIncome, lang)}
                    </span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-xl">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. Expenses: White Card with thick amber border left */}
                <div className="p-5 rounded-2xl bg-white border-l-4 border-amber-600 border border-amber-50/50 hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      {t.totalExpenses}
                    </span>
                    <span className="text-2xl font-black text-amber-700 block mt-1 tracking-tight">
                      {formatCurrency(stats.totalExpenses, lang)}
                    </span>
                  </div>
                  <div className="bg-amber-50 text-amber-700 p-2.5 rounded-xl">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                </div>

                {/* 3. Balance: Highly premium glowing deep emerald card with Wallet Icon */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 text-white shadow-lg hover:scale-[1.01] transition-all flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-200/90 uppercase tracking-widest block">
                      {t.netBalance}
                    </span>
                    <span className="text-2xl font-black block mt-1 tracking-tight">
                      {formatCurrency(stats.netBalance, lang)}
                    </span>
                  </div>
                  <div className="bg-emerald-700/60 text-white p-2.5 rounded-xl animate-pulse">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>

              </div>
              
              {/* Bottom transparency notice */}
              <div className="mt-5 p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="font-medium">{t.transparencyBanner}</p>
              </div>
            </div>
          )}
        </section>

        {/* ==========================================
            DONATION CLAIM RECEIPT FORM CARD
            ========================================== */}
        <section className="bg-white rounded-3xl p-6 border border-emerald-100/40 shadow-xl shadow-emerald-950/5">
          <div className="border-b border-gray-100 pb-4 mb-5">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5.5 h-5.5 text-emerald-600" />
              <span>{t.claimTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
              {t.claimDesc}
            </p>
          </div>

          <form onSubmit={handleSubmitDonation} className="space-y-4">
            
            {/* Input Row 1: Donor Name & Anonymous Checkbox */}
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3">
              
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {t.donorNameLabel}
                </label>
                
                {/* Anonymous Checkbox */}
                <label className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => {
                      setIsAnonymous(e.target.checked);
                      if (e.target.checked) setDonorName("");
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{t.anonymousCheckbox}</span>
                </label>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={isAnonymous ? "" : donorName}
                  disabled={isAnonymous}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder={isAnonymous ? t.anonymousPlaceholder : t.donorNamePlaceholder}
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs disabled:bg-gray-100 disabled:text-gray-400 transition-colors font-medium placeholder-slate-400"
                  required={!isAnonymous}
                />
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {isAnonymous ? <UserX className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
                </div>
              </div>
            </div>

            {/* Input Row 2: Amount & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {t.amountLabel}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                    ৳
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={t.amountPlaceholder}
                    className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-sm transition-all font-medium placeholder-slate-400"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {t.categoryLabel}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-sm transition-all font-medium text-slate-700 cursor-pointer"
                  required
                >
                  <option value="" disabled>{t.categorySelect}</option>
                  <option value="jumma_collection">{t.catJumma}</option>
                  <option value="general_fund">{t.catGeneral}</option>
                  <option value="mosque_development">{t.catDevelopment}</option>
                </select>
              </div>

            </div>

            {/* Input Row 3: Payment Method & TrxID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Method */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {t.methodLabel}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full h-11 pl-3.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-sm transition-all font-medium text-slate-700 cursor-pointer"
                  required
                >
                  <option value="" disabled>{t.methodSelect}</option>
                  <option value="bkash">{t.methodBkash}</option>
                  <option value="nagad">{t.methodNagad}</option>
                  <option value="rocket">{t.methodRocket}</option>
                  <option value="upay">{t.methodUpay}</option>
                  <option value="bank">{t.methodBank}</option>
                </select>
              </div>

              {/* TrxID */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  {t.trxIdLabel}
                </label>
                <input
                  type="text"
                  value={trxId}
                  disabled={!paymentMethod}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder={t.trxIdPlaceholder}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs shadow-sm disabled:bg-gray-100 disabled:text-gray-400 transition-colors font-medium placeholder-slate-400"
                  required
                />
              </div>

            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer font-sans"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t.submittingBtn}</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>{t.submitBtn}</span>
                </>
              )}
            </button>

          </form>
        </section>

        {/* ==========================================
            RECEIPT TRACKING & SEARCH SYSTEM CARD
            ========================================== */}
        <section className="bg-white rounded-3xl p-6 border border-emerald-100/40 shadow-xl shadow-emerald-950/5">
          <div className="border-b border-gray-100 pb-4 mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-5.5 h-5.5 text-emerald-600" />
              <span>{t.trackTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
              {t.trackDesc}
            </p>
          </div>

          <form onSubmit={handleSearchReceipt} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={trackQuery}
                onChange={(e) => setTrackQuery(e.target.value)}
                placeholder={t.trackPlaceholder}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium placeholder-slate-400"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={searchingReceipt}
              className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {searchingReceipt ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.trackSearching}</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>{t.trackBtn}</span>
                </>
              )}
            </button>
          </form>

          {/* Searched Results Drawer */}
          {searched && (
            <div className="mt-5 p-4 rounded-2xl border bg-gray-50 border-gray-100 animate-fadeIn">
              
              {/* Scenario 1: Not Found */}
              {trackResult === "not_found" && (
                <div className="flex gap-3 text-red-700">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <h4 className="font-extrabold text-sm text-red-800">{t.trackNotFoundTitle}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{t.trackNotFoundMsg}</p>
                  </div>
                </div>
              )}

              {/* Scenario 2: Pending Claim */}
              {trackResult && trackResult !== "not_found" && trackResult.status === "pending" && (
                <div className="flex gap-3 text-amber-700">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 animate-pulse" />
                  <div>
                    <h4 className="font-extrabold text-sm text-amber-800">{t.trackPendingTitle}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{t.trackPendingMsg}</p>
                    
                    <div className="mt-3 p-3 rounded-xl bg-white border border-amber-100 text-slate-700 text-xs font-bold space-y-1.5 shadow-sm">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Donor</span>
                        <span>{trackResult.isAnonymous ? t.anonymousName : trackResult.donorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount</span>
                        <span>{formatCurrency(trackResult.amount, lang)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Method</span>
                        <span className="uppercase">{trackResult.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scenario 3: Approved / Found Claim */}
              {trackResult && trackResult !== "not_found" && trackResult.status === "approved" && (
                <div className="flex gap-3 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                  <div className="w-full">
                    <h4 className="font-extrabold text-sm text-emerald-800">{t.trackFoundTitle}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{t.trackFoundMsg}</p>
                    
                    <div className="mt-3 p-3.5 rounded-xl bg-white border border-emerald-100 text-slate-700 text-xs font-bold space-y-2 shadow-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Donor</span>
                          <span>{trackResult.isAnonymous ? t.anonymousName : trackResult.donorName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Amount</span>
                          <span>{formatCurrency(trackResult.amount, lang)}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Category</span>
                          <span>{trackResult.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">Method</span>
                          <span className="uppercase">{trackResult.paymentMethod}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        triggerToast("success", lang === "bn" ? "ডাউনলোড শুরু হচ্ছে..." : "Starting download...", lang === "bn" ? "দান রশিদ PDF প্রস্তুত করা হচ্ছে।" : "Preparing donation receipt PDF.");
                        handleDownloadReceiptPdf(trackResult);
                      }}
                      className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-950/15"
                    >
                      <Download className="w-4 h-4" />
                      <span>{t.trackDownloadBtn}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* ==========================================
            TRANSPARENCY TABS & LOG VIEW
            ========================================== */}
        <section className="bg-white rounded-3xl border border-emerald-100/40 shadow-xl shadow-emerald-950/5 overflow-hidden">
          
          {/* Tab Switcher Headers */}
          <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-1.5">
            
            <button
              onClick={() => setActiveTab("collections")}
              className={`flex-grow py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "collections"
                  ? "bg-white text-emerald-800 shadow-sm border border-emerald-100/50"
                  : "text-slate-500 hover:bg-white/40"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.tabCollections}</span>
            </button>

            <button
              onClick={() => setActiveTab("expenses")}
              className={`flex-grow py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-white text-emerald-800 shadow-sm border border-emerald-100/50"
                  : "text-slate-500 hover:bg-white/40"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{t.tabExpenses}</span>
            </button>

            <button
              onClick={() => setActiveTab("notices")}
              className={`flex-grow py-3.5 px-3 rounded-2xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "notices"
                  ? "bg-white text-emerald-800 shadow-sm border border-emerald-100/50"
                  : "text-slate-500 hover:bg-white/40"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>{t.tabNotices}</span>
            </button>

          </div>

          {/* Tab Body Contents */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2.5">
                <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                <p className="text-xs font-semibold">{t.loadingData}</p>
              </div>
            ) : (
              <div>
                
                {/* 1. COLLECTIONS TAB VIEW */}
                {activeTab === "collections" && (
                  <div className="space-y-4">
                    {donations.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400 font-medium">
                        {t.noData}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-slate-400 font-bold">
                              <th className="pb-3 px-2 font-semibold text-center">{t.tableDate}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.tableDonor}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.tableAmount}</th>
                              <th className="pb-3 px-2 font-semibold text-center hidden sm:table-cell">{t.tableCategory}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.tableMethod}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {donations.map((d) => (
                              <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3 px-2 text-slate-500 whitespace-nowrap text-center">
                                  {formatDate(d.date, lang)}
                                </td>
                                <td className="py-3 px-2 font-bold text-slate-950 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {d.isAnonymous ? (
                                      <span className="text-slate-400 font-medium text-xs sm:text-sm italic">
                                        {t.anonymousName}
                                      </span>
                                    ) : (
                                      <span>{d.donorName}</span>
                                    )}
                                    
                                    {/* Verification status label badge */}
                                    <span className={`inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full font-bold leading-none shrink-0 ${
                                      d.status === "approved"
                                        ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                        : "bg-amber-50 text-amber-600 border border-amber-100"
                                    }`}>
                                      {d.status === "approved" ? (
                                        <>
                                          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                                          <span>{t.verifiedBadge}</span>
                                        </>
                                      ) : (
                                        <>
                                          <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                          <span>{t.pendingBadge}</span>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 px-2 font-black text-slate-900 text-center">
                                  {formatCurrency(d.amount, lang)}
                                </td>
                                <td className="py-3 px-2 text-slate-600 hidden sm:table-cell text-center">
                                  <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    {translateCategory(d.category, lang)}
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-slate-500 whitespace-nowrap text-center">
                                  <span className="uppercase text-[10px] font-extrabold px-2.5 py-1 rounded bg-slate-100 text-slate-600">
                                    {d.paymentMethod}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. EXPENSES TAB VIEW */}
                {activeTab === "expenses" && (
                  <div className="space-y-4">
                    {expenses.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400 font-medium">
                        {t.noData}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-center text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 text-slate-400 font-bold">
                              <th className="pb-3 px-2 font-semibold text-center">{t.tableDate}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.tableExpense}</th>
                              <th className="pb-3 px-2 font-semibold text-center">{t.tableAmount}</th>
                              <th className="pb-3 px-2 font-semibold text-center hidden sm:table-cell">{t.tableCategory}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {expenses.map((e) => (
                              <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3.5 px-2 text-slate-500 whitespace-nowrap text-center font-medium">
                                  {formatDate(e.date, lang)}
                                </td>
                                <td className="py-3.5 px-2 font-bold text-slate-900 leading-relaxed text-center">
                                  {e.description}
                                </td>
                                <td className="py-3.5 px-2 font-black text-red-600 text-center whitespace-nowrap">
                                  - {formatCurrency(e.amount, lang)}
                                </td>
                                <td className="py-3.5 px-2 text-slate-600 hidden sm:table-cell text-center whitespace-nowrap">
                                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                    {translateCategory(e.category, lang)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. NOTICE BOARD TAB VIEW */}
                {activeTab === "notices" && (
                  <div className="space-y-4">
                    {notices.length === 0 ? (
                      <p className="text-center py-8 text-xs text-slate-400 font-medium">
                        {t.noData}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {notices.map((n) => (
                          <div 
                            key={n.id} 
                            className="p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-emerald-100/50 hover:bg-emerald-50/10 hover:shadow-sm transition-all space-y-2.5"
                          >
                            <div className="flex justify-between items-start gap-2.5">
                              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug flex items-center gap-1.5">
                                <Info className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                                <span>{n.title}</span>
                              </h3>
                              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap uppercase tracking-wider flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{formatDate(n.date, lang)}</span>
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                              {n.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
