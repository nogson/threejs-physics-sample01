class GlobalState {
  private _score: number = 0;

  get score() {
    return this._score;
  }

  set score(value: number) {
    this._score = value;
    this.dispatchChangeEvent("score", value);
  }

  private dispatchChangeEvent(property: string, value: any) {
    const event = new CustomEvent("globalStateChange", {
      detail: { property, value },
    });
    window.dispatchEvent(event);
  }
}

const globalState = new GlobalState();
export { globalState };
