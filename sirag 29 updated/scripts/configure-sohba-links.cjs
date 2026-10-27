/** Run after setting the real Apple team ID / Android release certificate IDs. */
const fs = require("node:fs"),
  path = require("node:path");
const envFile = path.join(__dirname, "../.env");
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);
const config = require("../app.json").expo;
const folder = path.join(__dirname, "../invitation-site/.well-known");
fs.mkdirSync(folder, { recursive: true });
const team = (process.env.SIRAJ_APPLE_TEAM_ID || "").trim();
const certificates = (process.env.SIRAJ_ANDROID_SHA256_FINGERPRINTS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
if (team && !/^[A-Z0-9]{10}$/.test(team))
  throw Error("Use the ten-character Apple Developer Team ID");
if (certificates.some((c) => !/^([A-Fa-f0-9]{2}:){31}[A-Fa-f0-9]{2}$/.test(c)))
  throw Error(
    "Use SHA-256 signing certificate fingerprints, separated by commas",
  );
fs.writeFileSync(
  path.join(folder, "apple-app-site-association"),
  JSON.stringify(
    {
      applinks: {
        apps: [],
        details: team
          ? [
              {
                appID: `${team}.${config.ios.bundleIdentifier}`,
                paths: ["/", "/join", "/join/*"],
              },
            ]
          : [],
      },
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(folder, "assetlinks.json"),
  JSON.stringify(
    certificates.length
      ? [
          {
            relation: ["delegate_permission/common.handle_all_urls"],
            target: {
              namespace: "android_app",
              package_name: config.android.package,
              sha256_cert_fingerprints: certificates,
            },
          },
        ]
      : [],
    null,
    2,
  ),
);
console.log(
  `Association files generated. iOS: ${team ? "configured" : "not yet configured"}; Android: ${certificates.length ? "configured" : "not yet configured"}. Deploy Hosting and rebuild the app after configuring the HTTPS host.`,
);
