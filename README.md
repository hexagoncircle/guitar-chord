# `<guitar-chord>` Web Component

A Web Component that displays a guitar chord chart. Check out the [demo](https://hexagoncircle.github.io/guitar-chord/). 🎸

✨ _work in progress_ ✨

## Usage

Include the component script on the page, then add the `guitar-chord` custom element with the appropriate attributes.

```html
<script type="module" src="path/to/guitar-chord.js"></script>

<!-- Renders a C major chord -->
<guitar-chord
  display-name="C"
  readable-name="C major"
  pattern="022100"
  fingers="023100"
></guitar-chord>

<!-- Renders an E flat minor chord -->
<guitar-chord
  display-name="Eb minor"
  readable-name="E flat minor"
  pattern="x13321"
  fingers="013421"
  barre="6"
></guitar-chord>
```

## Name that chord

The name of the chord being represented in the chart.

- `display-name` - The chord name to display on screen.
- `readable-name` - An optional visually-hidden string alternative to the display name that is better understood when read aloud.

Here are a handful of examples combining display and readable names:

| `display-name` | `readable-name` |
| -------------- | --------------- |
| Am             | A minor         |
| Amaj7          | A major seventh |
| B#             | B sharp         |
| Eb minor       | E flat minor    |

## Chord markers and finger positions

Chord markers and finger positions are represented as six-character strings. They read from left to right, starting with string 6 (thickest) and ending with string 1 (thinnest). In standard tuning, this would be EADGBE.

`pattern` - Six characters, each representing a string in the chord.

| value | represents |
| ----- | ---------- |
| `x`   | mute       |
| `0`   | open       |
| `1-9` | fret       |

`fingers` - Six characters, each representing the finger used on that respective string.

| value | finger |
| ----- | ------ |
| `0`   | none   |
| `1`   | index  |
| `2`   | middle |
| `3`   | ring   |
| `4`   | pinky  |

## Barre chords

[What is a barre chord?](https://en.wikipedia.org/wiki/Barre_chord)

`barre` - Set the fret number where the barre chord starts. When a fret above `2` is barred, notice that a small number appears next to the barre marker. This number represents the starting fret.

## Customize styles

A handful of color, font, and layout styles can be customized by declaring values on the available CSS custom properties. For example, the following styles will cascade down to all `guitar-chord` elements. Try it out in the [demo](https://hexagoncircle.github.io/guitar-chord/).

```css
:root {
  --guitarChord-color: dodgerblue;
  --guitarChord-text-color: rebeccapurple;
  --guitarChord-marker-color: hotpink;
  --guitarChord-aspectRatio: 2 / 3;
  --guitarChord-fontFamily: monospace;
}
```
