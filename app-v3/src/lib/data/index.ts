import type { BridgetteData } from './types';
// data.js is generated from src/data.js by tools/build_app_data.mjs.
import { data as raw } from './data.js';

export const data = raw as unknown as BridgetteData;
export type {
  BridgetteData,
  Wine,
  Bottle,
  Beer,
  Fortified,
  Food,
  Cocktail,
  Translator,
  Lesson,
  Card,
  Progress,
  CardState,
  Climate,
  WineFamily,
  Objection
} from './types';
