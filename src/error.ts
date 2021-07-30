"use strict";
function error(message: string) {
  console.error(message);
}
export function NOT_YET_IMPLEMENTED(MESSAGE: string) {
  return () => error(`feature not implemented: ${MESSAGE}`);
}
export function DEPRECATED(ERROR_MESSAGE: string) {
  return () => error(`deprecation error: ${ERROR_MESSAGE}`);
}
