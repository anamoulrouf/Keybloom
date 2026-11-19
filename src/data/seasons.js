// Seasons and beds (levels). Keys unlock adaptively inside play; seasons give the theme, the
// bed's plant, the story, and a Giant Harvest + festival once the last bed is finished.
// Winter beds add capitals and punctuation (see core/words.js winterize).
export const SEASONS = [
  {
    id: 'spring', name: 'Spring', keysLabel: 'Home row', time: 'morning', open: true,
    harvest: { giant: 'sunflower', name: 'Giant Sunflower', festival: 'Blossom Festival' },
    beds: [
      { species: 'daisy', words: 12 }, { species: 'lettuce', words: 14 }, { species: 'bluebell', words: 14 },
      { species: 'tulip', words: 16 }, { species: 'carrot', words: 16 }, { species: 'strawberry', words: 18 },
      { species: 'fern', words: 18 }, { species: 'poppy', words: 20 },
    ],
  },
  {
    id: 'summer', name: 'Summer', keysLabel: 'Top row', time: 'day', open: true,
    harvest: { giant: 'strawberry', name: 'Giant Strawberry', festival: 'Midsummer Picnic' },
    beds: [
      { species: 'pea', words: 18 }, { species: 'marigold', words: 18 }, { species: 'lavender', words: 20 },
      { species: 'sunflower', words: 20 }, { species: 'strawberry', words: 22 }, { species: 'lettuce', words: 22 },
      { species: 'tulip', words: 24 }, { species: 'sunflower', words: 24 },
    ],
  },
  {
    id: 'autumn', name: 'Autumn', keysLabel: 'Bottom row', time: 'evening', open: true,
    harvest: { giant: 'pumpkin', name: 'Giant Pumpkin', festival: 'Lantern Night' },
    beds: [
      { species: 'pumpkin', words: 22 }, { species: 'aster', words: 22 }, { species: 'chrysanthemum', words: 24 },
      { species: 'kale', words: 24 }, { species: 'dahlia', words: 26 }, { species: 'cosmos', words: 26 },
      { species: 'pumpkin', words: 28 }, { species: 'sunflower', words: 28 },
    ],
  },
  {
    id: 'winter', name: 'Winter', keysLabel: 'Capitals and punctuation', time: 'night', open: true,
    harvest: { giant: 'tree', name: 'Ancient Tree', festival: 'Frost Fair' },
    beds: [
      { species: 'snowdrop', words: 18 }, { species: 'hellebore', words: 20 }, { species: 'pansy', words: 20 },
      { species: 'holly', words: 22 }, { species: 'cyclamen', words: 22 }, { species: 'winterjasmine', words: 24 },
      { species: 'crocus', words: 24 }, { species: 'snowdrop', words: 26 },
    ],
  },
];

export const BED_NAMES = ['First Patch', 'Mossy Corner', 'Bee Path', 'Rain Barrel Bed', 'Sunny Strip', 'Old Wall Bed', 'Pond Edge', 'Hilltop Plot'];

// The old gardener's journal: one page comes back with every finished bed (8 per season).
export const JOURNAL = [
  // Spring
  'Day one. I found this garden asleep under weeds. Somebody loved it once. The soil still smells sweet. I think I will stay.',
  'The F and J keys on my old typewriter have little bumps, like seeds you can feel in the dark. My fingers always find their way home.',
  'Bluebells are slow. Five years from seed to flower! Some things cannot be hurried, and that is all right.',
  'I tried to plant everything at once today. Nothing grew straight. Tomorrow: one row at a time, slowly and neatly.',
  'A rabbit ate half my carrots. I planted more. There is enough garden for both of us.',
  'Note to self: the strawberries ripen fastest when nobody is watching them. (Not true. I checked.)',
  'Under the big fern there is a stone with a hedgehog carved on it. I wonder who carved it.',
  'Spring is done. My hands know the middle row of keys like they know the garden path. Summer next: reaching up for the top row, like reaching for apples.',
  // Summer
  'Sweet peas climb anything. The fence, the bench, my hat if I sit still long enough.',
  'Marigolds keep the bugs away. Kind words keep the sad days away. Plant both.',
  'The bees came today. First one, then six, then too many to count. The lavender hummed all afternoon.',
  'Sunflowers turn to follow the sun. I turn to follow the smell of baking bread from the cottage. We all have our light.',
  'I wrote the names of every plant on little wooden signs. Typing them on my typewriter first made my letters neat and even.',
  'A hedgehog visited at dusk and helped me look for slugs. I left her a saucer of water. I hope she comes back.',
  'The hedgehog came back. She has a little scarf now (I may have knitted it). I think I will call her Pip.',
  'Summer is ending, little Pip. If you are reading this, the garden is yours now. The first seed I ever planted is still waiting by the old wall. Autumn will show you where.',
  // Autumn
  'The leaves are turning. Pip says the old wall looks different in autumn light. She is right. There is a loose stone near the bottom.',
  'Behind the loose stone: a tin box, rusty and round. Pip would not let me open it until we had both washed our hands. Very proper.',
  'Inside the tin: one seed, the size of a button, wrapped in a note. The note just says "Not yet. When your hands are ready."',
  'Ready for what? Pip thinks it means typing. Every evening now we practise the bottom row: c, v, b, n, m. Slowly, then smoothly.',
  'The pumpkins are as big as Pip. She sleeps on one. I have decided not to mention it.',
  'Squirrels have been burying acorns everywhere. Next spring there will be oak trees in very silly places.',
  'Lantern night is coming. I hung paper lanterns along the fence. The seed in the tin felt warm today. Strange.',
  'All the letters are home now, every single one. The seed note had a second line I missed: "Plant me when the snow comes."',
  // Winter
  'First snow. Pip and I planted the button seed in the very middle of the garden and covered it with straw.',
  'Capital letters are like tall hats for words. Pip practised Shift all morning and now writes her name properly: Pip.',
  'Nothing has sprouted yet. The snowdrops did not wait for permission. Neither should we. More practice, more patience.',
  'A full stop at the end of a sentence is like a seed at the end of a season. It means: rest now. More is coming.',
  'Question: how do you know when a garden is finished? Answer: you never do. That is the best part.',
  'There is a green shoot in the straw! Pip did a cartwheel. I did not know hedgehogs could do cartwheels.',
  'The shoot has a bud now, shaped like a little key. When someone types carefully nearby, it glows. I am not making this up.',
  'To whoever finds this last page: the seed was called Keybloom. It opens for a gardener with patient hands. Yours are ready. The garden is yours, and so is the story. Thank you for helping Pip.',
];

// Giant Harvest lines for Winter (sentences, all keys). Earlier seasons generate real-word lines.
export const WINTER_HARVEST = [
  'The old tree is waking up.',
  'Its roots are deep, and its branches are wide.',
  'Pip hangs a lantern on every branch!',
  'Is that snow, or are the stars falling?',
  "It's the Frost Fair. Everyone is here.",
];
