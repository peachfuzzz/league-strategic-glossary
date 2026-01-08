/**
 * Shuffle Configuration
 *
 * Controls the behavior of the shuffle/random term feature in Explore mode.
 * This allows you to tweak what terms are eligible for random selection.
 */

export interface ShuffleConfig {
  /**
   * Minimum number of total connections (links + autoLinks) required
   * for a term to be eligible for shuffle selection.
   *
   * Set to 0 to allow any term (including dead ends).
   * Set to 1+ to ensure shuffled terms have at least that many connections.
   *
   * Example:
   * - minConnections: 0  -> Any term can be selected (may include dead ends)
   * - minConnections: 1  -> Only terms with at least 1 connection
   * - minConnections: 3  -> Only terms with at least 3 connections (well-connected terms)
   */
  minConnections: number;
}

/**
 * Active shuffle configuration.
 *
 * To change behavior, edit the values below and restart the dev server.
 */
export const SHUFFLE_CONFIG: ShuffleConfig = {
  minConnections: 2,  // Default: require at least 1 connection to avoid dead ends
};
