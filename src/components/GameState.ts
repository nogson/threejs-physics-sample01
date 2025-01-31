import { globalState } from "../models/globalState";

const gameStateElm = document.getElementById("gameState");

export function initGameState() {
  if (gameStateElm) {
    gameStateElm.innerHTML = `
          
        `;
  }

  window.addEventListener("globalStateChange", (event) => {
    renderGameState();
  });
}

export function renderGameState() {
  let score = globalState.score;
  if (gameStateElm) {
    let html = "";
    for (let i = 0; i < score; i++) {
      html += `<img src="images/point.png" class="point" />`;
    }

    gameStateElm.innerHTML = html;
  }
}
