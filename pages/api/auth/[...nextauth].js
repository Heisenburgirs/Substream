import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: process.env.DISCORD_REDIRECT_URL,
    })
  ],

  // When the user signs in, get their token
  callbacks: {
		async jwt({ token, account }) {
			// Persist the user ID to the token right after sign in
			if (account) {
				console.log("JWT ACCOUNT", account);
				token.userId = account.providerAccountId;
        token.access_token = account.access_token;
			}
			return token;
		},

		// eslint-disable-next-line no-unused-vars
		async session({ session, token }) {

      // Fetch user Guilds
      const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token.access_token}`,
            },
        });

			const userGuilds = await guildsResponse.json();
      //console.log("GUILDS", userGuilds)

			// Store the necessary user data in the session
			session.userId = token.userId;
      session.guilds = userGuilds;

      //console.log("ACCESS TOKEN", token.access_token)

			//console.log(session)
			return session;
		},
	},	
};

export default NextAuth(authOptions);
