/** Share startup/sign-in work so simultaneous features cannot create two identities. */
export function identitySession<T>(
  ready: () => Promise<void>,
  current: () => T | null,
  signIn: () => Promise<T>,
) {
  let pending: Promise<T> | null = null;
  return () => {
    if (pending) return pending;
    pending = (async () => {
      await ready();
      return current() || (await signIn());
    })().finally(() => {
      pending = null;
    });
    return pending;
  };
}
