---
id: buffer
term: Buffer
tags: [game-mechanics]
alternates: ["input buffer", "buffer window"]
links: [cc-buffer]
---

Inputting an action before it can be performed. Upon buffering an input, the game will attempt to execute it as soon as the conditions for performing the input are met. Some examples include:
A player inputs a targeted action on a target that is out of range. Upon the target entering the player’s range, their champion applies their action.
A player presses an ability with a significant cast time. During the cast time, they press another ability. After the first ability is cast and the player is actionable again, the second ability is instantly performed.
It can be difficult to predict whether an input is bufferable in a particular state.
