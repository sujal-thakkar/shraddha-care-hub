import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";
import { searchMembers, type MemberSearchResult } from "@/lib/studycircle";

export interface MemberSelection {
  memberId: string | null;
  guestName: string | null;
  displayName: string;
}

interface MemberSearchComboboxProps {
  value: { memberId: string | null; guestName: string | null };
  onChange: (v: MemberSelection) => void;
  placeholder?: string;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  lapsed: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  due: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
};

function last4(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `****${digits.slice(-4)}` : digits;
}

/**
 * Reusable member autocomplete for Study Circle performers.
 * Member-first: picks a `member_imports.id` and caches the name as guest_name.
 * Falls back to a free-text guest name when the person is not a member (E1/E10).
 */
export function MemberSearchCombobox({ value, onChange, placeholder, className }: MemberSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MemberSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guestText, setGuestText] = useState("");
  const seq = useRef(0);

  const hasSelection = Boolean(value.memberId || value.guestName);

  // Debounced member search (design doc §8.3 — 300ms, min 2 chars).
  useEffect(() => {
    if (guestMode || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const handle = window.setTimeout(async () => {
      const mySeq = ++seq.current;
      try {
        const rows = await searchMembers(query);
        if (seq.current === mySeq) setResults(rows);
      } catch {
        if (seq.current === mySeq) setResults([]);
      } finally {
        if (seq.current === mySeq) setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [query, guestMode]);

  const reset = () => {
    setQuery("");
    setResults([]);
    setGuestMode(false);
    setGuestText("");
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) reset();
  };

  const pickMember = (m: MemberSearchResult) => {
    onChange({ memberId: m.id, guestName: m.name, displayName: m.name });
    handleOpenChange(false);
  };

  const pickGuest = () => {
    const name = guestText.trim();
    if (!name) return;
    onChange({ memberId: null, guestName: name, displayName: name });
    handleOpenChange(false);
  };

  if (hasSelection) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 pl-2.5 pr-1 py-1 text-sm",
          className,
        )}
      >
        <span className="font-medium text-foreground">{value.memberId ? value.guestName : `${value.guestName} (guest)`}</span>
        <button
          type="button"
          aria-label="Remove performer"
          className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onChange({ memberId: null, guestName: null, displayName: "" })}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-9 w-full justify-start gap-2 font-normal text-muted-foreground", className)}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{placeholder ?? "Search member…"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem] p-0">
        {guestMode ? (
          <div className="p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Not in the member list — enter the name as a guest.
            </p>
            <Input
              autoFocus
              value={guestText}
              onChange={(e) => setGuestText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  pickGuest();
                }
              }}
              placeholder="Performer name"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setGuestMode(false)}>
                Back
              </Button>
              <Button type="button" size="sm" onClick={pickGuest} disabled={!guestText.trim()}>
                Add guest
              </Button>
            </div>
          </div>
        ) : (
          <Command shouldFilter={false}>
            <CommandInput placeholder="Type a name or member ID…" value={query} onValueChange={setQuery} />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              ) : query.trim().length < 2 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Type at least 2 characters.</div>
              ) : results.length === 0 ? (
                <CommandEmpty>No members found.</CommandEmpty>
              ) : (
                <CommandGroup heading="Members">
                  {results.map((m) => (
                    <CommandItem key={m.id} value={m.id} onSelect={() => pickMember(m)} className="gap-2">
                      <Check className="h-4 w-4 opacity-0" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium text-foreground">{m.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {[m.membership_id, last4(m.phone_digits)].filter(Boolean).join(" · ")}
                        </span>
                      </div>
                      {m.status && (
                        <Badge variant="secondary" className={cn("shrink-0 capitalize", STATUS_STYLES[m.status])}>
                          {m.status}
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <button
              type="button"
              onClick={() => setGuestMode(true)}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-sm text-primary hover:bg-accent"
            >
              <UserPlus className="h-4 w-4" />
              Not in member list? Add as guest
            </button>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default MemberSearchCombobox;
