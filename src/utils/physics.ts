import * as CANNON from "cannon-es";

export function initPhysics() {
  const world = new CANNON.World();
  world.gravity.set(0, -9.82, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  // // SolverをGSSolverにキャストしてiterationsを設定
  // const solver = world.solver as CANNON.GSSolver;
  // solver.iterations = 10;
  return world;
}
