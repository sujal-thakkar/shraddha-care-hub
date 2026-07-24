import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type Lang = "en" | "bn";
const KEY = "app_lang";

// Blog-area translation dictionary. Keys are English fallbacks; missing keys fall back to English.
// Blog *content* (title, body) is never translated — those are original writings.
const dict: Record<string, Record<Lang, string>> = {
  // Blog listing page
  "Blogs": { en: "Blogs", bn: "ব্লগ" },
  "Stories, poems, recitations & reflections from our community.": {
    en: "Stories, poems, recitations & reflections from our community.",
    bn: "আমাদের সম্প্রদায়ের গল্প, কবিতা, আবৃত্তি ও প্রতিফলন।",
  },
  "Become a writer": { en: "Become a writer", bn: "লেখক হোন" },
  "Write as guest": { en: "Write as guest", bn: "অতিথি হিসেবে লিখুন" },
  "Write a blog": { en: "Write a blog", bn: "একটি ব্লগ লিখুন" },
  "My profile": { en: "My profile", bn: "আমার প্রোফাইল" },
  "Writer application pending admin approval.": {
    en: "Writer application pending admin approval.",
    bn: "লেখক আবেদন অ্যাডমিন অনুমোদনের অপেক্ষায়।",
  },
  "Write as guest meanwhile": { en: "Write as guest meanwhile", bn: "ইতিমধ্যে অতিথি হিসেবে লিখুন" },
  "Write as guest instead": { en: "Write as guest instead", bn: "পরিবর্তে অতিথি হিসেবে লিখুন" },
  "Your writer application was declined. Contact an admin for details.": {
    en: "Your writer application was declined. Contact an admin for details.",
    bn: "আপনার লেখক আবেদন প্রত্যাখ্যান করা হয়েছে। বিস্তারিত জানতে অ্যাডমিনের সাথে যোগাযোগ করুন।",
  },
  "Search blogs": { en: "Search blogs", bn: "ব্লগ খুঁজুন" },
  "All": { en: "All", bn: "সব" },
  "No blogs yet. Be the first to share yours!": {
    en: "No blogs yet. Be the first to share yours!",
    bn: "এখনও কোনো ব্লগ নেই। আপনিই প্রথম শেয়ার করুন!",
  },
  "By": { en: "By", bn: "লিখেছেন" },
  "Guest Blogger": { en: "Guest Blogger", bn: "অতিথি ব্লগার" },
  "Anonymous": { en: "Anonymous", bn: "অজ্ঞাত" },
  "Previous": { en: "Previous", bn: "পূর্ববর্তী" },
  "Next": { en: "Next", bn: "পরবর্তী" },
  "Page {n} of {t}": { en: "Page {n} of {t}", bn: "পৃষ্ঠা {n} / {t}" },

  // Blog read
  "Back to blogs": { en: "Back to blogs", bn: "ব্লগে ফিরে যান" },
  "min read": { en: "min read", bn: "মিনিট পড়া" },
  "Listen": { en: "Listen", bn: "শুনুন" },
  "Pause": { en: "Pause", bn: "থামান" },
  "Play": { en: "Play", bn: "চালান" },
  "Share": { en: "Share", bn: "শেয়ার করুন" },
  "Comments": { en: "Comments", bn: "মন্তব্য" },
  "You may also like": { en: "You may also like", bn: "আপনার পছন্দ হতে পারে" },
  "Explore more blogs": { en: "Explore more blogs", bn: "আরও ব্লগ দেখুন" },
  "Leave a Reply": { en: "Leave a Reply", bn: "একটি মন্তব্য করুন" },
  "Name": { en: "Name", bn: "নাম" },
  "Email address": { en: "Email address", bn: "ইমেইল ঠিকানা" },
  "Website": { en: "Website", bn: "ওয়েবসাইট" },
  "Comment": { en: "Comment", bn: "মন্তব্য" },
  "Post comment": { en: "Post comment", bn: "মন্তব্য জমা দিন" },
  "Like": { en: "Like", bn: "পছন্দ" },
  "Likes": { en: "Likes", bn: "পছন্দসমূহ" },

  // Writer / guest form
  "Title": { en: "Title", bn: "শিরোনাম" },
  "Your title": { en: "Your title", bn: "আপনার শিরোনাম" },
  "Cover image": { en: "Cover image", bn: "কভার ছবি" },
  "Upload cover": { en: "Upload cover", bn: "কভার আপলোড করুন" },
  "Submit for review": { en: "Submit for review", bn: "পর্যালোচনার জন্য জমা দিন" },
  "Save draft": { en: "Save draft", bn: "খসড়া সংরক্ষণ" },
  "Language": { en: "Language", bn: "ভাষা" },
  "English": { en: "English", bn: "ইংরেজি" },
  "Bengali": { en: "Bengali", bn: "বাংলা" },
  "Story": { en: "Story", bn: "গল্প" },
  "Poem": { en: "Poem", bn: "কবিতা" },
  "Recitation": { en: "Recitation", bn: "আবৃত্তি" },
  "Full name": { en: "Full name", bn: "পূর্ণ নাম" },
  "Phone number": { en: "Phone number", bn: "ফোন নম্বর" },
  "Continue": { en: "Continue", bn: "চালিয়ে যান" },
  "Cancel": { en: "Cancel", bn: "বাতিল" },
  "Submit": { en: "Submit", bn: "জমা দিন" },
  "PIN": { en: "PIN", bn: "পিন" },
  "Set a PIN": { en: "Set a PIN", bn: "একটি পিন সেট করুন" },
  "Enter your PIN": { en: "Enter your PIN", bn: "আপনার পিন লিখুন" },
  "Welcome back": { en: "Welcome back", bn: "আবার স্বাগতম" },
  "Go back to blog page": { en: "Go back to blog page", bn: "ব্লগ পৃষ্ঠায় ফিরে যান" },

  // Profile
  "Profile": { en: "Profile", bn: "প্রোফাইল" },
  "Drafts": { en: "Drafts", bn: "খসড়া" },
  "Pending": { en: "Pending", bn: "অপেক্ষমাণ" },
  "Published": { en: "Published", bn: "প্রকাশিত" },
  "Log out": { en: "Log out", bn: "লগ আউট" },
  "Change PIN": { en: "Change PIN", bn: "পিন পরিবর্তন" },
  "Edit": { en: "Edit", bn: "সম্পাদনা" },
  "Delete": { en: "Delete", bn: "মুছুন" },
  "Save changes": { en: "Save changes", bn: "পরিবর্তন সংরক্ষণ" },

  // Auth menu label
  "Language / ভাষা": { en: "Language / ভাষা", bn: "ভাষা / Language" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({ lang: "en", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(KEY);
    return stored === "bn" ? "bn" : "en";
  });

  useEffect(() => {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang === "bn" ? "bn" : "en";
  }, [lang]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = dict[key];
      let out = entry ? entry[lang] || entry.en || key : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return out;
    },
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
