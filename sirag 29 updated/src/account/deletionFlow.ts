/** Keep a resumable checkpoint; never claim deletion completed after a failure. */
export type DeleteStage = "cloud" | "identity" | "device";
export interface DeletionSteps {
  cloud(): Promise<void>;
  identity(): Promise<void>;
  device(): Promise<void>;
  checkpoint(stage: DeleteStage): Promise<void>;
}
export async function runDeletion(
  steps: DeletionSteps,
  start: DeleteStage = "cloud",
) {
  if (start === "cloud") {
    await steps.cloud();
    await steps.checkpoint("identity");
  }
  if (start !== "device") {
    await steps.identity();
    await steps.checkpoint("device");
  }
  await steps.device();
}
