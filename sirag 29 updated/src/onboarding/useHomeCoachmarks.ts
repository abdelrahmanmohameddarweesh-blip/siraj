import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EdgeInsets } from "react-native-safe-area-context";
import { loadProfile } from "../profile/profileStore";
import { launch } from "../notifications/launchState";
import { HOME_TOUR_KEY } from "./state";
import { Box, HOME_STEPS, TourTarget } from "./coachModel";
import type { RefObject, MutableRefObject, ComponentRef } from "react";
export function useHomeCoachmarks(
  navigation: any,
  scroll: RefObject<ComponentRef<typeof ScrollView> | null>,
  scrollY: MutableRefObject<number>,
  insets: EdgeInsets,
) {
  const { width, height } = useWindowDimensions(),
    focused = useIsFocused();
  const [active, setActive] = useState(false),
    [index, setIndex] = useState(0),
    [rect, setRect] = useState<Box | null>(null),
    [visiting, setVisiting] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const alive = useRef(true),
    automaticChecked = useRef(false),
    opening = useRef(false);
  const targets = useMemo(
    () =>
      Object.fromEntries(
        HOME_STEPS.map((s) => [s.target, createRef<ComponentRef<typeof View>>()]),
      ) as Record<TourTarget, RefObject<ComponentRef<typeof View> | null>>,
    [],
  );
  const visible = active && focused && !visiting;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (focused) setVisiting(false);
  }, [focused]);
  const start = useCallback(() => {
    setIndex(0);
    setRect(null);
    setError("");
    setVisiting(false);
    setActive(true);
  }, []);
  useFocusEffect(
    useCallback(() => {
      let valid = true;
      if (!automaticChecked.current && !launch.fromNotification) {
        void Promise.all([AsyncStorage.getItem(HOME_TOUR_KEY), loadProfile()])
          .then(([seen, profile]) => {
            if (valid && profile) {
              automaticChecked.current = true;
              if (!seen) start();
            }
          })
          .catch(() => {});
      }
      return () => {
        valid = false;
      };
    }, [start]),
  );
  useEffect(() => {
    if (!visible) return;
    setRect(null);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(setTimeout(fn, ms));
    };
    const measure = (attempt = 0) => {
      const node = targets[HOME_STEPS[index].target].current;
      if (!node) {
        if (attempt < 8) later(() => measure(attempt + 1), 120);
        else setError("تعذّر تحديد العنصر. يمكنك المتابعة أو تخطي الجولة.");
        return;
      }
      node.measureInWindow((x, y, w, h) => {
        if (cancelled) return;
        if (!w || !h) {
          if (attempt < 8) later(() => measure(attempt + 1), 120);
          return;
        }
        if (HOME_STEPS[index].target !== "oasis") {
          const desired = insets.top + 100;
          const next = Math.max(0, scrollY.current + y - desired);
          scroll.current?.scrollTo({ y: next, animated: false });
        }
        later(() => {
          if (cancelled) return;
          node.measureInWindow((rx, ry, rw, rh) => {
            if (!cancelled && rw > 0 && rh > 0)
              setRect({ x: rx, y: ry, width: rw, height: rh });
          });
        }, 180);
      });
    };
    later(() => measure(), 250);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [visible, index, width, height, insets.top, scroll, scrollY, targets]);
  const finish = useCallback(
    async (skipped = false) => {
      if (opening.current) return false;
      opening.current = true;
      setBusy(true);
      try {
        await AsyncStorage.setItem(
          HOME_TOUR_KEY,
          skipped ? "skipped" : "complete",
        );
        if (alive.current) {
          setActive(false);
          setRect(null);
          scroll.current?.scrollTo({ y: 0, animated: false });
        }
        return true;
      } catch {
        setError("تعذّر حفظ الجولة. حاول مرة أخرى.");
        return false;
      } finally {
        opening.current = false;
        if (alive.current) setBusy(false);
      }
    },
    [scroll],
  );
  const next = () => {
    if (index === HOME_STEPS.length - 1) void finish();
    else {
      setRect(null);
      setError("");
      setIndex((i) => i + 1);
    }
  };
  const previous = () => {
    setRect(null);
    setError("");
    setIndex((i) => Math.max(0, i - 1));
  };
  const visit = async () => {
    if (busy || opening.current) return;
    const step = HOME_STEPS[index];
    if (index === HOME_STEPS.length - 1) {
      if (!(await finish())) return;
    } else {
      setVisiting(true);
      setRect(null);
      setIndex((i) => i + 1);
    }
    setTimeout(() => {
      if (alive.current) navigation.navigate(step.screen);
    }, 180);
  };
  return {
    targets,
    visible,
    active,
    index,
    rect,
    busy,
    error,
    start,
    next,
    previous,
    visit,
    skip: () => void finish(true),
    step: HOME_STEPS[index],
    total: HOME_STEPS.length,
  };
}
