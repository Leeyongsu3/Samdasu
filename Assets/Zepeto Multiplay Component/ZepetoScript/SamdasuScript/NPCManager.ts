import { ZepetoScriptBehaviour } from 'ZEPETO.Script';
import { SpawnInfo, ZepetoCharacter, ZepetoCharacterCreator } from 'ZEPETO.Character.Controller';
  
export default class NPCManager extends ZepetoScriptBehaviour {
  
    // ZEPETO ID of the NPC
    public zepetoId: string;
    // NPC character object
    private _npc: ZepetoCharacter;
  
    Start() {
        // Create a new instance of SpawnInfo and set its position and rotation based on the object's transform
        const spawnInfo = new SpawnInfo();
        spawnInfo.position = this.transform.position;
        spawnInfo.rotation = this.transform.rotation;
  
        // Use ZepetoCharacterCreator to create a new character by Zepeto ID and assign it to _npc variable
        ZepetoCharacterCreator.CreateByZepetoId(this.zepetoId, spawnInfo, (character: ZepetoCharacter) => {
            this._npc = character;
        })
    }
}