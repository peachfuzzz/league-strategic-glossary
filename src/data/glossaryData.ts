// THIS FILE IS AUTO-GENERATED
// Do not edit directly. Edit files in src/data/terms/ instead.
// Run 'npm run generate-glossary' to regenerate this file.
// Tag colors are sourced from src/config/tags.config.ts

export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  caption?: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  tags: string[];
  links: string[];        // Manual links from frontmatter
  alternates?: string[];  // Alternate names/forms (e.g., "OTP" for "one trick")
  autoLinks?: string[];   // Auto-detected links from definition text
  media?: MediaItem[];    // Images and videos for the term
  // Extensible for future additions
  extensions?: {
    translations?: Record<string, string>;
    videos?: string[];
    difficulty?: string;
    [key: string]: any;
  };
}

export const glossaryData: GlossaryTerm[] = [
  {
    "id": "ability-rotation",
    "term": "Ability Rotation",
    "definition": "A string of all of a champion’s basic abilities. Most champions in League are designed to use their abilities in tandem for greater value. Abilities in a champion’s kit usually have differing cooldowns so an ability rotation is easiest to perform at the beginning of a fight. A full rotation of abilities becomes more difficult to perform as fights extend and the opportunity cost of holding spells increases.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "alternates": [
      "full rotation"
    ],
    "autoLinks": [
      "fight",
      "value"
    ]
  },
  {
    "id": "actor",
    "term": "Actor",
    "definition": "Something or someone that acts upon an object. \nAuthors’ note: In this glossary, we often use actor as a formalization of “you, the player doing stuff,” though the two are occasionally interchangeable.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "autoLinks": [
      "object"
    ]
  },
  {
    "id": "all-in",
    "term": "All-in",
    "definition": "A fight between opposing players with the intention to kill. An all-in is taken either when an actor has sufficient kill pressure, either via a calculation of lethal, or as a natural consequence of prior combat.  All-ins often expend every resource and cooldown available to all champions involved.",
    "tags": [
      "strategy"
    ],
    "links": [
      "trade"
    ],
    "autoLinks": [
      "actor",
      "combat",
      "fight",
      "kill-pressure",
      "pressure"
    ]
  },
  {
    "id": "attack-cancel",
    "term": "Attack Cancel",
    "definition": "The act of resetting a champion’s basic attack timer *before* damage occurs with a different input. If an attack is canceled, the champion will reattempt it from the beginning of their windup, rather than the moment the attack was canceled. Canceled attacks are generally considered a misinput, though intentionally canceling an attack is a strategy sometimes employed to attempt it again at a more opportune moment.\nAuthors’ note: Sometimes used interchangeably with attack resets, but we separated the two mechanics for increased clarity.",
    "tags": [
      "game-mechanics"
    ],
    "links": [],
    "alternates": [
      "auto cancel"
    ],
    "autoLinks": [
      "mechanics"
    ]
  },
  {
    "id": "attack-reset",
    "term": "Attack Reset",
    "definition": "The act of resetting a champion’s basic attack timer *after* damage occurs with a different input. If an attack is reset after the attack’s damage is applied, it starts the next attack’s windup immediately, letting another attack start sooner than usual. Most abilities that empower a champion’s basic attack also serve as attack resets. Attack resets are often a key part of a champion’s bread-and-butter string. The specific ability or item that lets a champion attack reset can also be referred to as an attack reset.\nAuthors’ note: Sometimes used interchangeably with attack cancels, but we separated the two mechanics for increased clarity.",
    "tags": [
      "game-mechanics"
    ],
    "links": [],
    "alternates": [
      "auto reset"
    ],
    "autoLinks": [
      "mechanics"
    ]
  },
  {
    "id": "backstep",
    "term": "Backstep",
    "definition": "Dodging an ability by briefly moving opposite the expected direction of travel. Backsteps are effectively a subclass of sidesteps that travel backwards. A backstep requires a player to input a movement command in the opposite direction of their original intended location, thus requiring a higher degree of intentionality than a traditional sidestep.",
    "tags": [
      "vernacular"
    ],
    "links": []
  },
  {
    "id": "bait",
    "term": "Bait",
    "definition": "When a player purposefully puts themselves in a dangerous position in an attempt to get the opponent to take an action. The act of baiting can be done on multiple scales. On a skirmishing level, a player can bait to try to get an opponent to start a fight, only to have their teammate(s) join once the opponents have committed to the fight. On a smaller scale, weaving in and out of the maximum range of an opponent's ability can maximize the chances of their opponent wasting a skill shot.",
    "tags": [
      "strategy"
    ],
    "links": [
      "overextend"
    ],
    "autoLinks": [
      "fight"
    ]
  },
  {
    "id": "bounceback",
    "term": "Bounceback",
    "definition": "The phase of a minion wave that occurs after a wave crashes into the opposing team’s tower. During a bounceback, the opposing minions will outnumber the allied minions, forcing the wave to push back towards the allied tower. Bouncebacks are a period of higher tension during the lane phase because a death from either side results in more lost minions than an even wave. Bouncebacks can result in a freeze.",
    "tags": [
      "game-mechanics",
      "minions"
    ],
    "links": [],
    "alternates": [
      "bounce"
    ],
    "autoLinks": [
      "freeze",
      "tension",
      "wave"
    ]
  },
  {
    "id": "buffer",
    "term": "Buffer",
    "definition": "Inputting an action before it can be performed. Upon buffering an input, the game will attempt to execute it as soon as the conditions for performing the input are met. Some examples include:\nA player inputs a targeted action on a target that is out of range. Upon the target entering the player’s range, their champion acts instantly.\nA player presses an ability with a significant cast time. During the cast time, they press another ability. After the first ability is cast and the player is actionable again, the game performs the second ability instantly.\nA player is inactionable. They input an action before their inactionable state ends. Upon regaining actionability, they act instantly.\nIt can be difficult to predict whether an input is bufferable in a particular state.",
    "tags": [
      "game-mechanics"
    ],
    "links": [
      "cc-buffer"
    ],
    "alternates": [
      "input buffer",
      "buffer window"
    ]
  },
  {
    "id": "cc-buffer",
    "term": "CC Buffer",
    "definition": "Casting an ability immediately before falling under hard crowd control to overlap moments of inactionability. Most abilities are uncancelable and have an animation during which a champion is inactionable. A player can time the cast of an ability to begin right before hard CC is applied, which results in the CC duration sharing significant overlap with the champion’s existing animation inactionability. \n\nA special case exists for some movement abilities with startup animations. When an immobilizing or displacing effect hits a champion during or immediately before the startup of their dash or blink, the startup animation of the movement is not interrupted, letting the dash succeed regardless.\n\nAuthors’ note: The term “buffer” sometimes applies to this phenomenon, but we have separated the definitions for clarity.",
    "tags": [
      "game-mechanics"
    ],
    "links": [],
    "alternates": [
      "buffering through CC"
    ],
    "autoLinks": [
      "buffer"
    ]
  },
  {
    "id": "chain-cc",
    "term": "Chain CC",
    "definition": "Timing several distinct sources of hard CC on the same target to apply in sequence without allowing the target to act. An optimal chain CC overlaps the duration of each source of crowd control as little as possible to maximize the time they are inactionable.",
    "tags": [
      "strategy"
    ],
    "links": []
  },
  {
    "id": "cheese",
    "term": "Cheese",
    "definition": "An unexpected or surprising decision by an actor, generally considered suboptimal, whose success relies on a lack of knowledge from the target. Picking off-meta champions can often be categorized as cheese, since a significant advantage can be gained from the information asymmetry of an unusual pick. Plays are also sometimes labeled as cheesy if the play would only work through the element of surprise.",
    "tags": [
      "vernacular"
    ],
    "links": [],
    "alternates": [
      "cheesy"
    ],
    "autoLinks": [
      "actor"
    ]
  },
  {
    "id": "collapse",
    "term": "Collapse",
    "definition": "Sending multiple people to one area of the map at the same time to try to kill a target or a group of targets. Collapses are most often used to describe converging upon a player in a sidelane, but can also refer to areas, such as the Baron pit.",
    "tags": [
      "strategy"
    ],
    "links": []
  },
  {
    "id": "combat",
    "term": "Combat",
    "definition": "The state of exchanging damage or crowd control with an enemy unit. Combat is the main interface for interaction in League since most champion outputs revolve around dealing, preventing, and receiving damage. Being “in-combat” also has mechanical effects. Some items, abilities, and passives function differently in and out of combat.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "alternates": [
      "in-combat"
    ]
  },
  {
    "id": "contest",
    "term": "Contest",
    "definition": "Threatening or fighting over something. An actor can contest anything: a minion, lane priority, neutral objectives, etc. Contesting is a demonstration of intent and does not necessarily mean a full fight over the object of the contest. Even just the threat of fighting, such as a soft contest, can be enough to achieve the goal of a contest.",
    "tags": [
      "strategy"
    ],
    "links": [
      "give"
    ],
    "alternates": [
      "contesting"
    ],
    "autoLinks": [
      "actor",
      "fight",
      "object",
      "threat"
    ]
  },
  {
    "id": "counterjungle",
    "term": "Counterjungle",
    "definition": "Invading the opposing team’s jungle to kill their jungle camps. Counterjungling is a common response taken when the enemy jungler shows on the map, often considered a crossmap play. Unlike clearing allied camps, counterjungling’s effects are twofold: the player gains the gold and experience from killing the camp, while the opposing jungler loses access to the same resources, creating a net relative advantage of two camps.",
    "tags": [
      "strategy",
      "jungle"
    ],
    "links": [],
    "autoLinks": [
      "crossmap"
    ]
  },
  {
    "id": "counterpick",
    "term": "Counterpick",
    "definition": "Selecting a champion in reaction to the enemy team’s picks. The player with counterpick can choose a champion that matches up well against the enemy team or their opposing laner. This term is most often used in reference to lane matchups.",
    "tags": [
      "strategy"
    ],
    "links": []
  },
  {
    "id": "crash",
    "term": "Crash",
    "definition": "When a wave of minions enters the opposing team’s tower range. Crashes are classified by “completeness,” determined by the location at which opposing waves meet relative to the tower. A crash is “full/complete” when the allied minions directly attack the enemy tower. A crash is considered “partial” when the enemy melee minions are in tower range, but not the ranged minions, resulting in a wave stalling just outside of tower range.\n\nCrashes are strategically desirable because a crash and the following bounceback create a period of time in which few, if any, enemy minions die. A crash opens a window for an allied player to spend time outside of the lane—such as to roam or recall—without fear of losing excess gold and experience.",
    "tags": [
      "game-mechanics",
      "minions"
    ],
    "links": [],
    "autoLinks": [
      "bounceback",
      "wave"
    ]
  },
  {
    "id": "crossmap",
    "term": "Crossmap",
    "definition": "A play made across the map from an opponent's play. Crossmapping is a frequent response to an opposing play made with a numbers advantage. Crossmaps can be reactive, but are strongest when performed proactively, provoking the opposing team to commit to a course of action. When a crossmap concerns two different neutral objectives, the situation is sometimes called a “trade.”",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "trade"
    ]
  },
  {
    "id": "dance",
    "term": "Dance",
    "definition": "An extended sequence between two teams around a neutral objective where both teams hesitate to commit against each other. Dances tend to happen when both teams are roughly equal in strength and the objective in question is particularly important, such as baron, dragon soul, or elder dragon. Baron and dragon dances are some of the most tense sequences in a game, since the stakes are game-deciding and the inevitable fight is chaotic.",
    "tags": [
      "vernacular"
    ],
    "links": [],
    "autoLinks": [
      "fight"
    ]
  },
  {
    "id": "dive",
    "term": "Dive",
    "definition": "Attempting to kill enemy champion(s) under their tower. Dives have a high risk-reward ratio: the ramping tower damage makes dives very dangerous, but the reward of killing an enemy under their own tower is the denial of at least one, if not multiple, waves. Dives are sometimes attempted in quick succession; re-attempts are called a redive.  A successful dive requires quick execution and coordinated management of tower aggro to minimize allied deaths.",
    "tags": [
      "strategy"
    ],
    "links": []
  },
  {
    "id": "duel",
    "term": "Duel",
    "definition": "A small scale fight involving one player from each team. Duels are most common in the early game when laners are confined to their assigned lanes and much active fighting is isolated from the influence of others. Duels tend to favor champions who have particularly strong single-target damage.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "fight"
    ]
  },
  {
    "id": "engage",
    "term": "Engage",
    "definition": "The act of starting a fight proactively. An engage starts an encounter by setting up for follow-up, usually in the form of a gap closer or crowd control. Engage is often used in the context of larger multi-person skirmishes and teamfights, but it can also refer to points in the isolated 1v1. Engage can also refer to the specific champion(s) or abilities used to perform the act of initiation, e.g. “Our engage this game is Ornn and his ult.”",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "fight"
    ]
  },
  {
    "id": "expected-value",
    "term": "Expected Value",
    "definition": "The weighted average of an outcome. The expected value of an outcome is directly proportional to the probability of the potential value gained. Expected value is a strong factor in decision-making, and optimization often surrounds improving the expected value of decisions by either lowering the variance of success or increasing the value of the outcome. \nAuthors’ note: We avoid using standard deviation because it is uncommon in the player lexicon and implies a level of precision impossible to measure.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "alternates": [
      "EV"
    ],
    "autoLinks": [
      "value",
      "variance"
    ]
  },
  {
    "id": "fight",
    "term": "Fight",
    "definition": "The period of time and location in which combat occurs. A fight can occur at several scales, with additional descriptors depending on the encounter's duration and the number of champions involved. Fights are discrete: they have definitive endpoints and are locally contained around the action, though fights can drift and move accordingly. Periods of combat or tension without definitive endpoints are labeled differently, though they can also be called fights.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [
      "dance",
      "contest"
    ],
    "autoLinks": [
      "combat",
      "tension"
    ]
  },
  {
    "id": "flash-buffer",
    "term": "Flash Buffer",
    "definition": "Buffering an action on a target or location before flashing into range to perform it instantly. A special case of the regular buffer system. Flash buffering can be done with some spells that are cast based on location, and is affected by the clamp cast setting.",
    "tags": [
      "game-mechanics"
    ],
    "links": [
      "flashcast"
    ],
    "autoLinks": [
      "buffer"
    ]
  },
  {
    "id": "flashcast",
    "term": "Flashcast",
    "definition": "Casting Flash during the cast time of an ability. The effect of a flashcast varies with how an ability is implemented. Whether an ability is aimed at the start or end of its cast time, whether it originates from the character at the beginning or end of its cast time, and its targeting input method all affect the outcome of a successful flashcast. Not all abilities can be flashcast.",
    "tags": [
      "game-mechanics"
    ],
    "links": [
      "flash-buffer"
    ]
  },
  {
    "id": "freeze",
    "term": "Freeze",
    "definition": "Keeping a larger enemy minion wave near, but not within range of, an allied tower. A freeze forms when a large enemy wave can kill an allied wave before the allied minions can build up fast enough to reverse wave direction, while also not being allowed to crash into the allied tower. Freezing can allow an actor to deny the opposing laner(s) of minion gold or even experience for an extended period of time, since the wave will not initiate a bounceback until the freeze is broken. A freeze breaks when the enemy minions cannot kill enough allied minions to prevent a buildup, and can happen intentionally or naturally. Within a large enough difference of ranged minions (usually 3+), a freeze can last indefinitely, sometimes referred to as a true freeze.",
    "tags": [
      "strategy",
      "minions"
    ],
    "links": [],
    "autoLinks": [
      "actor",
      "bounceback",
      "crash",
      "wave"
    ]
  },
  {
    "id": "gank",
    "term": "Gank",
    "definition": "A player entering a lane with the intent of creating a numbers advantage to help the allied laner(s), usually with the goal of killing the enemy laner(s). A jungler’s main way of influencing lanes is through ganking, though ganking can be performed by anyone not originally assigned to the ganked lane. The term gank mostly applies during lane phase, since lane assignments are much less strict later. Gank appears to be a portmanteau of “gang kill,” originating from MMOs.",
    "tags": [
      "strategy",
      "jungle"
    ],
    "links": []
  },
  {
    "id": "give",
    "term": "Give",
    "definition": "Allowing the enemy to do something. An actor can give anything: a jungle camp, space, towers, etc. Giving is not necessarily a passive decision, and can be done strategically to allocate time and resources towards a more valuable play. A common reason to give is to set up a cross-map play.",
    "tags": [
      "strategy"
    ],
    "links": [
      "contest"
    ],
    "alternates": [
      "giving"
    ],
    "autoLinks": [
      "actor"
    ]
  },
  {
    "id": "high-elo",
    "term": "High Elo",
    "definition": "The ladder ratings at which players are considered very skilled at the game. The exact threshold of high elo is a contentious topic among the community, with definitions of “high elo” ranging from Emerald+ to 1k LP Challenger. Riot’s balance framework, as of 2020, defines Elite play as Diamond 2 and onwards.",
    "tags": [
      "vernacular"
    ],
    "links": []
  },
  {
    "id": "hook",
    "term": "Hook",
    "definition": "An ability that forces a target’s movement towards the champion who cast it. Hooks are a defining part of a champion’s kit, and champions with hooks are also known as “hook champions.”",
    "tags": [
      "vernacular"
    ],
    "links": []
  },
  {
    "id": "hypercarry",
    "term": "Hypercarry",
    "definition": "A champion with a kit that scales particularly well into the late game. The specific attributes that determine a hypercarry are up for debate, but generally hypercarries have high, reliable, target-agnostic damage with lots of multiplicative scalings. Marksmen make up the majority of hypercarry candidates, as basic attacks are very reliable and already have several multiplicative scalers in attack speed, attack damage, and crit chance.",
    "tags": [
      "vernacular"
    ],
    "links": []
  },
  {
    "id": "interaction-engine",
    "term": "Interaction (Engine)",
    "definition": "The way two actions, states, or inputs affect each other according to the game engine. Interactions refer to the specific situation or outcome of an event, especially in unintuitive or unclear scenarios, e.g. a Quinn’s Vault targeting a Camille using Hookshot. The outcome of key interactions is a factor in analyzing matchups and fights.",
    "tags": [
      "abstract-concepts"
    ],
    "links": []
  },
  {
    "id": "invade",
    "term": "Invade",
    "definition": "Entering the opposing jungle. Invades most often have the goal of counterjungling, fighting the enemy jungler, or placing deep vision. Invades tend to carry more risk than clearing the allied jungle, due to the proximity of the enemy laners, so their success often relies upon additional information or assistance from allies.",
    "tags": [
      "strategy",
      "jungle"
    ],
    "links": []
  },
  {
    "id": "key-ability",
    "term": "Key Ability",
    "definition": "An ability that swings an interaction heavily in one player’s favor if used successfully. Most commonly this will be a non-guaranteed CC tool, but can also be dashes or defensive abilities.",
    "tags": [
      "abstract-concepts"
    ],
    "links": []
  },
  {
    "id": "kill-pressure",
    "term": "Kill Pressure",
    "definition": "A state where a player can kill another player with a strings of abilities. Usually, this means that if the player with kill pressure lands their key setup ability, they have a string of inputs that takes a relatively short amount of time that has a high likelihood of killing the other player. Whenever a player has kill pressure, it allows them to play much more aggressively, and the defending player will need to play more safely.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "autoLinks": [
      "pressure"
    ]
  },
  {
    "id": "lane-assignment",
    "term": "Lane Assignment",
    "definition": "The allocation of lanes to laners, particularly once lane phase has ended. Lane assignments after lane phase often differ from the roles at the beginning of the game. Ideally, in determining lane assignments, a team tries to maximize safety, map pressure, and suitability for each laner. In many games, the bot laner and support move to mid lane while the solo laners move to side lanes, but moment-to-moment lane assignments are situationally-dependent.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "pressure"
    ]
  },
  {
    "id": "macro",
    "term": "Macro",
    "definition": "Skills and strategies that concern longer-term decisions, on the order of a minute or more. Macro covers ideas that require significant foresight and/or coordination between teammates and often aim to generate value for the team, rather than just the individual.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "alternates": [
      "macrostrategy"
    ],
    "autoLinks": [
      "value"
    ]
  },
  {
    "id": "matchup",
    "term": "Matchup",
    "definition": "An overall evaluation of the likely outcome for specific champions during the lane phase or in isolated combat. Matchups are the total of the possible interactions that result in one or more champions holding advantages or disadvantages over the other, assuming equal champion mastery and skill between each player. Analysis of matchups can concern players in a single role, or a combination of two roles (such as bot/support or mid/jungle), but rarely the entire draft.\n\nMatchups in League are not clearly quantified due to the multitude of factors that can introduce variance. Qualifiers are often attached to describe the general favorability of interactions. Matchups are judged on a scale from hard winning to hard losing, with matchups in the middle deemed “skill” or “even.” Truly unplayable matchups are extremely rare in League due to how many factors can influence the isolated 1v1.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "combat",
      "variance"
    ]
  },
  {
    "id": "mechanics",
    "term": "Mechanics",
    "definition": "Skills and strategies that concern in-the-moment decisions and inputs, on the order of seconds or less. Mechanics cover ideas that rely heavily on reaction speed, game sense, and intuition, and center around combat.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "alternates": [
      "micro",
      "microstrategy"
    ],
    "autoLinks": [
      "combat"
    ]
  },
  {
    "id": "mindgame",
    "term": "Mindgame",
    "definition": "A situation where two opposing players have discrete right and wrong options, and each attempts to manipulate the other into making a mistake. A common example of a mindgame involves a specific interaction (engine) between two abilities that counter each other, such as Sion’s Q versus Fiora’s W, where each player wants to use their ability to negate the other’s. Mindgames primarily focus on prediction and guesswork rather than reaction-based execution.",
    "tags": [
      "strategy"
    ],
    "links": [
      "mixup"
    ]
  },
  {
    "id": "mixup",
    "term": "Mixup",
    "definition": "A situation where a defending player is vulnerable to multiple options from an attacking player, forcing them to predict or guess the correct response. Mixups are valuable when an attacking player can expect their opponent’s reaction to a string, either as a result of strong matchup knowledge or conditioning. The opponent anticipates a specific animation or other trigger to which they react, so by changing the string to introduce a non-standard option, the opponent might get caught off-guard. When performing a mixup, a player may need to take a suboptimal action to break the opponent’s expectations.",
    "tags": [
      "strategy"
    ],
    "links": [
      "mindgame"
    ],
    "autoLinks": [
      "matchup"
    ]
  },
  {
    "id": "object",
    "term": "Object",
    "definition": "Something or someone being acted upon, usually by an actor.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "autoLinks": [
      "actor"
    ]
  },
  {
    "id": "objective-setup",
    "term": "Objective Setup",
    "definition": "The sequence of preparing a play around a neutral objective. The term objective setup can be used in specific, referring to a prepared, high-coordination sequence a team performs before an objective, or in general, referring to the general situation before a neutral objective is contested. The goal of an objective setup is to make the following contest easier, through a mixture of wave management, map movement, vision control, and synchronizing tempo.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "contest",
      "tempo",
      "wave"
    ]
  },
  {
    "id": "one-trick",
    "term": "One-trick",
    "definition": "Refers to a player who almost exclusively plays a single champion. The player may play the same champion in multiple roles, but rarely deviates from their main unless banned out. High elo one-tricks are a common source of specific champion innovation. Watching a champion’s associated one-tricks play in high elo is also a common suggestion to players new to a champion. Originates from the phrase “one-trick pony.”",
    "tags": [
      "vernacular"
    ],
    "links": [],
    "autoLinks": [
      "high-elo"
    ]
  },
  {
    "id": "overextend",
    "term": "Overextend",
    "definition": "When a player is far in the opposing team’s area of map control. The overextending player is vulnerable to a gank or a collapse. Overextension is not necessarily a mistake, as it can bait the enemy team into overcommitting resources.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "bait",
      "collapse",
      "gank"
    ]
  },
  {
    "id": "pathing",
    "term": "Pathing",
    "definition": "The route a jungler takes on the map. Jungle pathing also encompasses the skill of planning such a route and the decision-making process of deciding where to go and when. “Pathing toward” is sometimes used in a similar context as the prioritization of the object that a jungler paths towards, e.g. “pathing towards bot.”",
    "tags": [
      "strategy",
      "jungle"
    ],
    "links": [],
    "alternates": [
      "jungle pathing"
    ],
    "autoLinks": [
      "object"
    ]
  },
  {
    "id": "peel",
    "term": "Peel",
    "definition": "The act of keeping an enemy off of an allied target, including oneself. Peeling is most effectively performed with hard CC, especially abilities with forced movement. Some champions are more equipped with peel than others, and it is often the job of champions with high peel to help allied champions with low self-peel.",
    "tags": [
      "strategy"
    ],
    "links": []
  },
  {
    "id": "play-strategy",
    "term": "Play (strategy)",
    "definition": "A plan or sequence that advances the gamestate. Plays generally focus around combat or other moments of high tension, with the beginning and end of a play defined by when champions enter and exit combat. A play describes a proactive sequence, even if not planned or fully intentional.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "combat",
      "tension"
    ]
  },
  {
    "id": "pressure",
    "term": "Pressure",
    "definition": "A threat that requires a response from the opponent. Pressure relies on an active threat: an actor with pressure threatens to take action which, if left unanswered, will create an advantage for themselves. Pressure can be applied at all three game scales. Example: a laner applies pressure to their opponent by denying minions, a splitpusher applies pressure to the map by pushing waves, and a team applies pressure to the enemy by starting a neutral objective.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "autoLinks": [
      "actor",
      "splitpusher",
      "threat"
    ]
  },
  {
    "id": "proxy",
    "term": "Proxy",
    "definition": "Farming the enemy minion waves between standing enemy turrets. Proxying minimizes lane interactions and creates a tempo advantage for the proxying player at the cost of increased risk of death upon an enemy collapse. Since the enemy minion waves are killed before they can meet with the allied wave, the allied wave will always crash without interruption unless the opposing laner interferes, while also preventing the opposing laner from pushing with their own wave to threaten tower damage. In certain matchups, proxying can force the lower waveclear laner to remain under their tower while the proxying player can farm uncontested.",
    "tags": [
      "strategy",
      "minions"
    ],
    "links": [],
    "autoLinks": [
      "collapse",
      "crash",
      "tempo",
      "wave"
    ]
  },
  {
    "id": "re-engage",
    "term": "Re-engage",
    "definition": "The act of re-initiating combat after an initial fight has already occurred. A re-engage acts as an extender to a fight, providing setup for another round of follow-up. Re-engage isn’t a specific job covered in a team comp, since any tool used for engage can also be used to re-engage.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "combat",
      "engage",
      "fight"
    ]
  },
  {
    "id": "recall-timing",
    "term": "Recall Timing",
    "definition": "A window of time that is opportune for a recall. A recalling player is inactionable for a recall’s 8-second channel time, then off the map from any standing resources or potential plays until they leave base, incurring a high tempo cost. The general strategy of recall timings aims to minimize tempo costs by finding a period of time where minimal enemy minions die and action on the map is low.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "tempo"
    ]
  },
  {
    "id": "reliability",
    "term": "Reliability",
    "definition": "A measure of the consistency of an option, hinging upon variance. Actions or strategies that have high reliability often have low time/resource investment, carry little risk of failure or death, and have few prerequisite conditions. As an example, ranged basic attacks are highly reliable sources of damage owing to their frequency and low commitment, whereas melee skillshots are relatively unreliable since the user must be within the enemy’s effective range to cast it and their success is not guaranteed. Reliability is one of the axes upon which an output is evaluated. An option’s reliability tends to be inversely related to its value—highly reliable options tend to have lower payoffs, and vice versa.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [
      "value"
    ],
    "autoLinks": [
      "variance"
    ]
  },
  {
    "id": "rotate",
    "term": "Rotate",
    "definition": "Moving to or from lanes. A rotation can also refer to specifically swapping lanes with another allied laner for a strategic purpose, such as maximizing farm, sidelane pressure, or preparing for an upcoming objective setup.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "objective-setup",
      "pressure"
    ]
  },
  {
    "id": "shove",
    "term": "Shove",
    "definition": "Killing all the minions in a wave as fast as possible. Shoving is a short-term wave tactic primarily used when a player has a short window for manipulating a wave, but cannot be responded to by the opponent. During the lane phase, the goal of shoving is to crash a wave into the opposing tower completely. Outside of the laning phase, shoving refers to the general act of pushing a wave as quickly as possible.\n\nShoving is commonly performed immediately after a player kills their lane opponent. By pushing their wave into the opposing tower, the player forces their lane opponent to miss the gold and experience of any minions killed by the tower while minimizing any gold or experience lost from their own recall.",
    "tags": [
      "strategy",
      "minions"
    ],
    "links": [
      "slow-push"
    ],
    "alternates": [
      "hard push",
      "fast push"
    ],
    "autoLinks": [
      "crash",
      "wave"
    ]
  },
  {
    "id": "siege",
    "term": "Siege",
    "definition": "The tactic of threatening defended enemy towers over an extended period of time. Sieges are generally high risk since the presence of the tower gives the defending team an advantage if a fight occurs. Sieges are most commonly a midgame tactic, and their efficacy greatly increases if Baron is slain.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "fight"
    ]
  },
  {
    "id": "skill-test",
    "term": "Skill Test",
    "definition": "A task, encountered regularly during games, whose outcome affects the game state. Skill tests are the abstract categories of problems that League of Legends asks of a player that wants to win. Skill tests can be categorized broadly and narrowly. For example, positioning is a skill test asked of all champions, while pet micromanagement only concerns champions that summon controllable pets.",
    "tags": [
      "abstract-concepts"
    ],
    "links": []
  },
  {
    "id": "skirmish",
    "term": "Skirmish",
    "definition": "A medium-scale fight involving multiple players from both teams. Skirmishes are a catch-all term for fights which are too small to be considered a teamfight, but involve more players than in a duel. Skirmishes tend to favor champions who have significant sustained damage but suffer heavily from the hard lockdown and burst present in full teamfights.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "duel",
      "fight",
      "teamfight"
    ]
  },
  {
    "id": "slow-push",
    "term": "Slow Push",
    "definition": "Killing minions as slowly as possible while an actor’s wave pushes toward the enemy tower. Slow pushing is a medium-term wave tactic primarily used when a player has a longer window for manipulating a wave. Slow pushing is a common default tactic because minions naturally tend to slow push if left mostly undisturbed. Slow pushes happen over 2-4 waves and result in a large buildup of allied minions before eventually crashing. The eventual large crash gives the actor a timer to make a bigger play, such as a dive, a roam, or a recall.",
    "tags": [
      "strategy",
      "minions"
    ],
    "links": [
      "shove"
    ],
    "autoLinks": [
      "actor",
      "crash",
      "dive",
      "wave"
    ]
  },
  {
    "id": "spacing",
    "term": "Spacing",
    "definition": "A player intentionally moving to maintain a specific range against an enemy. Most often, a player will be spacing one of their opponents’ abilities or combinations of abilities. Spacing is most commonly used to maintain threat on an enemy while staying out of range of an enemy’s effective range.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "threat"
    ]
  },
  {
    "id": "spike",
    "term": "Spike",
    "definition": "A significant increase in power level. The significance of a spike is not strictly defined, though generally spikes refer to power increases that unlock new capabilities for a champion. Spikes that are commonly discussed include level 2, level 3, level 6, and completed items. Skilled players often formulate their gameplans around spikes, since they are a clear reference point to power and can be used to surprise opponents.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "alternates": [
      "powerspike"
    ]
  },
  {
    "id": "split-map",
    "term": "Split Map",
    "definition": "A map state where both junglers opt to control one side (bot/top) of the map only. Split maps often form as a result of vertical jungling, creating a well-defined strongside and weakside. Because split maps incentivize junglers to focus on only one side of the map while ignoring the other, side lanes that benefit from increased jungle presence benefit more from a successful split map.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "strongside",
      "weakside"
    ]
  },
  {
    "id": "splitpush",
    "term": "Splitpush",
    "definition": "Pushing a sidelane while split from the team. A splitpush puts pressure on the opposing team to consider sending one or more people to answer the splitpusher, giving the splitpusher’s allies time to make a play on the opposite side of the map. Splitpushing, an isolated play is often contrasted with teamfighting, a grouped play.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "alternates": [
      "splitting"
    ],
    "autoLinks": [
      "give",
      "pressure",
      "splitpusher"
    ]
  },
  {
    "id": "splitpusher",
    "term": "Splitpusher",
    "definition": "A champion that excels at the splitpush, often relying on the strategy to win games. Splitpushers commonly have strong dueling and high tower damage, especially in the form of attack resets.",
    "tags": [
      "vernacular"
    ],
    "links": [],
    "autoLinks": [
      "splitpush"
    ]
  },
  {
    "id": "squishy",
    "term": "Squishy",
    "definition": "The quality of being easy to kill. Squishy is most commonly used as an analogy for champion durability. Champions who have inherently low defenses are called “squishies.”",
    "tags": [
      "vernacular"
    ],
    "links": [
      "tanky"
    ]
  },
  {
    "id": "strongside",
    "term": "Strongside",
    "definition": "A lane that receives comparatively more roams and ganks from their teammates. Designating a lane as a team’s strongside (strongsiding) incentivizes the strongsided player to play more aggressively, since they are more likely to receive assistance with their plays. Strongsiding can help swing a volatile matchup or snowball an already advantaged lane at the cost of creating a weakside.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "matchup",
      "weakside"
    ]
  },
  {
    "id": "tactics",
    "term": "Tactics",
    "definition": "Skills and strategies that concern decisions and plans in the medium term, on the order of minion waves. Tactics cover ideas that require some foresight without significant coordination: strategies that are still selfish, but consider potential outcomes and factors slightly beyond the present.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "alternates": [
      "mesostrategy",
      "meso"
    ]
  },
  {
    "id": "tanky",
    "term": "Tanky",
    "definition": "The quality of being hard to kill. Tanky champions often have inherently higher defensive stats, build defensively, or have strong defensive outputs.",
    "tags": [
      "vernacular"
    ],
    "links": [
      "squishy"
    ]
  },
  {
    "id": "teamfight",
    "term": "Teamfight",
    "definition": "A large-scale fight involving most or all players on both teams. Teamfighting is chaotic and tense, being subject to many aspects of variance and having high, game-deciding stakes. Teamfights happen more regularly once the laning phase ends and players are less bound to individual lanes. Teamfights tend to favor champions who enjoy the setup and safety offered by teammates to output extreme damage or control large amounts of space.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "fight",
      "variance"
    ]
  },
  {
    "id": "tempo",
    "term": "Tempo",
    "definition": "The efficiency of spent time in comparison to the opponent. In League, time on the map always competes with the collection of risk-free gold and experience—minion waves for laners and jungle camps for junglers. Tempo can be measured as the time to act without incurring a significant opportunity cost, often compared to this baseline value. For example, a player might be considered “behind tempo” if they have significant standing resources yet to collect while their counterpart has already finished.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "autoLinks": [
      "value"
    ]
  },
  {
    "id": "tension",
    "term": "Tension",
    "definition": "A state of raised stakes, especially with respect to the opposing team. Tension appears when two competing interests from opposing parties collide, even without active threat or combat. The presence of tension accentuates losses and gains—for each interest fulfilled by one side, an equivalent interest is lost for the other. Tension scales with both threat and value. The greater the potential agency each side has over the other or the greater the value of the outcome, the higher the stakes rise.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "autoLinks": [
      "combat",
      "threat",
      "value"
    ]
  },
  {
    "id": "threat",
    "term": "Threat",
    "definition": "The potential to act on an object. The value of a threat depends on the implied expected value of the threatened action: the theoretical EV of the action if it were taken at that instant. Once an actor takes the threatened action, the threat of the ability transforms into a realized value.\n\nExample: Blitzcrank approaches an enemy champion with its Q, Rocket Grab. When Blitz Q is off cooldown, Blitz has extremely high agency over its potential target, generating massive threat. Blitz can use the threat of its hook—the expected value of the hook hitting its target—to zone the enemy, generating value in the form of space. Once Blitz does cast its hook, it loses the associated threat, even if the hook itself generated value.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [],
    "autoLinks": [
      "actor",
      "expected-value",
      "hook",
      "object",
      "value",
      "zone"
    ]
  },
  {
    "id": "trade",
    "term": "Trade",
    "definition": "A combat between opposing laners with the intention to force an expenditure of resources, rather than to threaten a kill. Trades are often evaluated as positive or negative based on how they favor each party in terms of the parity of resources exchanged. Trades can be categorized as short or long depending on the length of the engagement. Sufficient trading can generate kill pressure or lead to an all-in.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "all-in",
      "combat",
      "kill-pressure",
      "pressure"
    ]
  },
  {
    "id": "value",
    "term": "Value",
    "definition": "The quantitative measurement of an action, decision, or state. In essence, value is how much something is “worth” to an actor. An outcome’s value is its measurable quantity: gold, health, mana, cooldown, movement, etc. Value allows for comparing actions or decisions that are measured similarly. Analogous to money in real life, value is discounted over time: a given amount of value now is worth more than the same amount of value later.",
    "tags": [
      "abstract-concepts"
    ],
    "links": [
      "expected-value"
    ],
    "autoLinks": [
      "actor"
    ]
  },
  {
    "id": "variance",
    "term": "Variance",
    "definition": "The measure of deviation from an expected outcome. Broadly, variance encompasses all the factors a player cannot directly control in a game. This includes probability-based outcomes, such as crit chance and matchmaking, as well as human variability in decisions and inputs. Variance is difficult to quantify and is most often discussed in terms of changes in variance (positive and negative).\n\nBoth decreasing and increasing variance can be valuable. Decreasing variance benefits a party with an advantage, since their expected outcome for a situation is positive. This also applies in reverse: for a party at a disadvantage, increased variance can result in more opportunities to obtain an unlikely outcome. Manipulating variance in as many aspects as possible is a fundamental skill of optimization.",
    "tags": [
      "abstract-concepts"
    ],
    "links": []
  },
  {
    "id": "wave-thinning",
    "term": "Wave Thinning",
    "definition": "Killing a few minions in an incoming wave without eliminating the entire wave. Thinning a wave is used to slow down a push or lower the possible incoming minion damage. Successfully thinning a wave preserves the wave direction while slowing the wave’s speed and the damage taken from minions. Commonly performed to maintain a freeze, contest a crash, or stall a dive.",
    "tags": [
      "strategy",
      "minions"
    ],
    "links": [],
    "alternates": [
      "trimming"
    ],
    "autoLinks": [
      "contest",
      "crash",
      "dive",
      "freeze",
      "wave"
    ]
  },
  {
    "id": "wave",
    "term": "Wave",
    "definition": "A group of minions. A wave can refer to a specific group of minions spawned by either nexus on a regular interval or any arbitrary collection of minions in a lane. Minion waves spawn at 30-second intervals (decreasing to 25, then 20 seconds with game time as of Season 2026), and are also used as a measurement of time.",
    "tags": [
      "game-mechanics",
      "minions"
    ],
    "links": [],
    "alternates": [
      "minion wave"
    ]
  },
  {
    "id": "weakside",
    "term": "Weakside",
    "definition": "A lane that receives comparatively fewer roams and ganks from their teammates. Designating a lane as a team’s weakside (weaksiding) incentivizes the weaksided player to play more cautiously, since they are less likely to receive assistance against enemy plays. A weakside is the cost of a strongside: investing heavily in one lane means leaving another to fend for themselves.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "strongside"
    ]
  },
  {
    "id": "zone",
    "term": "Zone",
    "definition": "Creating a space through threat that disincentivizes the approach of opposing players. Zoning implies the lack of active combat. A player being zoned could still choose to ignore the threat and enter the area, though they likely would experience retaliation.",
    "tags": [
      "strategy"
    ],
    "links": [],
    "autoLinks": [
      "combat",
      "threat"
    ]
  }
];

// Tag colors imported from tags.config.ts
export const tagColors: Record<string, string> = {
  'abstract-concepts': '#ec4899',
  'vernacular': '#8b5cf6',
  'strategy': '#3b82f6',
  'game-mechanics': '#06b6d4',
  'economy': '#f59e0b',
  'vision': '#6366f1',
  'minions': '#a855f7',
  'jungle': '#059669',
  'item': '#f97316'
};
