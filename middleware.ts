import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/roadmap/:path*",
    "/applications/:path*",
    "/interview/:path*",
    "/opportunities/:path*",
    "/community/:path*",
    "/consent/:path*",
  ],
};
