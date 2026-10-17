import { expect, test } from "vitest";
import { hanumanRedirect } from "../convex/redirects";
test("Google sign-in stays on either authorized Hanuman address", () => {
  expect(hanumanRedirect("/")).toBe("https://hanuman.dyut.si/");
  for (const origin of ["https://hanuman.dyut.si", "https://be-hanuman-next.vercel.app"]) {
    expect(hanumanRedirect(origin + "/?test=1")).toBe(origin + "/?test=1");
  }
});
test("sign-in refuses lookalike and external return addresses", () => {
  for (const value of ["//example.com", "https://hanuman.dyut.si.evil.example", "https://user@hanuman.dyut.si", "http://hanuman.dyut.si"]) {
    expect(() => hanumanRedirect(value)).toThrow();
  }
});

test("owned public domains are allowed without opening redirects to lookalikes",()=>{
 for(const origin of ["https://behanuman.com","https://www.behanuman.com"])expect(hanumanRedirect(origin+"/")).toBe(origin+"/");
 for(const url of ["http://www.behanuman.com/","https://www.behanuman.com.evil.example/","https://user@www.behanuman.com/","https://behanuman.com:8443/","https://other.behanuman.com/"])expect(()=>hanumanRedirect(url)).toThrow();
});
