# Keybloom

A calm garden typing game for kids aged 8–12. Typing words plants a garden, clean typing makes
the music richer, and speed grows only after accuracy does.

## Run it

```
npm install
npm run build      # → dist/keybloom.html (one offline file, open it directly or serve it)
npm run serve      # http://localhost:4174
npm test           # unit tests
```

## What's in it (plan steps 1–12)

**Learning**
- Keys unlock in small groups (a s d f l → g h k → e i → r u → t y → o w → j p → c n → m v →
  b x → q z), always with real words, never letter drills, only at ≥90% accuracy and steady
  speed. Weak keys appear more; target WPM rises after 3 runs at ≥92% accuracy; the on-screen
  keyboard hint fades as accuracy grows and lights Shift for capitals.
- Seed Test placement, Sprout Lessons, Daily Watering (2 min, weakest keys).

**Four seasons, 32 beds** (Spring home row · Summer top row · Autumn bottom row · Winter capitals
and punctuation). Garden Play: words drift by; typing one plants it; nothing is ever lost (missed
words go to the compost and come back). Bloom Chain music layers at 5 / 10 / 20 / 30 clean words,
one Golden Seed per bed. About every 5 minutes of play a weather event: **Rain Rush** (catch
falling letters in the barrel), **Firefly Night**, **Windy Day**. After each season's last bed,
a **Giant Harvest** (sunflower, strawberry, pumpkin, ancient tree) and a **festival**. Winter's
festival ends the journal mystery (32 pages) with the Keybloom.

**More modes**: **Bee Race** (a bee replays your own best run), **Family Relay** (two players
take turns; each races their own usual speed, so a parent and a child are evenly matched),
**Garden Words** (60 words you type into your meadow, 5 magic words, 5 secret words hinted in the
Almanac), **Story Seeds** (9 original stories; typos are fixed with Backspace; every page grows
the storybook tree), **Greenhouse** (numbers and small sums).

**Islamic Life** (opens once every letter is learned): type the 99 Names of Allah with their
meanings (20 lessons), the English meaning of Al-Fatiha and surahs 105–114 (Saheeh International)
with the Arabic verse shown above each line (Uthmani text via quran.com, Amiri Quran font), and
29 beautiful supplications typed one part at a time. Typos must be fixed; the chapter has no music,
only nature sounds and soft clicks. Arabic is for reading only and is never typed.

**Between sessions**: plants grow one stage per day; mystery seed packets (for a bed's first
3 flowers, or all three of Pip's weekly Requests) reveal themselves when they bloom; 8 animal
visitors come for what you grow; Seed Almanac (35 plants); dewdrop shop; Garden Postcard (PNG).

**Family**: up to 4 gardeners on one computer, garden visits with notes on the garden sign, and
a **Parent Corner** (hold 3 s + a sum) with speed and accuracy charts, minutes per day, a
trouble-key map, a recommended next focus, break-reminder setting, and export / import / reset.

Settings: music / effects / nature volume, OpenDyslexic font, text size, Extra calm / Breezy
pace, reduced motion. Touch-only devices get a "grab a keyboard" screen. Everything is saved
locally; nothing leaves the device.

Fonts: Atkinson Hyperlegible and OpenDyslexic (SIL Open Font License), bundled via @fontsource.
