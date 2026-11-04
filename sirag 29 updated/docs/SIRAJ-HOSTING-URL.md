# Free Siraj-branded policy URLs

A Firebase project ID cannot be renamed. Its public Hosting site can use a separate available site ID in the **same** project. Keep project `batal-moslem` and its Auth/Firestore configuration; this does not migrate/delete accounts or activity. No custom-domain purchase or paid backend is required for a free `web.app` site within Firebase's free Hosting quotas.

Proposed site ID: **siraj-livingdesert**, subject to global availability. No site was created or deployed here. The repository retains its current URL until the helper is run after successfully creating the site.

From the latest project's **sirag 29 updated** folder on the owner's Mac:

```sh
npx firebase-tools login
npx firebase-tools hosting:sites:create siraj-livingdesert --project batal-moslem
```

If Firebase says the site ID is taken, stop and choose another available Siraj-based ID. Use that exact ID in all following commands. The existing site's `batal-moslem.web.app` address cannot simply be renamed into `siraj.web.app` if someone else owns that name.

After site creation succeeds, if the original policy pages have never been deployed, publish the current/default Hosting site once **before** switching targets, so existing installed versions retain working legal links:

```sh
npx firebase-tools deploy --only hosting --project batal-moslem
```

Then configure and publish the new site:

```sh
npm run hosting:configure -- siraj-livingdesert
npx firebase-tools deploy --only hosting:siraj --project batal-moslem
```

The helper updates `.firebaserc` Hosting-target mapping, the `firebase.json` Hosting target, `release.config.json` website base used by the in-app account/legal links, and existing listing URLs. It never changes Firebase project ID, Auth domain, API keys, Firestore rules, package or signing credentials. It does not create the site, deploy it, update Play Console or rebuild the app. Use `--dry-run` to preview changes without writing files.

After successful deployment, verify in a private browser window:

- `https://siraj-livingdesert.web.app/privacy` displays Siraj's privacy policy without login.
- `https://siraj-livingdesert.web.app/delete-account` displays the deletion request instructions.
- `https://siraj-livingdesert.web.app/support` displays support information.

Only use these URLs in Play Console **after** they open correctly. The current cloud workspace cannot verify the public host because network access to this domain is blocked.

The existing Firebase Hosting site is not deleted by this process. Keep any previously published policy URL accessible during the transition. New native builds made after running the helper use the new legal URL; already-built AABs retain their original in-app address. Keep the original site available for those versions. Creating the new site does not grant Google Play production access or remove closed-testing requirements. Android/iOS app-link domain association is a separate configuration and is not changed by this helper.
