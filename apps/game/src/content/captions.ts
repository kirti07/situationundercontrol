import { Character } from '@suc/sim';

export const CaptionCue = {
  Start: 0,
  FirstSmash: 1,
  HundredSmashes: 2,
  Power: 3,
  Backfire: 4,
  Climb: 5,
  Lights: 6,
  Rush: 7,
  Stamp: 8,
  SitIn: 9,
  Barricade: 10,
  HundredReached: 11,
} as const;
export type CaptionCue = (typeof CaptionCue)[keyof typeof CaptionCue];

type Lines = Readonly<Partial<Record<CaptionCue, string>>>;

const SWARM: Lines = {
  [CaptionCue.Start]: 'Central Secretariat metro, 5:30 PM. The swarm comes up the stairs.',
  [CaptionCue.Stamp]: 'Lathi charge! Every stamp is three more of us. The lawns are watching.',
  [CaptionCue.SitIn]: 'Sit-in. Nobody moves, nobody gets stamped.',
  [CaptionCue.Barricade]: 'New barricade. Old trick. Pile up and climb.',
  [CaptionCue.Climb]: 'Twenty-five on the barricade. Over we go.',
  [CaptionCue.Lights]: 'The arch lights up in the tricolour. Keep walking.',
  [CaptionCue.Rush]: 'Six roads open. All of them lead to the arch.',
  [CaptionCue.HundredReached]: 'A hundred under the arch. Peacefully.',
};

const PRIME_TIME: Lines = {
  [CaptionCue.Start]: "Tonight's debate: are these cockroaches even Indian?",
  [CaptionCue.FirstSmash]: 'Breaking: one cockroach neutralised. Three more, sources say.',
  [CaptionCue.HundredSmashes]: 'A hundred smashed. Ratings are excellent. So are the roaches.',
  [CaptionCue.Power]:
    '"The nation wants to know why these cockroaches won\'t let me finish my sentence!"',
  [CaptionCue.Backfire]: 'The clip has gone viral. Roaches are pouring in from all six roads.',
  [CaptionCue.Lights]: 'Lights on. Cameras on. Cockroaches also, unfortunately, on.',
  [CaptionCue.Rush]: 'We are getting reports of... more reports.',
};

const CHANAKYA: Lines = {
  [CaptionCue.Start]: 'Everything is under control. Please stop counting.',
  [CaptionCue.FirstSmash]: 'Masterstroke, sir. Every one we remove brings three more.',
  [CaptionCue.HundredSmashes]: 'A hundred removed, sir. Shall we remove more?',
  [CaptionCue.Power]: '"Masterstroke. We have barricaded the barricades."',
  [CaptionCue.Climb]: 'They are climbing the barricade, sir. Shall we barricade the climb?',
  [CaptionCue.Lights]: 'The arch is lit. Nobody informed the cockroaches.',
  [CaptionCue.Rush]: 'Detention capacity exceeded. Kindly detain fewer.',
};

const PRADHAN_SEVAK: Lines = {
  [CaptionCue.Start]: 'My dear countrymen, there is nothing to see at India Gate.',
  [CaptionCue.FirstSmash]: 'We have taken firm action. The action has taken three more.',
  [CaptionCue.HundredSmashes]: 'A historic hundred. Never in seventy years.',
  [CaptionCue.Power]: '"Today, let us talk about millets."',
  [CaptionCue.Lights]: 'Tricolour lights. Tricolour optics.',
  [CaptionCue.Rush]: 'Mitron, the situation is under control. Please do not look.',
};

export const CAPTIONS: Readonly<Record<Character, Lines>> = {
  [Character.None]: SWARM,
  [Character.PrimeTime]: PRIME_TIME,
  [Character.Chanakya]: CHANAKYA,
  [Character.PradhanSevak]: PRADHAN_SEVAK,
};

export const FRONT_PAGE_CAPTIONS: readonly string[] = [
  '"Officially, there are no cockroaches at India Gate. Unofficially, please stop counting."',
  '"The pigeon on the arch has seen everything. The pigeon is not taking questions."',
  '"Every smash makes three more. The ministry is studying the matter."',
];
