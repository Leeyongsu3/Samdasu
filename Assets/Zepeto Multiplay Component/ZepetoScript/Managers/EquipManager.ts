import { Animator, GameObject, HumanBodyBones, Mathf, Random, Resources, Transform } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room } from 'ZEPETO.Multiplay';
import { EquipData } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from './GameManager';
import { Anim, Datas, MESSAGE, UnequipButtonType } from './TypeManager';
import UIManager from './UIManager';

export default class EquipManager extends ZepetoScriptBehaviour {

    /* Singleton */
    private static _instance: EquipManager = null;
    public static get instance(): EquipManager {
        if (this._instance === null) {
            this._instance = GameObject.FindObjectOfType<EquipManager>();
            if (this._instance === null) {
                this._instance = new GameObject(EquipManager.name).AddComponent<EquipManager>();
            }
        }
        return this._instance;
    }
    
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;

    /* Samdasu Field */
    @Header("Samdasus Field")
    @SerializeField() private cake: GameObject;
    @SerializeField() private balloons: GameObject[] = [];
    @SerializeField() private samdasuPet: GameObject;
    public get balloonsCount(): number { return this.balloons.length; }
    public GetBalloonsName(index:number): string { return this.balloons[index].name; }
    
    /* Singleton */
    private Awake() {
        if (EquipManager._instance !== null && EquipManager._instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            EquipManager._instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }
    }

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
            this.room.AddMessageHandler(MESSAGE.Equip, (equipData:EquipData) => {
                switch(equipData.itemName) {
                    case this.samdasuPet.name :
                        this.EquipSamdasu(equipData);
                        break;
                    case this.cake.name :
                        this.EquipCake(equipData);
                        break;
                    case Datas.Balloon :
                    case Datas.Balloon_A :
                    case Datas.Balloon_B :
                    case Datas.Balloon_C :
                        this.EquipBalloon(equipData);
                        // this.EquipItem(equipData);
                        break;
                }
            });

            this.room.AddMessageHandler(MESSAGE.EquipChange, (equipData:EquipData) => {
                if(!equipData.prevItemName) return;

                /* Equip */
                switch(equipData.itemName) {
                    case this.samdasuPet.name :
                        this.EquipSamdasu(equipData);
                        break;
                    case this.cake.name :
                        this.EquipCake(equipData);
                        break;
                    case Datas.Balloon :
                    case Datas.Balloon_A :
                    case Datas.Balloon_B :
                    case Datas.Balloon_C :
                        this.UnEquipItem(equipData);
                        this.EquipBalloon(equipData);
                        // this.EquipItem(equipData);
                        break;
                }
            });

            this.room.AddMessageHandler(MESSAGE.Unequip, (equipData:EquipData) => {
                if(!equipData.prevItemName) return;
                this.UnEquipItem(equipData);
            });
        }
        this.cake.name = Datas.Cake;
        this.samdasuPet.name = Datas.Samdasu;
    }
    
    /* Up Equip Item */
    private UnEquipItem(equipData:EquipData) {
        // if(equipData.prevItemName == this.cake.name) return;
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const prevBone = anim.GetBoneTransform(equipData.prevBone);
        const prevName = equipData.prevItemName;
        console.log(` UnEquipItem 2 ${prevName}`);
        for(const trans of prevBone.GetComponentsInChildren<Transform>()) {
            if(trans.name == prevName) {
                GameObject.Destroy(trans.gameObject);
                
                switch(equipData.itemName) {
                    case this.samdasuPet.name :
                        if(this.room.SessionId == equipData.sessionId) SyncIndexManager.SamdasuPetInHand = false; // isLocal
                        anim.SetBool(Anim.isHold, false);
                        break;
                    case this.cake.name :
                        if(this.room.SessionId == equipData.sessionId) SyncIndexManager.CakeInHead = false; // isLocal
                        break;
                    case Datas.Balloon :
                    case Datas.Balloon_A :
                    case Datas.Balloon_B :
                    case Datas.Balloon_C :
                        if(this.room.SessionId == equipData.sessionId) SyncIndexManager.BalloonInHand = false; // isLocal
                        break;
                }
            }
        }
    }
    
    // /* Equip Item */
    // private EquipItem(equipData:EquipData) {
    //     const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
    //     const bone = anim.GetBoneTransform(equipData.bone);
    //     const prefab = Resources.Load<GameObject>(equipData.itemName);
    //     const equip = GameObject.Instantiate(prefab, bone) as GameObject;
    //     equip.name = `${equipData.itemName}-${equipData.bone.toString()}`;
    // }

    /** Samdasu **/
    /* Player Equip Samdasu */
    private EquipSamdasu(equipData:EquipData) {
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(equipData.bone);
        const equip = GameObject.Instantiate(this.samdasuPet, bone) as GameObject;
        equip.name = equipData.itemName;
        if(this.room.SessionId == equipData.sessionId) SyncIndexManager.SamdasuPetInHand = true; // isLocal

        /* Animation */
        GameManager.instance.onPlayerDrink();

        /* Button Visible */
        if(this.room.SessionId == equipData.sessionId) UIManager.instance.UnequipButtonVisibler(UnequipButtonType.RightHand, true);
    }

    /* Player Equip Balloon */
    private EquipBalloon(equipData:EquipData) {
        for(const balloon of this.balloons) {
            if(balloon.name == equipData.itemName) {
                const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
                const bone = anim.GetBoneTransform(equipData.bone);
                const equip = GameObject.Instantiate(balloon, bone) as GameObject;
                equip.name = equipData.itemName;
                if(this.room.SessionId == equipData.sessionId) SyncIndexManager.BalloonInHand = true; // isLocal
                
                /* Button Visible */
                if(this.room.SessionId == equipData.sessionId) UIManager.instance.UnequipButtonVisibler(UnequipButtonType.LeftHand, true);
                break;
            }
        }
    }

    /* Player Equip 25 Cake */
    private EquipCake(equipData:EquipData) {
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(equipData.bone);
        const equip = GameObject.Instantiate(this.cake, bone) as GameObject;
        equip.name = equipData.itemName;
        if(this.room.SessionId == equipData.sessionId) SyncIndexManager.CakeInHead = true; // isLocal
                
        /* Button Visible */
        // if(this.room.SessionId == equipData.sessionId) UIManager.instance.UnequipButtonVisibler(UnequipButtonType.Head, true);
    }
}