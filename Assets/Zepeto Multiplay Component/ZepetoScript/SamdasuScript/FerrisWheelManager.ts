import { Animator, Quaternion, Time, Transform, Vector3 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import SyncIndexManager from '../Common/SyncIndexManager';
import { Datas } from '../Managers/TypeManager';
import TransformSyncHelper from '../Transform/TransformSyncHelper';

export default class FerrisWheelManager extends ZepetoScriptBehaviour {

    /* Ferris Wheel Property */
    @SerializeField() private rotateSpeed:number = 5;
    private cages: Transform[] = Array<Transform>();
    private isCageSet: boolean = false;

    /* Default Property */
    private m_tfHelper:TransformSyncHelper;
    
    private Start() {
        /* Default Init */
        this.m_tfHelper = this.GetComponent<TransformSyncHelper>();
        this.m_tfHelper.rotateSpeed = this.rotateSpeed;

        /* Ferris Wheel Init */
        for(let i=0; i<this.transform.childCount; i++) {
            const cabin = this.transform.GetChild(i).GetChild(0);
            if(cabin.name == Datas.Cabin) {
                cabin.name = `${Datas.Cabin}_${SyncIndexManager.Carbin_Id++}`;
                this.cages.push(cabin);
                this.isCageSet = true;
            }
        }
    }

    private FixedUpdate() {
        /* Ferris Wheel Cage Rotation Lock */
        if(this.isCageSet) {
            for(const cage of this.cages) {
                cage.eulerAngles = new Vector3(-90, 90, 0);
            }
        }

        /* Ferris Wheel Body Rotate */
        if(!this.m_tfHelper.isOwner) return;
        const x = (this.rotateSpeed * Time.deltaTime) % 360;
        this.transform.eulerAngles = new Vector3(
            this.transform.rotation.eulerAngles.x + x,
            this.transform.rotation.eulerAngles.y,
            this.transform.rotation.eulerAngles.z);
    }
}