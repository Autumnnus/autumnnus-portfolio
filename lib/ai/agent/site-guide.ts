import en from "@/messages/en.json";
import tr from "@/messages/tr.json";
import { CHEATS, TYPED_CODES, type CheatId } from "@/lib/pixel/cheats";
import type { AssistantLocale } from "../config";

/**
 * The homepage mini-game, as the assistant sees it.
 *
 * Riddles, answers and code names come straight from the translations and
 * `lib/pixel/cheats.ts`, the same sources the game uses, so the assistant
 * can't drift out of date when a code or riddle changes. Only what each
 * secret and code *does* is written here.
 */

const MESSAGES = { tr, en } as const;

type HotspotId = "tree" | "cabin" | "sky" | "decor" | "critter";
const HOTSPOTS: HotspotId[] = ["tree", "cabin", "sky", "decor", "critter"];

const SECRET_EFFECT: Record<AssistantLocale, Record<HotspotId, string>> = {
  tr: {
    tree: "Ağaca tıkla: ağaç sallanır, sonbaharda yapraklar, kışta kar dökülür.",
    cabin: "Kulübenin kapısına tıkla (kapıyı çal): ışık yanar, kapı aralanır ve karanlıkta bir çift göz belirir.",
    sky: "Güneşe ya da aya tıkla: gülümser; sonbaharda etrafına kıvılcım saçar, kışta meteor yağmuru başlar.",
    decor: "Sonbaharda balkabaklarına/fenere tıkla, fener yanar. Kışta kardan adama tıkla, şapkası uçar.",
    critter: "Sahneden ara sıra bir hayvan geçer: sonbaharda tilki, kışta penguen. Geçerken üstüne tıkla. Diğer 4 sır bulununca daha sık geçer; biraz beklemek gerekebilir.",
  },
  en: {
    tree: "Click the tree: it shakes and drops leaves in autumn, snow in winter.",
    cabin: "Click the cabin door (knock): the light comes on, the door opens and a pair of eyes peeks out.",
    sky: "Click the sun or the moon: it smiles; sparks fly in autumn, a meteor shower starts in winter.",
    decor: "In autumn click the pumpkins/lantern and the lantern lights up. In winter click the snowman and its hat pops off.",
    critter: "Every so often an animal walks across: a fox in autumn, a penguin in winter. Click it as it passes. Once the other 4 secrets are found it shows up more often; it may take a short wait.",
  },
};

const CODE_EFFECT: Record<AssistantLocale, Record<CheatId, string>> = {
  tr: {
    konami: "Ağaçlar sarsılır; sonbaharda yaprak fırtınası, kışta kar fırtınası.",
    fireworks: "Gökyüzünde havai fişekler patlar.",
    ufo: "Bir UFO gelip tilkiyi/pengueni ışınla kaçırır.",
    weather: "Sonbaharda gök gürültülü sağanak, kışta rüzgârlı tipi başlar.",
    cycle: "Günün saati döner: sonbaharda akşam olur, kışta gündüz.",
  },
  en: {
    konami: "The trees shake: a leaf storm in autumn, a blizzard in winter.",
    fireworks: "Fireworks burst across the sky.",
    ufo: "A UFO arrives and beams up the fox/penguin.",
    weather: "A thunderstorm downpour in autumn, a windy blizzard in winter.",
    cycle: "The time of day turns: evening in autumn, daylight in winter.",
  },
};

