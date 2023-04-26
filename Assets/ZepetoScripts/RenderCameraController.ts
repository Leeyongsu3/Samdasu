import { Camera, GameObject } from 'UnityEngine';
import { Button } from 'UnityEngine.UI';
import { UIZepetoPlayerControl, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class RenderCameraController extends ZepetoScriptBehaviour {

    /* Controller Property */
    @SerializeField() private renderEditCamera: Camera;
    @SerializeField() private renderTextureCamera: Camera;
    @SerializeField() private renderButton: Button;
    @SerializeField() private mainCanvas: GameObject;
    @SerializeField() private screenShotPrefab: GameObject;
    private renderChange: RenderMode = RenderMode.Default;
    private controller:GameObject;

    Start() {
        if(this.renderButton) {
            this.renderButton.onClick.AddListener(() => {
                switch(+this.renderChange) {
                    case RenderMode.Default: // to Edit mode
                        console.log(`Current : Render Default`);
                        ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(false);
                        console.log(`Render Default to Render Edit Mode...... 1`);
                        this.renderEditCamera.gameObject.SetActive(true);
                        console.log(`Render Default to Render Edit Mode...... 2`);
                        this.screenShotPrefab.SetActive(false);
                        console.log(`Render Default to Render Edit Mode...... 3`);
                        this.mainCanvas.SetActive(false);
                        console.log(`Render Default to Render Edit Mode...... 4`);
                        this.renderChange = RenderMode.Edit_Mode;
                        console.log(`Render Default to Render Edit Mode...... 5`);
                        this.ControllerSet(false);
                        console.log(`Change to Render Edit Mode`);
                        break;

                    case RenderMode.Edit_Mode: // to Image mode
                        console.log(`Current : Render Edit Mode`);
                        ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(true);
                        console.log(`Render Edit Mode to Render Image Mode...... 1`);
                        this.renderTextureCamera.gameObject.SetActive(true);
                        console.log(`Render Edit Mode to Render Image Mode...... 2`);
                        this.renderEditCamera.gameObject.SetActive(false);
                        console.log(`Render Edit Mode to Render Image Mode...... 3`);
                        this.screenShotPrefab.SetActive(false);
                        console.log(`Render Edit Mode to Render Image Mode...... 4`);
                        this.mainCanvas.SetActive(false);
                        console.log(`Render Edit Mode to Render Image Mode...... 5`);
                        this.renderChange = RenderMode.Image_Mode;
                        console.log(`Render Edit Mode to Render Image Mode...... 6`);
                        this.ControllerSet(false);
                        console.log(`Change to Render Image Mode`);
                        break;

                    case RenderMode.Image_Mode: // to Default
                        console.log(`Current : Render Image Mode`);
                        ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(true);
                        console.log(`Render Image Mode to Render Default...... 1`);
                        this.renderTextureCamera.gameObject.SetActive(false);
                        console.log(`Render Image Mode to Render Default...... 2`);
                        this.renderEditCamera.gameObject.SetActive(false);
                        console.log(`Render Image Mode to Render Default...... 3`);
                        this.screenShotPrefab.SetActive(true);
                        console.log(`Render Image Mode to Render Default...... 4`);
                        this.mainCanvas.SetActive(true);
                        console.log(`Render Image Mode to Render Default...... 5`);
                        this.renderChange = RenderMode.Default;
                        console.log(`Render Image Mode to Render Default...... 6`);
                        this.ControllerSet(true);
                        console.log(`Change to Render Default`);
                        break;
                }
            });
        }
        console.log(this.screenShotPrefab.activeSelf);
        
    }

    /* Controller Set */
    private ControllerSet(controlable:boolean) {
        if(!this.controller) {
            const controller = ZepetoPlayers.instance.gameObject.GetComponentInChildren<UIZepetoPlayerControl>();
            this.controller = controller.gameObject;
        }
        this.controller.gameObject.SetActive(controlable);
        // if(controlable) {
        //     this.controller.gameObject.SetActive(controlable);
        // } else {
        //     this.controller.gameObject.SetActive(controlable);
        // }
    }
}

export enum RenderMode {
    Default, Edit_Mode, Image_Mode,
}