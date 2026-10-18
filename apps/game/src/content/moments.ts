import { MomentKind } from '@suc/sim';

export const CHANNEL = 'LAP-DOG NEWS';

export interface Tell {
  readonly name: string;
}

export const FAKE_TELLS_TEXT: readonly Tell[] = [
  { name: 'shiny new shoes' },
  { name: 'a walkie-talkie under his dupatta' },
  { name: 'a phone filming faces' },
  { name: 'a tiny regulation moustache' },
  { name: 'a placard that says "Sab changa si"' },
  { name: 'a crisp, freshly ironed kurta' },
];

export interface Placard {
  readonly headline: string;
  readonly right: string;
  readonly wrong: string;
}

export const PLACARDS: readonly Placard[] = [
  {
    headline: 'ANTI-NATIONAL MOB EATS PIZZA!',
    right: 'Pizza is national. So are we.',
    wrong: 'Extra cheese, please',
  },
  {
    headline: 'COCKROACHES PAID ₹500 TO PROTEST!',
    right: 'Show us the ₹500 first',
    wrong: 'UPI only, please',
  },
  {
    headline: 'PROTEST IS FOREIGN-FUNDED!',
    right: 'Funded by mess daal',
    wrong: 'Thank you, abroad!',
  },
  {
    headline: "THEY DON'T EVEN KNOW WHY THEY'RE HERE!",
    right: 'We read the bill. Did you?',
    wrong: 'Wait, why are we here?',
  },
  {
    headline: 'STUDENTS SHOULD STUDY, NOT PROTEST!',
    right: 'Paper leaked. Nothing to study.',
    wrong: 'Exams? Never heard of them',
  },
  {
    headline: "TOOLKIT FOUND IN COCKROACH'S BAG!",
    right: "It's a tiffin box",
    wrong: 'Yes, a very big toolkit',
  },
  {
    headline: 'CROWD OF ONLY 47, SAY OFFICIALS!',
    right: "Count again. We'll wait.",
    wrong: 'Fine, we are 47',
  },
  {
    headline: 'COCKROACHES BLOCKING TRAFFIC!',
    right: 'We came by metro',
    wrong: 'Honk if you hate us',
  },
  {
    headline: 'WHERE WERE THEY 70 YEARS AGO?!',
    right: 'Not born yet',
    wrong: 'Hiding, obviously',
  },
  {
    headline: 'PROTESTERS SEEN SMILING. SUSPICIOUS!',
    right: 'The chai was good',
    wrong: 'Yes, we are plotting',
  },
  {
    headline: 'LAWNS RUINED BY PICNIC MOB!',
    right: 'We brought brooms',
    wrong: 'The grass tastes nice',
  },
  {
    headline: 'NATION WANTS TO KNOW WHO IS BEHIND THIS!',
    right: 'The nation. Obviously.',
    wrong: 'Ask the pigeon',
  },
  {
    headline: 'COCKROACHES DOING IT FOR INSTAGRAM!',
    right: 'We have 3 followers. One is Mom.',
    wrong: 'Like and subscribe',
  },
  {
    headline: 'THEY WANT EVERYTHING FREE!',
    right: 'Just a fair exam',
    wrong: 'Free Wi-Fi first',
  },
  {
    headline: 'OUTSIDE AGITATORS SPOTTED!',
    right: 'Blue Line, Rajiv Chowk',
    wrong: 'We are from Mars',
  },
  {
    headline: 'MOB REFUSES TO GO HOME!',
    right: 'Home is a PG with no water',
    wrong: 'Home is overrated',
  },
  {
    headline: 'COCKROACHES HATE DEVELOPMENT!',
    right: 'We want roads without potholes',
    wrong: 'Down with roads!',
  },
  {
    headline: 'PROTEST ENDS IN FIVE MINUTES, SAY SOURCES!',
    right: 'Your sources need a watch',
    wrong: 'Okay, bye',
  },
  {
    headline: 'COCKROACHES MISLED BY SOCIAL MEDIA!',
    right: 'We read newspapers too',
    wrong: 'Forwarded many times',
  },
  {
    headline: 'VIOLENT MOB ON KARTAVYA PATH!',
    right: 'We are sitting. Quietly.',
    wrong: 'We are very scary',
  },
];

export const MOMENT_INSTRUCTIONS: Readonly<Record<MomentKind, string>> = {
  [MomentKind.None]: '',
  [MomentKind.Fake]: 'Find the fake!',
  [MomentKind.Placard]: 'Right placard!',
};

export const GAGS: readonly string[] = [
  'Drone report: official count, 47.',
  'Water cannon deployed. Cockroaches are waterproof.',
  'Chanakya: "Rally mein kaun tha?" Crowd: "Rashi."',
  `${CHANNEL} declares the protest over. The protest disagrees.`,
  'Internet suspended. News now travels by word of mouth, faster.',
  'An official counts the crowd, gives up, and writes "many".',
];
