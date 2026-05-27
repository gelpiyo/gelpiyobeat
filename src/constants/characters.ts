export interface CharacterDef {
  id: string;
  name: string;
  file: string;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'char_01', name: 'ゲルぴよ', file: 'char_01.png', rarity: 'N' },
  { id: 'char_02', name: 'モモぴよ', file: 'char_02.png', rarity: 'N' },
  { id: 'char_03', name: 'パルぴよ', file: 'char_03.png', rarity: 'R' },
  { id: 'char_04', name: 'Sブルー', file: 'char_04.png', rarity: 'R' },
  { id: 'char_05', name: 'Mレッド', file: 'char_05.png', rarity: 'SR' },
  { id: 'char_06', name: 'ゲルチキ', file: 'char_06.png', rarity: 'SR' },
  { id: 'char_07', name: 'レインボー', file: 'char_07.png', rarity: 'SSR' },
  { id: 'char_08', name: 'パープル', file: 'char_08.png', rarity: 'R' },
  { id: 'char_09', name: 'ワルぴよ', file: 'char_09.png', rarity: 'SR' },
];
