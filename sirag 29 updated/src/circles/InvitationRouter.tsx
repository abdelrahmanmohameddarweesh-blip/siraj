import { useEffect } from "react";
import { Linking } from "react-native";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { loadProfile } from "../profile/profileStore";
import { updateJSON } from "../storage/jsonStore";
import { launch } from "../notifications/launchState";
export function useInvitationRouter(
  nav: NavigationContainerRefWithCurrent<any>,
) {
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = "";
    const open = async (url: string | null | undefined) => {
      if (!url || url === last) return;
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      const trusted =
        parsed.protocol === "sirag:" &&
        (parsed.hostname === "sohba" || parsed.pathname === "/sohba");
      // Web invitations are handled by the hosted landing page; never trust an
      // arbitrary https link to redirect app navigation.
      if (!trusted) return;
      const code = (parsed.searchParams.get("code") || "").toUpperCase();
      if (!/^[A-F0-9]{12}$/.test(code)) return;
      last = url;
      launch.fromNotification = true;
      try {
        await updateJSON<string | null>(
          "sirag-sohba-pending-code",
          null,
          () => code,
        );
        const profile = await loadProfile();
        const go = () => {
          if (!alive) return;
          if (!nav.isReady()) {
            timer = setTimeout(go, 150);
            return;
          }
          if (profile)
            nav.reset({
              index: 1,
              routes: [{ name: "Home" }, { name: "Sohba", params: { code } }],
            });
          else
            nav.reset({
              index: 0,
              routes: [
                {
                  name: "ProfileSetup",
                  params: { nextRoute: "Sohba", nextParams: { code } },
                },
              ],
            });
        };
        go();
      } catch {
        launch.fromNotification = false;
      }
    };
    void Linking.getInitialURL().then(open);
    const sub = Linking.addEventListener("url", (e) => {
      void open(e.url);
    });
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [nav]);
}
