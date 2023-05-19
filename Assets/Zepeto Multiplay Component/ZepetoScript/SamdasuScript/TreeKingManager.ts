import { Color, GameObject, Material, Mathf, Time } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { OrangeChangeState } from '../Managers/TypeManager';

export default class TreeKingManager extends ZepetoScriptBehaviour {

    /* Samdasu Field */
    @Header("Samdasus Field")
    @SerializeField() private changeTargets: GameObject[] = [];
    @SerializeField() private transferMaterials: Material[] = [];
    @SerializeField() private readonly timeCycle: number = 10
    @SerializeField() private readonly visibleTime: number = 10
    private changeState:OrangeChangeState = OrangeChangeState.Level_1;
    private timer:number = 0;
    private timerM:number = 0;

    /* Change Properties */
    private currentObject:GameObject;
    private nextObject:GameObject;
    private currentMaterial:Material;
    private nextMaterial:Material;
    private visible:Color;
    private invisible:Color;

    Start() {
        this.visible = Color.white;
        this.invisible = Color.white;
        this.invisible.a = 0;
    }
    
    FixedUpdate() {
        this.SetObject();
        this.Change();
    }

    private SetObject() {
        const state = this.changeState as number;
        this.currentObject = this.changeTargets[state];
        this.nextObject = this.changeTargets[(state+1) % this.changeTargets.length];
        this.currentMaterial = this.transferMaterials[state];
        this.nextMaterial = this.transferMaterials[(state+1) % this.changeTargets.length];
    }

    private Change() {
        this.timer += Time.deltaTime;
        if(this.timeCycle < this.timer) {
            this.nextObject.SetActive(true);
            this.timerM += Time.deltaTime / this.visibleTime;
            this.currentMaterial.color = Color.Lerp(this.currentMaterial.color, this.invisible, this.timerM);
            this.nextMaterial.color = Color.Lerp(this.nextMaterial.color, this.visible, this.timerM);
            if(this.currentMaterial.color.a < 0.005) {
                this.timer = 0;
                this.timerM = 0;
                this.currentObject.SetActive(false);
                this.changeState = (this.changeState+1) % this.changeTargets.length;
            }
        }
    }
}