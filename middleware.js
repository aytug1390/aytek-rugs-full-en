export { default } from "next-auth/middleware";

export const config = {
  matcher: process.env.SKIP_AUTH === "1" ? [] : ["/admin/:path*"],
};
