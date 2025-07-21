# Future Features & Modular Roadmap for Refraktor

## 1. Make It More Useful Musically
- **Music Box Mode:**
  - Load and play MIDI files.
  - Parse MIDI and trigger pad hits/notes according to MIDI events.
  - Visualize MIDI notes as a piano roll or animated rays.
- **Chord/Scale Helper:**
  - "Chord Magnet" mode: snap pad hits to the nearest note in the selected scale/chord.
  - "Chord Pad" mode: one pad triggers a full chord (triad, seventh, etc).

## 2. Image or Live Input as a Lens
- **Image Lens:**
  - Upload an image (e.g., a cat).
  - Use pixel data as a heightmap or color map to deform the lens mesh.
  - Use color/brightness to modulate refraction, amplitude, or musical parameters.
- **Live Input Lens:**
  - Use webcam/video input as a dynamic lens.
  - Continuously update the lens mesh based on video frame pixel data.

## 3. Change Lens Shape (Plane → Sphere, etc)
- Allow user to select lens geometry: plane, sphere, torus, custom mesh.
- Extend raycaster and deformation logic to support new shapes.

## 4. Chords and Chord Magnet
- Robust "Chord Magnet" mode: snap every pad hit to the nearest note in the selected scale/chord.
- "Chord Pad" mode: one pad triggers a full chord.

## 5. Morph Lens to Play a Song
- Use a MIDI file or "melody map" to animate the lens deformation over time.
- Rays play a melody or song as the lens morphs.

---

## Modular Approach (Without Breaking Current Modules)

### A. Modular "Lens" System
- Refactor lens logic to support new lens types: PlaneLens, ImageLens, VideoLens, SphereLens, etc.
- Each lens type implements:
  - `getDeformation(x, y, t)` (for mesh deformation)
  - `getRefraction(x, y, t)` (for raycasting)
- UI lets user select lens type and upload image/video if needed.

### B. Modular "Music Engine"
- Add "Music Box" module:
  - Load/parse MIDI files.
  - Schedule pad hits/note triggers according to MIDI events.
- Add "Chord Helper" module:
  - Snap notes to scale/chord.
  - Trigger full chords from a single pad.

### C. Keep Current Modules Stable
- All new features are opt-in and modular.
- Default experience remains as is.
- New features are added as new panels or toggles in the UI.

---

## Feature Table

| Feature                | Module/Panel      | Approach/Notes                                 |
|------------------------|-------------------|------------------------------------------------|
| Music Box (MIDI)       | Music/Playback    | MIDI parser, schedule pad hits                 |
| Chord Helper           | Music/Chord       | Snap to scale/chord, chord pads                |
| Image/Video Lens       | Lens/Deformation  | Upload image/video, use as heightmap           |
| Lens Shape             | Lens/Geometry     | Select plane, sphere, torus, custom mesh       |
| Lens Morph Song        | Music/Lens        | Animate lens mesh to play melody               |

---

**Next Steps:**
- Choose a feature to implement first (e.g., Image Lens, Music Box).
- Design and build as a modular, opt-in panel or mode.
- Keep all current modules stable and extensible. 