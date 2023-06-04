import { Animator, BoxCollider, Camera, CharacterController, GameObject, HumanBodyBones, Mathf, MeshRenderer, Quaternion, Random, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { UIZepetoPlayerControl, ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import DOTWeenSyncHelper from '../DOTween/DOTWeenSyncHelper';
import PlayerSync from '../Player/PlayerSync';
import FlumeRideManager from '../SamdasuScript/FlumeRideManager';
import HorseRideManager from '../SamdasuScript/HorseRideManager';
import MGRManager from '../SamdasuScript/MGRManager';
import NPCManager from '../SamdasuScript/NPCManager';
import OXManager from '../SamdasuScript/OXManager';
import RenderCameraController from '../SamdasuScript/RenderCameraController';
import TrashManager from '../SamdasuScript/TrashManager';
import TreeKingManager from '../SamdasuScript/TreeKingManager';
import ZoneTriggerController from '../SamdasuScript/ZoneTriggerController';
import ChairSit from '../Sample Code/ChairSit';
import LookAt from '../Sample Code/LookAt';
import AnimatorSyncHelper from '../Transform/AnimatorSyncHelper';
import TransformSyncHelper from '../Transform/TransformSyncHelper';
import EquipManager from './EquipManager';
import LeaderBoardManager from './LeaderBoardManager';
import { Anim, ButtonType, CameraMode, Datas, EffectType, ERROR, LandStamp, LoadingType, MESSAGE, SamdasuState, SendName, StampType, SyncChair, SyncRide, UnequipButtonType } from './TypeManager';
import UIManager from './UIManager';
import VisibleManager from './VisibleManager';

export default class GameManager extends ZepetoScriptBehaviour {

    /* Singleton */
    private static _instance: GameManager = null;
    public static get instance(): GameManager {
        if (this._instance === null) {
            this._instance = GameObject.FindObjectOfType<GameManager>();
            if (this._instance === null) {
                this._instance = new GameObject(GameManager.name).AddComponent<GameManager>();
            }
        }
        return this._instance;
    }

    /* GameManagers Default Properties */
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;
    private animatorSyncHelpers: AnimatorSyncHelper[] = [];
    private transformSyncs: TransformSyncHelper[] = [];
    private doTWeenSyncs: DOTWeenSyncHelper[] = [];
    private syncChairs: ChairSit[] = [];
    private player: Player;
    private camLocalPos: Vector3;
    private joyCon:UIZepetoPlayerControl;

    /* Samdasu Field */
    @Header("* Samdasus Field")
    @Header("Managers")
    @SerializeField() private _leaderboardManager: Transform;
    @SerializeField() private _horseRideManager: Transform;
    @SerializeField() private _flumeRideManager: Transform;
    // @SerializeField() private _treeKingManager: Transform;
    @SerializeField() private _visibleManager: Transform;
    @SerializeField() private _trashManager: Transform;
    @SerializeField() private _mgrManager: Transform;
    @SerializeField() private _npcManager: Transform;
    @SerializeField() private _oxManager: Transform;
    private leaderboardManager: LeaderBoardManager;
    private horseRideManager: HorseRideManager;
    private flumeRideManager: FlumeRideManager;
    // private treeKingManager: TreeKingManager;
    private visibleManager: VisibleManager;
    private trashManager: TrashManager;
    private mgrManager: MGRManager;
    private npcManager: NPCManager;
    private oxManager: OXManager;
    
    @Header("Controllers")
    @SerializeField() private _renderCameraController: Transform;
    @SerializeField() private _zoneTriggerController: Transform;
    private renderCameraController: RenderCameraController;
    private zoneTriggerController: ZoneTriggerController;

    private targetCarbin:Transform;

    @Header("Return Points")
    @SerializeField() private wheelReturnPoint: Transform;
    @SerializeField() private mgrReturnPoint: Transform;

    @Header("Others")
    @SerializeField() private trashFoolGroup: Transform;
    @SerializeField() private samdasuPetInWorld: GameObject;
    public get samdasuName(): string { return this.samdasuPetInWorld.name }
    private halfStamp_MGR: boolean = false;
    private halfStamp_Wheel: boolean = false; 
    
    /* Singleton */
    private Awake() {
        if (GameManager._instance !== null && GameManager._instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            GameManager._instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
            this.room.AddMessageHandler(MESSAGE.ChairSitDown, (message:SyncChair) => {
                if(this.room.SessionId == message.OwnerSessionId) {
                    for(const chair of this.syncChairs) chair.ButtonOnOff(false);
                }
                for(const chair of this.syncChairs) {
                    if(chair.Id == message.chairId) {
                        chair.PlayerSitDown(message.OwnerSessionId);
                    }
                }
            });

            this.room.AddMessageHandler(MESSAGE.ChairSitUp, (message:SyncChair) => {
                if(this.room.SessionId == message.OwnerSessionId) {
                    for(const chair of this.syncChairs) chair.ButtonOnOff(true);
                }
                for(const chair of this.syncChairs) {
                    if(chair.Id == message.chairId) {
                        chair.PlayerSitUp(message.OwnerSessionId);
                    }
                }
            });

            this.room.AddMessageHandler(MESSAGE.Play_Effect, (message:any) => {
                this.zoneTriggerController.PlayEffect();
                this.leaderboardManager.UpdateScore();
            });

            this.room.AddMessageHandler(MESSAGE.Ride_MGR, (message:SyncRide) => {
                if(message.isRide) {
                    this.RideMerryGoRound(message.OwnerSessionId);
                } else {
                    this.RideOffMerryGoRound(message.OwnerSessionId, message.isComplete);
                }
            });

            this.room.AddMessageHandler(MESSAGE.Ride_Wheel, (message:SyncRide) => {
                if(message.isRide) {
                    this.RideWheel(message.OwnerSessionId);
                } else {
                    
                    this.RideOffWheel(message.OwnerSessionId, message.isComplete);
                }
            });

            this.room.AddMessageHandler(MESSAGE.Ride_Horse, (message:SyncRide) => {
                if(message.isRide) {
                    this.RideHorse(message.OwnerSessionId);
                } else {
                    this.RideOFFHorse(message.OwnerSessionId);
                }
            });

            this.room.AddMessageHandler(MESSAGE.MGR_Play, (message:any) => {
                this.mgrManager.isPlay = message.isPlay;
            });

            this.room.AddMessageHandler(MESSAGE.Visible, (message:any) => {
                this.visibleManager.TargetControl(message.name, message.isVisible);
            });

            this.room.AddMessageHandler(MESSAGE.FlumeRide, (message:any) => {
                this.flumeRideManager.WaitRide(message.OwnerSessionId, message.NeedTo_wait);
            });
        }
        this.StartCoroutine(this.StartLoading());
        
        // this.animatorSyncHelpers = GameObject.FindObjectsOfType<AnimatorSyncHelper>();
        // this.animatorSyncHelpers.sort();
        // for(const anim of this.animatorSyncHelpers) {
        //     SyncIndexManager.SyncIndex++;
        //     anim.RemoteStart(SyncIndexManager.SyncIndex.toString());
        // }
        this.transformSyncs = GameObject.FindObjectsOfType<TransformSyncHelper>();
        this.transformSyncs.sort();
        for(const trans of this.transformSyncs) {
            SyncIndexManager.SyncIndex++;
            trans.RemoteStart(SyncIndexManager.SyncIndex.toString());
        }
        console.log(`[GameManager] TransformSyncHelper connected success`);

        this.doTWeenSyncs = GameObject.FindObjectsOfType<DOTWeenSyncHelper>();
        this.doTWeenSyncs.sort();
        for(const dot of this.doTWeenSyncs) {
            SyncIndexManager.SyncIndex++;
            dot.RemoteStart(SyncIndexManager.SyncIndex.toString());
        }
        console.log(`[GameManager] DOTWeenSyncHelper connected success`);

        /* Get Managers */
        const leaderboardManager = this._leaderboardManager.GetComponent<LeaderBoardManager>();
        if(leaderboardManager) this.leaderboardManager = leaderboardManager;
        else this.leaderboardManager = GameObject.FindObjectOfType<LeaderBoardManager>();
        this._leaderboardManager = null;
        leaderboardManager.RemoteStart();
        console.log(`[GameManager] LeaderBoardManager loaded success`);
        
        const visibleManager = this._visibleManager.GetComponent<VisibleManager>();
        if(visibleManager) this.visibleManager = visibleManager;
        else this.visibleManager = GameObject.FindObjectOfType<VisibleManager>();
        this._visibleManager = null;
        visibleManager.RemoteStart();
        console.log(`[GameManager] VisibleManager loaded success`);

        /* Get Samdasu Managers */
        const horseRideManager = this._horseRideManager.GetComponent<HorseRideManager>();
        if(horseRideManager) this.horseRideManager = horseRideManager;
        else this.horseRideManager = GameObject.FindObjectOfType<HorseRideManager>();
        this._horseRideManager = null;
        console.log(`[GameManager] HorseRideManager loaded success`);

        // const treeKingManager = this._treeKingManager.GetComponent<TreeKingManager>();
        // if(treeKingManager) this.treeKingManager = treeKingManager;
        // else this.treeKingManager = GameObject.FindObjectOfType<TreeKingManager>();
        // this._treeKingManager = null;
        // treeKingManager.RemoteStart();
        // console.log(`[GameManager] TreeKingManager loaded success`);

        const trashManager = this._trashManager.GetComponent<TrashManager>();
        if(trashManager) this.trashManager = trashManager;
        else this.trashManager = GameObject.FindObjectOfType<TrashManager>();
        this._trashManager = null;
        console.log(`[GameManager] TrashManager loaded success`);

        const mgrManager = this._mgrManager.GetComponent<MGRManager>();
        if(mgrManager) this.mgrManager = mgrManager;
        else this.mgrManager = GameObject.FindObjectOfType<MGRManager>();
        this._mgrManager = null;
        console.log(`[GameManager] MGRManager loaded success`);

        const npcManager = this._npcManager.GetComponent<NPCManager>();
        if(npcManager) this.npcManager = npcManager;
        else this.npcManager = GameObject.FindObjectOfType<NPCManager>();
        this._npcManager = null;
        npcManager.RemoteStart();
        console.log(`[GameManager] NPCManager loaded success`);

        const oxManager = this._oxManager.GetComponent<OXManager>();
        if(oxManager) this.oxManager = oxManager;
        else this.oxManager = GameObject.FindObjectOfType<OXManager>();
        this._oxManager = null;
        oxManager.RemoteStart();
        console.log(`[GameManager] OXManager loaded success`);

        /* Get Controllers */
        const renderCameraController = this._renderCameraController.GetComponent<RenderCameraController>();
        if(renderCameraController) this.renderCameraController = renderCameraController;
        else this.renderCameraController = GameObject.FindObjectOfType<RenderCameraController>();
        this._renderCameraController = null;
        renderCameraController.RemoteStart();
        console.log(`[GameManager] RenderCameraController loaded success`);

        const zoneTriggerController = this._zoneTriggerController.GetComponent<ZoneTriggerController>();
        if(zoneTriggerController) this.zoneTriggerController = zoneTriggerController;
        else this.zoneTriggerController = GameObject.FindObjectOfType<ZoneTriggerController>();
        this._zoneTriggerController = null;
        zoneTriggerController.RemoteStart();
        console.log(`[GameManager] ZoneTriggerController loaded success`);
    }

    /* Start Loading */
    private * StartLoading() {
        const loadingUI = UIManager.instance.GetLoadingImage(LoadingType.Start);
        if(!loadingUI) return;
        let isLoading = true;
        loadingUI.SetActive(true);
        ZepetoPlayers.instance.controllerData.inputAsset.Disable();
        const wait = new WaitForSeconds(2);
        while (isLoading) {
            yield wait;
            if (this.room != null && this.room.IsConnected) {
                if (ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) {
                    /* Remote Start */
                    UIManager.instance.RemoteStart();
                    console.log(`[GameManager] UIManager loaded success`);

                    const flumeRideManager = this._flumeRideManager.GetComponent<FlumeRideManager>();
                    if(flumeRideManager) this.flumeRideManager = flumeRideManager;
                    else this.flumeRideManager = GameObject.FindObjectOfType<FlumeRideManager>();
                    this._flumeRideManager = null;
                    flumeRideManager.localSessionId = this.room.SessionId;
                    console.log(`[GameManager] FlumeRideManager loaded success`);

                    /* Sync Chair Init */
                    this.syncChairs = GameObject.FindObjectsOfType<ChairSit>();
                    this.syncChairs.sort();
                    for(const chair of this.syncChairs) {
                        SyncIndexManager.SyncChairIndex++;
                        chair.RemoteStart(SyncIndexManager.SyncChairIndex.toString());
                        chair.localSessionId = this.room.SessionId;
                    }
                    console.log(`[GameManager] ChairSync connected success`);

                    /* Stop Loading */
                    isLoading = false;
                    loadingUI.SetActive(false);
                    ZepetoPlayers.instance.controllerData.inputAsset.Enable();
                    this.StopCoroutine(this.StartLoading());
                    break;
                }
            }
        }
    }

    /* Change Camera Mode */
    public SetCameraFPS() { this.ChangeCameraMode(CameraMode.FPS); }
    public SetCameraTPS() { this.ChangeCameraMode(CameraMode.TPS); }
    private ChangeCameraMode(cameraMode:CameraMode) {
        /* Get Camera Data */
        const cam = ZepetoPlayers.instance.ZepetoCamera;
        const character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.transform;
        if(SyncIndexManager.CameraMode == CameraMode.TPS) {
            this.camLocalPos = cam.camera.transform.position;
            const dir = Vector3.Distance(character.position, this.camLocalPos);
            console.log(dir);
            
        }
        SyncIndexManager.CameraMode = cameraMode;

        /* Set Camera Mode */
        switch (+cameraMode) {
            case CameraMode.FPS:
                cam.additionalOffset = (cam.LookOffset *-1) + (Vector3.up *0.1);
                cam.additionalMaxZoomDistance = -(cam.MaxZoomDistance +1);
                cam.additionalMinZoomDistance = -(cam.MinZoomDistance +1);
                break;

            case CameraMode.TPS:
                cam.additionalOffset = Vector3.zero;
                cam.additionalMaxZoomDistance = 0;
                cam.additionalMinZoomDistance = 0;
                cam.camera.transform.localPosition = this.camLocalPos;
                console.log(` return local ${this.camLocalPos.x}, ${this.camLocalPos.y}, ${this.camLocalPos.z}`);
                console.log(` return local ${cam.transform.localPosition.x}, ${cam.transform.localPosition.y}, ${cam.transform.localPosition.z}`);
                break;
        }
    }

    /* Raycast Button Start */
    SwitchButtonScript(btn : Transform) {
        let lookAt = btn.GetComponentInChildren<LookAt>();
        if(!lookAt) {
            lookAt = btn.GetComponentInParent<LookAt>();
            console.log(lookAt, lookAt==null);
            if(!lookAt) return;
        }
        const buttonType = lookAt.buttonType;
        const target = lookAt.scriptTarget;
        const data = new RoomData();
        switch (+buttonType){
            case ButtonType.Chair:
                const chairSit = target.GetComponent<ChairSit>();
                if(!chairSit) return;
                data.Add(SendName.isSit, true);
                data.Add(SendName.chairId, chairSit.Id);
                this.room.Send(MESSAGE.ChairSit, data.GetObject());
                this.SetSamdasuState(SamdasuState.NONE, false);
                break;

            case ButtonType.Trash:
                lookAt.RemoteStopLooking();
                target.SetParent(this.trashFoolGroup);
                target.position = this.trashFoolGroup.position;
                target.gameObject.SetActive(false);
                data.Add(SendName.Pick_Trash, true);
                this.room.Send(MESSAGE.Pick_Trash, data.GetObject());
                break;

            case ButtonType.Ride_Wheel:
                lookAt.RemoteStopLooking();
                if(!target) return;
                this.targetCarbin = target;

                /* Carbin Invisible */
                // const mesh = target.parent.GetComponent<MeshRenderer>();
                // mesh.enabled = false;
                
                // const rideController = target.GetComponent<RideController>();
                // if(!rideController || rideController.SamdasuState == SamdasuState.NONE) return;
                this.room.Send(MESSAGE.Ride_Wheel, data.GetObject());
                break;

            case ButtonType.Ride_MGR:
                lookAt.RemoteStopLooking();
                this.room.Send(MESSAGE.Ride_MGR, data.GetObject());
                break;

            case ButtonType.Balloon_Pick:
                /* Player State Set */
                this.SetSamdasuState(SamdasuState.Pick_Item, true);

                const index = Mathf.Floor(Random.Range(0, EquipManager.instance.balloonsCount));
                const balloon = EquipManager.instance.GetBalloonsName(index);

                /* Samdasu Equip */
                data.Add(SendName.name, balloon);
                data.Add(SendName.attach, HumanBodyBones.LeftHand);
                this.room.Send(MESSAGE.Equip, data.GetObject());
                break;

            case ButtonType.Samdasu_Pick:
                if(this.samdasuPetInWorld != target.gameObject) return console.error(ERROR.NOT_MATCHED_OBJECT);

                /* Player State Set */
                this.SetSamdasuState(SamdasuState.Pick_Item, true, true);

                /* Samdasu Equip */
                if(!SyncIndexManager.SamdasuPetInHand) {
                    data.Add(SendName.name, Datas.Samdasu);
                    data.Add(SendName.attach, HumanBodyBones.RightHand);
                    this.room.Send(MESSAGE.Equip, data.GetObject());
                }
                this.onPlayerDrink();
                break;

            case ButtonType.NPC_Trash:
            case ButtonType.Add_Horse:
            case ButtonType.NPC_Render:
            case ButtonType.NPC_Hanlabong:
                lookAt.RemoteStopLooking();
                lookAt.NPCButtonActivate();
                break;

            case ButtonType.NPC_Cake:
                /* Samdasu Equip */
                data.Add(SendName.name, Datas.Cake);
                data.Add(SendName.attach, HumanBodyBones.Head);
                this.room.Send(MESSAGE.Equip, data.GetObject());
                break;
                
            case ButtonType.Visible:
                data.Add(SendName.name, target.name);
                data.Add(SendName.isVisible, !target.gameObject.activeSelf);
                this.room.Send(MESSAGE.Visible, data.GetObject());
                break;
                
            case ButtonType.FlumeRide:
                this.StartCoroutine(this.FlumeRide());
                break;

            default :
                console.error(`타입이 설정되지 않은 버튼이 있습니다. ${btn.name}-${ButtonType[buttonType]}`)
                break;
        }
    }

    /* Player Sit Out */
    public PlayerSendSitUp(chairId: string) {
        if(!this.room || !this.room.IsConnected) return;
        const data = new RoomData();
        data.Add(SendName.isSit, false);
        data.Add(SendName.chairId, chairId);
        this.room.Send(MESSAGE.ChairSit, data.GetObject());
    }

    /* Trigger Firework */
    public onTriggerFirework() {
        if(!this.room || !this.room.IsConnected) return;
        const data = new RoomData();
        data.Add(SendName.effectType, EffectType.Firework);
        this.room.Send(MESSAGE.Play_Effect, data.GetObject());
    }

    /* Get Local Player */
    public SetLocalPlayer(player:Player) {
        this.player = player;
        UIManager.instance.SetStampUI(this.player.samdasu.Stamps);
        UIManager.instance.SetStickerUI(this.player.samdasu.Stickers);
    }

    /* Player Data Update */
    public PlayerDataUpdate() {
        const changeData = [false, false, false];
        if(SyncIndexManager.Rank != this.player.samdasu.Rank) {
            SyncIndexManager.Rank = this.player.samdasu.Rank;
            changeData[0] = true;
        }
        if(SyncIndexManager.Score != this.player.samdasu.Score) {
            SyncIndexManager.Score = this.player.samdasu.Score;
            changeData[1] = true;
        }
        if(SyncIndexManager.TrashCount != this.player.samdasu.TrashCount) {
            SyncIndexManager.TrashCount = this.player.samdasu.TrashCount;
            changeData[2] = true;
        }

        /* Update Local UI */
        if(changeData[1] || changeData[2]) {
            UIManager.instance.UpdatePlayerUI();
        }

        /* Update LeaderBoard */
        if(changeData[0] || changeData[1]) {
            this.leaderboardManager.UpdateScore();
        }
    }
    
    /** Samdasu */
    /* Clear Stamp Mission */
    public ClearStampMission(mission:StampType) {
        /* Check Player Already Cleared */
        for(let i=0; i<this.player.samdasu.Stamps.Count; i++) {
            const stamp = this.player.samdasu.Stamps[i];
            if(stamp.name == mission) {
                if(stamp.isClear) { return; }
                else { break; }
            }
        }
        const data = new RoomData();
        const stamp = new RoomData();
        stamp.Add(SendName.name, mission);
        stamp.Add(SendName.isClear, true);
        data.Add(SendName.stamp, stamp.GetObject());
        this.room.Send(MESSAGE.Clear_Stamp, data.GetObject());
    }

    /* RenderState Change */
    public RenderModeToEditMode() { this.renderCameraController.RenderPhotoModeChangeToEdit(); }

    /* Get Alive Trash Count */
    public GetAliveTrashCount() {
        return this.trashManager.GetAliveCount();
    }
    /* Trash Game Play */
    public onTrashGamePlay() {
        this.trashManager.onTrashGamePlay();
    }

    /* Samdasu Visible */
    public onCreateStickerObject() {
        this.samdasuPetInWorld.transform.gameObject.SetActive(true);
    }

    /* Player Drink Samdasu */
    public onPlayerDrink() {
        if (!this.room || !this.room.IsConnected) return;
        if(!ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) return;

        /* Animator Check */
        const anim = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.ZepetoAnimator;
        if(anim.GetInteger(Anim.SamdasuState) != SamdasuState.Pick_Item) return;
        if(!SyncIndexManager.SamdasuPetInHand) return;

        /* Player Play Animation */
        this.StartCoroutine(this.DrinkSamdasu());
    }
    private * DrinkSamdasu() {
        /* Player Play Animation */
        const character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;
        const characterController = character.transform.GetComponent<CharacterController>();

        /* Controller OFF */
        this.LocalPlayerControllerSet(false);

        /* Player State Set */
        this.SetSamdasuState(SamdasuState.Samdasu_Drink, true);
        characterController.enabled = false;

        /* Player Stop Animation */
        yield new WaitForSeconds(3);

        /* Player State Set Return */
        this.SetSamdasuState(SamdasuState.Pick_Item, true, true);
        
        /* Controller ON */
        this.LocalPlayerControllerSet(true);
        characterController.enabled = true;

        /* Samdasu Drink Stamp Check */
        const waterStamp = SyncIndexManager.STAMPS.get(StampType.STAMP_WATER);
        if(!waterStamp.isClear) this.ClearStampMission(StampType.STAMP_WATER);
    }

    /* Check Land Half Stamp */
    private CheckLandStamp(halfStamp:LandStamp) {
        if(halfStamp == LandStamp.HALF_STAMP_MGR) this.halfStamp_MGR = true;
        else if(halfStamp == LandStamp.HALF_STAMP_WHEEL) this.halfStamp_Wheel = true;
        
        /* Samdasu Drink Stamp Check */
        const landStamp = SyncIndexManager.STAMPS.get(StampType.STAMP_LAND);
        if(!landStamp.isClear && this.halfStamp_MGR && this.halfStamp_Wheel) this.ClearStampMission(StampType.STAMP_LAND);
    }

    /* Player Ride Merry-Go-Round */
    private RideMerryGoRound(sessionId:string) {
        /* Get Teleport Target */
        const target:Transform = this.mgrManager.GetRideTarget(sessionId);
        if(target == null) return console.error(ERROR.ITS_FULL_PLAYERS);

        /* Character Teleport */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.Teleport(target.position, target.rotation);
        character.transform.SetParent(target);
        this.CharacterShadowVisibler(sessionId, true);

        /* Local Player */
        if(this.room.SessionId == sessionId) {
            /* Player State Set */
            this.SetSamdasuState(SamdasuState.Ride_MGR, true);
    
            /* Controller OFF */
            this.LocalPlayerControllerSet(false);
            const characterController = character.transform.GetComponent<CharacterController>();
            characterController.enabled = false;
    
            /* Local Player Ride Off UI */
            UIManager.instance.currentSamdasuState = MESSAGE.Ride_MGR;
        }
    }

    /* Player No Ride MerryGoRound */
    public RemoteRideOffMerryGoRound(sessionId:string) {
        if(this.room.SessionId == sessionId) {
            const data = new RoomData();
            data.Add(SendName.SamdasuState, MESSAGE.Ride_MGR);
            data.Add(SendName.isComplete, true);
            this.room.Send(MESSAGE.Ride_OFF, data.GetObject());
        }
    }

    /* Player No Ride MerryGoRound */
    private RideOffMerryGoRound(sessionId:string, isComplete:boolean) {
        if (!this.room || !this.room.IsConnected) return;
        if(!ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) return;

        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.currentSamdasuState = null;
        const result = this.mgrManager.RideOffPlayer(sessionId);

        /* Character Teleport */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.Teleport(this.mgrReturnPoint.position, Quaternion.identity);
        character.transform.SetParent(null);
        this.CharacterShadowVisibler(sessionId, true);

        /* Local Player */
        if(sessionId == this.room.SessionId) {
            /* Player State Set */
            this.SetSamdasuState(SamdasuState.Ride_MGR, false);
            
            /* Controller ON */
            this.LocalPlayerControllerSet(true);
            const characterController = character.transform.GetComponent<CharacterController>();
            characterController.enabled = true;
    
            /* Local Player Get Stamp */
            if(isComplete) {
                this.CheckLandStamp(LandStamp.HALF_STAMP_MGR);
            }
        }
    }

    /* MerryGoRound isPlay Control */
    public MGRisPlay(isPlay:boolean) {
        if (!this.room || !this.room.IsConnected) return;
        const data = new RoomData();
        data.Add(SendName.isPlay, isPlay);
        this.room.Send(MESSAGE.MGR_Play, data.GetObject());
    }

    /* Player Ride Wheel */
    private RideWheel(sessionId:string) {
        if (!this.room || !this.room.IsConnected) return;
        if(!ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) return;

        /* Character Teleport */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.Teleport(this.targetCarbin.position, Quaternion.identity);
        character.transform.SetParent(this.targetCarbin);
        this.CharacterShadowVisibler(sessionId, false);

        /* Local Player */
        if(this.room.SessionId == sessionId) {
            /* Player State Set */
            this.SetSamdasuState(SamdasuState.Ride_Wheel, true);
    
            /* Local Player Ride Off UI */
            UIManager.instance.currentSamdasuState = MESSAGE.Ride_Wheel;
        }

        // /* Carbin Invisible */
        // const mesh = target.parent.GetComponent<MeshRenderer>();
        // mesh.enabled = false;
    }

    /* Player No Ride Wheel */
    public RemoteRideOffWheel(zepetoCharacter:ZepetoCharacter) {
        // UIManager.instance.currentSamdasuState = null;
        // zepetoCharacter.transform.SetParent(null);
        // zepetoCharacter.Teleport(this.wheelReturnPoint.position, Quaternion.identity);

        const character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.gameObject;
        if(character == zepetoCharacter.gameObject) {
            const data = new RoomData();
            data.Add(SendName.SamdasuState, MESSAGE.Ride_Wheel);
            data.Add(SendName.isComplete, true);
            this.room.Send(MESSAGE.Ride_OFF, data.GetObject());
        }

        /* Player State Set */
        this.SetSamdasuState(SamdasuState.Ride_Wheel, false);
    }

    /* Player No Ride Wheel */
    private RideOffWheel(sessionId:string, isComplete:boolean) {
        if (!this.room || !this.room.IsConnected) return;
        if(!ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) return;

        /* Character Teleport */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.Teleport(this.wheelReturnPoint.position, Quaternion.identity);
        character.transform.SetParent(null);
        this.CharacterShadowVisibler(sessionId, true);
        
        /* Local Player */
        if(this.room.SessionId == sessionId) {
            /* Local Player Ride Off UI */
            UIManager.instance.currentSamdasuState = null;

            /* Local Player Get Stamp */
            if(isComplete) {
                this.CheckLandStamp(LandStamp.HALF_STAMP_WHEEL);
            }
        }
    }

    /* Player Ride ON Horse */
    private RideHorse(sessionId:string) {
        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.isHorseRide = true;

        this.CharacterShadowVisibler(sessionId, false);
        this.horseRideManager.RideHorse(sessionId, this.room.SessionId);
    }

    /* Player Ride OFF Horse */
    public RideOFFHorse(sessionId:string) {
        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.isHorseRide = false;

        this.CharacterShadowVisibler(sessionId, true);
        this.horseRideManager.RideOFFHorse(sessionId);
    }

    /* Character Shadow Visibler */
    public CharacterShadowVisibler(sessionId:string, visible:boolean) {
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character.transform;
        const shadow = character.GetChild(0).GetChild(2);
        shadow.gameObject.SetActive(visible);
    }

    /* Local Player Controller Set */
    public LocalPlayerControllerSet(isEnable:boolean) {
        const character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;
        if(!this.joyCon) this.joyCon = ZepetoPlayers.instance.gameObject.GetComponentInChildren<UIZepetoPlayerControl>();

        /* Controller OFF */
        if(isEnable) {
            this.joyCon.gameObject.SetActive(true);
            ZepetoPlayers.instance.controllerData.inputAsset.Enable();

        } else {
            this.joyCon.gameObject.SetActive(false);
            ZepetoPlayers.instance.controllerData.inputAsset.Disable();
        }
    }

    /** Local Player Animation **/
    /* Local Player Swim */
    public SetSamdasuState(samdasuState:SamdasuState, isPlay:boolean, isHold:boolean = false) {
        const animator = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.ZepetoAnimator;

        /* Stop Animation */
        const prevState = animator.GetInteger(Anim.SamdasuState);
        if(samdasuState == SamdasuState.NONE) {
            /* Animation Play */
            this.PlayAnimation(SamdasuState.NONE, false);
            animator.SetBool(Anim.isHold, false);
            SyncIndexManager.BalloonInHand = false;
            SyncIndexManager.SamdasuPetInHand = false;

            /* Unequip Pick Item */
            this.Unequip(HumanBodyBones.LeftHand, this.samdasuPetInWorld.name);
            this.Unequip(HumanBodyBones.RightHand, Datas.Balloon);
            UIManager.instance.UnequipButtonVisibler(UnequipButtonType.LeftHand, false);
            UIManager.instance.UnequipButtonVisibler(UnequipButtonType.RightHand, false);
    
            /* Horse Ride Button Visibler */
            UIManager.instance.HorseRideButtonVisibler(this.IsCanRide());
            return;
        }

        /* Stop Animation Check */
        if(!isPlay && prevState != samdasuState) return;
        console.log(`SetSamdasuState ${prevState} ${samdasuState} ${isPlay}`);
    
        animator.SetBool(Anim.isHold, isHold);
        if(samdasuState != SamdasuState.Samdasu_Drink && samdasuState != SamdasuState.Pick_Item) {
            /* Unequip Pick Item */
            if(SyncIndexManager.BalloonInHand) {
                SyncIndexManager.BalloonInHand = false;
                this.Unequip(HumanBodyBones.LeftHand, this.samdasuPetInWorld.name);
                UIManager.instance.UnequipButtonVisibler(UnequipButtonType.LeftHand, false);
            }
            if(SyncIndexManager.SamdasuPetInHand) {
                SyncIndexManager.SamdasuPetInHand = false;
                this.Unequip(HumanBodyBones.RightHand, Datas.Balloon);
                UIManager.instance.UnequipButtonVisibler(UnequipButtonType.RightHand, false);
            }
        }

        /* Animation Play */
        this.PlayAnimation(samdasuState, isPlay);

        /* Horse Ride Button Visibler */
        UIManager.instance.HorseRideButtonVisibler(this.IsCanRide());
    }

    /* Local Player Animation */
    private PlayAnimation(samdasuState:SamdasuState, isPlay:boolean) {
        const animator = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.ZepetoAnimator;
        
        /* Play Local Animaion */
        if(isPlay)  animator.SetInteger(Anim.SamdasuState, samdasuState);
        else        animator.SetInteger(Anim.SamdasuState, SamdasuState.NONE);
    }

    /* Unequip Pick Item */
    private Unequip(bone:HumanBodyBones, itemName:string) {
        const data = new RoomData();
        data.Add(SendName.attach, bone);
        data.Add(SendName.name, itemName);
        this.room.Send(MESSAGE.Unequip, data.GetObject());
    }

    /* Horse Ride Button Checker */
    private IsCanRide() {
        const animator = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.ZepetoAnimator;
        const samdasuState = animator.GetInteger(Anim.SamdasuState);
        
        /* Can Not Ride Horse List */
        const checkList:number[] = [
            SamdasuState.Ride_Wheel,
            SamdasuState.Ride_MGR,
            SamdasuState.Samdasu_Drink,
            SamdasuState.Swim,
        ];
        for(const checker of checkList) {
            if(checker == samdasuState) {
                return false;
            }
        }
        return true;
    }

    private * FlumeRide() {
        /* Send Ride Wait */
        const data = new RoomData();
        data.Add(SendName.NeedTo_wait, true);
        this.room.Send(MESSAGE.FlumeRide, data.GetObject());

        /* Player State Set */
        // this.SetSamdasuState(SamdasuState.Samdasu_Drink, true);

        /* Player Stop Animation */
        yield new WaitForSeconds(3);

        /* Player State Set Return */
        // this.SetSamdasuState(SamdasuState.Pick_Item, true, true);
        
        /* Send Ride Wait */
        const dataWait = new RoomData();
        dataWait.Add(SendName.NeedTo_wait, false);
        this.room.Send(MESSAGE.FlumeRide, dataWait.GetObject());
    }
}