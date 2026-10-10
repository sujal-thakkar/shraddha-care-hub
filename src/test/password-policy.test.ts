import { describe, expect, it } from "vitest";
import { getPasswordChecks, isPasswordValid } from "@/lib/password-policy";

describe("member password policy", () => {
  it("accepts a password that meets every requirement", () => {
    expect(isPasswordValid("Aram1982")).toBe(true);
    expect(getPasswordChecks("Aram1982")).toEqual({
      minLength: true,
      uppercase: true,
      lowercase: true,
      number: true,
    });
  });

  it("reports each missing requirement", () => {
    expect(getPasswordChecks("short")).toEqual({
      minLength: false,
      uppercase: false,
      lowercase: true,
      number: false,
    });
    expect(isPasswordValid("lowercase1")).toBe(false);
    expect(isPasswordValid("Uppercase1")).toBe(true);
    expect(isPasswordValid("UPPERCASE1")).toBe(false);
  });
});