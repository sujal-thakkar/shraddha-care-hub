import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatSessionDateInput, parseSessionDateInput } from "@/lib/studycircle";

interface StudyCircleDatePickerProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  describedBy: string;
}

export function StudyCircleDatePicker({
  id,
  value,
  onChange,
  invalid,
  describedBy,
}: StudyCircleDatePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedISO = parseSessionDateInput(value);
  const selectedDate = selectedISO ? parseISO(selectedISO) : undefined;

  return (
    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={10}
          placeholder="DD/MM/YYYY"
          aria-invalid={invalid}
          aria-describedby={describedBy}
          value={value}
          onChange={(event) => onChange(formatSessionDateInput(event.target.value))}
          className="pr-12"
        />
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Choose scheduled date from calendar"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          initialFocus
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "dd/MM/yyyy"));
            setCalendarOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
