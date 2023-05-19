import { Animator, BoxCollider, Camera, CharacterController, GameObject, HumanBodyBones, MeshRenderer, Quaternion, Transform, Vector3, WaitForSeconds } from 'UnityEngine';
import { UIZepetoPlayerControl, ZepetoCharacter, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import { Player } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import DOTWeenSyncHelper from '../DOTween/DOTWeenSyncHelper';
import PlayerSync from '../Player/PlayerSync';
import HorseRideManager from '../SamdasuScript/HorseRideManager';
import MGRManager from '../SamdasuScript/MGRManager';
import TrashManager from '../SamdasuScript/TrashManager';
import ChairSit from '../Sample Code/ChairSit';
import LookAt from '../Sample Code/LookAt';
import AnimatorSyncHelper from '../Transform/AnimatorSyncHelper';
import TransformSyncHelper from '../Transform/TransformSyncHelper';
import { Anim, ButtonType, Datas, LoadingType, MESSAGE, SamdasuState, SendName, StampType, SyncRide } from './TypeManager';
import UIManager from './UIManager';

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
    private player: Player;
    private joyCon:UIZepetoPlayerControl;

    /* TESET */
    private targetCarbin:Transform;
    /* TESET */

    /* Samdasu Field */
    @Header("Samdasus Field")
    @SerializeField() private trashFoolGroup: Transform;
    @SerializeField() private _horseRideManager: Transform;
    @SerializeField() private _trashManager: Transform;
    @SerializeField() private _mgrManager: Transform;
    private horseRideManager: HorseRideManager;
    private trashManager: TrashManager;
    private mgrManager: MGRManager;

    @SerializeField() private wheelReturnPoint: Transform;
    @SerializeField() private mgrReturnPoint: Transform;
    
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
            this.room.AddMessageHandler(MESSAGE.Add_Sticker, (message:any) => {
            });

            this.room.AddMessageHandler(MESSAGE.Add_Point, (message:any) => {
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
        this.doTWeenSyncs = GameObject.FindObjectsOfType<DOTWeenSyncHelper>();
        this.doTWeenSyncs.sort();
        for(const dot of this.doTWeenSyncs) {
            SyncIndexManager.SyncIndex++;
            dot.RemoteStart(SyncIndexManager.SyncIndex.toString());
        }

        /* Samdasu */
        const trashManager = this._trashManager.GetComponent<TrashManager>();
        if(trashManager) this.trashManager = trashManager;
        else this.trashManager = GameObject.FindObjectOfType<TrashManager>();
        this._trashManager = null;

        const mgrManager = this._mgrManager.GetComponent<MGRManager>();
        if(mgrManager) this.mgrManager = mgrManager;
        else this.mgrManager = GameObject.FindObjectOfType<MGRManager>();
        this._mgrManager = null;

        const horseRideManager = this._horseRideManager.GetComponent<HorseRideManager>();
        if(horseRideManager) this.horseRideManager = horseRideManager;
        else this.horseRideManager = GameObject.FindObjectOfType<HorseRideManager>();
        this._horseRideManager = null;
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

                    /* Stop Loading */
                    isLoading = false;
                    loadingUI.SetActive(false);
                    ZepetoPlayers.instance.controllerData.inputAsset.Enable();
                    this.StopCoroutine(this.StartLoading());
                }
            }
        }
    }

    /* Raycast Button Start */
    SwitchButtonScript(btn : Transform) {
        let serverSender = MESSAGE.LOG;
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
                serverSender = MESSAGE.ChairSit;
                this.room.Send(serverSender, data.GetObject());
                break;

            case ButtonType.Trash:
                target.SetParent(this.trashFoolGroup);
                target.position = this.trashFoolGroup.position;
                target.gameObject.SetActive(false);
                data.Add(SendName.Pick_Trash, true);
                serverSender = MESSAGE.Pick_Trash;
                this.room.Send(serverSender, data.GetObject());
                // Update UI
                UIManager.instance.UpdateCreaterNPCUI(this.trashManager.GetAliveCount());
                break;

            case ButtonType.Ride_Wheel:
                if(!target) return;
                this.targetCarbin = target;

                /* Carbin Invisible */
                // const mesh = target.parent.GetComponent<MeshRenderer>();
                // mesh.enabled = false;
                
                // const rideController = target.GetComponent<RideController>();
                // if(!rideController || rideController.SamdasuState == SamdasuState.NONE) return;
                serverSender = MESSAGE.Ride_Wheel;
                this.room.Send(serverSender, data.GetObject());
                break;

            case ButtonType.Ride_MGR:
                serverSender = MESSAGE.Ride_MGR;
                this.room.Send(serverSender, data.GetObject());
                break;

            case ButtonType.Samdasu_Pick:
                target.gameObject.SetActive(false);
                break;

            case ButtonType.Add_Horse:
            case ButtonType.Samdasu_Drink:
            case ButtonType.NPC_Trader:
                lookAt.NPCButtonActivate();
                break;

            case ButtonType.NPC_Creater:
                UIManager.instance.UpdateCreaterNPCUI(this.trashManager.GetAliveCount());
                lookAt.NPCButtonActivate();
                break;

            default :
                console.error(`타입이 설정되지 않은 버튼이 있습니다. ${btn.name}`)
                break;
        }
    }

    /* Player Sit Out */
    PlayerSitOut(chair: Transform, player: PlayerSync) {
        const chairSit = chair.GetComponent<ChairSit>();
        if(!chairSit) return;
        const data = new RoomData();
        data.Add(SendName.isSit, false);
        data.Add(SendName.chairId, chairSit.Id);
        this.room.Send(MESSAGE.ChairSit, data.GetObject());
    }

    /* Get Local Player */
    public SetLocalPlayer(player:Player) {
        this.player = player;
        UIManager.instance.SetStampUI(this.player.samdasu.Stamps);
        UIManager.instance.SetStickerUI(this.player.samdasu.Stickers);
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

    /* Trash Game Play */
    public onTrashGamePlay() {
        console.log(` >>>>>>>>>>>>> onTrashGamePlay in GameManger `);
        this.trashManager.onTrashGamePlay();
    }

    /* Player Drink Samdasu */
    public onPlayerDrink() {
        if (!this.room || !this.room.IsConnected) return;
        if(!ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) return;

        /* Animator Check */
        // const anim = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.ZepetoAnimator;
        // if(anim.GetInteger("SamdasuState") != SamdasuState.NONE) return;

        /* Player Play Animation */
        this.StartCoroutine(this.DrinkSamdasu());
    }
    private * DrinkSamdasu() {
        /* Player Play Animation */
        const character = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character;
        const characterController = character.transform.GetComponent<CharacterController>();
        if(!this.joyCon) this.joyCon = ZepetoPlayers.instance.gameObject.GetComponentInChildren<UIZepetoPlayerControl>();

        /* Controller OFF */
        this.joyCon.gameObject.SetActive(false);
        ZepetoPlayers.instance.controllerData.inputAsset.Disable();
        this.Drink(true);
        characterController.enabled = false;
        
        /* Samdasu in the Hand */
        // if(!this.samdasuPetClone) this.samdasuPetClone = GameObject.Instantiate<GameObject>(this.samdasuPet);
        // const data = new RoomData();
        // data.Add("name", this.samdasuPetClone.name); 
        // data.Add("attach", HumanBodyBones.RightHand);
        // this.room.Send("Equip", data.GetObject());

        /* Player Stop Animation */
        yield new WaitForSeconds(0.1);
        this.Drink(false);
        yield new WaitForSeconds(3);
        
        /* Controller ON */
        this.joyCon.gameObject.SetActive(true);
        ZepetoPlayers.instance.controllerData.inputAsset.Enable();
        characterController.enabled = true;
        // destory samdasu in the hand

        /* Samdasu Drink Stamp */
        this.ClearStampMission(StampType.STAMP_WATER);
    }

    /* Player Ride Merry-Go-Round */
    private RideMerryGoRound(sessionId:string) {
        /* Get Teleport Target */
        const target:Transform = this.mgrManager.GetRideTarget(sessionId);
        if(target == null) return; // It's Full...

        /* Character Teleport */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.Teleport(target.position, target.rotation);
        character.transform.SetParent(target);
        this.CharacterShadowVisibler(sessionId, true);
        this.MGR(true);

        /* Controller OFF */
        if(!this.joyCon) this.joyCon = ZepetoPlayers.instance.gameObject.GetComponentInChildren<UIZepetoPlayerControl>();
        this.joyCon.gameObject.SetActive(false);
        const characterController = character.transform.GetComponent<CharacterController>();
        ZepetoPlayers.instance.controllerData.inputAsset.Disable();
        characterController.enabled = false;

        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.currentSamdasuState = MESSAGE.Ride_MGR;
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
        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.currentSamdasuState = null;
        const result = this.mgrManager.RideOffPlayer(sessionId);

        if (!this.room || !this.room.IsConnected) return;
        if(!ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) return;

        /* Character Teleport */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.Teleport(this.mgrReturnPoint.position, Quaternion.identity);
        character.transform.SetParent(null);
        this.CharacterShadowVisibler(sessionId, true);
        this.MGR(false);
        
        /* Controller ON */
        if(!this.joyCon) this.joyCon = ZepetoPlayers.instance.gameObject.GetComponentInChildren<UIZepetoPlayerControl>();
        this.joyCon.gameObject.SetActive(true);
        const characterController = character.transform.GetComponent<CharacterController>();
        ZepetoPlayers.instance.controllerData.inputAsset.Enable();
        characterController.enabled = true;

        /* Local Player Get Stamp */
        if(sessionId == this.room.SessionId && isComplete) {
            this.ClearStampMission(StampType.STAMP_MGR);
        }
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
        this.Wheel(true);

        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.currentSamdasuState = MESSAGE.Ride_Wheel;

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
        this.Wheel(false);
    }

    /* Player No Ride Wheel */
    private RideOffWheel(sessionId:string, isComplete:boolean) {
        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.currentSamdasuState = null;

        if (!this.room || !this.room.IsConnected) return;
        if(!ZepetoPlayers.instance.HasPlayer(this.room.SessionId)) return;

        /* Character Teleport */
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character;
        character.Teleport(this.wheelReturnPoint.position, Quaternion.identity);
        character.transform.SetParent(null);
        this.CharacterShadowVisibler(sessionId, true);

        console.log(isComplete);
        
        /* Local Player Get Stamp */
        if(sessionId == this.room.SessionId && isComplete) {
            this.ClearStampMission(StampType.STAMP_WHEEL);
        }
    }

    /* Player Ride ON Horse */
    private RideHorse(sessionId:string) {
        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.isHorseRide = true;

        this.CharacterShadowVisibler(sessionId, false);
        this.horseRideManager.RideHorse(sessionId);
    }

    /* Player Ride OFF Horse */
    public RideOFFHorse(sessionId:string) {
        /* Local Player Ride Off UI */
        if(this.room.SessionId == sessionId) UIManager.instance.isHorseRide = false;

        this.CharacterShadowVisibler(sessionId, true);
        this.horseRideManager.RideOFFHorse(sessionId);
    }

    /* Character Shadow Visibler */
    private CharacterShadowVisibler(sessionId:string, visible:boolean) {
        const character = ZepetoPlayers.instance.GetPlayer(sessionId).character.transform;
        const shadow = character.GetChild(0).GetChild(2);
        shadow.gameObject.SetActive(visible);
    }

    /** Local Player Animation **/
    /* Local Player Swim */
    public Swim(isSwim:boolean) { this.PlayAnimation(isSwim, SamdasuState.Swim); }
    public MGR(isDrink:boolean) { this.PlayAnimation(isDrink, SamdasuState.Ride_MGR); }
    public Ride(isRide:boolean) { this.PlayAnimation(isRide, SamdasuState.Ride_Horse); }
    public Drink(isDrink:boolean) { this.PlayAnimation(isDrink, SamdasuState.Samdasu_Drink); }
    public Wheel(isFerrisWheel:boolean) { this.PlayAnimation(isFerrisWheel, SamdasuState.Ride_Wheel); }

    /* Local Player Animation */
    private PlayAnimation(isPlay:boolean, samdasuState:SamdasuState = 0) {
        const animator = ZepetoPlayers.instance.GetPlayer(this.room.SessionId).character.ZepetoAnimator;
        if(isPlay) {
            animator.SetInteger(Anim.SamdasuState, samdasuState);
        } else {
            animator.SetInteger(Anim.SamdasuState, SamdasuState.NONE);
        }
    }
}