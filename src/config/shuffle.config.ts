/**
 * Shuffle Configuration
 *
 * Controls the behavior of the shuffle/random term feature in Explore mode.
 * This allows you to tweak what terms are eligible for random selection.
 */

export interface ShuffleConfig {
  /**
   * Minimum number of `related` connections required for a concept to be
   * eligible for shuffle selection.
   *
   * Set to 0 to allow any concept (including dead ends).
   * Set to 1+ to ensure shuffled concepts have at least that many connections.
   *
   * Example:
   * - minConnections: 0  -> Any concept can be selected (may include dead ends)
   * - minConnections: 1  -> Only concepts with at least 1 connection
   * - minConnections: 3  -> Only concepts with at least 3 connections
   */
  minConnections: number;
}

/**
 * Active shuffle configuration.
 *
 * To change behavior, edit the values below and restart the dev server.
 */
export const SHUFFLE_CONFIG: ShuffleConfig = {
  // Cross-references are being reauthored as explicit wikilinks, so `related`
  // is sparse right now - most concepts have no connections at all. A non-zero
  // floor would make shuffle pick from a handful of concepts. Raise this once
  // linking is done.
  minConnections: 0,
};
