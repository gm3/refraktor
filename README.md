# REFRAKTOR

![logo_dark](https://hackmd.io/_uploads/BJUfVnaSgl.png)


REFRAKTOR is an interactive 3D audio-visual synthesizer for the web. It combines real-time sound generation with a dynamic 3D scene, allowing users to create evolving soundscapes and visuals by manipulating a variety of parameters.

At its core, a central "light source" (a UFO model) emits rays that interact with a grid below, triggering musical notes. The sound of these notes, the visual post-processing effects, and the behavior of the scene can all be controlled through a modular, draggable UI.

![image](https://hackmd.io/_uploads/HJy4426Bge.png)


---

## Features

The user interface is composed of several draggable panels, each controlling a different aspect of the synthesizer:

*   **General:** Master sound toggle and the ability to add a second, independently-controlled "lens" to the scene.
*   **Master:** A master volume control and a "Panic" button to reset the audio engine.
*   **Sound:** Control the core sound with a waveform selector (`sine`, `square`, etc.), an interactive ADSR envelope visualizer, and sliders for Attack, Decay, Sustain, Release, and note Duration.
*   **Filter:** Shape the sound with a multi-mode filter (`lowpass`, `highpass`, etc.) and controls for Frequency and Q (Resonance).
*   **Lens 1 & 2:** Manipulate the cymatics simulation by controlling the frequency and amplitude of the wave patterns on the lenses.
*   **Music:** Enable a "Chord Magnet" to gently pull notes towards a defined musical scale for more harmonic results.
*   **Bloom:** Adjust the post-processing bloom effect, controlling its strength, radius, and threshold to create a glowing, ethereal look.
*   **MIDI:** Enable MIDI output to send the generated notes to external hardware or software synthesizers.
*   **Presets:** Save the entire state of the application to a JSON file, and load presets to instantly recall your favorite sounds and settings.

---

## Local Development

To run REFRAKTOR on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/refraktor.git
    cd refraktor
    ```

2.  **Install dependencies:**
    This project uses `npm` for package management.
    ```bash
    npm install
    ```

3.  **Run the development server:**
    This command starts a local server with hot-reloading.
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or the next available port).

---

## Available Scripts

*   `npm run dev`: Starts the Vite development server.
*   `npm run build`: Bundles the application for production into the `dist` folder.
*   `npm run preview`: Serves the production build locally to preview it.

---

## Core Technologies

*   **[Three.js](https://threejs.org/):** For rendering the 3D scene, including the models, grid, and post-processing effects.
*   **[Tone.js](https://tonejs.github.io/):** For all real-time audio generation, including the PolySynth, ADSR envelopes, and filter effects.
*   **[Vite](https://vitejs.dev/):** As the build tool and development server, providing a fast and modern development experience. 