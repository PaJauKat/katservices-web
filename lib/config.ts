export const STORE = {
  name: "KatServices",
  tagline: "OSRS SERVICE STORE",
  heroTitle: "Elite OSRS Services",
  discord: {
    /** Your personal Discord username, shown for copy-to-clipboard contact. */
    username: "pajau",
    /**
     * Your numeric Discord user ID (optional but recommended).
     * How to get it: open Discord -> Settings -> Advanced -> Developer Mode,
     * then right-click your profile -> Copy User ID.
     * When set, buttons link straight to https://discord.com/users/<id>.
     */
    userId: "",
  },
};

/** Direct profile link when userId is configured, otherwise null. */
export const discordProfileUrl: string | null = STORE.discord.userId
  ? `https://discord.com/users/${STORE.discord.userId}`
  : null;

export const CHECKOUT = {
  /** If set, order confirmations are POSTed to this Discord webhook. */
  discordWebhook: process.env.DISCORD_WEBHOOK_URL ?? "",
};