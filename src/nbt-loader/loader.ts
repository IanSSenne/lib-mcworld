import {decode} from "nbt-ts";
import { gunzipSync } from "zlib";
export class Struct{
    mimic(_original:object){

    }
}
export class NBTloader{
    middleware:((buf:Buffer)=>Buffer)[] = [];
    addMiddleware(fn:(buf:Buffer)=>Buffer){
        this.middleware.push(fn);
    }
    getLoaderForStruct(struct:Struct){
        return (data:Buffer)=>{
            const value = this.runMiddleware(data);
            const jsobj = decode(value);
            console.log(jsobj);
            return struct.mimic(jsobj);
        }
    }
    runMiddleware(data:Buffer):Buffer{
        return this.middleware.reduce((pv,cb)=>cb(pv),data);
    }
}



let gzipNbtLoader:NBTloader;
export function getGZIPNbtLoader(){
    if(!gzipNbtLoader){
        gzipNbtLoader = new NBTloader();
        gzipNbtLoader.addMiddleware((buf:Buffer)=>gunzipSync(buf));
    }
    return gzipNbtLoader;
}