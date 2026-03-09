/**
 * Barrel de exportações — src/lib/storage
 *
 * Centraliza os hooks de armazenamento para facilitar os imports:
 *
 *   import { useLocalStorage, useLocalOnly, useStorageSync }
 *     from "@/lib/storage";
 */
export { useLocalStorage } from "./useLocalStorage";
export { useLocalOnly }    from "./useLocalOnly";
export { useStorageSync }  from "./useStorageSync";
