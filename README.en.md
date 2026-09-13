<div align="center">

# AFTER HOURS · Rainy Study

### Open a book. Leave a little of yourself behind.

An interactive 3D reading room for books, handwritten notes, and narrated stories.

[简体中文](README.md) · **English**

[Enter the room](https://andyhuo520.github.io/rainy-study/) · [Open the pop-up library](https://andyhuo520.github.io/rainy-study/?library=children) · [Watch the demo](docs/demo.mp4)

**6 readable books · 12 pop-up scenes · Freehand drawing · No API key required**

</div>

![The running application: warm lighting, bookshelves, a desk, and a rainy window](docs/room.png)

Rain falls outside while a warm lamp lights the desk. Find a comfortable angle, take a book from the shelf, and open a story. Or pick up the pen and draw something. Put the paper down, and your strokes appear on the sheet in the 3D room, ready for your next visit.

> All images below are screenshots of the running project. Book covers and interior illustrations include AI-generated artwork; concept art is not used as a substitute for product screenshots. The demo recording is silent. Chinese narration is available inside the app.

## Start with a story

![The illustrated three-book selection screen](docs/library.png)

| A Little Fox Borrows a Light | A Little Whale Finds the Ocean's Song |
| :---: | :---: |
| ![A fox, a lantern, and a miniature forest](docs/popup-book.png) | ![A whale swimming among coral and fish](docs/ocean.png) |
| Cross the forest to deliver bread to Grandma Hedgehog. The lantern sways, leaves fall, and fireflies drift past. | Follow a song through the ocean. The whale swims, fish circle, and bubbles rise. |

![The rabbit and its miniature lunar garden](docs/moon.png)

**The Little Gardener on the Moon:** join Mimi for low-gravity hops, care for an imaginary seed, and wait for a garden of starlight.

Each book contains four scenes, Chinese narration, facts, and a short interactive question. Click an animal for chapter-specific dialogue, or drag to view the scene from another angle. Pop-up objects fold down before the page turns; the next scene rises after the turn.

## Read quietly, or pick up a pen

| Illustrated reading | Freehand drawing |
| :---: | :---: |
| ![An illustrated two-page reading spread](docs/reading.png) | ![The writing canvas and ink controls](docs/handwriting.png) |
| Three books with three chapters each. Take one out, turn the pages, and return it to the shelf. | Change ink color and width, undo and redo, save your strokes, or export a PNG. |

## What you can do

| Experience | Features |
| --- | --- |
| Explore | Drag to orbit, scroll to zoom, or choose room, bookshelf, desk, and window views |
| Save a view | Bookmark the camera angle and restore it after a refresh |
| Change the weather | Switch between rain and daylight, with coordinated lighting, window scenery, and rain effects; enable rain audio manually |
| Read | Six books with 21 chapters or scenes, including three animated pop-up books |
| Listen | Twelve prerecorded Chinese Edge TTS tracks; turning a page stops the previous track |
| Draw | Write with a mouse or touch input, save strokes onto the desk's paper, and export an image |
| Leave a book | Use the close button or Esc; touch controls are available on mobile |

**The application interface and story content are currently in Chinese.** Notes, reading progress, answers, and saved views stay in the current browser. They do not sync across devices.

## Run locally

Node.js 24 is recommended. Node.js 20.19+ or 22.12+ is supported.

```sh
git clone https://github.com/andyhuo520/rainy-study.git
cd rainy-study
npm ci
npm run dev
```

Open the local URL shown in your terminal. Add `?library=children` to open the pop-up library directly.

**No API key or model server is required.** The browser renders the scenes; illustrations and audio are included in the repository.

```sh
npm run build
npm run preview
```

Production files are written to `dist/`. Relative asset paths support static hosting, including GitHub Pages project paths. This repository keeps source code on `main` and deployed files on `gh-pages`. Rebuild and commit the contents of `dist/` to `gh-pages` to update the site.

## Implementation and credits

| Part | Implementation |
| --- | --- |
| Scenes and interaction | Three.js, vanilla JavaScript, CSS animation |
| Development and builds | Vite |
| Drawing and textures | Canvas and browser local storage |
| Book illustrations | Image-generated covers and interior artwork |
| Narration | Prerecorded Edge TTS MP3 files using the Xiaoxiao voice |

This project began as a hands-on coding experiment with [Atria Dawn Preview](https://github.com/atria-asi/Atria-Dawn-Preview). Atria generated the initial room application and multiple patches through its API. Codex organized execution, feedback, and verification, and directly fixed some wall geometry and event selectors.

Codex implemented the later book pickup and reading experience, handwriting, glass droplets, pop-up books, animated scenes, and deployment. The completed project should not be attributed entirely to Atria acting independently. This is an independent demo, not an official Atria project or a comparative model benchmark.

## Current limitations

- Browser-based 3D pop-up books, without a camera or real-world AR tracking.
- Orbit navigation and preset viewpoints, without first-person walking or collisions.
- Lunar gardening is a fictional setting. Animals, rain, and sound use stylized simulations.
- Main interactions and desktop/390px mobile layouts have been checked; exhaustive device coverage, long-running performance, and studies with children have not been completed.
- Audio requires a user gesture. Clearing browser site data removes locally saved notes and progress.

## License

Project-owned code uses the [MIT License](LICENSE). Dependencies retain their respective licenses. AI-generated illustrations and synthesized audio are included for project demonstration and modification reference; their inclusion does not imply endorsement by third-party model or service providers.

Built another room or added a new story? Share it in [Issues](https://github.com/andyhuo520/rainy-study/issues).
