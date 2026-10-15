# PUBG Ally hover scene

Hovering the PUBG Ally publication card, or focusing its Paper link, starts one scene: the main character equips a helmet, joins the already-helmeted olive-jacket teammate for alternating firing bursts, then both run through the card's right edge and disappear. It lasts about 6.1 seconds and does not loop while the pointer remains over the card.

`pubg-ally.js` draws into a pointer-transparent canvas clipped to the publication card. The card keeps its original dimensions, title, metadata, and link. Actors occupy the bottom-right space and scale down in narrow cards. The sequence stops offscreen, when filtered out, in hidden tabs, and with reduced-motion preferences.

The original five transparent sprite sheets were generated with the built-in imagegen tool using the original character as the identity/style reference. Each sheet contains four frames in a 2×2 grid; packed frame dimensions are 192×224, with body center x=96 and foot baseline y=216. Equip frames share their final standing-frame scale so raising the helmet does not stretch the body. The wide frame preserves rifles and muzzle flashes. Shooting and running sprites preserve their frame-to-frame scale.

Final files: `equip.png`, `shoot.png`, `run.png`, `friend-shoot.png`, and `friend-run.png`. Exact generation prompts are in `generation-prompts.json`; packing measurements are in `frame-metrics.json`.

Chrome verification covered each sequence phase, disappearance and replay, clipping and stable card height, keyboard focus, the Paper link, publication filtering, reduced motion, offscreen cancellation, and narrow-screen layout. No browser errors were observed.

## Refinement

`equip-v2.png` replaces the original helmet frames; `aim-v2.png` adds a rifle-raising transition. Both were generated with imagegen from the shooting pose to keep a consistent stance, angle, and helmet. Frame packing crops to the connected figure, excluding detached fragments from adjacent cells. The final aiming pose and initial shooting pose draw the same actual shooting frame, so the handoff is pixel-identical. Exact prompts are in `refinement-prompts.json`; alignment measurements are in `refined-frame-metrics.json`.

Hover requests are retained while sprites load, and playback checks the actual visible card bounds rather than waiting for the first visibility callback. Re-entering the title can replay the scene without leaving the entire card. Failed sprite loads can retry on hover with a fresh request URL.

Verification found 35 detached pixels above each of the original lower helmet frames and zero above all refined equip/aim frames. Browser checks covered the identical aim-to-shoot handoff, early hover with delayed sprites and visibility callbacks, failed-load retries, replay, keyboard focus, reduced motion, filtering, offscreen cancellation, and mobile containment.

The entrance now uses a 1.45-second left-to-right run at a constant sprite size. The main character enters bareheaded carrying the helmet (`enter.png`), with the already-helmeted friend following shortly behind. Both use cycling running frames, fade into clarity as they cross the vignette's left edge, and decelerate into their standing positions before helmet equipping. The entrance lane is clipped separately to keep the Paper link and metadata readable. There is no enlargement effect.

`enter.png` was generated with imagegen; its exact prompt is in `enter-prompt.json`. `run-v2.png` and `friend-run-v2.png` repackage the original generated running art using connected-figure cropping to remove neighboring-cell fragments. Their geometry is recorded in `running-frame-metrics.json`.
