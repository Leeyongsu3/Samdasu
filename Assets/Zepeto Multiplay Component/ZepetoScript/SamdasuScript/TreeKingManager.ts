import { Color, GameObject, Material, Mathf, Time } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TreeKingManager extends ZepetoScriptBehaviour {

    /* Samdasu Field */
    @Header("Samdasus Field")
    @SerializeField() private changeTargets: GameObject[] = [];
    @SerializeField() private transferMaterials: Material[] = [];
    @SerializeField() private readonly timeCycle: number = 10
    @SerializeField() private readonly visibleTime: number = 10
    private changeState:number = 0;
    private timer:number = 0;
    private timerM:number = 0;
    private changeStart: boolean = false;


    /* Change Properties */
    private currentObject:GameObject;
    private nextObject:GameObject;
    private currentMaterial:Material;
    private nextMaterial:Material;
    private visible:Color;
    private invisible:Color;

    /* GameManager */
    public RemoteStart() {
        this.visible = Color.white;
        this.invisible = Color.white;
        this.invisible.a = 0;
        for(const mat of this.transferMaterials) {
            mat.color = this.invisible;
        }
        this.transferMaterials[this.changeState].color = this.visible;
        this.changeStart = true;
    }
    
    FixedUpdate() {
        if(!this.changeStart) return;
        this.SetObject();
        this.Change();
    }

    /* State Changer */
    private SetObject() {
        const state = this.changeState;
        this.currentObject = this.changeTargets[state];
        this.nextObject = this.changeTargets[(state+1) % this.changeTargets.length];
        this.currentMaterial = this.transferMaterials[state];
        this.nextMaterial = this.transferMaterials[(state+1) % this.changeTargets.length];
    }

    /* Color Changer */
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