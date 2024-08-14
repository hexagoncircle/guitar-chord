class GuitarChord extends HTMLElement {
  static register(tag = "guitar-chord") {
    if ("customElements" in window) {
      customElements.define(tag, this);
    }
  }

  static observedAttributes = ["display-name", "readable-name", "barre", "fingers", "pattern"];

  get displayName() {
    return this.getAttribute("display-name");
  }

  get readableName() {
    return this.getAttribute("readable-name");
  }

  get barre() {
    return this.getAttribute("barre");
  }

  get fingers() {
    return this.parseAttributeToArray("fingers", /[^0-5]/g);
  }

  get pattern() {
    return this.parseAttributeToArray("pattern", /[^0-5x]/g);
  }

  constructor() {
    super().attachShadow({ mode: "open" });

    this.stringCount = 6;
    this.fingerNames = ["index", "middle", "ring", "pinky"];
    this.templateParts = [
      { className: "name", tag: "p" },
      { className: "instructions", tag: "ol", reversed: true },
      { className: "chart", tag: "div" },
      { className: "fingers", tag: "div", hide: "reader" },
    ];
  }

  connectedCallback() {
    const sheet = new CSSStyleSheet();

    sheet.replaceSync(GuitarChord.css);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.setupTemplate();
    this.setupElements();
    this.renderGridLines();
    this.renderChordName();
    this.renderMarkers();
    this.renderInstructions();
    this.renderFingerPositions();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.elements || newValue === oldValue) return;

    switch (name) {
      case "display-name":
      case "readable-name":
        this.renderChordName();
        break;
      case "fingers":
        this.renderFingerPositions();
        break;
      case "pattern":
      case "barre":
        this.renderMarkers();
        break;
    }

    if (["fingers", "pattern", "barre"].includes(name)) {
      this.renderInstructions();
    }
  }

  parseAttributeToArray(str, regex) {
    const value = this.getAttribute(str);

    if (!value) return;

    return value.toLowerCase().replace(regex, "").split("");
  }

  renderChordName() {
    this.elements.name.classList.toggle("visually-hidden", !this.displayName && this.readableName);

    if (!this.displayName && this.readableName) {
      this.elements.name.textContent = this.readableName;
      return;
    }

    if (!this.displayName) {
      this.elements.name.replaceChildren();
      return;
    }

    if (!this.readableName) {
      this.elements.name.textContent = this.displayName;
      return;
    }

    const names = document.createDocumentFragment();

    const displayText = document.createElement("span");
    const readableText = document.createElement("span");

    displayText.ariaHidden = true;
    displayText.textContent = this.displayName;

    readableText.classList.add("visually-hidden");
    readableText.textContent = this.readableName;

    names.append(displayText);
    names.append(readableText);

    this.elements.name.replaceChildren(names);
  }

  renderGridLines() {
    this.elements.chart.style.setProperty("--guitarChord-grid-size", `${100 / this.stringCount}%`);
  }

  renderFingerPositions() {
    if (!this.fingers) {
      this.elements.fingers.replaceChildren();
      return;
    }

    const positions = document.createDocumentFragment();

    for (let i = 0; i < this.fingers.length; i++) {
      if (i >= this.stringCount) break;

      const el = document.createElement("span");
      el.textContent = this.fingers[i] !== "0" ? this.fingers[i] : "";
      positions.append(el);
    }

    this.elements.fingers.replaceChildren(positions);
  }

  renderInstructions() {
    if (!this.pattern) {
      this.elements.instructions.replaceChildren();
      return;
    }

    const [pattern, barreValue] = this.barre
      ? this.setupBarreChord(this.pattern)
      : [this.pattern, null];

    const insertText = (i) => {
      const fingerValue = this.fingers ? this.fingerNames[this.fingers[i] - 1] : "";
      let text = this.setActionName(pattern[i]);

      if (pattern[i] === "0" || pattern[i] === "x") {
        return text;
      } else if (barreValue === pattern[i] || !pattern[i]) {
        text = `barre fret ${this.barre} with index finger`;
      } else {
        text += ` ${fingerValue} finger on fret ${pattern[i]}`;
      }

      return text;
    };

    const listEl = document.createDocumentFragment();

    for (let i = 0; i < this.stringCount; i++) {
      const el = document.createElement("li");
      el.textContent = insertText(i);
      listEl.append(el);
    }

    this.elements.instructions.replaceChildren(listEl);
  }

  renderMarkers() {
    if (!this.pattern) {
      this.elements.chart.replaceChildren();
      return;
    }

    const [pattern, barreValue] = this.barre
      ? this.setupBarreChord(this.pattern)
      : [this.pattern, null];
    const markers = document.createDocumentFragment();

    for (let i = 0; i < pattern.length; i++) {
      if (i >= this.stringCount) break;

      const isBarreChord = pattern[i] === barreValue;
      const el = document.createElement("span");

      el.classList.add("marker");
      el.classList.toggle("barre", isBarreChord);
      el.style.setProperty("--col", i + 1);
      el.style.setProperty("--row", this.setRow(pattern[i]));
      el.setAttribute("data-action", this.setActionName(pattern[i]));

      // Show fret number if barre value is 2 or greater on top row
      isBarreChord &&
        this.barre > 1 &&
        pattern[i] === "1" &&
        el.setAttribute("data-barre-fret", this.barre);

      markers.append(el);
    }

    this.elements.chart.replaceChildren(markers);
  }

  setupBarreChord(pattern) {
    if (!pattern.length) return [];

    // Filter out "x" value, convert to number type, find smallest value to represent the barred fret, convert back to string.
    const barreValue = Math.min(...pattern.filter((v) => v !== "x").map(Number)).toString();
    let isBarreValueSet = false;

    const barrePattern = pattern.filter((value) => {
      if (value === barreValue) {
        if (isBarreValueSet) return;
        isBarreValueSet = true;
        return true;
      }

      return true;
    });

    return [barrePattern, barreValue];
  }

  setupElements() {
    this.elements = {};

    this.templateParts.forEach(({ className }) => {
      this.elements[className] = this.shadowRoot.querySelector(`.${className}`);
    });
  }

  setupTemplate() {
    const sections = document.createDocumentFragment();

    this.templateParts.forEach(({ className, tag, reversed, hide }) => {
      const el = document.createElement(tag);

      el.classList.add(className);
      reversed && el.setAttribute("reversed", "");
      hide === "screen" && el.classList.add("visually-hidden");
      el.ariaHidden = hide === "reader" ? true : null;
      sections.append(el);
    });

    this.shadowRoot.append(sections);
  }

  setActionName(value) {
    switch (value) {
      case "x":
        return "mute";
      case "0":
        return "open";
      default:
        return "press";
    }
  }

  setRow(value) {
    return !isNaN(Number(value)) ? Number(value) + 1 : 0;
  }

  static css = `
    :host {
      --_color: var(--guitarChord-color, currentColor);
      --_text-color: var(--guitarChord-text-color, var(--_color));
      --_marker-color: var(--guitarChord-marker-color, var(--_color));
      --_string-size: 2px;
      --_marker-size: 8cqi;

      container-type: inline-size;
      display: grid;
      gap: calc(var(--_string-size) * 2);
      font-family: var(--guitarChord-fontFamily, system-ui, sans-serif);
      color: var(--_color);
    }

    :host > * {
      display: grid;
    }

    .visually-hidden {
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
      margin: 0;
    }

    :is(.name, .fingers):empty {
      display: none;
    }

    .name {
      margin: 0;
      position: relative;
      justify-content: center;
      text-align: center;
      font-size: var(--guitarname-fontSize, calc(0.2rem + 8cqi));
      font-weight: var(--guitarname-fontWeight, normal);
      color: var(--_text-color);
    }

    .chart {
      position: relative;
      align-self: start;
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: repeat(6, 1fr);
      place-items: center;
      aspect-ratio: var(--guitarChord-aspectRatio, 1);
      border-block-end: var(--_string-size) solid var(--_color);
    }

    .chart::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(transparent 80%, var(--_color) 80%),
        linear-gradient(
          var(--_color) var(--_string-size),
          transparent var(--_string-size)
        ),
        linear-gradient(
          90deg,
          var(--_color) var(--_string-size),
          transparent var(--_string-size)
        );
      background-position: 
        0 1px, 
        0 0, 
        calc(50% - var(--_string-size) * 0.5) 0;
      background-size: var(--guitarChord-grid-size) var(--guitarChord-grid-size);
      background-repeat: repeat-x, repeat, repeat;
      mask-image: linear-gradient(to bottom, transparent calc(var(--guitarChord-grid-size) - 2%), black calc(var(--guitarChord-grid-size) - 2%));
    }

    .marker {
      position: relative;
      grid-column: var(--col);
      grid-row: var(--row);
      position: relative;
      display: grid;
      place-items: center;
      grid-template-areas: "marker";
      width: var(--_marker-size);
      height: var(--_marker-size);
      border-radius: 50%;
      box-shadow: inset 0 0 0 var(--_string-size) var(--_marker-color);
    }

    [data-action=press] {
      background: var(--_marker-color);
      box-shadow: unset;
    }

    [data-action=mute] {
      background: transparent;
      box-shadow: unset;
    }

    [data-action=mute]::before,
    [data-action=mute]::after {
      content: "";
      grid-area: marker;
      width: var(--_string-size);
      height: 100%;
      background: var(--_marker-color);
      border-radius: 360px;
    }

    [data-action=mute]::before {
      rotate: -45deg;
    }

    [data-action=mute]::after {
      rotate: 45deg;
    }

    .fingers {
      grid-template-columns: repeat(6, 1fr);
      justify-items: center;
      font-size: calc(0.2rem + 5cqi);
      color: var(--_text-color);
    }

    .fingers :first-child,
    .fingers::after {
      grid-column: 1;
      grid-row: 1;
    }

    .barre {
      grid-column-end: -1;
      display: flex;
      align-items: center;
      width: calc(100% - var(--_marker-size) * 1.3);
      height: calc(var(--_marker-size) / 1.25);
      border-radius: 360px;
    }

    .barre::after {
      position: absolute;
      left: calc(100% + 4px);
      content: attr(data-barre-fret);
      display: grid;
      place-content: center;
      margin-inline: auto;
      line-height: 1;
      font-size: calc(0.2rem + 4cqi);
      font-weight: var(--guitarChord-barre-fontSize, 600);
      color: var(--_text-color);
    }
  `;
}

GuitarChord.register();
