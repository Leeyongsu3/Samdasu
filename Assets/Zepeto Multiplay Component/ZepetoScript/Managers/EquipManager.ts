import { Animator, GameObject, HumanBodyBones, Mathf, Random, Resources, Transform } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room } from 'ZEPETO.Multiplay';
import { EquipData } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from './GameManager';
import { Datas, MESSAGE } from './TypeManager';

export default class EquipManager extends ZepetoScriptBehaviour {
    
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;

    /* Samdasu Field */
    @Header("Samdasus Field")
    @SerializeField() private cake: GameObject;
    @SerializeField() private balloons: GameObject[] = [];
    @SerializeField() private samdasuPet: GameObject;

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
    }
    
    /* Up Equip Item */
    private UnEquipItem(equipData:EquipData) {
        if(equipData.prevItemName == this.cake.name) return;
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const prevBone = anim.GetBoneTransform(equipData.prevBone);
        const prevName = equipData.prevItemName;
        console.log(` UnEquipItem 2 ${prevName}`);
        for(const trans of prevBone.GetComponentsInChildren<Transform>()) {
            if(trans.name == prevName) {
                GameObject.Destroy(trans.gameObject);

                
                switch(equipData.itemName) {
                    case this.samdasuPet.name :
                        SyncIndexManager.SamdasuPetInHand = false;
                        break;
                    case this.cake.name :
                        SyncIndexManager.CakeInHead = false;
                        break;
                    case Datas.Balloon :
                        SyncIndexManager.BalloonInHand = false;
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
        SyncIndexManager.SamdasuPetInHand = true;

        /* Animation */
        GameManager.instance.onPlayerDrink();
    }

    /* Player Equip Balloon */
    private EquipBalloon(equipData:EquipData) {
        const index = Mathf.Floor(Random.Range(0, this.balloons.length));
        const balloon = this.balloons[index];

        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(equipData.bone);
        const equip = GameObject.Instantiate(balloon, bone) as GameObject;
        equip.name = equipData.itemName;
        SyncIndexManager.BalloonInHand = true;
    }

    /* Player Equip 25 Cake */
    private EquipCake(equipData:EquipData) {
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(equipData.bone);
        const equip = GameObject.Instantiate(this.cake, bone) as GameObject;
        equip.name = equipData.itemName;
        SyncIndexManager.CakeInHead = true;
    }
}