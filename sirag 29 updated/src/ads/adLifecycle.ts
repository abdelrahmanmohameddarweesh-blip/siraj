/** Only the SDK's earned event may invoke onEarned; closing/loading never does. */
export interface AdDriver {
  on(
    event: "loaded" | "earned" | "closed" | "error",
    listener: (error?: unknown) => void,
  ): () => void;
  load(): void;
  show(): Promise<unknown>;
  destroy(): void;
}
export async function runRewardedLifecycle(
  ad: AdDriver,
  onEarned: () => Promise<unknown>,
  timeoutMs = 45000,
): Promise<{ earned: boolean }> {
  return new Promise((resolve, reject) => {
    let settled = false,
      earned = false,
      showing = false,
      work: Promise<unknown> | null = null;
    const stops: (() => void)[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cleanup = () => {
      if (timer) clearTimeout(timer);
      stops.forEach((stop) => {
        try {
          stop();
        } catch {}
      });
      try {
        ad.destroy();
      } catch {}
    };
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      Promise.resolve(work).then(
        () =>
          earned
            ? resolve({ earned: true })
            : reject(
                error instanceof Error
                  ? error
                  : new Error("الإعلان غير متاح الآن. حاول لاحقًا."),
              ),
        reject,
      );
    };
    stops.push(
      ad.on("earned", () => {
        if (settled || earned) return;
        earned = true;
        work = Promise.resolve().then(onEarned);
        work.catch(() => {});
      }),
    );
    stops.push(
      ad.on("closed", () => {
        if (settled) return;
        settled = true;
        cleanup();
        Promise.resolve(work).then(() => resolve({ earned }), reject);
      }),
    );
    stops.push(ad.on("error", fail));
    stops.push(
      ad.on("loaded", () => {
        if (settled || showing) return;
        showing = true;
        if (timer) clearTimeout(timer);
        ad.show().catch(fail);
      }),
    );
    timer = setTimeout(
      () =>
        fail(
          new Error(
            "الإعلان لم يصل بعد. لم تُحتسب مشاهدة أو مكافأة. حاول لاحقًا.",
          ),
        ),
      timeoutMs,
    );
    try {
      ad.load();
    } catch (e) {
      fail(e);
    }
  });
}
