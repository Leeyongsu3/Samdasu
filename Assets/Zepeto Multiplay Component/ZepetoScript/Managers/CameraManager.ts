import { Camera, GameObject, Input, LayerMask, Mathf, Physics, Quaternion, RaycastHit, Transform, Vector3 } from 'UnityEngine';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from './GameManager';
import { CameraMode, Datas } from './TypeManager';

export default class CameraManager extends ZepetoScriptBehaviour {

    /* Properties */
    private layer_btn : number;
    public multiplay : ZepetoWorldMultiplay;
    private hitValue: GameObject; 

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();

        this.layer_btn = 1 << LayerMask.NameToLayer(Datas.Button); // Layer 6
        
    }

    /* Raycasting */
    Update() {
        if (this.multiplay.Room != null && this.multiplay.Room.IsConnected) {
            const hasPlayer = ZepetoPlayers.instance.HasPlayer(this.multiplay.Room.SessionId);
            if (hasPlayer) {
                this.Raycasting();
                if(SyncIndexManager.CameraMode == CameraMode.FPS) {
                    //// camera to character
                    // const character = ZepetoPlayers.instance.GetPlayer(this.multiplay.Room.SessionId).character.transform;
                    // const lookAxisRot = Quaternion.LookRotation(this.transform.parent.forward);
                    // const projRot = Vector3.ProjectOnPlane(lookAxisRot.eulerAngles, Vector3.right);
                    // character.rotation = Quaternion.Euler(projRot);
                    
                    //// character to camera
                    // const character = ZepetoPlayers.instance.GetPlayer(this.multiplay.Room.SessionId).character.transform;
                    // const lookAxisRot = Quaternion.LookRotation(character.forward);
                    // const projRot = Vector3.ProjectOnPlane(lookAxisRot.eulerAngles, Vector3.right);
                    // this.transform.parent.rotation = Quaternion.Euler(projRot);
                }
            }
        }
    }

    Raycasting() {
        // iphone 이슈
        // 아이폰은 왠지는 모르겟지만
        // ButtonUp일때 ButtonDown과 Button를 무시한다
        // 빈 공간에 터치 후에 드래그상태에서 버튼 위에서 ButtonUp을 할 때만 작동된다!!!!
        if(Input.GetMouseButtonDown(0)) {
            // console.log(`Input Down`);
            
            const ray = ZepetoPlayers.instance.ZepetoCamera.camera.ScreenPointToRay(Input.mousePosition);
            const hitInfo = $ref<RaycastHit>();
            if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_btn)) {
                this.hitValue = hitInfo.value.transform.gameObject;
            } else {
                this.hitValue = null;
            }

        // } else if(Input.GetMouseButton(0)) {
        //     console.log(`Input BUTTON !!!`);

        } else if(this.hitValue && Input.GetMouseButtonUp(0)) {
            // console.log(`Input Up`);
            const ray = ZepetoPlayers.instance.ZepetoCamera.camera.ScreenPointToRay(Input.mousePosition);
            const hitInfo = $ref<RaycastHit>();
            // console.log(`Input Up 0 ${this.hitValue} ${hitInfo.value} `);
            if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_btn)) {
                // console.log(`Input Up 1 ${this.hitValue} ${hitInfo.value.transform.gameObject} ${this.hitValue == hitInfo.value.transform.gameObject}`);
                if(this.hitValue == hitInfo.value.transform.gameObject) {
                    // console.log(`Input Up 2`);
                    GameManager.instance.SwitchButtonScript(hitInfo.value.transform);
                }
            }
            this.hitValue = null;
        }
        // if(Input.GetMouseButtonUp(0)) {
        //     console.log(`Input Up`);
        //     const ray = ZepetoPlayers.instance.ZepetoCamera.camera.ScreenPointToRay(Input.mousePosition);
        //     const hitInfo = $ref<RaycastHit>();
        //     if(Physics.SphereCast(ray, 0.5, hitInfo, Mathf.Infinity, this.layer_btn)) {
        //         console.log(`Input Up`);
        //         GameManager.instance.SwitchButtonScript(hitInfo.value.transform);
        //     }
        // }
    }
}