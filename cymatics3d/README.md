# 3D Cymatics Sound Refraction Simulator

This project is an interactive 3D experiment that visualizes the principles of cymatics and light refraction using Three.js and the Web Audio API. It simulates a beam of light passing through one or two frequency-controlled lenses, which distort the light and project a dynamic pattern onto a grid below. Each tile on the grid is tuned to a note in the D minor scale, creating a unique audiovisual experience as the light patterns shift.

## Features

-   **Real-time 3D Visualization**: Built with Three.js, the scene features a movable light source, one or two deformable lenses, and a projection grid.
-   **Cymatic Lens Deformation**: The shape of each lens is dynamically modified on the CPU based on frequency and amplitude parameters, simulating the patterns created by sound vibrations.
-   **Dual Lens System**: Users can add a second lens to the scene for more complex refraction patterns. Each lens has independent controls for frequency, amplitude, height (Y-position), and refractive index.
-   **Physics-Based Light Refraction**: The path of light is calculated using a ray-tracing approach. Refraction is simulated by applying Snell's Law at the point where each light ray intersects with the deformed surface of the lenses.
-   **Interactive Audio**: The projection grid is tuned to the D minor scale. When a light ray hits a tile, it plays a "one-shot" musical note generated with the Web Audio API. The sound is designed to be subtle and bell-like.
-   **Advanced UI Controls**: A clean, minimalistic UI allows for precise control over:
    -   Frequency and amplitude for each lens.
    -   Vertical position and refractive index for each lens.
    -   An "Auto Sweep" mode with a ping-pong effect that sweeps the frequency from 20Hz to 20kHz over one minute.
    -   A sound toggle to enable or disable audio playback.
    -   The ability to add or remove the second lens.

## How It Works

### 1. Scene Setup
The environment is a standard Three.js scene with a `PerspectiveCamera` and `WebGLRenderer`. `OrbitControls` are used for camera manipulation, and `TransformControls` allow the user to move the light source.

### 2. Lens Deformation
Instead of relying on GPU shaders for visual-only effects, the lens deformation is calculated on the CPU. The vertices of a `PlaneGeometry` are displaced based on a cymatic formula that uses frequency, amplitude, and time. This approach is crucial because it allows the application to have full knowledge of the mesh's exact shape for accurate physics calculations.

### 3. Ray Tracing and Refraction
-   A fan of light rays is emitted from the light source in a cone shape.
-   For each ray, the code calculates the intersection point with the first lens.
-   At the intersection point, the local normal of the deformed lens surface is calculated.
-   Snell's Law is applied using the incident ray, the surface normal, and the refractive indices of air (1.0) and the lens material (user-defined) to determine the new path of the ray.
-   If a second lens is present, this process is repeated.
-   Finally, the refracted ray's intersection with the ground grid is calculated, and the corresponding tile is illuminated.

### 4. Audio Generation
-   The Web Audio API is used to synthesize sound in the browser.
-   During initialization, each of the 256 grid tiles is assigned a frequency from the D minor scale, spanning four octaves. This creates a spatial and harmonically pleasing layout of notes.
-   To ensure a "one-shot" sound, the application tracks which tiles are lit in each frame. A sound is only triggered when a tile transitions from an "off" state to an "on" state.
-   The `playTone` function creates an `OscillatorNode` and a `GainNode` to produce a sine wave with a gentle, bell-like envelope (a short fade-in and a longer fade-out).

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to the local URL provided by Vite (e.g., `http://localhost:5173`). 