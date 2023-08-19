import NextAuth from "next-auth"

interface Guild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
}

interface User {
  email: string;
  image: string;
  name: string;
}

declare module "next-auth" {
  interface Session {
    expires: string;
    guilds: Guilds[];
    user: {
      email: string,
      image: string,
      name: string,
    }
    userId: string;
  }
}
