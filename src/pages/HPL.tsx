import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Marquee } from "@/components/ui/marquee";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  Medal,
  Users,
  Gamepad2,
  Search,
  ArrowLeft,
  Calendar,
  Clock,
  Star,
  Flame,
  Target,
  ChevronRight,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import hplPoster from "@/assets/HPL-poster.jpeg";
import hoslaLogo from "@/assets/hosla-logo.png";

// ─── Types ────────────────────────────────────────────────────
interface Team {
  name: string;
  totalPoints: number;
  memberCount: number;
  average: string;
}

interface Player {
  name: string;
  team: string;
  points: number;
}

interface RecentMatch {
  game: string;
  time: string;
  winners: string;
}

interface HPLData {
  teams: Team[];
  players: Player[];
  recent: RecentMatch[];
}

// ─── Helpers ──────────────────────────────────────────────────
const HPL_API =
  "https://script.google.com/macros/s/AKfycbz3EnfDbyApScLtZd6igngJJKwMzpdxeaWmDWh3LWDjOG2w970U32L-nC1cwyJjhalKLA/exec";

const cleanTeamName = (name: string) => {
  if (!name || name === "Unknown") return "Unknown";
  return name.split(" ").slice(0, 2).join(" ");
};

const formatMatchTime = (isoString: string) => {
  const date = new Date(isoString);
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
};

const RANK_COLORS = [
  "from-yellow-400 to-amber-500", // Gold
  "from-gray-300 to-gray-400",    // Silver
  "from-orange-400 to-orange-600", // Bronze
];

const RANK_ICONS = ["🥇", "🥈", "🥉"];

const RANK_BORDER_COLORS = [
  "border-yellow-400/60",
  "border-gray-400/60",
  "border-orange-400/60",
];

// ─── Loading Skeleton ─────────────────────────────────────────
const HPLSkeleton = () => (
  <Layout>
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10">
      <div className="container py-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  </Layout>
);

