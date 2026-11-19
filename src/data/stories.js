// Story Seeds: short original garden stories, typed page by page. Each page is a few short lines
// (one sentence each) with capitals and punctuation. Typos must be fixed with Backspace here,
// to practise real-world typing. Every page typed grows the storybook tree.
export const STORIES = [
  {
    id: 'snail', title: 'The Snail Who Wanted to Fly',
    pages: [
      ['Sir Slowly was a snail with a very big dream.', 'He wanted to fly, just like the bees.', '"How hard can it be?" he said.'],
      ['He climbed the tallest sunflower in the garden.', 'It took him three whole days.', 'At the top, he looked down. Oh my.'],
      ['A bee landed next to him and smiled.', '"Want to see the garden from here every day?"', 'Sir Slowly nodded. Flying could wait.'],
    ],
  },
  {
    id: 'lantern', title: 'Pip and the Lost Lantern',
    pages: [
      ['One windy night, a paper lantern blew away.', 'Pip saw it float over the fence and the pond.', '"Wait for me!" she called.'],
      ['She followed it past the barn and the old oak.', 'The lantern stopped in a bush full of fireflies.', 'It glowed even brighter than before.'],
      ['Pip carried it home, slowly and carefully.', 'The fireflies came too. They liked the light.', 'Now the garden has the best lanterns of all.'],
    ],
  },
  {
    id: 'seed', title: 'The Very Small Seed',
    pages: [
      ['There once was a seed smaller than a crumb.', 'The other seeds were big and round and loud.', '"You are too tiny to grow," they said.'],
      ['The small seed did not argue. It just waited.', 'It drank the rain. It listened to the worms.', 'Then one morning, it pushed up a green tip.'],
      ['By summer it was the tallest plant of all.', 'It was a sunflower, taller than the fence!', 'Small things can grow big. Just wait and see.'],
    ],
  },
  {
    id: 'rain', title: 'Rain Day',
    pages: [
      ['Plip. Plop. Plip. The rain began to fall.', 'Clover the bunny hid under a cabbage leaf.', 'Ruby the robin did not mind one bit.'],
      ['"Rain brings the worms up!" Ruby sang.', '"Rain makes the carrots sweet," said Pip.', 'Clover peeked out. "Is that true?"'],
      ['When the sun came back, everything sparkled.', 'There was a rainbow over the pond.', 'Clover decided rain days were not so bad.'],
    ],
  },
  {
    id: 'hum', title: 'The Bee Who Could Not Hum',
    pages: [
      ['Bumble was a bee who could buzz, but not hum.', 'Every time she tried, she just sneezed.', 'The other bees giggled. Bumble felt sad.'],
      ['Pip found her sitting alone on a daisy.', '"Try humming very softly, like a breeze," she said.', 'Bumble took a breath. Hmmmm. It worked!'],
      ['Now Bumble hums the quietest song in the hive.', 'It helps the baby bees fall asleep.', 'Sometimes quiet is exactly right.'],
    ],
  },
  {
    id: 'picnic', title: 'The Moonlight Picnic',
    pages: [
      ["It was Luna the moth's birthday.", 'She wanted a picnic, but she only woke at night.', 'Who would come to a picnic in the dark?'],
      ['Pip made a plan and told everyone in secret.', 'The fireflies brought light. The owl brought pears.', 'Sir Slowly started walking there on Tuesday.'],
      ['At midnight, Luna flew down to the garden.', '"Surprise!" everyone shouted, very quietly.', 'It was the best birthday she ever had.'],
    ],
  },
  {
    id: 'scarecrow', title: "The Scarecrow's Secret",
    pages: [
      ['The scarecrow was supposed to scare the crows.', 'But he was much too friendly for that.', 'He waved at every bird that flew past.'],
      ['One day, a crow landed on his hat.', '"Why do you never shout at us?" it asked.', '"Because you are my only visitors," he said.'],
      ['From then on, the crows visited every day.', 'They told him jokes and brought him buttons.', 'And they never, ever ate the seeds again.'],
    ],
  },
  {
    id: 'snow', title: 'The First Snow',
    pages: [
      ['Pip woke up and the whole garden was white.', 'The beds, the bench, the pumpkins: all white!', '"Where did everything go?" she whispered.'],
      ['She dug a little hole in the snow with her nose.', 'Underneath, something green was waiting.', 'It was a snowdrop, warm and safe and asleep.'],
      ['"The garden is still here," Pip said, smiling.', '"It is just resting, like me after lunch."', 'She made a snow hedgehog and went inside.'],
    ],
  },
  {
    id: 'acorn', title: 'Where Did the Acorns Go?',
    pages: [
      ['Every autumn, the squirrel buried forty acorns.', 'Every winter, she could only find twenty.', '"Where do the others go?" she asked Pip.'],
      ['Pip pointed at the little trees by the fence.', '"Those are your lost acorns," she said.', '"You did not lose them. You planted them!"'],
      ['The squirrel looked at her trees with pride.', '"I am not forgetful," she said. "I am a gardener."', 'And she buried forty more, just in case.'],
    ],
  },
];

export const STORY_PAGE_COUNT = STORIES.reduce((n, s) => n + s.pages.length, 0);
