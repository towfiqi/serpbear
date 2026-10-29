/**
 * The external URL of this SerpBear instance, read when the code runs.
 *
 * Next.js replaces `process.env.NEXT_PUBLIC_*` with the value it sees at build
 * time whenever the variable exists then. Reading through an alias keeps the
 * lookup at runtime, as the removed `serverRuntimeConfig.appURL` did, so one
 * image serves any URL.
 */
const getAppURL = (): string => {
   const { env } = process;
   return env.NEXT_PUBLIC_APP_URL || '';
};

export default getAppURL;
