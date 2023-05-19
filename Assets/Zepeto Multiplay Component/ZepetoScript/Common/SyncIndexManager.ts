import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { Stamp, Sticker } from '../Managers/TypeManager';

export default class SyncIndexManager extends ZepetoScriptBehaviour {
    /** This is used to give a unique ID to synchronization objects that do not have a separate ID. */
    public static SyncIndex:number = 0;

    /* Samdasu */
    public static Rank:number = 0;
    public static Score:number = 0;
    public static TrashCount:number = 0;
    
    public static Carbin_Id:number = 0;
    public static MGR_Id:number = 0;

    public static STAMPS:Map<string, Stamp> = new Map<string, Stamp>();
    public static STICKERS:Map<string, Sticker> = new Map<string, Sticker>();
}