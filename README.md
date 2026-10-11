<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=28&duration=2800&pause=900&color=38BDF8&center=true&vCenter=true&width=720&lines=SPECTRA+%2F%2F+METROLOGY;See+color.+Measure+color.;A+browser-based+color+analysis+workbench." alt="Animated SPECTRA title" />

<p><strong>A browser-based color analysis workbench.</strong><br>
Sample colors from your camera or an image, inspect color coordinates, explore nearby shades, and export readings.</p>

<p>
  <a href="#-features"><img src="https://img.shields.io/badge/FEATURES-38BDF8?style=for-the-badge&labelColor=0B0F19" alt="Features"></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/QUICK_START-10B981?style=for-the-badge&labelColor=0B0F19" alt="Quick start"></a>
  <a href="#-how-to-use"><img src="https://img.shields.io/badge/HOW_TO_USE-F59E0B?style=for-the-badge&labelColor=0B0F19" alt="How to use"></a>
</p>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0284C7,50:4338CA,100:0B0F19&height=3" width="100%" alt="Blue gradient divider">

### Live color sampling · CIE color spaces · Shade exploration

<img src="https://img.shields.io/badge/HTML5-Markup-E34F26?style=flat-square&logo=html5&logoColor=white">
<img src="https://img.shields.io/badge/CSS3-Responsive_ UI-1572B6?style=flat-square&logo=css3&logoColor=white">
<img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=111827">
<img src="https://img.shields.io/badge/No_Backend-Local_Processing-10B981?style=flat-square">

</div>

---

## ✦ What is SPECTRA?

SPECTRA is a client-side color-sampling and analysis interface built with **HTML, CSS, and vanilla JavaScript**. It uses a camera feed or an uploaded image to sample a point, then presents color values and related visualizations in one workspace.

> **Important:** A phone or laptop camera is not a calibrated spectrophotometer. Results depend on lighting, camera processing, display settings, and the sampled surface. Treat readings as useful digital estimates—not certified laboratory measurements.

## ▣ Features

| Capability | What it does |
|---|---|
| 📷 Live camera sampling | Request camera access and sample colors from the live feed |
| 🖼️ Image input | Load a still image and sample points from it |
| 🎯 Sampling reticle | Move the target to inspect a specific area |
| 🎨 Color readout | Display HEX, RGB, and a generated color name |
| 🧪 Color-space calculations | Calculate CIE XYZ and CIE L\*a\*b\* values using the app's conversion routines |
| 🌈 Shade matrix | Explore 12 nearby shade variations and their ΔE00 differences |
| ♿ Contrast estimate | Show a WCAG-style contrast ratio for the sampled color |
| 🔒 Reading lock | Freeze the current reading while inspecting it |
| 🗂️ Session history | Save readings locally in the browser and revisit recent swatches |
| 📤 CSV export | Export recorded readings for further analysis |
| ⚙️ Sampling modes | Switch between the available quick and precision sampling modes |
| 📱 Responsive workspace | Use the interface on supported desktop and mobile browsers |

## ◉ Interface preview

<div align="center">

<img src="https://dummyimage.com/1000x560/06090e/38bdf8.png&text=SPECTRA+METROLOGY+%7C+Add+your+own+project+screenshot" alt="Replace this placeholder with a screenshot of the SPECTRA interface" width="100%">

<sub>Replace this placeholder with a real screenshot or GIF of your running application for the strongest GitHub presentation.</sub>

</div>

## ⌁ Quick start

### Option 1 — Run locally

1. Download or clone this repository.
2. Keep the three files together in the same folder:
   - `index.html`
   - `style.css`
   - `app.js`
3. Start a local development server from that folder. For example, with Python:

   ```bash
   python -m http.server 8000
   ```

4. Open `http://localhost:8000` in your browser.
5. Select **Engage Live Sensor** and grant camera permission, or choose **Upload Sample File**.

