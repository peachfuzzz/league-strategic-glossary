// THIS FILE IS AUTO-GENERATED
// Do not edit directly. Edit files in src/data/terms/ instead.
// Run 'npm run generate-glossary' to regenerate this file.

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  tags: string[];
  links: string[];        // Manual links from frontmatter
  alternates?: string[];  // Alternate names/forms (e.g., "OTP" for "one trick")
  autoLinks?: string[];   // Auto-detected links from definition text
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
    "id": "actor",
    "term": "Actor",
    "definition": "Something or someone that acts upon an object.",
    "tags": [
      "abstract"
    ],
    "links": [],
    "autoLinks": [
      "object"
    ]
  },
  {
    "id": "all-in",
    "term": "All-in",
    "definition": "Combat between opposing laners with the intention to kill. An all-in is taken either when one lane has sufficient kill pressure, either via a calculation of lethal, or as a natural consequence of prior combat.  All-ins often assume the possibility of expending every resource and cooldown available to all champions involved.",
    "tags": [
      "strategy"
    ],
    "links": [
      "trade"
    ],
    "autoLinks": [
      "combat",
      "kill-pressure"
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
    ]
  },
  {
    "id": "attack-reset",
    "term": "Attack Reset",
    "definition": "The act of resetting a champion’s basic attack timer *after* damage occurs with a different input. If an attack is reset after the attack’s damage is applied, it starts the next attack’s windup immediately, letting another attack start sooner than usual. The term “attack reset” can also refer to the specific action that triggers an attack reset. Most abilities that empower a champion’s basic attack also serve as attack resets. Attack resets are often a key part of a champion’s bread-and-butter string. \nAuthors’ note: Sometimes used interchangeably with attack cancels, but we separated the two mechanics for increased clarity.",
    "tags": [
      "game-mechanics"
    ],
    "links": [],
    "alternates": [
      "auto reset"
    ]
  },
  {
    "id": "bait",
    "term": "Bait",
    "definition": "Baiting occurs when a player purposefully puts themselves in a dangerous position in an attempt to get the opponent to take an action. The act of baiting can be done on multiple scales. On a skirmishing level, a player can bait to try to get an opponent to start a fight, only to have their teammate(s) join once the opponents have committed to the fight. On a smaller scale, weaving in and out of the maximum range of an opponent's ability can maximize the chances of their opponent wasting a skill shot.",
    "tags": [
      "strategy"
    ],
    "links": [
      "overextend"
    ]
  },
  {
    "id": "buffer",
    "term": "Buffer",
    "definition": "Inputting an action before it can be performed. Upon buffering an input, the game will attempt to execute it as soon as the conditions for performing the input are met. Some examples include:\nA player inputs a targeted action on a target that is out of range. Upon the target entering the player’s range, their champion applies their action.\nA player presses an ability with a significant cast time. During the cast time, they press another ability. After the first ability is cast and the player is actionable again, the second ability is instantly performed.\nIt can be difficult to predict whether an input is bufferable in a particular state.",
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
    "links": [
      "buffer"
    ],
    "alternates": [
      "buffering through CC"
    ]
  },
  {
    "id": "collapse",
    "term": "Collapse",
    "definition": "Sending multiple people to one area of the map at the same time to try to kill an overextending player.",
    "tags": [
      "strategy"
    ],
    "links": []
  },
  {
    "id": "combat",
    "term": "Combat",
    "definition": "The state of exchanging damage or crowd control with enemy champion(s). Combat can happen at several scales depending on the duration of the encounter and the number of champions involved. In combat, a player realizes threat as the actor or the object. Being “in-combat” also has mechanical effects, with some items, abilities, and passives having different functions in and out of combat.",
    "tags": [
      "abstract"
    ],
    "links": [],
    "alternates": [
      "in-combat"
    ],
    "autoLinks": [
      "actor",
      "object",
      "threat"
    ]
  },
  {
    "id": "counterpick",
    "term": "Counterpick",
    "definition": "Selecting a champion in reaction to the enemy team’s picks. The player with counterpick can choose a champion that matches up well against the enemy team or their opposing laner. This term is most often used in reference to lane matchups.",
    "tags": [
      "strategy",
      "laning"
    ],
    "links": []
  },
  {
    "id": "engage",
    "term": "Engage",
    "definition": "The act of starting a fight proactively. An engage starts an encounter by setting up for follow-up, usually in the form of a gap closer or crowd control. Engage is often used in the context of larger multi-person skirmishes and teamfights, but it can also refer to points in the isolated 1v1. Engage can also refer to the specific champion(s) or abilities used to perform the act of initiation, e.g. “Our engage this game is Ornn and his ult.”",
    "tags": [
      "strategy"
    ],
    "links": [
      "re-engage"
    ]
  },
  {
    "id": "high-elo",
    "term": "High Elo",
    "definition": "The ladder ratings where players are considered very skilled at the game. The exact threshold of high elo is a contentious topic among the community, with definitions of “high elo” ranging from Emerald+ to 1k LP Challenger. Riot’s balance framework, as of 2020, defines Elite play as Diamond 2 and onwards.",
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
    "links": [
      "forced-movement"
    ]
  },
  {
    "id": "key-ability",
    "term": "Key Ability",
    "definition": "An ability that swings an interaction heavily in one player’s favor if used successfully. Most commonly this will be a non-guaranteed CC tool, but can also be dashes or defensive abilities.",
    "tags": [
      "strategy"
    ],
    "links": []
  },
  {
    "id": "kill-pressure",
    "term": "Kill Pressure",
    "definition": "Kill pressure is a state where a player can kill another player with any of their strings of abilities. Usually, this means that if the player with kill pressure lands their key set up ability, they have a string of inputs that takes a relatively short amount of time that has a high likelihood of killing the other player. Whenever a player has kill pressure, it allows them to play much more aggressively, and the defending player will need to play more safely.",
    "tags": [
      "abstract"
    ],
    "links": [
      "key ability",
      "strings",
      "freeze"
    ]
  },
  {
    "id": "matchup",
    "term": "Matchup",
    "definition": "The abstract evaluation of the favorability of outcomes for specific champions during the lane phase or an isolated combat. Matchups ar the total of the possible interactions that result in one or more champions holding advantages or disadvantages over the other(s), assuming equal champion mastery and skill between each player. Analysis of matchups can concern players in a single role, or a combination of two roles (such as bot/support or mid/jungle), but rarely the entire draft.\n\nMatchups in League are not clearly quantified due to the multitude of factors that can create variance. Qualifiers are often attached to describe the general favorability of interactions. Matchups are judged on a scale from hard winning to hard losing, with matchups in the middle deemed “skill” or “even.” Truly unplayable matchups are extremely rare in League due to how many factors can influence the isolated 1v1.",
    "tags": [
      "strategy",
      "laning"
    ],
    "links": [],
    "autoLinks": [
      "combat"
    ]
  },
  {
    "id": "object",
    "term": "Object",
    "definition": "Something or someone being acted upon, usually by an actor.",
    "tags": [
      "abstract"
    ],
    "links": [],
    "autoLinks": [
      "actor"
    ]
  },
  {
    "id": "one-trick",
    "term": "One-trick",
    "definition": "Refers to a player who plays almost exclusively a single champion. The player may play the same champion in multiple roles, but rarely deviates from their main unless banned out. High elo one-tricks are a common source of specific champion innovation. Watching a champion’s associated one-tricks play in high elo is also a common suggestion to players new to a champion. Originates from the phrase “one-trick pony.”",
    "tags": [
      "vernacular"
    ],
    "links": [],
    "alternates": [
      "OTP",
      "one trick pony"
    ],
    "autoLinks": [
      "high-elo"
    ]
  },
  {
    "id": "overextend",
    "term": "Overextend",
    "definition": "When a player is far in the opposing team’s area of map control. An overextending player is vulnerable to a gank or a collapse. Overextension is not necessarily a mistake, as it can bait the enemy team into overcommitting resources.",
    "tags": [
      "strategy"
    ],
    "links": [
      "collapse"
    ],
    "autoLinks": [
      "bait"
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
      "engage"
    ]
  },
  {
    "id": "shove",
    "term": "Shove",
    "definition": "Killing all the minions in a wave as fast as possible. Shoving is a short-term wave tactic primarily used when a player has a short window for manipulating a wave, but cannot be responded to by the opponent. During the lane phase, the goal of shoving is to crash a wave into the opposing tower completely. Outside of the laning phase, shoving refers to the general act of pushing a wave as quickly as possible.",
    "tags": [
      "strategy",
      "minions"
    ],
    "links": [
      "slow-push"
    ],
    "alternates": [
      "hard push"
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
    "id": "squishy",
    "term": "Squishy",
    "definition": "The quality of being easy to kill. Squishy is most commonly used in reference to champion durability, where champions who have inherently low defenses are often referred to as “squishies.”",
    "tags": [
      "vernacular"
    ],
    "links": [
      "tanky"
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
    "id": "tension",
    "term": "Tension",
    "definition": "A state of raised stakes, especially with respect to an enemy champion. Tension appears when two competing interests from opposing parties collide, even without active threat or combat. The presence of tension accentuates losses and gains—for each interest fulfilled by one side, an equivalent interest is lost for the other. Tension scales with threat: the greater the capability of influence each side has over the other, the higher the stakes become.",
    "tags": [
      "abstract"
    ],
    "links": [],
    "autoLinks": [
      "combat",
      "threat"
    ]
  },
  {
    "id": "threat",
    "term": "Threat",
    "definition": "Threat is the potential to act on an object in combat. It is generated when an actor obtains the capability to influence a target by creating value, and increases with the probability of a successful action. Fundamentally, threat is speculative—the threat of an action can create value on its own, but any value generated is with reference to an implied ground state. \n\nExample: Blitzcrank approaches an enemy champion with its Q, Rocket Grab. While Blitz Q is off cooldown, Blitz has extremely high potential to act upon its target since its hook repositions the enemy and renders them temporarily inactionable. This means while Blitz can cast its hook, it generates massive threat. Blitz can use the threat of the hook—the possibility for the hook to hit its target—as a way to influence the enemy. However, if Blitz never casts the hook, the possible value is never realized, since it never acts upon the enemy.",
    "tags": [
      "abstract"
    ],
    "links": [],
    "autoLinks": [
      "actor",
      "combat",
      "hook",
      "object"
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
      "kill-pressure"
    ]
  },
  {
    "id": "wave-thinning",
    "term": "Wave Thinning",
    "definition": "Killing a few minions in an incoming wave without clearing it entirely. Thinning a wave is used to slow down a push or lower the possible incoming minion damage. Generally, the goal of thinning is to kills as few minions as necessary to preserve the wave direction while slowing the wave’s speed. Commonly performed to maintain a freeze.",
    "tags": [
      "strategy",
      "minions"
    ],
    "links": [],
    "alternates": [
      "trimming"
    ]
  }
];

export const tagColors: Record<string, string> = {
  'minion': '#a855f7',
  'strategy': '#3b82f6',
  'fundamentals': '#10b981',
  'stat': '#eab308',
  'economy': '#f59e0b',
  'jungle': '#059669',
  'abstract-concept': '#ec4899',
  'item': '#f97316',
  'vision': '#6366f1',
  'role': '#06b6d4',
  'map': '#14b8a6',
  'summoner-spell': '#d946ef'
};

export const tagColorClasses: Record<string, string> = {
  'minion': 'bg-purple-600',
  'strategy': 'bg-blue-600',
  'fundamentals': 'bg-green-600',
  'stat': 'bg-yellow-600',
  'economy': 'bg-amber-600',
  'jungle': 'bg-emerald-600',
  'abstract-concept': 'bg-pink-600',
  'item': 'bg-orange-600',
  'vision': 'bg-indigo-600',
  'role': 'bg-cyan-600',
  'map': 'bg-teal-600',
  'summoner-spell': 'bg-fuchsia-600'
};
