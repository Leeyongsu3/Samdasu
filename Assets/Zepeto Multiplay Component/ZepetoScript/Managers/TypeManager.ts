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
    LOG = "Log",

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
}

/* Server Connect Messages Room Datas Name */
export enum SendName {
    // Default
    isSit = "isSit",
    chairId = "chairId",
    gestureName = "gestureName",
    animationParam = "animationParam",
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
    Samdasu_Drink = 40,
    Swim = 50,
}



//////////////////////////////////////////////// About Game Manager

/* Sprite World Button */
export enum ButtonType {
    NONE = -1,
    Trash = 20, Add_Horse = 21, Ride_Wheel = 22, Ride_MGR = 23, Samdasu_Pick = 24, Samdasu_Drink = 25,
    NPC_Trader = 30, NPC_Creater = 31, NPC_B = 32, NPC_C = 33,
    Chair,
    EquipHead, EquipRightHand, EquipLeftHand, EquipBody,
}



//////////////////////////////////////////////// About UI Manager

/* Loading UI Data */
export enum LoadingType {
    Start = "UI_Loarding_Start",
    Teleport = "UI_Loarding_Teleport",
    NONE = "",
}

/** Samdasu **/
/* Stickers Datas */
export interface Sticker {
    name:string;
    count:number;
}
export enum StickerType {
    _01 = "01",
    _02 = "02",
    _03 = "03",
    _04 = "04",
    _05 = "05",
    _06 = "06",
    _07 = "07",
    _08 = "08",
    _09 = "09",
    _10 = "10",
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
    STAMP_MGR = "STAMP_MGR",
    STAMP_WHEEL = "STAMP_WHEEL",
    STAMP_WATER = "STAMP_WATER",
    STAMP_TRASH = "STAMP_TRASH",
    STAMP_OX_QUIZ = "STAMP_OX_QUIZ",
    STAMP_STICKER = "STAMP_STICKER",
}
export interface StampUI {
    gameObject:GameObject;
    transform:Transform;
    stamp:Stamp;
}

/* Trashes Datas */
export interface TrashCreater {
    yesButton:GameObject;
    count_text:Text;
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
}

/* Ride MGR Datas */
export interface MGRRide {
    transform:Transform,
    isRide:boolean,
    id:number,
}

/* Samdasu Render Mode Type */
export enum RenderPhotoMode {
    Default, Edit_Mode, Result_Mode,
}

/* Samdasu King Orange Change State */
export enum OrangeChangeState {
    NONE =-1,
    Level_1 = 0, Level_2 = 1, Level_3 = 2, Level_4 = 3, Level_5 = 4,
}


//////////////////////////////////////////////// Others

/* Other String Datas Collection */
export enum Datas {
    // LeaderBoard Id 
    TrashScoreId = "9290993a-299c-462c-a907-3abbdb190d21",

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
    Active = "Active",
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
    NOT_FOUND_HORSE = "NOT FOUND HORSE",
}