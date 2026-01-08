/**
 * Graph Physics Configuration
 *
 * Controls the physics simulation behavior for the force-directed graph visualization.
 * Adjust these values to change how nodes move and interact in the graph view.
 */

export interface GraphPhysicsConfig {
  /**
   * Damping factor (0-1). Lower values = slower, smoother movement.
   * Recommended range: 0.70-0.95
   *
   * - 0.70 = Very slow, floaty movement
   * - 0.80 = Balanced, smooth movement (default)
   * - 0.95 = Fast, snappy movement
   */
  damping: number;

  /**
   * Strength of gravitational pull toward the center.
   * Higher values pull nodes toward the center more strongly.
   * Recommended range: 0.0001-0.001
   *
   * - 0.0001 = Weak center pull (more spread out)
   * - 0.0003 = Balanced center pull (default)
   * - 0.0010 = Strong center pull (more compact)
   */
  centerForce: number;

  /**
   * How strongly nodes repel each other.
   * Higher values = nodes push further apart.
   * Recommended range: 1000-5000
   *
   * - 1000 = Nodes stay closer together
   * - 2000 = Balanced spacing (default)
   * - 5000 = Nodes spread far apart
   */
  repulsion: number;

  /**
   * Ideal distance between connected nodes.
   * Recommended range: 100-250
   *
   * - 100  = Compact, tight clusters
   * - 150  = Balanced spacing (default)
   * - 250  = Loose, spread out connections
   */
  linkDistance: number;

  /**
   * How strongly links pull connected nodes together.
   * Higher values = stronger attraction between linked nodes.
   * Recommended range: 0.003-0.015
   *
   * - 0.003 = Weak link attraction (more free-floating)
   * - 0.008 = Balanced link attraction (default)
   * - 0.015 = Strong link attraction (tight clusters)
   */
  linkStrength: number;
}

/**
 * Active graph physics configuration.
 *
 * To change behavior, edit the values below and restart the dev server.
 */
export const GRAPH_PHYSICS_CONFIG: GraphPhysicsConfig = {
  damping: 0.80,
  centerForce: 0.0003,
  repulsion: 2000,
  linkDistance: 150,
  linkStrength: 0.008,
};