const HOW_IT_WORKS: Record<AssistantLocale, string[]> = {
  tr: [
    "Oyun ana sayfanın en üstündeki piksel sahnede (hero kartı). Kartın altındaki görev çubuğu ilerlemeyi gösterir.",
    "Görev 1/2: sahnede saklı 5 sırrı bul. Henüz bulunmamış her şeyin üstünde bir \"!\" işareti olur; sahne de bir sonraki sırra ok ve ipucu balonuyla yol gösterir.",
    "5 sır bulununca \"Kâşif\" başarımı açılır ve kartın altındaki kod konsolu kilidini açar.",
    "Görev 2/2: 5 gizli kodu konsola yazıp Gir'e bas. Konsolun yanında ↑ ↓ ← → B A tuşları var; telefonda Konami kodu için bunları kullan.",
    "Konsolda \"İpuçları\" düğmesi her kod için bir bilmece gösterir; \"İpucu\" düğmesi cevabın bir harfini açar.",
    "Konsol affedicidir: büyük/küçük harf ve Türkçe karakterler önemsizdir, Türkçe ve İngilizce eş anlamlılar kabul edilir, uzun kelimelerde tek harf hatası sayılır. \"Çok yakın\" mesajı bir harfin yanlış olduğunu söyler.",
    "Bilgisayarda kodları konsola girmeden, sayfada herhangi bir yerde klavyeyle yazmak da çalışır (bir yazı alanına odaklı değilken), konsol kilitliyken bile. Konami için klavyenin ok tuşları + B A.",
    "Bütün sırlar ve kodlar bulununca \"Hile Ustası\" başarımı gelir. Kodlar sonra da istenildiği kadar yeniden çalıştırılabilir.",
    "İlerleme tarayıcıda saklanır. Üst menüdeki mevsim düğmesiyle sonbahar ⇄ kış geçişi yapılabilir; mevsim değişince yeni mevsim için görev sıfırdan başlar (sahne ve efektler mevsime göre değişir).",
  ],
  en: [
    "The game lives in the pixel scene at the top of the homepage (the hero card). The quest bar under the card shows progress.",
    "Quest 1/2: find the 5 secrets hidden in the scene. Anything not yet found has a \"!\" marker above it, and the scene points to the next secret with an arrow and a hint bubble.",
    "Finding all 5 unlocks the \"Explorer\" achievement and the code console under the card.",
    "Quest 2/2: type the 5 secret codes into the console and press Enter. Next to it are ↑ ↓ ← → B A buttons; use them for the Konami code on a phone.",
    "The console's \"Hints\" button shows a riddle for each code; the \"Hint\" button reveals one letter of the answer.",
    "The console is forgiving: case and Turkish letters don't matter, Turkish and English synonyms work, and a one-letter typo counts for longer words. \"So close\" means one letter is off.",
    "On a computer the codes can also be typed anywhere on the page with the keyboard (while no text field is focused), even before the console unlocks. For Konami, use the arrow keys + B A.",
    "Finding every secret and code earns the \"Cheat Master\" achievement. Codes can be re-run any time afterwards.",
    "Progress is saved in the browser. The season button in the top menu switches autumn ⇄ winter; switching seasons starts a fresh quest for that season (the scene and effects change with the season).",
  ],
};

/** Words the console accepts for each code (display forms, both languages). */
const ACCEPTED: Record<CheatId, string[]> = {
  konami: ["↑↑↓↓BA", "↑↑↓↓←→←→BA", "konami", "up up down down b a", "yukarı yukarı aşağı aşağı b a"],
  fireworks: ["kadir", "havai fişek", "fişek", "fireworks"],
  ufo: ["ufo", "uzaylı", "alien"],
  weather: ["yağış", "yağmur", "sağanak", "kar", "tipi", "fırtına", "storm", "rain", "snow", "weather"],
  cycle: ["döngü", "gece", "gündüz", "akşam", "cycle", "night", "day", "dusk"],
};

export interface SiteGuide {
  game: string;
  where: string;
  howItWorks: string[];
  secrets: { id: HotspotId; hint: string; howToFind: string }[];
  codes: {
    id: CheatId;
    name: string;
    riddle: string;
    answer: string;
    alsoAccepted: string[];
    typedAnywhere: string[];
    effect: string;
  }[];
}

function seasonal(value: string | Record<string, string>) {
  return typeof value === "string" ? value : Object.values(value).join(" / ");
}

export function getSiteGuide(locale: AssistantLocale): SiteGuide {
  const scene = MESSAGES[locale].Hero.scene;
  const typedFor = (id: CheatId) =>
    Object.entries(TYPED_CODES)
      .filter(([, cheat]) => cheat === id)
      .map(([word]) => word);

  return {
    game: locale === "tr" ? "Ana sayfa piksel sahne oyunu (sırlar ve gizli kodlar)" : "Homepage pixel-scene game (secrets and secret codes)",
    where: "/",
    howItWorks: HOW_IT_WORKS[locale],
    secrets: HOTSPOTS.map((id) => ({
      id,
      hint: seasonal(scene.hint[id]),
      howToFind: SECRET_EFFECT[locale][id],
    })),
    codes: CHEATS.map((id) => ({
      id,
      name: scene.code[id].title,
      riddle: scene.console.riddles[id],
      answer: scene.console.answers[id],
      alsoAccepted: ACCEPTED[id],
      typedAnywhere: id === "konami" ? ["↑↑↓↓BA (arrow keys)", "↑↑↓↓←→←→BA"] : typedFor(id),
      effect: CODE_EFFECT[locale][id],
    })),
  };
}
