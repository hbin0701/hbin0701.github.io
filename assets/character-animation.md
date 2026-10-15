# Character animations and cursors

The character has three emotes: hover wave, curious head tilt, and two thumbs up, plus automatic blinking. Breathing remains off. Hovering the character always triggers a friendly wave. Wave never plays in the automatic idle sequence. A subtle “Hover me!” hint sits beside the character on devices with a mouse. The hint is hidden for touch and reduced-motion preferences.

Blinks last 200 ms and recur every 2–3.5 seconds while resting. Head tilt and two thumbs up play from a shuffled sequence with a new gesture starting approximately every five seconds, including animation time; each returns to the original neutral pose. Hover emotes interrupt an idle gesture and restart the five-second rhythm. Movement pauses offscreen, in hidden tabs, in desktop view, and for reduced-motion preferences. Desktop icon images remain still.

`character.js` draws the PNG sprite frames into a 128×192 canvas. Each action sheet contains four frames in a 2×2 grid. Every frame is aligned to the same foot baseline and body center. The head tilt keeps its natural height changes. The blink overlays only the eyes of the original idle pose.

The built-in imagegen tool generated nine new action sheets and three cursor images. The pointer hand and walking cycle each received a targeted imagegen refinement. Sequence timings include anticipation, a short peak hold, and a return to rest, without image stretching or rotated cutout limbs.

Final assets are in `assets/character/*.png` and `assets/cursors/*.png`. Exact prompts and refinement notes are saved in `assets/character/generation-prompts.json`; measured frame alignment is recorded in `assets/character/frame-metrics.json`. Original assets have been preserved.

Open `/character-preview.html` on the local server to review the three emotes and blink side by side. This page uses the same renderer as the main website and includes a pause button. The gallery demonstrates waves automatically for review; the main website always waves on hover.

The website uses a native 24px pixel arrow in ivory, changing to gold with a three-frame sparkle over links, buttons, and the character. Cursor artwork is in `assets/cursors/game/`; `cursor.js` animates only during hover and stops for reduced motion or hidden tabs. Text inputs retain text cursors and desktop window bars retain grab/grabbing cursors. Older cursor artwork is preserved but unused.

The backpack-adjusting emote has been removed from the renderer, hover choices, automatic sequence, and preview gallery. Its unused artwork is preserved.

Nod, look-left, and look-right have also been removed from the renderer, hover choices, automatic sequence, and preview gallery. Their unused artwork is preserved.

The shrug is replaced by a double-thumbs-up emote in the renderer, automatic choices, hover choices, and preview. The new four-frame sprite was generated with imagegen and aligned to the same foot baseline. Its prompt and alignment metrics are recorded alongside the sprite.
