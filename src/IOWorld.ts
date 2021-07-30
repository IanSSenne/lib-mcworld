"use strict";
import {readFileSync, writeFileSync} from "fs";
import { decode } from "nbt-ts";
import * as zlib from "zlib";
import { BlockResult, Block, ErrorType } from "./index";
import { Int, toInt } from "./Int";
import * as pako from "pako";

export interface IOWorld {
  get(x: Int, y: Int, z: Int): Promise<BlockResult>;
  set(x: Int, y: Int, z: Int, block: Block): Promise<boolean>;
}
class XZStore<T>{
    store: Map<Int, Map<Int, T>>;
    constructor(){
        this.store = new Map<Int,Map<Int,T>>()
    }
    get(x:Int,z:Int):T|null{
        if(this.store.has(x)){
            return this.store.get(x)?.get(z)||null;
        }
        return null;
    }
    set(x:Int,z:Int,value:T):boolean{
        if(!this.store.has(x)){
            this.store.set(x,new Map<Int,T>())
        }
        return Boolean(this.store.get(x)?.set(z,value));
    }
}
const CHUNK_SIZE = 0x1000;
class JavaChunk{
    data?:Buffer;
    location: number;
    timestamp?: number;
    sectorCount: number;
    DATA_OFFSET: number;
    CHUNK_DATA_LENGTH?: number;
    COMPRESSION_TYPE?: number;
    CHUNK_DATA_RAW?: Buffer;
    nbt: any;
    loaded:boolean=true;
    constructor(x:Int,z:Int,lookup:Buffer,offset:Int){
        const CHUNK_LOCATION_OFFSET = offset + CHUNK_SIZE * 0;
        const CHUNK_TIMESTAMP_OFFSET = offset+ CHUNK_SIZE * 1;

        this.location = lookup.readUIntBE(CHUNK_LOCATION_OFFSET,3);
        this.DATA_OFFSET = CHUNK_SIZE * this.location;

        //does something, only referenced one by the wiki
        this.sectorCount = lookup.readUIntBE(CHUNK_LOCATION_OFFSET+3,1);
        if(this.DATA_OFFSET == 0 && this.sectorCount == 0){
          this.loaded=false;
        }else{

          this.timestamp = lookup.readUIntBE(CHUNK_TIMESTAMP_OFFSET,4);
          
          this.CHUNK_DATA_LENGTH = lookup.readUIntBE(this.DATA_OFFSET,4);
          this.COMPRESSION_TYPE = lookup.readUIntBE(this.DATA_OFFSET+4,1);
          this.CHUNK_DATA_RAW = lookup.slice(this.DATA_OFFSET+5,this.DATA_OFFSET+4+this.CHUNK_DATA_LENGTH);
          switch(this.COMPRESSION_TYPE){
            case 1:
              this.data = zlib.gunzipSync(this.CHUNK_DATA_RAW);
            break;
            case 2:
              this.data = Buffer.from(pako.inflate(this.CHUNK_DATA_RAW));
            break;
            case 3:
              this.data = this.CHUNK_DATA_RAW;
            break;
            case 0:
            default:
              console.log("unkown compression format:",this.COMPRESSION_TYPE);
              throw new Error("Invalid chunk");
          }
          this.nbt = decode(this.data);
          writeFileSync(`./debug/r.${x}.${z}.json`,JSON.stringify(this.nbt,null,2));
        }
    }
    getByteSizeForSection(section:any){
      return Math.max(4,Math.floor((section.BlockStates.length*64) / 4096));
    }
    getBlockAtPosition(x:Int,y:Int,z:Int):Block{
      const Segment = Math.floor(y/16);
      const BlockPos:number = y*16*16 + z*16 + x;
      const SubChunk = this.nbt.value.Level.Sections[Segment];
      console.log({Segment,BlockPos,SubChunk})
      debugger;
      if(!SubChunk){
        return {
          id:-2 as Int,
          resolvedId:"NOT_LOADED",
        }
      }
      if(SubChunk.Palette){
        return {
          id: SubChunk.BlockStates[BlockPos],
          resolvedId:""
        }
      }
      return {
        id: -1 as Int,
        resolvedId: "minecraft:air"
      }
    }
}
class JavaRegion{
    chunks = new XZStore<JavaChunk>();
    x: Int;
    z: Int;
    header:Buffer//length 8192
    constructor(x:Int,z:Int,data:Buffer){
        this.header = data.slice(0,0x2000);

        this.x = x;
        this.z = z;
        for(let _x:Int = 0 as Int;_x<32;_x++){
          for(let _z:Int = 0 as Int;_z<32;_z++){
            this.chunks.set(_x, _z, new JavaChunk(_x,_z,data,4 * ((_x & 31) + (_z & 31) * 32) as Int));
          }
        }
    }
}
//@ts-ignore
BigInt.prototype["toJSON"] = function(){
  return this.toString()+"n"
}
export class JavaWorld implements IOWorld {
  path: { base: string; };
  regions: XZStore<JavaRegion> = new XZStore<JavaRegion>();
  constructor(path: string) {
    this.path = {
      base: path
    };
    // throw new Error("Method not implemented.");
  }
  async get(x: Int, y: Int, z: Int): Promise<BlockResult> {
    console.log(`get block ${x},${y},${z}`);
    const REGION_X = x >> 5 as Int;
    const REGION_Z = z >> 5 as Int;
    let _region:JavaRegion;
    let region:JavaRegion|null = this.regions.get(REGION_X, REGION_Z);
    if(!region){
      const regionData = readFileSync(this.path.base+"/region/r."+REGION_X+"."+REGION_Z+".mca");
      _region = new JavaRegion(REGION_X,REGION_Z,regionData);
      this.regions.set(REGION_X, REGION_Z, _region);
    }else{
      _region = region;
    }
    const REL_X = Math.floor(x/16 - REGION_X * 32);
    const REL_Z = Math.floor(z/16 - REGION_Z * 32);
    return {
      // @ts-ignore
      result: _region?.chunks?.get(toInt(REL_X & 0x1f), toInt(REL_Z & 0x1f))?.getBlockAtPosition(toInt(x & 0xf), y,toInt(z & 0x1f)),
      error:ErrorType.none
    };
    // return { result: null, error: ErrorType.position_not_loaded };
  }
  async set(x: Int, y: Int, z: Int, block: Block): Promise<boolean> {
    console.log(`set block ${x},${y},${z},${block.resolvedId}`);
    throw new Error("Method not implemented.");
  }
}
