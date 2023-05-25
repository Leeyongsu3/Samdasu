import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { CameraMode, Language, Stamp, Sticker } from '../Managers/TypeManager';

export default class SyncIndexManager extends ZepetoScriptBehaviour {
    /** This is used to give a unique ID to synchronization objects that do not have a separate ID. */
    public static SyncIndex:number = 0;
    public static SyncChairIndex:number = 0;

    /* UI Manager */
    public static language:Language = Language.KR;
    public static Talk_First_Finish: boolean;

    /* Equip Manager */
    public static CakeInHead: boolean;
    public static BalloonInHand: boolean;
    public static SamdasuPetInHand: boolean;

    /* Camera Manager */
    public static CameraMode:CameraMode = CameraMode.TPS;

    /* Samdasu */
    public static Rank:number = 0;
    public static Score:number = 0;
    public static TrashCount:number = 0;
    
    public static Carbin_Id:number = 0;
    public static MGR_Id:number = 0;

    public static STAMPS:Map<string, Stamp> = new Map<string, Stamp>();
    public static STICKERS:Map<string, Sticker> = new Map<string, Sticker>();
}