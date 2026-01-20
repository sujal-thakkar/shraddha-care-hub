import { useQuery } from "@tanstack/react-query";
import { Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TeamMemberCard } from "./TeamMemberCard";
import type { Database } from "@/integrations/supabase/types";

type TeamCategory = Database["public"]["Enums"]["team_category"];

interface TeamMember {
  id: string;
  name: string;
  role: string;
  category: TeamCategory;
  photo_url: string | null;
  bio: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  display_order: number;
}

const CATEGORY_CONFIG: Record<TeamCategory, { label: string; order: number }> = {
  president: { label: "President", order: 1 },
  core: { label: "Core Team", order: 2 },
  senior_members: { label: "Senior Members", order: 3 },
  advocates: { label: "Advocates", order: 4 },
  counsellors: { label: "Counsellors", order: 5 },
  volunteers_technical: { label: "Technical Volunteers", order: 6 },
  volunteers_hr: { label: "HR Volunteers", order: 7 },
  volunteers_marketing: { label: "Marketing Volunteers", order: 8 },
  volunteers_social_media: { label: "Social Media Managers", order: 9 },
  volunteers_design: { label: "Design Volunteers", order: 10 },
  interns: { label: "Interns", order: 11 },
};

export function TeamSection() {
  const { data: teamMembers, isLoading, error } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as TeamMember[];
    },
  });

  // Group members by category
  const groupedMembers = teamMembers?.reduce((acc, member) => {
    if (!acc[member.category]) {
      acc[member.category] = [];
    }
    acc[member.category].push(member);
    return acc;
  }, {} as Record<TeamCategory, TeamMember[]>);

  // Sort categories by order
  const sortedCategories = groupedMembers
    ? (Object.keys(groupedMembers) as TeamCategory[]).sort(
        (a, b) => CATEGORY_CONFIG[a].order - CATEGORY_CONFIG[b].order
      )
    : [];

  if (isLoading) {
    return (
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !teamMembers || teamMembers.length === 0) {
    return (
      <section className="py-16 lg:py-24 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The dedicated individuals driving our mission forward.
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Team information coming soon...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-16">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Our Team
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            The dedicated individuals driving our mission forward.
          </p>
        </div>

        <div className="space-y-16">
          {sortedCategories.map((category) => (
            <div key={category}>
              {/* Category Header */}
              <div className="text-center mb-8">
                <h3 className="font-serif text-xl lg:text-2xl font-semibold text-foreground">
                  {CATEGORY_CONFIG[category].label}
                </h3>
                <div className="w-16 h-1 bg-primary mx-auto mt-3 rounded-full" />
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
                {groupedMembers![category].map((member) => (
                  <TeamMemberCard
                    key={member.id}
                    name={member.name}
                    role={member.role}
                    photoUrl={member.photo_url}
                    bio={member.bio}
                    facebookUrl={member.facebook_url}
                    instagramUrl={member.instagram_url}
                    linkedinUrl={member.linkedin_url}
                    githubUrl={member.github_url}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
