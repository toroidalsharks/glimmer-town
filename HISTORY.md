# History

Glimmer Town grew one version at a time as a single HTML file, each version patched on top of the last. In v26 the file was split into `src/` so it can be edited like a normal project. The split itself lost nothing: before any v26 fix went in, building `src/` gave back the v25 file byte for byte.

The files in `src/js` are roughly in the order things were added.

| Version | What came in | Where it lives now |
|---|---|---|
| early | Residents, town layout, memory and diary, encounters, shops and coins, the Creator, morning meetings, daily life, nights, real AI minds through OpenRouter, Firebase sync and the remote | `000` to `190` |
| early | The 3D town, resident models, interiors, happiness and presents, dreams, mail, the ferry and the second island, festivals, the morning paper, building, visitors, synthesized sound | `200` to `310` |
| middle | Red and invited residents, downtown, love and weddings, fishing, seasons, birthdays, your garden plot, the camera, Glimmer Hall court, books, jobs and strikes, GlimmerNet, Claude's workshop | `320` to `440` |
| v20 | Glimmer Labs floors, the clinic and health | `450`, `460` |
| v21 | Laptops, the Outside, world news | `470` |
| v22 | Group huddles and town uproars | `480` |
| v23 | Hair and faces, grass and flowers, show and tell, residents' own goals, phone notifications, the island living while the box is off | `490` to `530` |
| v24 | The storybook look: new lighting and materials, water, sky, Blender-made props, Mochi remodeled, Claude's crystal cat, fireflies and ghosts | `540` to `570` |
| v25 | Cutscenes, courtroom trials with Judge Hoot, crime and mysteries, the case board | `580` to `630` |
| v26 | Moved into this repo with a build step, tests and automatic publishing. The first test run caught two v25 bugs: pressing "Hold the trial now" while a trial was already on its way queued a second trial of the same case, and debates showed "Let the town vote" twice. Judge Hoot's close-up now sits back far enough to show him on his bench. The box and the remote now update themselves when a new build is published. | `build.mjs`, `tests/`, `tools/` |

Mili, little Claude, Claude the coder, personal space, touch, phones, texts, the dialog box, the panels and boot sit at `640` to `750`, the same place they had at the end of the old single file.