// ─── Main Component ───────────────────────────────────────────
export default function HPL() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<HPLData>({
    queryKey: ["hpl-data"],
    queryFn: async () => {
      const res = await fetch(HPL_API);
      if (!res.ok) throw new Error("Failed to fetch HPL data");
      return res.json();
    },
    refetchInterval: 60000, // Refresh every 60s
    staleTime: 30000,
  });

  // Sort teams by average descending
  const sortedTeams = useMemo(() => {
    if (!data?.teams) return [];
    return [...data.teams].sort(
      (a, b) => parseFloat(b.average) - parseFloat(a.average)
    );
  }, [data?.teams]);

  // Sort players by points descending
  const sortedPlayers = useMemo(() => {
    if (!data?.players) return [];
    return [...data.players].sort((a, b) => b.points - a.points);
  }, [data?.players]);

  // Filtered players
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return sortedPlayers;
    const q = searchQuery.toLowerCase();
    return sortedPlayers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        cleanTeamName(p.team).toLowerCase().includes(q)
    );
  }, [sortedPlayers, searchQuery]);

  const leadingTeam = sortedTeams[0];

  if (isLoading) return <HPLSkeleton />;

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-6 text-center space-y-4">
              <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-bold">Oops! Couldn't load HPL data</h2>
              <p className="text-muted-foreground">
                Please check your connection and try again.
              </p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10">
        {/* ─── Back Navigation ─────────────────────────────── */}
        <div className="container pt-6">
          <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
            <Link to="/corporate-care">
              <ArrowLeft className="h-4 w-4" />
              Back to Corporate Care
            </Link>
          </Button>
        </div>

        {/* ─── Hero / Event Banner ────────────────────────── */}
        <section className="container py-6 lg:py-10">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 dark:from-orange-600 dark:via-amber-600 dark:to-yellow-600 p-1">
              <div className="relative rounded-[calc(1.5rem-4px)] overflow-hidden bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-500 dark:from-orange-700 dark:via-amber-700 dark:to-yellow-600">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 text-6xl">🏆</div>
                  <div className="absolute top-8 right-8 text-5xl">⭐</div>
                  <div className="absolute bottom-4 left-1/3 text-4xl">🎯</div>
                  <div className="absolute bottom-8 right-4 text-5xl">🏅</div>
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-6 p-6 lg:p-10 items-center">
                  <div className="space-y-4 text-white">
                    <div className="flex items-center gap-3">
                      <img
                        src={hoslaLogo}
                        alt="Hosla"
                        className="h-10 w-10 rounded-full bg-white/20 p-1"
                      />
                      <Badge className="bg-white/20 text-white border-white/30 text-sm hover:bg-white/30">
                        <Flame className="h-3.5 w-3.5 mr-1" />
                        Live Event
                      </Badge>
                    </div>

                    <h1 className="text-3xl lg:text-5xl font-bold leading-tight">
                      Hosla Premier
                      <br />
                      League{" "}
                      <span className="text-yellow-200">🏏</span>
                    </h1>

                    <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-lg">
                      A high-energy sports league for our beloved Senior Citizens!
                      Offline games (Carrom, Ludo, Badminton) & Online games
                      (Quizzes, Antakshari) — celebrating courage at every age.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                        <Target className="h-4 w-4" />
                        Registrations Open!
                      </div>
                      <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium">
                        <Calendar className="h-4 w-4" />
                        Matches Every Weekend
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center lg:justify-end">
                    <motion.img
                      src={hplPoster}
                      alt="Hosla Premier League Poster"
                      className="rounded-2xl shadow-2xl max-h-72 lg:max-h-80 object-cover border-4 border-white/20"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ─── Leading Team Hero ──────────────────────────── */}
        {leadingTeam && parseFloat(leadingTeam.average) > 0 && (
          <section className="container pb-8">
            <ScrollReveal delay={100}>
              <motion.div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-100 via-amber-50 to-yellow-100 dark:from-yellow-900/30 dark:via-amber-900/20 dark:to-yellow-900/30 border-2 border-yellow-400/40 p-6 lg:p-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="absolute top-2 right-4 text-6xl opacity-20">🏆</div>
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-400/30">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                      🔥 Current Leader
                    </p>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                      {cleanTeamName(leadingTeam.name)}
                    </h2>
                  </div>
                  <div className="flex gap-6 text-center">
                    <div>
                      <p className="text-4xl lg:text-5xl font-bold text-amber-600 dark:text-amber-400">
                        {parseFloat(leadingTeam.average).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Avg Score
                      </p>
                    </div>
                    <div>
                      <p className="text-4xl lg:text-5xl font-bold text-foreground">
                        {leadingTeam.totalPoints}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        Total Pts
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          </section>
        )}

        {/* ─── Team Standings ─────────────────────────────── */}
        <section className="container pb-10">
          <ScrollReveal delay={150}>
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Team Standings
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sortedTeams.map((team, index) => (
                <motion.div
                  key={team.name}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card
                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      index < 3 ? RANK_BORDER_COLORS[index] + " border-2" : ""
                    }`}
                  >
                    {index < 3 && (
                      <div
                        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${RANK_COLORS[index]}`}
                      />
                    )}

                    <CardContent className="pt-6 pb-5 px-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {index < 3 ? (
                            <span className="text-2xl">{RANK_ICONS[index]}</span>
                          ) : (
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {team.memberCount} members
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-foreground mb-3">
                        {cleanTeamName(team.name)}
                      </h3>

                      <div className="flex items-baseline gap-4">
                        <div>
                          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                            {parseFloat(team.average).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Average
                          </p>
                        </div>
                        <div>
                          <p className="text-xl font-semibold text-foreground">
                            {team.totalPoints}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            Points
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* ─── Recent Matches Ticker ──────────────────────── */}
        {data?.recent && data.recent.length > 0 && (
          <section className="container pb-10">
            <ScrollReveal delay={200}>
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Recent Matches
                </h2>
              </div>

              <div className="overflow-hidden rounded-xl border bg-card">
                <Marquee speed="slow" pauseOnHover direction="left">
                  {data.recent.map((match, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-6 py-4 border-r border-border min-w-[300px]"
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {match.game}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          🏆 {match.winners}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-auto">
                        {formatMatchTime(match.time)}
                      </span>
                    </div>
                  ))}
                </Marquee>
              </div>
            </ScrollReveal>
          </section>
        )}

        {/* ─── Individual MVP Leaderboard ─────────────────── */}
        <section className="container pb-16">
          <ScrollReveal delay={250}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Individual MVP Leaderboard
                </h2>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-base"
                />
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16 text-center font-semibold text-base">
                        Rank
                      </TableHead>
                      <TableHead className="font-semibold text-base">Player</TableHead>
                      <TableHead className="font-semibold text-base">Team</TableHead>
                      <TableHead className="text-right font-semibold text-base">
                        Points
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPlayers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchQuery
                            ? "No players match your search."
                            : "No player data available yet."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPlayers.map((player, i) => {
                        // Find original rank in full sorted list
                        const originalRank = sortedPlayers.findIndex(
                          (p) => p.name === player.name
                        );
                        return (
                          <TableRow
                            key={player.name}
                            className={`transition-colors ${
                              originalRank < 3
                                ? "bg-amber-50/50 dark:bg-amber-950/20"
                                : ""
                            }`}
                          >
                            <TableCell className="text-center text-lg font-bold">
                              {originalRank < 3 ? (
                                <span className="text-2xl">
                                  {RANK_ICONS[originalRank]}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {originalRank + 1}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold text-base text-foreground">
                              {player.name}
                            </TableCell>
                            <TableCell>
                              {player.team === "Unknown" ? (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground border-muted-foreground/30"
                                >
                                  Unassigned
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="font-medium"
                                >
                                  {cleanTeamName(player.team)}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                {player.points}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </ScrollReveal>
        </section>

        {/* ─── Footer CTA ─────────────────────────────────── */}
        <section className="container pb-16">
          <ScrollReveal delay={300}>
            <div className="text-center rounded-2xl bg-gradient-to-r from-orange-100 via-amber-50 to-yellow-100 dark:from-orange-900/20 dark:via-amber-900/15 dark:to-yellow-900/20 border border-amber-200/50 dark:border-amber-800/30 p-8 lg:p-12">
              <p className="text-4xl mb-4">💪</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
                Every Player is a Champion!
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
                HPL celebrates the spirit of courage and community. Keep playing,
                keep winning — age is just a number!
              </p>
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Link to="/corporate-care">
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Explore Corporate Care
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </section>
      </div>
    </Layout>
  );
}
