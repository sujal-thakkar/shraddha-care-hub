import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Loader2, MapPin } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type ProjectEvent = Database["public"]["Tables"]["projects_events"]["Row"];
type ProjectStatus = Database["public"]["Enums"]["project_status"];
type OrganizationType = Database["public"]["Enums"]["organization_type"];

export function ProjectsEventsSection() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["public-projects-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects_events")
        .select("*")
        .eq("is_published", true)
        .neq("status", "completed")
        .order("display_order", { ascending: true })
        .order("start_date", { ascending: true });
      
      if (error) throw error;
      return data as ProjectEvent[];
    },
  });

  const getStatusBadge = (status: ProjectStatus) => {
    if (status === "upcoming") {
      return (
        <Badge 
          className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100"
        >
          Upcoming
        </Badge>
      );
    }
    return (
      <Badge 
        className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100"
      >
        Ongoing
      </Badge>
    );
  };

  const getOrgLabel = (org: OrganizationType) => {
    const labels: Record<OrganizationType, string> = {
      shraddha: "Shraddha",
      hosla: "Hosla",
      both: "Shraddha & Hosla",
    };
    return labels[org];
  };

  if (isLoading) {
    return (
      <section 
        className="relative py-16 lg:py-24 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(88, 55, 163, 0.08) 0%, rgba(120, 80, 200, 0.12) 100%)' }}
      >
        <div className="container">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(250, 70%, 45%)' }} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section 
      className="relative py-16 lg:py-24 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgba(88, 55, 163, 0.08) 0%, rgba(120, 80, 200, 0.12) 100%)' }}
    >
      {/* Decorative calendar icons */}
      <div className="absolute top-10 left-10 opacity-5">
        <Calendar className="w-32 h-32" style={{ color: 'hsl(250, 70%, 45%)' }} />
      </div>
      <div className="absolute bottom-10 right-10 opacity-5">
        <Calendar className="w-32 h-32" style={{ color: 'hsl(250, 70%, 45%)' }} />
      </div>
      
      <div className="container relative z-10">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Our Projects & Events
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our upcoming and ongoing initiatives dedicated to elder care and community welfare.
            </p>
          </div>
        </ScrollReveal>

        {events.length === 0 ? (
          <ScrollReveal>
            <div className="text-center py-12 bg-background/50 rounded-2xl border border-border/50">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" style={{ color: 'hsl(250, 70%, 45%)' }} />
              <p className="text-muted-foreground">No upcoming events at the moment. Check back soon!</p>
            </div>
          </ScrollReveal>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event, index) => (
              <ScrollReveal key={event.id} delay={index * 100}>
                <div 
                  className="relative bg-background rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-border/50 group h-full flex flex-col"
                >
                  {/* Purple accent line */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: 'linear-gradient(90deg, hsl(250, 70%, 45%), hsl(220, 70%, 50%))' }}
                  />
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      {getStatusBadge(event.status)}
                      <span 
                        className="text-xs font-medium px-2 py-1 rounded-full"
                        style={{ 
                          background: 'linear-gradient(135deg, rgba(88, 55, 163, 0.1), rgba(120, 80, 200, 0.1))',
                          color: 'hsl(250, 70%, 45%)'
                        }}
                      >
                        {getOrgLabel(event.organization)}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-[hsl(250,70%,45%)] transition-colors">
                      {event.title}
                    </h3>
                    
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" style={{ color: 'hsl(250, 70%, 45%)' }} />
                      <span>
                        {format(new Date(event.start_date), "MMM d, yyyy")}
                        {event.end_date && ` - ${format(new Date(event.end_date), "MMM d, yyyy")}`}
                      </span>
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" style={{ color: 'hsl(250, 70%, 45%)' }} />
                        <span>{event.location}</span>
                      </div>
                    )}
                    
                    {event.resource_link && (
                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm"
                        className="w-full mt-auto border-[hsl(250,70%,45%)]/30 text-[hsl(250,70%,45%)] hover:bg-[hsl(250,70%,45%)] hover:text-white"
                      >
                        <a href={event.resource_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Learn More
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
