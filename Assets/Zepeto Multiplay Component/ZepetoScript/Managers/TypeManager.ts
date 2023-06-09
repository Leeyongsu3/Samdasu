import { Animator, GameObject, HumanBodyBones, Transform } from 'UnityEngine';
import { Button, Image, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import OXController from '../SamdasuScript/OXController';


export default class TypeManager {
}
//////////////////////////////////////////////// About Index Server

/* Server Connect Message */
export enum MESSAGE {
    SyncPlayer = "SyncPlayer",
    ChairSit = "ChairSit",
    ChairSitDown = "ChairSitDown",
    ChairSitUp = "ChairSitUp",
    Equip = "Equip",
    EquipChange = "EquipChange",
    Unequip = "Unequip",
    SyncObjectAnimation = "SyncObjectAnimation",
    LOG = "Log",
    Visible = "Visible",
    Leaderboard_Update = "Leaderboard_Update",

    /** Samdasu **/
    Clear_Stamp = "Clear_Stamp",
    Pick_Trash = "Pick_Trash",
    Add_Sticker = "Add_Sticker",
    Add_Point = "Add_Point",
    Ride_Horse = "Ride_Horse",
    Ride_Wheel = "Ride_Wheel",
    Ride_MGR = "Ride_MGR",
    Ride_OFF = "Ride_OFF",
    // Samdasu_Drink = "Samdasu_Drink",
    MGR_Play = "MGR_Play",
    Play_Effect = "Play_Effect",
    FlumeRide = "FlumeRide",
}

/* Server Connect Messages Room Datas Name */
export enum SendName {
    // Default
    isSit = "isSit",
    chairId = "chairId",
    gestureName = "gestureName",
    animationParam = "animationParam",
    cliplength = "cliplength",
    playerAdditionalValue = "playerAdditionalValue",

    // Samdasu
    SamdasuState = "SamdasuState",
    isComplete = "isComplete",
    trashCount = "trashCount",
    Selected_A = "Selected_A",
    Selected_B = "Selected_B",
    Ride_OFF = "Ride_OFF",
    Pick_Trash = "Pick_Trash",
    name = "name",
    isClear = "isClear",
    stamp = "stamp",
    attach = "attach",
    isPlay = "isPlay",
    effectType = "effectType",
    isVisible = "isVisible",
    NeedTo_wait = "NeedTo_wait",
}

/* Player Speed Datas Name */
export enum PlayerMove {
    additionalWalkSpeed = "additionalWalkSpeed",
    additionalRunSpeed = "additionalRunSpeed",
    additionalJumpPower = "additionalJumpPower",
}

/** Samdasu **/
/* Samdasu Rides Data */
export interface SyncRide {
    OwnerSessionId: string,
    isComplete: boolean,
    isRide: boolean,
}

/* Samdasu State Data */
export enum SamdasuState {
    NONE = 0,
    Ride_Horse = 10,
    Ride_Wheel = 20,
    Ride_MGR = 30,
    Pick_Item = 40, Samdasu_Drink = 41,
    Swim = 50,
    Ride_FlumeRide = 60,
}



//////////////////////////////////////////////// About Game Manager

/* Sprite World Button */
export enum ButtonType {
    NONE = -1,
    Trash = 20, Add_Horse = 21, Ride_Wheel = 22, Ride_MGR = 23, Samdasu_Pick = 24, Balloon_Pick = 27, 
    NPC_Hanlabong = 30, NPC_Trash = 31, NPC_Render = 32, NPC_Cake = 33,
    Chair,
    EquipHead, EquipRightHand, EquipLeftHand, EquipBody,
    Visible,
    FlumeRide,
}

/* Camera Mode Data */
export enum CameraMode {
    FPS, TPS,
}

/* Camera Mode Data */
export enum EffectType {
    NONE = -1,
    Firework = 1,
}

/* Object Animation Sync */
export interface SyncAnim {
    currentProgress:number;
}


//////////////////////////////////////////////// About UI Manager

/* Loading UI Data */
export enum LoadingType {
    Start = "UI_Loarding_Start",
    Teleport = "UI_Loarding_Teleport",
    NONE = "",
}

export enum Language {
    EN, KR
}

/** Samdasu **/
/* Stickers Datas */
export interface Sticker {
    name:string;
    count:number;
}
export enum StickerType {
    candle25 = "candle25",
    flower_red = "flower_red",
    mulbangul = "mulbangul",
    backrockdam = "backrockdam",
    airplane = "airplane",
    samdasu = "samdasu",
    songee = "songee",
    flower_yellow = "flower_yellow",
    horse = "horse",
    congraturation = "congraturation",
    halbang = "halbang",
    hanrabong = "hanrabong",
    haenyeo = "haenyeo",
    volcano = "volcano",
}
export interface StickerUI {
    buy:CountUI;
    button:CountUI;
    inventory:CountUI;
    sticker:Sticker;
}

/* Sticker Buy Data */
export interface StickerSelected {
    Selected_A_Type:StickerType;
    Selected_B_Type:StickerType;
}

/* Stickers Count */
export interface CountUI {
    gameObject:GameObject;
    transform:Transform;
    countText:Text;
    countImage:Image;
}

/* Stamps Datas */
export interface Stamp {
    name:string;
    isClear:boolean;
}
export enum StampType {
    STAMP_LAND = "STAMP_LAND",
    STAMP_HORSE = "STAMP_HORSE",
    STAMP_WATER = "STAMP_WATER",
    STAMP_TRASH = "STAMP_TRASH",
    STAMP_OX_QUIZ = "STAMP_OX_QUIZ",
    STAMP_STICKER = "STAMP_STICKER",
}
export enum LandStamp {
    HALF_STAMP_WHEEL = "HALF_STAMP_WHEEL",
    HALF_STAMP_MGR = "HALF_STAMP_MGR",
}
export interface StampUI {
    gameObject:GameObject;
    transform:Transform;
    stamp:Stamp;
}



//////////////////////////////////////////////// Samadasu Others

/* Render Sticker Button Datas */
export interface ButtonInfo {
    button:Button,
    count:number,
    countText:Text,
    countImage:Image,
    instances:GameObject[],
}

/* Render Instantiated Item */
export interface RenderItemData {
    gameObject:GameObject,
    transform:Transform,
    scale_suporter:number,
    rot_suporter:number,
}

/* Samdasu Render Mode Type */
export enum RenderPhotoMode {
    Default, Edit_Mode, Result_Mode,
}

/* OX Type Datas */
export enum OXType {
    OX_WALL = "wall",
    OX_SUCCESSED = "Successed",
    OX_FAILED = "Failed",
    OX_CLEAR = "Clear",
}

/* OX Quiz Datas */
export interface OXData {
    controller:OXController,
    isPassed:boolean,
}

/* Ride Horse Datas */
export interface HorseRider {
    sessionId:string,
    horse:GameObject,
    horseAnimator:Animator,
    ownerAnimator:Animator,
    startRiding:boolean,
}

/* Ride MGR Datas */
export interface MGRRide {
    transform:Transform,
    isRide:boolean,
    id:number,
}

/* LeaderBoard Datas */
export enum RankData {
    /* LeaderBoard Id */
    // TrashScoreId = "3c306291-c963-4a8c-8216-30a89eb208ad",
    TrashScoreId = "7645ecac-18c9-4435-9996-d4c1d0db5a5e",
    
    /* Recycle Datas */
    Rank_Start = 1,
    Rank_End = 10,
    Empty = "",
    Zero = "0",
}

export interface RankUI {
    panel:GameObject,
    rank:number,
    text_Id:Text,
    text_Score:Text,
}

export enum UnequipButtonType {
    Head = 5,
    RightHand = 6,
    LeftHand = 7,
}


//////////////////////////////////////////////// Others

/* Other String Datas Collection */
export enum Datas {
    // NPC Id
    kuaId = "samdasoostory",

    // Names
    Cake = "Cake",
    Samdasu = "Samdasu",
    Balloon = "Balloon",
    Balloon_A = "Balloon_A",
    Balloon_B = "Balloon_B",
    Balloon_C = "Balloon_C",

    // Transform Point
    SpawnPoint = "SpawnPoint",
    TeleportPoint = "TeleportPoint",

    // Layer
    Button = "Button",
    Render_Frame = "Render Frame",
    Render_Item = "Render Item",

    // Rotate Item
    Horse = "Horse",
    Cabin = "cabin",
}

/* Equip Datas */
export interface EquipData{
    key:string;
    sessionId:string;
    itemName:string;
    prevItemName:string;
    bone:HumanBodyBones;
}

/* Animation Clip Name Datas */
export enum Anim {
    State = "State",
    SamdasuState = "SamdasuState",
    MoveState = "MoveState",
    JumpState = "JumpState",
    LandingState = "LandingState",
    MotionSpeed = "MotionSpeed",
    FallSpeed = "FallSpeed",
    Acceleration = "Acceleration",
    MoveProgress = "MoveProgress",
    isSit = "isSit",
    isHold = "isHold",
    
    // OX Quiz
    Active = "Active",

    // NPC Animation
    isNPC = "isNPC",

    // Board Animation
    BoardSlide = "BoardSlide",
}

/* Chair Sit Datas */
export interface SyncChair {
    chairId: string,
    OwnerSessionId: string,
    onOff: boolean,
}

/* Default ScreenShot Render Result Toast Data */
export enum TOAST_MESSAGE {
    feedUploading = "Uploading...",
    feedCompleted = "Done",
    feedFailed = "Failed",
    screenShotSaveCompleted = "Saved!"
}

/* Default ScreenShot Render Result Layer Data */
export enum LAYER {
    everything = -1,
    nothing = 0,
    UI = 5,
}

/* Console Error */
export enum ERROR {
    NOT_ADDED_STIKERS = "NOT Added Stickers......",
    NOT_SELECTED_STICKERS = "NOT Selected...",
    NOT_FOUND_ITEM = "NOT FOUND ITEM....",
    NOT_FOUND_HORSE = "NOT FOUND HORSE",
    NOT_MATCHED_OBJECT = "NOT MATCHED OBJECT....",
    ITS_FULL_PLAYERS = "IT'S FULL PLAYERS....",
}