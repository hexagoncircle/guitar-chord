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
    // Only allow numbers
    return this.parseAttributeToArray("fingers", /[^0-9]/g);
  }

  get pattern() {
    // Only allow "x" (mute) or numbers
    return this.parseAttributeToArray("pattern", /[^0-9x]/g);
  }

  constructor() {
    super().attachShadow({ mode: "open" });
  }

  connectedCallback() {
    const sheet = new CSSStyleSheet();

    sheet.replaceSync(GuitarChord.css);
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.stringCount = 6;
    this.fingerNames = ["index", "middle", "ring", "pinky"];
    this.templateParts = [
      { className: "name", tag: "p" },
      { className: "instructions", tag: "ul" },
      { className: "chart", tag: "div" },
      { className: "fingers", tag: "div" },
      { className: "markers", tag: "div" },
    ];

    this.setupTemplate();
    this.setupElements();
    this.setGridLines();
    this.renderFingerPositions();
    this.renderChordName();
    this.renderMarkers();
  }

  attributeChangedCallback(name) {
    if (!this.elements) return;

    switch (name) {
      case "display-name":
        this.renderChordName();
        break;
      case "readable-name":
        this.renderChordName();
        break;
      case "fingers":
        this.renderFingerPositions();
        break;
      case "pattern":
        this.renderMarkers();
        break;
      case "barre":
        this.renderMarkers();
        break;
    }
  }

  parseAttributeToArray(str, regex) {
    const value = this.getAttribute(str);

    if (!value) return;

    return value.toLowerCase().replace(regex, "").split("");
  }

  renderInstructions(pattern, barreValue) {
    if (!this.elements.instructions) return;

    const listEl = document.createDocumentFragment();

    const insertText = (i) => {
      const value = this.stringCount - i;
      const fingerValue = this.fingers[i] - 1;
      let text = `String ${value}: `;

      if (pattern[i] === "0") {
        text += `open`;
      } else if (pattern[i] === "x") {
        text += `mute`;
      } else if (barreValue === pattern[i] || !pattern[i]) {
        text += `barred on fret ${this.barre} by index finger`;
      } else {
        text += `place ${this.fingerNames[fingerValue]} finger on fret ${pattern[i]}`;
      }

      return text;
    };

    for (let i = 0; i < this.stringCount; i++) {
      const el = document.createElement("li");
      el.textContent = insertText(i);
      listEl.append(el);
    }

    this.elements.instructions.replaceChildren(listEl);
  }

  renderMarkers() {
    if (!this.elements.markers || !this.pattern) return;

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
      el.setAttribute("data-action", this.setMarkerAction(pattern[i]));

      // Show fret number if barre value is 2 or greater on top row
      isBarreChord &&
        this.barre > 1 &&
        pattern[i] === "1" &&
        el.setAttribute("data-barre-fret", this.barre);

      markers.append(el);
    }

    this.elements.markers.replaceChildren(markers);
    this.renderInstructions(pattern, barreValue);
  }

  renderFingerPositions() {
    if (!this.elements.fingers || !this.fingers) return;

    const positions = document.createDocumentFragment();

    for (let i = 0; i < this.fingers.length; i++) {
      if (i >= this.stringCount) break;

      const el = document.createElement("span");
      el.textContent = this.fingers[i] !== "0" ? this.fingers[i] : "";
      positions.append(el);
    }

    this.elements.fingers.replaceChildren(positions);
  }

  renderChordName() {
    if (!this.elements.name) return;

    if (!this.readableName) {
      this.elements.name.textContent = this.displayName;
      return;
    }

    const names = document.createDocumentFragment();

    const displayText = document.createElement("span");
    const readableText = document.createElement("span");

    displayText.ariaHidden = true;
    displayText.textContent = this.displayName;
    names.append(displayText);
    readableText.classList.add("visually-hidden");
    readableText.textContent = this.readableName;
    names.append(readableText);

    this.elements.name.replaceChildren(names);
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

    this.templateParts.forEach(({ className, tag }) => {
      const el = document.createElement(tag);
      el.classList.add(className);
      el.classList.toggle("visually-hidden", className === "instructions");
      sections.append(el);
    });

    this.shadowRoot.append(sections);
  }

  setGridLines() {
    this.elements.chart.style.setProperty("--guitarChord-grid-size", `${100 / this.stringCount}%`);
  }

  setMarkerAction(value) {
    if (value === "x") {
      return "mute";
    } else if (value === "0") {
      return "open";
    } else {
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
      grid-template-areas:
        "name"
        "chart"
        "fingers";
      gap: calc(var(--_string-size) * 2);
      font-family: var(--guitarChord-fontFamily, system-ui, sans-serif);
      color: var(--_color);
    }

    :host > * {
      display: grid;
    }

    .chart {
      box-sizing: border-box;
      grid-area: chart;
      position: relative;
      display: grid;
      grid-template-rows: repeat(6, 1fr);
      justify-items: center;
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
      border-block-end: var(--_string-size) solid
        var(--_color);
      background-repeat: repeat-x, repeat, repeat;
      mask-image: linear-gradient(to bottom, transparent calc(var(--guitarChord-grid-size) - 2%), black calc(var(--guitarChord-grid-size) - 2%));
    }

    .chart > * {
      grid-area: 1 / 1 / -1 / -1;
      display: grid;
    }

    :is(.chart, .markers) {
      aspect-ratio: var(--guitarChord-aspectRatio, 1);
    }

    .name {
      margin: 0;
      grid-area: name;
      position: relative;
      align-self: start;
      justify-content: center;
      text-align: center;
      font-size: var(--guitarname-fontSize, calc(0.2rem + 8cqi));
      font-weight: var(--guitarname-fontWeight, normal);
      color: var(--_text-color);
    }

    .visually-hidden {
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      height: 1px;
      overflow: hidden;
      position: absolute;
      white-space: nowrap;
      width: 1px;
    }

    .markers {
      grid-area: chart;
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: repeat(6, 1fr);
      place-items: center;
    }

    .fingers {
      grid-area: fingers;
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

    /* Maintain text height when empty */
    :where(.name, .fingers):empty::after {
      content: "0";
      opacity: 0;
      user-select: none;
      pointer-events: none;
    }

    .marker {
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
  `;
}

GuitarChord.register();
