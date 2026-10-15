import { describe, expect, it, vi } from "vitest";

import { coordinatesProblem, mapsSearchUrl, parseLocation, resolveShortLink } from "@/lib/location";

const coords = (input: string) => {
  const result = parseLocation(input);
  if (result.kind !== "coordinates") throw new Error(`expected coordinates, got ${JSON.stringify(result)}`);
  return result.coordinates;
};

describe("parseLocation — positive", () => {
  it.each([
    ["17.6868, 83.2185", 17.6868, 83.2185],
    ["17.6868,83.2185", 17.6868, 83.2185],
    ["17.6868 83.2185", 17.6868, 83.2185],
    ["  (17.6868, 83.2185)  ", 17.6868, 83.2185],
    ["+17.6868, +83.2185", 17.6868, 83.2185],
    ["17, 83", 17, 83],
  ])("decimal %s", (input, lat, lng) => {
    expect(coords(input)).toEqual({ latitude: lat, longitude: lng });
  });

  it("degrees-minutes-seconds as Google Maps shows it", () => {
    const c = coords(`17°40'17.1"N 83°12'36.4"E`);
    expect(c.latitude).toBeCloseTo(17.671417, 5);
    expect(c.longitude).toBeCloseTo(83.210111, 5);
  });

  it("DMS with typographic primes and longitude first", () => {
    const c = coords(`83°12′36.4″E, 17°40′17.1″N`);
    expect(c.latitude).toBeCloseTo(17.671417, 5);
    expect(c.longitude).toBeCloseTo(83.210111, 5);
  });

  it("decimal degrees with hemispheres", () => {
    expect(coords("17.6714°N 83.2101°E")).toEqual({ latitude: 17.6714, longitude: 83.2101 });
  });

  it("place URL prefers the !3d!4d pin over the @ viewport", () => {
    const url =
      "https://www.google.com/maps/place/Asha+Health+Care/@17.6900,83.2000,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d17.6714!4d83.2101!16s";
    expect(coords(url)).toEqual({ latitude: 17.6714, longitude: 83.2101 });
  });

  it("falls back to the @ viewport when there is no pin", () => {
    expect(coords("https://www.google.com/maps/@17.6868,83.2185,15z")).toEqual({
      latitude: 17.6868,
      longitude: 83.2185,
    });
  });

  it.each([
    "https://www.google.com/maps/search/?api=1&query=17.6868,83.2185",
    "https://maps.google.com/?q=17.6868,83.2185",
    "https://www.google.co.in/maps?ll=17.6868,83.2185&z=16",
    "https://www.google.com/maps/dir/?api=1&destination=17.6868%2C83.2185",
    "https://www.google.com/maps/search/17.6868,+83.2185?entry=ttu",
    "https://www.google.com/maps/place/17.6868,83.2185",
  ])("query and path forms: %s", (url) => {
    expect(coords(url)).toEqual({ latitude: 17.6868, longitude: 83.2185 });
  });

  it("DMS inside a URL path", () => {
    const c = coords(
      "https://www.google.com/maps/place/17%C2%B040'17.1%22N+83%C2%B012'36.4%22E/@17.67,83.21,17z",
    );
    expect(c.latitude).toBeCloseTo(17.671417, 5);
  });

  it("share text with a place name before the link", () => {
    expect(parseLocation("Asha Health Care https://maps.app.goo.gl/AbC123xyz")).toEqual({
      kind: "short-link",
      url: "https://maps.app.goo.gl/AbC123xyz",
    });
  });

  it("goo.gl/maps short links are recognised", () => {
    expect(parseLocation("https://goo.gl/maps/xyz").kind).toBe("short-link");
  });

  it("rounds to six decimals to match numeric(9,6)", () => {
    expect(coords("17.12345678, 83.98765432")).toEqual({ latitude: 17.123457, longitude: 83.987654 });
  });

  it("mapsSearchUrl builds the directions link", () => {
    expect(mapsSearchUrl({ latitude: 17.6, longitude: 83.2 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=17.6,83.2",
    );
  });
});

describe("parseLocation — negative", () => {
  it.each(["", "   ", null, undefined])("empty input %j", (input) => {
    expect(parseLocation(input as string)).toEqual({ kind: "empty" });
  });

  it.each([
    "Gajuwaka, Visakhapatnam",
    "hello",
    "17.6868",
    "17.6868, 83.2185, 5",
    "abc, def",
    `17°40'17.1"N 18°12'36.4"N`, // two latitudes
    `17°75'00"N 83°12'36.4"E`, // 75 minutes
  ])("unrecognised text %s", (input) => {
    expect(parseLocation(input).kind).toBe("invalid");
  });

  it("swapped latitude/longitude is caught", () => {
    const result = parseLocation("83.2185, 17.6868");
    expect(result).toMatchObject({ kind: "invalid" });
  });

  it.each(["0, 0", "0,0"])("Null Island %s", (input) => {
    expect(parseLocation(input)).toMatchObject({ kind: "invalid", message: expect.stringContaining("0, 0") });
  });

  it.each(["95, 83", "17, 190", "-91, 0"])("out of range %s", (input) => {
    expect(parseLocation(input).kind).toBe("invalid");
  });

  it("outside India", () => {
    expect(parseLocation("51.5074, -0.1278")).toMatchObject({ kind: "invalid", message: expect.stringContaining("outside India") });
  });

  it.each([
    "https://example.com/maps/@17.6868,83.2185,15z",
    "https://evil.google.com.attacker.io/maps/@17.6,83.2,15z",
    "https://goo.gl/abcdef",
    "https://www.google.com/maps/place/Asha+Health+Care",
  ])("links with no usable pin: %s", (input) => {
    expect(parseLocation(input).kind).toBe("invalid");
  });

  it("rejects absurdly long input", () => {
    expect(parseLocation("x".repeat(3000)).kind).toBe("invalid");
  });
});

describe("coordinatesProblem", () => {
  it("accepts a Vizag point", () => expect(coordinatesProblem(17.6868, 83.2185)).toBeNull());
  it("rejects NaN", () => expect(coordinatesProblem(Number.NaN, 83)).not.toBeNull());
  it("accepts India's edges", () => {
    expect(coordinatesProblem(8.0883, 77.5385)).toBeNull(); // Kanyakumari
    expect(coordinatesProblem(34.1526, 77.5771)).toBeNull(); // Leh
  });
});

const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });

