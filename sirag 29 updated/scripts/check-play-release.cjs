const fs = require("node:fs"),
  path = require("node:path");
const base = path.join(__dirname, ".."),
  read = (p) => JSON.parse(fs.readFileSync(path.join(base, p), "utf8"));
const { expo } = read("app.json"),
  release = read("release.config.json"),
  eas = read("eas.json");
const errors = [],
  check = (ok, message) => {
    if (!ok) errors.push(message);
  };
check(
  expo.android.package === "com.sirag.livingdesert",
  "Confirm the permanent Android package before first upload",
);
check(
  Number.isInteger(expo.android.versionCode) && expo.android.versionCode > 0,
  "A positive Android versionCode is required",
);
check(
  eas.build["play-internal"].android.buildType === "app-bundle",
  "Internal Play build must produce AAB",
);
check(
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(release.supportEmail),
  "A public support email is required",
);
for (const [file, w, h] of [
  ["store-listing/icon-512.png", 512, 512],
  ["store-listing/feature-graphic-1024x500.png", 1024, 500],
]) {
  const bytes = fs.readFileSync(path.join(base, file));
  check(
    bytes.readUInt32BE(16) === w && bytes.readUInt32BE(20) === h,
    `${file} dimensions must be ${w}×${h}`,
  );
}
for (const route of ["privacy.html", "delete-account.html", "support.html"])
  check(
    fs.existsSync(path.join(base, "invitation-site", route)),
    `Missing ${route}`,
  );
if (process.argv.includes("--public")) {
  check(
    release.releaseScope === "full-features-13-plus" && release.minimumAge === 13 && release.audience === "ages-13-and-older",
    "Confirm the approved 13+ audience and full-feature release scope",
  );
  check(
    release.ownerReleaseApproved === true,
    "Owner must review the native app, listing, privacy and app-content declarations before public submission",
  );
}
if (errors.length) {
  errors.forEach((e) => console.error("BLOCKED: " + e));
  process.exitCode = 1;
} else
  console.log(
    "PASS: local release-package checks. This does not create a signed AAB, publish web pages or approve Play policies.",
  );
