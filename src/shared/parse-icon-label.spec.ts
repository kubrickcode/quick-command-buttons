import { parseIconLabel } from "./parse-icon-label";

describe("parseIconLabel", () => {
  it("should split icon token from display text", () => {
    expect(parseIconLabel("$(terminal) Test")).toEqual({
      displayText: "Test",
      iconName: "terminal",
      iconToken: "$(terminal)",
      spin: false,
    });
  });

  it("should keep the spin modifier in the token but strip it from the icon name", () => {
    expect(parseIconLabel("$(gear~spin) Build")).toEqual({
      displayText: "Build",
      iconName: "gear",
      iconToken: "$(gear~spin)",
      spin: true,
    });
  });

  it("should return an empty display text when the label is icon only", () => {
    expect(parseIconLabel("$(rocket)")).toEqual({
      displayText: "",
      iconName: "rocket",
      iconToken: "$(rocket)",
      spin: false,
    });
  });

  it("should treat a label without icon syntax as plain text", () => {
    expect(parseIconLabel("Build")).toEqual({ displayText: "Build", spin: false });
  });

  it("should ignore icon syntax that is not at the start", () => {
    expect(parseIconLabel("Build $(rocket)")).toEqual({
      displayText: "Build $(rocket)",
      spin: false,
    });
  });

  it("should not match an unclosed icon token", () => {
    expect(parseIconLabel("$(rocket Test")).toEqual({
      displayText: "$(rocket Test",
      spin: false,
    });
  });

  it("should handle an empty label", () => {
    expect(parseIconLabel("")).toEqual({ displayText: "", spin: false });
  });
});
