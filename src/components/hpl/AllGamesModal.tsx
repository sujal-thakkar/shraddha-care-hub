import { motion, AnimatePresence } from "framer-motion";
import { X, Wifi, WifiOff, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AllGamesModalProps {
  open: boolean;
  onClose: () => void;
}

const OFFLINE_GAMES = [
  { en: "Carrom", bn: "ক্যারাম", emoji: "🎯" },
  { en: "Ludo", bn: "লুডো", emoji: "🎲" },
  { en: "Chess", bn: "দাবা", emoji: "♟️" },
  { en: "Foosball", bn: "ফুসবল", emoji: "⚽" },
  { en: "Slow Walk", bn: "ধীর পায়ে হাঁটা", emoji: "🚶" },
  { en: "Marble Spoon", bn: "মার্বেল চামচ", emoji: "🥄" },
  { en: "Badminton", bn: "ব্যাডমিন্টন", emoji: "🏸" },
  { en: "Memory Game", bn: "মেমরি গেম", emoji: "🧠" },
  { en: "Gaaner Lorai", bn: "গানের লড়াই", emoji: "🎤" },
  { en: "Bucket Ball", bn: "বাকেট বল", emoji: "🪣" },
  { en: "Saankh Bajano", bn: "শাঁখ বাজানো", emoji: "🐚" },
];

const ONLINE_GAMES = [
  { en: "Antakshari", bn: "অন্তাক্ষরী", emoji: "🎵" },
  { en: "Popular Song Guess", bn: "জনপ্রিয় গান অনুমান", emoji: "🎶" },
  { en: "Create Song/Poem", bn: "গান/কবিতা রচনা", emoji: "✍️" },
  { en: "Quiz", bn: "কুইজ", emoji: "❓" },
  { en: "Word Making", bn: "শব্দ তৈরি", emoji: "🔤" },
  { en: "Online Presence", bn: "অনলাইন উপস্থিতি", emoji: "📱" },
  { en: "Such Suto", bn: "সুচ সুতো", emoji: "🧵" },
  { en: "TAT", bn: "ছবি দেখে বলা", emoji: "🖼️" },
  { en: "Yes No Guess", bn: "হ্যাঁ/না অনুমান", emoji: "🤔" },
  { en: "Song Quiz", bn: "গান ধরো", emoji: "🎧" },
  { en: "Song Quiz - Individual", bn: "গান ধরো (একক)", emoji: "🎙️" },
];

const BOTH_GAMES = [
  { en: "Gita Shloka", bn: "গীতা শ্লোক", emoji: "📖" },
];

const CATEGORY_CONFIG = [
  {
    title: "Offline Games",
    titleBn: "অফলাইন গেম",
    games: OFFLINE_GAMES,
    icon: WifiOff,
    gradient: "from-emerald-500 to-teal-600",
    cardBg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40",
    badgeBg: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
  },
  {
    title: "Online Games",
    titleBn: "অনলাইন গেম",
    games: ONLINE_GAMES,
    icon: Wifi,
    gradient: "from-blue-500 to-indigo-600",
    cardBg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40",
    badgeBg: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
  },
  {
    title: "Both",
    titleBn: "উভয়",
    games: BOTH_GAMES,
    icon: Globe,
    gradient: "from-purple-500 to-pink-600",
    cardBg: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/40",
    badgeBg: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300",
  },
];

export default function AllGamesModal({ open, onClose }: AllGamesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-background border shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-20 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">🏆 HPL Games</h2>
                  <p className="text-white/80 text-sm mt-0.5">সব খেলা এক নজরে</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-6">
              {CATEGORY_CONFIG.map((cat, catIdx) => (
                <div key={cat.title}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}>
                      <cat.icon className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {cat.title}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        ({cat.titleBn})
                      </span>
                    </h3>
                    <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${cat.badgeBg}`}>
                      {cat.games.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {cat.games.map((game, i) => (
                      <motion.div
                        key={game.en}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: catIdx * 0.1 + i * 0.03 }}
                        className={`rounded-xl border p-3 flex items-center gap-3 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-default ${cat.cardBg}`}
                      >
                        <span className="text-2xl flex-shrink-0">{game.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground leading-tight truncate">
                            {game.en}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {game.bn}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
