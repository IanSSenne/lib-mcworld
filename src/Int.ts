"use strict";

export type Int = number & { int: null; };
export function toInt(n:number){
    return n as Int;
}