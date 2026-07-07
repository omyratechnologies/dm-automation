import { z } from "zod";

/**
 * Meta enforces 1 000 bytes max for message text (UTF-8), not 1 000 chars.
 * Use this refine on any text field that will be sent as an Instagram message.
 */
export const maxBytesRefine = (max: number) =>
  (val: string) => Buffer.byteLength(val, "utf8") <= max;

export const maxBytesMessage = (max: number) =>
  `Text must be at most ${max} bytes (UTF-8)`;
