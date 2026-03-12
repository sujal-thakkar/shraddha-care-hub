import { Stethoscope, Mic2, Gamepad2, Brain, BadgePercent } from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

import bentoDental from "@/assets/bento-dental.jpg";
import bentoTalent from "@/assets/bento-talent.jpg";
import bentoGames from "@/assets/bento-games.png";
import bentoMemory from "@/assets/bento-memory.jpg";
import bentoMembership from "@/assets/bento-membership.jpg";

const ImageHeader = ({ src, alt }: { src: string; alt: string }) => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl overflow-hidden relative group/img">
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover/img:scale-110"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
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
