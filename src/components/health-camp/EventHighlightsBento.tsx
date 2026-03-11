import { motion } from "framer-motion";
import { Stethoscope, Mic2, Gamepad2, Brain, BadgePercent, Music, BookOpen, Puzzle, Target, Lightbulb, Dices, Sparkles, Gift } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const SkeletonDental = () => (
  <motion.div
    className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-pink-100 via-pink-50 to-white overflow-hidden items-center justify-center"
    initial={{ opacity: 0.8 }}
    whileHover={{ scale: 1.02 }}
  >
    <motion.div className="flex gap-3 items-end">
      {[40, 56, 48, 36, 52].map((h, i) => (
        <motion.div
          key={i}
          className="rounded-t-md bg-pink-300/70 w-4"
          style={{ height: h }}
          initial={{ height: 0 }}
          animate={{ height: h }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        />
      ))}
    </motion.div>
    <Stethoscope className="h-10 w-10 text-pink-400/40 absolute" />
  </motion.div>
);

const SkeletonTalent = () => {
  const variants = {
    initial: { y: 0 },
    animate: {
      y: [-2, 2, -2],
      transition: { duration: 2, repeat: Infinity },
    },
  };
  return (
    <motion.div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-pink-200/60 via-pink-100 to-pink-50 items-center justify-center gap-2 p-4">
      {["🎤", "🎶", "📖"].map((emoji, i) => (
        <motion.div
          key={i}
          className="text-3xl"
          variants={variants}
          initial="initial"
          animate="animate"
          style={{ animationDelay: `${i * 0.3}s` }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
        >
          {emoji}
        </motion.div>
      ))}
    </motion.div>
  );
};

const SkeletonGames = () => (
  <motion.div
    className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-pink-50 to-pink-100/80 items-center justify-center relative overflow-hidden"
    whileHover="hover"
  >
    <motion.div
      className="grid grid-cols-3 gap-2"
      variants={{ hover: { rotate: 3 } }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-6 h-6 rounded bg-pink-300/50"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
        />
      ))}
    </motion.div>
  </motion.div>
);

const SkeletonMemory = () => {
  const cards = ["🧩", "🎯", "💡", "🧠", "🎲", "✨"];
  return (
    <motion.div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-pink-100 to-pink-200/40 items-center justify-center p-4">
      <div className="grid grid-cols-3 gap-2">
        {cards.map((emoji, i) => (
          <motion.div
            key={i}
            className="w-10 h-10 rounded-lg bg-white/80 border border-pink-200 flex items-center justify-center text-lg cursor-pointer shadow-sm"
            whileHover={{ rotateY: 180, backgroundColor: "rgb(252, 231, 243)" }}
            transition={{ duration: 0.4 }}
          >
            {emoji}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const SkeletonMembership = () => (
  <motion.div
    className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-pink-600/10 via-pink-100 to-pink-50 items-center justify-center relative overflow-hidden"
    whileHover="hover"
  >
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-200/30 to-transparent"
      variants={{
        hover: {
          x: ["-100%", "100%"],
          transition: { duration: 1.5, repeat: Infinity },
        },
      }}
    />
    <div className="flex flex-col items-center gap-1 z-10">
      <span className="text-3xl">🎁</span>
      <span className="text-xs font-medium text-pink-600 bg-pink-100 px-3 py-1 rounded-full border border-pink-200">
        Early Bird Offer
      </span>
    </div>
  </motion.div>
);

const highlights = [
  {
    title: "Free Dental Check-up",
    description:
      "Professional screening to ensure your oral health is on track. A healthy smile is a timeless one!",
    header: <SkeletonDental />,
    className: "md:col-span-1",
    icon: <Stethoscope className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Senior Citizen Talent Express",
    description:
      "A stage for our elders to shine — sing a classic melody, recite poetry, or share a life story.",
    header: <SkeletonTalent />,
    className: "md:col-span-1",
    icon: <Mic2 className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Recreational Games & Activities",
    description:
      "Specially designed light physical activities to keep the energy high and the spirit youthful.",
    header: <SkeletonGames />,
    className: "md:col-span-1",
    icon: <Gamepad2 className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Memory Games",
    description:
      "Fun, cognitive exercises aimed at boosting mental agility and keeping the mind sharp.",
    header: <SkeletonMemory />,
    className: "md:col-span-2",
    icon: <Brain className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Exclusive Membership Offers",
    description:
      "Be the first to join the Hosla community with special Early Bird Offers available only at the event.",
    header: <SkeletonMembership />,
    className: "md:col-span-1",
    icon: <BadgePercent className="h-4 w-4 text-pink-600" />,
  },
];

export default function EventHighlightsBento() {
  return (
    <BentoGrid className="max-w-5xl mx-auto">
      {highlights.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={item.className}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}
