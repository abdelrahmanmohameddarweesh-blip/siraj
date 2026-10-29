const { expo } = require("./app.json");
const adConfig = require("./ads.config.json");
// HTTPS app links need the same host in the native build and Hosting association
// files. The custom sirag:// scheme remains available without domain setup.
let host = "";
try {
  const url = new URL(process.env.EXPO_PUBLIC_INVITE_BASE_URL || "");
  if (url.protocol === "https:") host = url.hostname;
} catch {}
function adAppId(value, fallback) {
  if (value && !/^ca-app-pub-\d+~\d+$/.test(value))
    throw new Error(
      "AdMob App IDs must contain ~. Do not put an Ad Unit ID (/) in an App ID field.",
    );
  return value || fallback;
}
module.exports = {
  ...expo,
  plugins: [
    ...(expo.plugins || []),
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: adAppId(
          process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
            adConfig.android.appId,
          "ca-app-pub-3940256099942544~3347511713",
        ),
        iosAppId: adAppId(
          process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || adConfig.ios.appId,
          "ca-app-pub-3940256099942544~1458002511",
        ),
        delayAppMeasurementInit: true,
      },
    ],
  ],
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
