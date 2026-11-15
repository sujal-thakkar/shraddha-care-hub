import { describe, expect, it } from "vitest";
import {
  ALREADY_MARKED_PRESENT_MESSAGE,
  describeSelfCheckinResult,
  isAlreadyMarkedPresent,
  normalizePhone10,
  type PresentAttendanceLike,
} from "@/lib/attendance";

const MEMBER_ID = "11111111-1111-1111-1111-111111111111";
const OTHER_MEMBER_ID = "22222222-2222-2222-2222-222222222222";

/**
 * These helpers mirror the SQL used by `check_attendance_already_present` and
 * `submit_self_attendance`. The scenarios below exercise the same edge cases the
 * server enforces, so a regression in the shared matching logic is caught here.
 */
describe("attendance already-present matching", () => {
  describe("normalizePhone10", () => {
    it("keeps the last 10 digits regardless of country code, formatting, or leading zero", () => {
      expect(normalizePhone10("+91 98765 43210")).toBe("9876543210");
      expect(normalizePhone10("098765-43210")).toBe("9876543210");
      expect(normalizePhone10("(98765) 43210")).toBe("9876543210");
      expect(normalizePhone10("9876543210")).toBe("9876543210");
    });

    it("returns whatever digits exist when fewer than 10 are supplied", () => {
      expect(normalizePhone10("98765")).toBe("98765");
      expect(normalizePhone10("")).toBe("");
      expect(normalizePhone10(null)).toBe("");
      expect(normalizePhone10(undefined)).toBe("");
    });
  });

  describe("logged-in member flow (matched by member_user_id)", () => {
    it("matches when the administrator recorded the member with the same user id", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: MEMBER_ID, attendee_phone: "0000000000" },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: MEMBER_ID })).toBe(true);
    });

    it("matches by member id even when the stored phone is missing or placeholder", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: MEMBER_ID, attendee_phone: null },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: MEMBER_ID, phone: "" })).toBe(true);
    });

    it("does not match a different member when neither id nor phone align", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: OTHER_MEMBER_ID, attendee_phone: "9998887776" },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: MEMBER_ID, phone: "9876543210" })).toBe(false);
    });

    it("ignores records that are not marked present", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "pending", member_user_id: MEMBER_ID, attendee_phone: "9876543210" },
        { attendance_status: "absent", member_user_id: MEMBER_ID, attendee_phone: "9876543210" },
        { attendance_status: "excused", member_user_id: MEMBER_ID, attendee_phone: "9876543210" },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: MEMBER_ID, phone: "9876543210" })).toBe(false);
    });
  });

  describe("non-logged-in & non-member flow (matched by phone)", () => {
    it("matches a guest record when formatting differs between submission and storage", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: null, attendee_phone: "+91 98765 43210" },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "9876543210" })).toBe(true);
    });

    it("matches when the attendee types a leading zero or country code", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: null, attendee_phone: "9876543210" },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "09876543210" })).toBe(true);
      expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "+91-9876543210" })).toBe(true);
    });

    it("does not match an unrelated guest phone number", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: null, attendee_phone: "9876543210" },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "9123456780" })).toBe(false);
    });

    it("never matches on an incomplete phone number", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: null, attendee_phone: "9876543210" },
      ];
      expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "98765" })).toBe(false);
      expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "" })).toBe(false);
    });

    it("returns false for an empty present list", () => {
      expect(isAlreadyMarkedPresent([], { memberUserId: MEMBER_ID, phone: "9876543210" })).toBe(false);
    });
  });

  describe("consistent matching for members and non-members", () => {
    it("matches the same phone for a member record and a guest record identically", () => {
      const present: PresentAttendanceLike[] = [
        { attendance_status: "present", member_user_id: MEMBER_ID, attendee_phone: "9876543210" },
        { attendance_status: "present", member_user_id: null, attendee_phone: "9876543210" },
      ];
      // Member flow supplies the user id; guest flow supplies only the phone.
      expect(isAlreadyMarkedPresent(present, { memberUserId: MEMBER_ID })).toBe(true);
      expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "9876543210" })).toBe(true);
    });
  });
});

describe("self check-in response interpretation", () => {
  it("treats an already_present response as the decisive outcome", () => {
    expect(describeSelfCheckinResult({ success: true, already_present: true, verification_pending: true }))
      .toBe("already_present");
    expect(describeSelfCheckinResult({ already_present: true })).toBe("already_present");
  });

  it("treats a non-pending submission as confirmed", () => {
    expect(describeSelfCheckinResult({ success: true, already_present: false, verification_pending: false }))
      .toBe("confirmed");
  });

  it("defaults to pending verification for fresh submissions and unknown payloads", () => {
    expect(describeSelfCheckinResult({ success: true, already_present: false, verification_pending: true }))
      .toBe("pending_verification");
    expect(describeSelfCheckinResult({ success: true })).toBe("pending_verification");
    expect(describeSelfCheckinResult(null)).toBe("pending_verification");
    expect(describeSelfCheckinResult("unexpected")).toBe("pending_verification");
  });
});

describe("end-to-end edge case scenarios (logic level)", () => {
  it("admin marks attendance first, then a member uses the form -> already present", () => {
    // Admin one-tap present creates a present record for the member.
    const present: PresentAttendanceLike[] = [
      { attendance_status: "present", member_user_id: MEMBER_ID, attendee_phone: "9876543210" },
    ];
    const alreadyPresent = isAlreadyMarkedPresent(present, { memberUserId: MEMBER_ID, phone: "9876543210" });
    expect(alreadyPresent).toBe(true);
    // The form shows the status message and never reaches the RPC.
  });

  it("admin marks attendance first, then a guest uses the form -> already present", () => {
    const present: PresentAttendanceLike[] = [
      { attendance_status: "present", member_user_id: null, attendee_phone: "9876543210" },
    ];
    expect(isAlreadyMarkedPresent(present, { memberUserId: null, phone: "9876543210" })).toBe(true);
  });

  it("attendee submits first, then admin verifies -> not already present on first submit", () => {
    // Attendee self check-in creates a pending record; nobody is present yet.
    const afterSelfCheckin: PresentAttendanceLike[] = [
      { attendance_status: "pending", member_user_id: MEMBER_ID, attendee_phone: "9876543210" },
    ];
    expect(isAlreadyMarkedPresent(afterSelfCheckin, { memberUserId: MEMBER_ID, phone: "9876543210" })).toBe(false);
  });

  it("unauthenticated user with no matching record can check in normally", () => {
    expect(isAlreadyMarkedPresent([], { memberUserId: null, phone: "9876543210" })).toBe(false);
  });

  it("exposes the exact user-facing message required by the spec", () => {
    expect(ALREADY_MARKED_PRESENT_MESSAGE).toBe("You have already been marked present for this session");
  });
});
