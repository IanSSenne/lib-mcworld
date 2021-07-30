"use strict";

// import { readFileSync } from "fs";
import { NOT_YET_IMPLEMENTED } from "./error";
import { toInt,Int } from "./Int";
import { IOWorld, JavaWorld } from "./IOWorld";
// import { getGZIPNbtLoader, Struct } from "./nbt-loader/loader";
// const gzipNbtLoader = getGZIPNbtLoader();
enum WorldType {
  java,
  bedrock,
}

type MCWorldOptions = {
  path: string,
  type: WorldType
};

export enum ErrorType{
  none,
  position_not_loaded
}

export class Block{
  id?: Int;
  resolvedId?: string;
}
export type BlockResult = {
  result: Block | null;
  error: ErrorType;
}
export class MCWorld {
  world!: IOWorld;
  options: MCWorldOptions;
  loaded: boolean = false;
  constructor(
    options: MCWorldOptions
  ) {
    this.options = options;
    switch (this.options.type){
      case WorldType.java:
        this.world = new JavaWorld(this.options.path);
        break;
      case WorldType.bedrock:
        NOT_YET_IMPLEMENTED("the bedrock world type is not supported");
        break;
    }
  }
  static java(path: string) {
    return new MCWorld({
      path,
      type: WorldType.java,
    });
  }
  getBlock(x: Int, y: Int, z: Int): Promise<BlockResult>{
    return this.world.get(x, y, z);
  }
  setBlock(x: Int, y: Int, z: Int, block: Block): Promise<boolean>{
    return this.world.set(x, y, z, block);
  }
  static bedrock = NOT_YET_IMPLEMENTED("the bedrock world type is not supported");
}


const w = MCWorld.java(String.raw`C:\Users\Owner\Documents\snap\saves\mob`);
// export function Int(num: number | any){
//   return Math.floor(num) as Int;
// }
w.getBlock(toInt(6), toInt(19), toInt(6)).then(result => {
  console.log(result.result);
});
// const testPath = String.raw`C:\Users\Owner\Documents\snap\saves\mob\level.dat`;
// const testPath2 = String.raw`C:\Users\Owner\Documents\snap\saves\mob\region\r.0.0.mca`;
// // if(w.loaded){
// //   w.getBlock(Int(1),Int(2),Int(3)).then(({result,error})=>{
// //     console.log({result,error});
// //   })
// // }

// const loader = gzipNbtLoader.getLoaderForStruct(new Struct());
// loader(readFileSync(testPath));