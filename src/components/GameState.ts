import { globalState } from "../models/globalState";

const gameStateElm = document.getElementById("gameState");

export function initGameState() {
  if (gameStateElm) {
    gameStateElm.innerHTML = `
          <div>Score: 0</div>
        `;
  }

  window.addEventListener("globalStateChange", (event) => {
    renderGameState();
  });
}

export function renderGameState() {
  let score = globalState.score;
  if (gameStateElm) {
    gameStateElm.innerHTML = `
      <div>Score: ${score}</div>
    `;
  }
}