describe("resolveShortLink", () => {
  it("follows a share link to the place pin", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      redirect("https://www.google.com/maps/place/X/@17.69,83.2,17z/data=!3d17.6714!4d83.2101"),
    );
    const result = await resolveShortLink("https://maps.app.goo.gl/AbC", fetchImpl);
    expect(result).toEqual({ kind: "coordinates", coordinates: { latitude: 17.6714, longitude: 83.2101 } });
    expect(fetchImpl).toHaveBeenCalledWith("https://maps.app.goo.gl/AbC", expect.objectContaining({ redirect: "manual" }));
  });

  it("follows a chain of Google redirects", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(redirect("https://maps.app.goo.gl/Next"))
      .mockResolvedValueOnce(redirect("https://maps.google.com/?q=17.6868,83.2185"));
    expect(await resolveShortLink("https://goo.gl/maps/abc", fetchImpl)).toMatchObject({ kind: "coordinates" });
  });

  it("refuses to follow a redirect off Google", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(redirect("https://attacker.example/steal"));
    expect((await resolveShortLink("https://maps.app.goo.gl/x", fetchImpl)).kind).toBe("invalid");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("never fetches a non-Google start URL", async () => {
    const fetchImpl = vi.fn();
    expect((await resolveShortLink("http://169.254.169.254/latest", fetchImpl)).kind).toBe("invalid");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("handles a dead link, a network error and a redirect loop", async () => {
    expect((await resolveShortLink("https://maps.app.goo.gl/x", vi.fn().mockResolvedValue(new Response("", { status: 404 })))).kind).toBe("invalid");
    expect((await resolveShortLink("https://maps.app.goo.gl/x", vi.fn().mockRejectedValue(new Error("down")))).kind).toBe("invalid");
    const loop = vi.fn().mockResolvedValue(redirect("https://maps.app.goo.gl/x"));
    expect((await resolveShortLink("https://maps.app.goo.gl/x", loop)).kind).toBe("invalid");
    expect(loop).toHaveBeenCalledTimes(5);
  });

  it("reports a place link with no pin as invalid", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(redirect("https://www.google.com/maps?q=Asha+Health+Care&ftid=0x1"));
    const loopGuard = fetchImpl.mockResolvedValue(new Response("<html>", { status: 200 }));
    expect((await resolveShortLink("https://maps.app.goo.gl/x", loopGuard)).kind).toBe("invalid");
  });
});