Camera access normally requires **HTTPS or localhost**. Opening the HTML file directly may prevent camera access in some browsers.

### Option 2 — Deploy with GitHub Pages

1. Push `index.html`, `style.css`, and `app.js` to the repository.
2. In GitHub, open **Settings → Pages**.
3. Choose the deployment branch and folder (commonly `main` and `/root`).
4. Save and wait for GitHub Pages to publish the site.
5. Open the published HTTPS URL and test camera permissions.

**Keep the filenames aligned.** The supplied HTML references `style.css` and `app.js`; GitHub Pages will not automatically resolve differently named files such as `style(3).css` or `app(3).js`.

## ⌖ How to use

1. **Start a sample:** engage the camera or upload an image.
2. **Aim:** click or drag on the preview to move the sampling reticle.
3. **Inspect:** review the color swatch, HEX/RGB values, shade matrix, and scientific coordinates.
4. **Copy:** use the HEX or RGB controls, or select a shade swatch to copy its value.
5. **Lock:** freeze a reading when you want to inspect it without the live feed changing.
6. **Save:** log useful readings to the session buffer.
7. **Export:** use **Export CSV** to download the recorded session.

## ⌘ Color science

The application includes conversion routines for:

- **sRGB → CIE XYZ**
- **CIE XYZ → CIE L\*a\*b\***
- **CIE L\*a\*b\* → XYZ → sRGB** for shade generation
- **CIEDE2000 (ΔE00)** to estimate perceptual difference between a sampled color and generated shades
- **HSL** coordinates and a contrast-ratio estimate

The implementation uses a D65 reference white for its XYZ/L\*a\*b\* calculations. These calculations do not, by themselves, make the camera or overall workflow compliant with a laboratory standard. Formal ASTM/ISO conformance requires validated measurement methods, controlled conditions, and suitable calibrated equipment.

## 🧱 Built with

- **HTML5** — application structure and accessible controls
- **CSS3** — responsive layout, dark interface, motion, and visual feedback
- **Vanilla JavaScript** — camera/image handling, sampling, color conversions, local session storage, and CSV export
- **Browser APIs** — `getUserMedia`, Canvas, Clipboard, FileReader, Local Storage, and Blob downloads

No server-side color-processing service is required for the current workflow.

## 🔐 Privacy & permissions

- Camera access is requested by the browser and requires your permission.
- The current implementation processes the camera/image sample in the browser.
- Saved readings are stored in the browser's local storage on that device.
- Clearing browser site data may remove locally saved readings.
- Do not assume that local history syncs between devices.

## ⚠️ Current limitations

- Camera output varies by device, lens, exposure, white balance, and lighting.
- A screen color value is not guaranteed to match the physical object's appearance.
- The generated shade matrix is a set of calculated variations, not a database of manufacturer-approved paint or material colors.
- Contrast estimates should be checked in the context where the color will actually be used.
- Browser camera access depends on permissions, browser support, and a secure context.

## 🗺️ Roadmap ideas

- [ ] Add an on-screen color picker for uploaded images
- [ ] Add side-by-side comparison of two saved readings
- [ ] Add JSON export alongside CSV
- [ ] Add user-configurable shade variation strength
- [ ] Add a guided calibration workflow and repeatability tests
- [ ] Add real project screenshots and a short demo GIF

## 🤝 Contributing

Ideas, bug reports, and improvements are welcome. Open an issue with steps to reproduce a bug, the browser/device used, and the expected behavior. Pull requests should keep the interface responsive and avoid claiming measurement accuracy that has not been validated.

## 📜 License

No license has been specified in the supplied files. Add a `LICENSE` file before presenting this project as open source; without one, reuse rights are not clearly granted.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:0B0F19,50:0369A1,100:0B0F19&height=2" width="100%" alt="Footer divider">

**SPECTRA / METROLOGY**  
*Measure digitally. Interpret carefully.*

<sub>Built with curiosity and vanilla JavaScript.</sub>

</div>
