import {
  formatSessionDateInput,
  formatSessionDayOfMonth,
  parseSessionDateInput,
} from "@/lib/studycircle";

describe("formatSessionDayOfMonth", () => {
  it("uses the day in the scheduled date", () => {
    expect(formatSessionDayOfMonth("2026-11-26")).toBe("26");
  });

  describe("parseSessionDateInput", () => {
    it("converts DD/MM/YYYY to the ISO date expected by the database", () => {
      expect(parseSessionDateInput("27/11/2026")).toBe("2026-11-27");
    });

    it("rejects incomplete and impossible calendar dates", () => {
      expect(parseSessionDateInput("27/11/26")).toBeNull();
      expect(parseSessionDateInput("31/02/2026")).toBeNull();
      expect(parseSessionDateInput("")).toBeNull();
    });
  });

  describe("formatSessionDateInput", () => {
    it("adds DD/MM/YYYY separators while limiting input to eight digits", () => {
      expect(formatSessionDateInput("27112026")).toBe("27/11/2026");
      expect(formatSessionDateInput("27/11/2026")).toBe("27/11/2026");
      expect(formatSessionDateInput("2711202699")).toBe("27/11/2026");
    });
  });

  it("formats the day number in Bengali", () => {
    expect(formatSessionDayOfMonth("2026-11-26", "bn")).toBe("২৬");
  });

  it("returns empty or unchanged input for missing or invalid dates", () => {
    expect(formatSessionDayOfMonth("")).toBe("");
    expect(formatSessionDayOfMonth("not-a-date")).toBe("not-a-date");
  });
});
