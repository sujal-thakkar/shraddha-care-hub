import { Stethoscope, Mic2, Gamepad2, Brain, BadgePercent, LucideIcon } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

import bentoDental from "@/assets/bento-dental.jpg";
import bentoTalent from "@/assets/bento-talent.jpg";
import bentoGames from "@/assets/bento-games.png";
import bentoMemory from "@/assets/bento-memory.jpg";
import bentoMembership from "@/assets/bento-membership.jpg";

const ImageHeader = ({ src, alt, Icon }: { src: string; alt: string; Icon: LucideIcon }) => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden relative group/img">
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover/img:scale-110"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md transition-all duration-300 group-hover/img:scale-110 group-hover/img:bg-pink-50 group-hover/img:shadow-pink-200/50">
      <Icon className="h-5 w-5 text-pink-600 transition-transform duration-300 group-hover/img:rotate-12" />
    </div>
  </div>
);

const highlights = [
  {
    title: "Free Dental Check-up",
    description: "Professional screening to ensure your oral health is on track. A healthy smile is a timeless one!",
    header: <ImageHeader src={bentoDental} alt="Free dental check-up for senior citizens" />,
    className: "md:col-span-1",
    icon: <Stethoscope className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Senior Citizen Talent Express",
    description: "A stage for our elders to shine — sing a classic melody, recite poetry, or share a life story.",
    header: <ImageHeader src={bentoTalent} alt="Senior citizens performing on stage" />,
    className: "md:col-span-1",
    icon: <Mic2 className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Recreational Games & Activities",
    description: "Specially designed light physical activities to keep the energy high and the spirit youthful.",
    header: <ImageHeader src={bentoGames} alt="Seniors playing recreational games outdoors" />,
    className: "md:col-span-1",
    icon: <Gamepad2 className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Memory Games",
    description: "Fun, cognitive exercises aimed at boosting mental agility and keeping the mind sharp.",
    header: <ImageHeader src={bentoMemory} alt="Seniors playing memory card games" />,
    className: "md:col-span-2",
    icon: <Brain className="h-4 w-4 text-pink-600" />,
  },
  {
    title: "Exclusive Membership Offers",
    description: "Be the first to join the Hosla community with special Early Bird Offers available only at the event.",
    header: <ImageHeader src={bentoMembership} alt="VIP early bird membership offer" />,
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
