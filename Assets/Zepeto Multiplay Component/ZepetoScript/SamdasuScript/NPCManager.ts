import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { SpawnInfo, ZepetoCharacter, ZepetoCharacterCreator } from 'ZEPETO.Character.Controller';
import { Transform } from 'UnityEngine';
import { Anim, Datas } from '../Managers/TypeManager';
  
export default class NPCManager extends ZepetoScriptBehaviour {
  
    /* Properties */
    @SerializeField() private npcPosisions: Transform[] = [];
    private npcs: ZepetoCharacter[] = [];

    /* GameManager */
    public RemoteStart() {
        this.SpanwNPC();
    }

    /* Create NPC */
    private SpanwNPC() {
        for(const pos of this.npcPosisions) {
            const spawnInfo = new SpawnInfo();
            spawnInfo.position = pos.position;
            spawnInfo.rotation = pos.rotation;
            
            /* Create and Init NPC */
            ZepetoCharacterCreator.CreateByZepetoId(Datas.kuaId, spawnInfo, (character: ZepetoCharacter) => {
                this.npcs.push(character);
                const animator = character.ZepetoAnimator;
                animator.SetBool(Anim.isNPC, true);
            })
        }
    }
}