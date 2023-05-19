import { Animator, GameObject, HumanBodyBones, Resources, Transform } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { Room } from 'ZEPETO.Multiplay';
import { EquipData } from 'ZEPETO.Multiplay.Schema';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import { MESSAGE } from './TypeManager';

export default class EquipManager extends ZepetoScriptBehaviour {
    
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;

    /* Samdasu Field */
    @Header("Samdasus Field")
    @SerializeField() private samdasuPetInWorld: GameObject;

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
            this.room.AddMessageHandler(MESSAGE.Equip, (equipData:EquipData) => {
                if(equipData.itemName == this.samdasuPetInWorld.name) {
                    this.EquipSamdasu(equipData);
                } else {
                    this.EquipItem(equipData);
                }
            });

            this.room.AddMessageHandler(MESSAGE.EquipChange, (equipData:EquipData) => {
                if(!equipData.prevItemName) return;
                this.UnEquipItem(equipData);
                if(equipData.itemName == this.samdasuPetInWorld.name) {
                    this.EquipSamdasu(equipData);
                } else {
                    this.EquipItem(equipData);
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
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(equipData.bone);
         const prevName = `${equipData.prevItemName}-${equipData.bone.toString()}`;
        for(const trans of bone.GetComponentsInChildren<Transform>()) {
            if(trans.name == prevName) {
                GameObject.Destroy(trans.gameObject);
            }
        }
    }
    
    /* Equip Item */
    private EquipItem(equipData:EquipData) {
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(equipData.bone);
        const prefab = Resources.Load<GameObject>(equipData.itemName);
        const equip = GameObject.Instantiate(prefab, bone) as GameObject;
        equip.name = `${equipData.itemName}-${equipData.bone.toString()}`;
    }

    /** Samdasu **/
    /* Player Equip Samdasu */
    private EquipSamdasu(equipData:EquipData) {
        const anim:Animator = ZepetoPlayers.instance.GetPlayer(equipData.sessionId).character.ZepetoAnimator;
        const bone = anim.GetBoneTransform(equipData.bone);
        const equip = GameObject.Instantiate(this.samdasuPetInWorld, bone) as GameObject;
        equip.name = `${equipData.itemName}-${equipData.bone.toString()}`;
    }
}