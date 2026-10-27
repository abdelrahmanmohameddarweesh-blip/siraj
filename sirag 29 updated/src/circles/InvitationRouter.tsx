import { useEffect } from "react";
import { Linking } from "react-native";
import type { NavigationContainerRefWithCurrent } from "@react-navigation/native";
import { updateJSON } from "../storage/jsonStore";
import { launch } from "../notifications/launchState";
import { invitationFromURL } from "./model";
export function useInvitationRouter(
  nav: NavigationContainerRefWithCurrent<any>,
) {
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = "";
    const open = async (url: string | null | undefined) => {
      if (!url || url === last) return;
      const code = invitationFromURL(
        url,
        process.env.EXPO_PUBLIC_INVITE_BASE_URL || "",
      );
      if (!code) return;
      last = url;
      launch.fromNotification = true;
      try {
        await updateJSON<string | null>(
          "sirag-sohba-pending-code",
          null,
          () => code,
        );
        const go = () => {
          if (!alive) return;
          if (!nav.isReady()) {
            timer = setTimeout(go, 150);
            return;
          }
          nav.reset({
            index: 1,
            routes: [{ name: "Home" }, { name: "Sohba", params: { code } }],
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
