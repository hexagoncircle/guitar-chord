import "./style.css";
import chords from "./chords.json";
import { Pane } from "tweakpane";
import { codeToHtml } from "shiki";

function setAttributes(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (value === true) {
      el.setAttribute(key, "");
    } else if (value) {
      el.setAttribute(key, value);
    } else {
      el.removeAttribute(key);
    }
  }
}

function generateChordList() {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < chords.length; i++) {
    const el = document.createElement("guitar-chord");

    setAttributes(el, {
      "display-name": chords[i].displayName,
      "readable-name": chords[i].readableName,
      pattern: chords[i].pattern,
      fingers: chords[i].fingers,
      barre: chords[i].barre,
    });

    fragment.append(el);
  }

  chordList.append(fragment);
}

async function updateChord(index) {
  const chord = chords[index];
  const attrs = {
    "display-name": chord.displayName,
    "readable-name": chord.readableName,
    pattern: chord.pattern,
    fingers: chord.fingers,
    barre: chord.barre,
  };

  setAttributes(guitarChordEl, attrs);

  const code = guitarChordEl.outerHTML;

  codeExampleHTML.innerHTML = await codeToHtml(code, {
    lang: "html",
    theme: "rose-pine",
  });
}

function updateCopyBtnText(btn) {
  const text = btn.textContent;

  btn.classList.add("copied");
  btn.textContent = "Copied!";

  setTimeout(() => {
    btn.classList.remove("copied");
    btn.textContent = text;
  }, 2000);
}

const codeExampleHTML = document.querySelector("[data-code='html']");
const copyHTML = document.querySelector("#copy-html");
const chordList = document.querySelector("chord-list");
const guitarChordEl = document.querySelector("guitar-chord");

copyHTML.addEventListener("click", (e) => {
  const code = guitarChordEl.outerHTML;

  navigator.clipboard.writeText(code).then(() => {
    updateCopyBtnText(e.target);
  });
});

generateChordList();
updateChord(0);

/**
 * Configuration pane
 */
let configStyles = {};

const pane = new Pane({
  title: "Configure",
  expanded: true,
});

function handleChange(e, prop) {
  configStyles[prop] = e.value;
  document.body.style.setProperty(prop, e.value);
}

pane
  .addBlade({
    view: "list",
    label: "chord",
    options: [
      ...chords.map(({ displayName }, i) => ({ text: displayName || "unknown chord", value: i })),
    ],
    value: 0,
  })
  .on("change", (e) => {
    updateChord(e.value);
  });

const CUSTOM_STYLES = {
  base: "#000",
  text: "#000",
  marker: "#000",
};

const customStyles = pane.addFolder({
  title: "Custom styles",
});

customStyles
  .addBlade({
    view: "list",
    label: "aspect ratio",
    options: [
      { text: "Default", value: "1" },
      { text: "Stretch", value: "2/3" },
      { text: "Squash", value: "5/4" },
    ],
    value: "1",
  })
  .on("change", (e) => handleChange(e, "--guitarChord-aspectRatio"));

customStyles
  .addBinding(CUSTOM_STYLES, "base")
  .on("change", (e) => handleChange(e, "--guitarChord-color"));

customStyles
  .addBinding(CUSTOM_STYLES, "text")
  .on("change", (e) => handleChange(e, "--guitarChord-text-color"));

customStyles
  .addBinding(CUSTOM_STYLES, "marker")
  .on("change", (e) => handleChange(e, "--guitarChord-marker-color"));

customStyles
  .addButton({
    title: "Copy CSS",
  })
  .on("click", () => {
    if (!Object.keys(configStyles).length) return;

    const css = `${Object.entries(configStyles)
      .map(([k, v]) => `${k}:${v}`)
      .join(";")};`;

    navigator.clipboard.writeText(css).then(() => {
      console.log("Copied styles:", css);
    });
  });

customStyles
  .addButton({
    title: "Reset custom styles",
  })
  .on("click", () => {
    configStyles = {};
    document.body.style = "";
  });
