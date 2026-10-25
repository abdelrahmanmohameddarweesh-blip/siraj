/**
 * Environment configuration for Batl Muslim
 * In Expo, variables prefixed with EXPO_PUBLIC_ are automatically exposed to the client bundle.
 */

export const Env = {
  /**
   * Optional pronunciation/DSP analysis server URL (e.g., "http://192.168.1.100:5001").
   * When empty or unset, on-device audio analysis is used directly.
   */
  dspServerUrl: process.env.EXPO_PUBLIC_DSP_SERVER_URL?.trim() || '',
};

export default Env;
