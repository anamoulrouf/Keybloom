// Garden Words (sandbox): type a word and it appears in your garden. 60 words at launch:
// 23 plants (drawn by the plant generator), 6 trees, 13 things, 13 animals and 5 magic words
// that change the scene. Secret words are not listed; the Almanac whispers hints about them.
export const PLANT_WORDS = {
  daisy: 'daisy', tulip: 'tulip', bluebell: 'bluebell', sunflower: 'sunflower', lavender: 'lavender',
  poppy: 'poppy', carrot: 'carrot', lettuce: 'lettuce', strawberry: 'strawberry', pea: 'pea',
  marigold: 'marigold', fern: 'fern', pumpkin: 'pumpkin', aster: 'aster', dahlia: 'dahlia',
  cosmos: 'cosmos', kale: 'kale', snowdrop: 'snowdrop', holly: 'holly', pansy: 'pansy',
  crocus: 'crocus', foxglove: 'foxglove', peony: 'peony',
};
export const TREE_WORDS = ['oak', 'pine', 'maple', 'birch', 'apple', 'willow'];
export const THING_WORDS = ['pond', 'rock', 'log', 'mushroom', 'kite', 'nest', 'hive', 'lantern', 'tent', 'well', 'bucket', 'wagon', 'snowman'];
export const ANIMAL_WORDS = ['fox', 'owl', 'frog', 'duck', 'cat', 'dog', 'butterfly', 'ladybug', 'bird', 'deer', 'squirrel', 'mouse', 'turtle'];
export const MAGIC_WORDS = ['sun', 'moon', 'rain', 'rainbow', 'snow'];
export const SECRET_WORDS = ['hedgehog', 'keybloom', 'pip', 'wish', 'dance'];

export const SKY_WORDS = new Set(['kite', 'bird', 'butterfly', 'owl']);

export const GARDEN_WORDS = [...Object.keys(PLANT_WORDS), ...TREE_WORDS, ...THING_WORDS, ...ANIMAL_WORDS, ...MAGIC_WORDS];

export function wordKind(w) {
  if (PLANT_WORDS[w]) return 'plant';
  if (TREE_WORDS.includes(w)) return 'tree';
  if (THING_WORDS.includes(w)) return 'thing';
  if (ANIMAL_WORDS.includes(w)) return 'animal';
  if (MAGIC_WORDS.includes(w)) return 'magic';
  if (SECRET_WORDS.includes(w)) return 'secret';
  return null;
}

// Riddles shown in the Almanac's "Whispers" section.
export const WHISPERS = [
  'Type the name of what Pip is, and see what she can do.',
  'The name of this whole garden game opens a flower of every colour.',
  'Say hello to the gardener by name.',
  'Make a wish on a clear night.',
  'Ask everyone to dance.',
];
