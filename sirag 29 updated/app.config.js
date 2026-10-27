const { expo } = require("./app.json");
// HTTPS app links need the same host in the native build and Hosting association
// files. The custom sirag:// scheme remains available without domain setup.
let host = "";
try {
  const url = new URL(process.env.EXPO_PUBLIC_INVITE_BASE_URL || "");
  if (url.protocol === "https:") host = url.hostname;
} catch {}
module.exports = {
  ...expo,
  ios: {
    ...expo.ios,
    ...(host ? { associatedDomains: [`applinks:${host}`] } : {}),
  },
  android: {
    ...expo.android,
    ...(host
      ? {
          intentFilters: [
            {
              action: "VIEW",
              autoVerify: true,
              data: [{ scheme: "https", host, pathPrefix: "/" }],
              category: ["BROWSABLE", "DEFAULT"],
            },
          ],
        }
      : {}),
  },
};
