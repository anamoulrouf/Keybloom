// Al-Asma ul Husna: the 99 Beautiful Names of Allah, in the order narrated by al-Tirmidhi.
// ar: Arabic (shown, never typed) · tr: transliteration a child types · en: English meaning.
// Transliteration: ee = long i, u = long u, ' = the letter 'ayn or hamza. Only typeable keys.
const LIST = `
1|الرَّحْمَٰنُ|Ar-Rahman|The Most Merciful
2|الرَّحِيمُ|Ar-Raheem|The Especially Merciful
3|الْمَلِكُ|Al-Malik|The King
4|الْقُدُّوسُ|Al-Quddus|The Most Holy
5|السَّلَامُ|As-Salam|The Source of Peace
6|الْمُؤْمِنُ|Al-Mu'min|The Giver of Faith and Safety
7|الْمُهَيْمِنُ|Al-Muhaymin|The Ever-Watchful Guardian
8|الْعَزِيزُ|Al-'Azeez|The Almighty
9|الْجَبَّارُ|Al-Jabbar|The Compeller, the Restorer
10|الْمُتَكَبِّرُ|Al-Mutakabbir|The Supreme in Greatness
11|الْخَالِقُ|Al-Khaliq|The Creator
12|الْبَارِئُ|Al-Bari'|The Maker
13|الْمُصَوِّرُ|Al-Musawwir|The Fashioner of Forms
14|الْغَفَّارُ|Al-Ghaffar|The Ever-Forgiving
15|الْقَهَّارُ|Al-Qahhar|The Subduer of All
16|الْوَهَّابُ|Al-Wahhab|The Giver of Gifts
17|الرَّزَّاقُ|Ar-Razzaq|The Provider
18|الْفَتَّاحُ|Al-Fattah|The Opener
19|الْعَلِيمُ|Al-'Aleem|The All-Knowing
20|الْقَابِضُ|Al-Qabid|The Withholder
21|الْبَاسِطُ|Al-Basit|The Extender
22|الْخَافِضُ|Al-Khafid|The One Who Lowers
23|الرَّافِعُ|Ar-Rafi'|The One Who Raises
24|الْمُعِزُّ|Al-Mu'izz|The Giver of Honor
25|الْمُذِلُّ|Al-Mudhill|The One Who Humbles
26|السَّمِيعُ|As-Samee'|The All-Hearing
27|الْبَصِيرُ|Al-Baseer|The All-Seeing
28|الْحَكَمُ|Al-Hakam|The Judge
29|الْعَدْلُ|Al-'Adl|The Utterly Just
30|اللَّطِيفُ|Al-Lateef|The Most Gentle, the Subtle
31|الْخَبِيرُ|Al-Khabeer|The All-Aware
32|الْحَلِيمُ|Al-Haleem|The Most Forbearing
33|الْعَظِيمُ|Al-'Azeem|The Magnificent
34|الْغَفُورُ|Al-Ghafur|The All-Forgiving
35|الشَّكُورُ|Ash-Shakur|The Most Appreciative
36|الْعَلِيُّ|Al-'Aliyy|The Most High
37|الْكَبِيرُ|Al-Kabeer|The Most Great
38|الْحَفِيظُ|Al-Hafeez|The Preserver
39|الْمُقِيتُ|Al-Muqeet|The Nourisher
40|الْحَسِيبُ|Al-Haseeb|The Reckoner
41|الْجَلِيلُ|Al-Jaleel|The Majestic
42|الْكَرِيمُ|Al-Kareem|The Most Generous
43|الرَّقِيبُ|Ar-Raqeeb|The Watchful
44|الْمُجِيبُ|Al-Mujeeb|The One Who Answers
45|الْوَاسِعُ|Al-Wasi'|The All-Encompassing
46|الْحَكِيمُ|Al-Hakeem|The All-Wise
47|الْوَدُودُ|Al-Wadud|The Most Loving
48|الْمَجِيدُ|Al-Majeed|The Most Glorious
49|الْبَاعِثُ|Al-Ba'ith|The Resurrector
50|الشَّهِيدُ|Ash-Shaheed|The Witness
51|الْحَقُّ|Al-Haqq|The Truth
52|الْوَكِيلُ|Al-Wakeel|The Trustee
53|الْقَوِيُّ|Al-Qawiyy|The All-Strong
54|الْمَتِينُ|Al-Mateen|The Firm
55|الْوَلِيُّ|Al-Waliyy|The Protecting Friend
56|الْحَمِيدُ|Al-Hameed|The Praiseworthy
57|الْمُحْصِي|Al-Muhsi|The One Who Counts All
58|الْمُبْدِئُ|Al-Mubdi'|The Originator
59|الْمُعِيدُ|Al-Mu'eed|The Restorer
60|الْمُحْيِي|Al-Muhyi|The Giver of Life
61|الْمُمِيتُ|Al-Mumeet|The Taker of Life
62|الْحَيُّ|Al-Hayy|The Ever-Living
63|الْقَيُّومُ|Al-Qayyum|The Self-Sustaining
64|الْوَاجِدُ|Al-Wajid|The One Who Lacks Nothing
65|الْمَاجِدُ|Al-Maajid|The Noble
66|الْوَاحِدُ|Al-Wahid|The One
67|الْأَحَدُ|Al-Ahad|The Unique, the Only One
68|الصَّمَدُ|As-Samad|The Eternal Refuge
69|الْقَادِرُ|Al-Qadir|The All-Able
70|الْمُقْتَدِرُ|Al-Muqtadir|The All-Powerful
71|الْمُقَدِّمُ|Al-Muqaddim|The One Who Brings Forward
72|الْمُؤَخِّرُ|Al-Mu'akhkhir|The One Who Delays
73|الْأَوَّلُ|Al-Awwal|The First
74|الْآخِرُ|Al-Akhir|The Last
75|الظَّاهِرُ|Az-Zahir|The Manifest
76|الْبَاطِنُ|Al-Batin|The Hidden
77|الْوَالِي|Al-Wali|The Governor
78|الْمُتَعَالِي|Al-Muta'ali|The Most Exalted
79|الْبَرُّ|Al-Barr|The Source of All Goodness
80|التَّوَّابُ|At-Tawwab|The Ever-Accepting of Repentance
81|الْمُنْتَقِمُ|Al-Muntaqim|The Avenger of Wrongs
82|الْعَفُوُّ|Al-'Afuww|The Pardoner
83|الرَّءُوفُ|Ar-Ra'uf|The Most Kind
84|مَالِكُ الْمُلْكِ|Malik-ul-Mulk|The Owner of All Sovereignty
85|ذُو الْجَلَالِ وَالْإِكْرَامِ|Dhul-Jalali wal-Ikram|The Lord of Majesty and Honor
86|الْمُقْسِطُ|Al-Muqsit|The Most Fair
87|الْجَامِعُ|Al-Jami'|The Gatherer
88|الْغَنِيُّ|Al-Ghaniyy|The Self-Sufficient
89|الْمُغْنِي|Al-Mughni|The Enricher
90|الْمَانِعُ|Al-Mani'|The Preventer of Harm
91|الضَّارُّ|Ad-Darr|The One Who Allows Hardship
92|النَّافِعُ|An-Nafi'|The One Who Benefits
93|النُّورُ|An-Nur|The Light
94|الْهَادِي|Al-Hadi|The Guide
95|الْبَدِيعُ|Al-Badee'|The Wondrous Originator
96|الْبَاقِي|Al-Baqi|The Everlasting
97|الْوَارِثُ|Al-Warith|The Inheritor of All
98|الرَّشِيدُ|Ar-Rasheed|The Guide to the Right Path
99|الصَّبُورُ|As-Sabur|The Most Patient
`;

export const NAMES = LIST.trim().split('\n').map((row) => {
  const [n, ar, tr, en] = row.split('|');
  return { n: Number(n), ar, tr, en };
});

export const NAMES_PER_LESSON = 5;
export const NAME_LESSONS = Math.ceil(NAMES.length / NAMES_PER_LESSON);

/** The line a child types for one name. */
export const nameLine = (x) => `${x.tr}: ${x.en}`;

export function nameLesson(i) {
  return NAMES.slice(i * NAMES_PER_LESSON, (i + 1) * NAMES_PER_LESSON);
}
