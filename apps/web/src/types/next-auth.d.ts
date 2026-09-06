import "next-auth";
import "next-auth/jwt";

// The session/token carry the user id and role our app relies on.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
  }
}
