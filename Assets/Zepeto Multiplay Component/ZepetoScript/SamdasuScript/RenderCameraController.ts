import { Camera, Color, GameObject, Mathf, Quaternion, RenderTexture, Transform, Vector3, WaitForEndOfFrame, YieldInstruction } from 'UnityEngine';
import { Button, Image, Text } from 'UnityEngine.UI';
import { UIZepetoPlayerControl, ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldContent } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager from '../Managers/GameManager';
import { ButtonInfo, RenderPhotoMode, StampType, TOAST_MESSAGE } from '../Managers/TypeManager';
import UIManager from '../Managers/UIManager';

export default class RenderCameraController extends ZepetoScriptBehaviour {

    /* Controller Properties */
    @Header("Init Field")
    @SerializeField() private renderButton: Button;
    @SerializeField() private stickerPool: Transform;

    @Header("Default Mode")
    @SerializeField() private mainCanvas: GameObject;
    // @SerializeField() private screenShotPrefab: GameObject;

    @Header("Edit Mode")
    @SerializeField() private renderEditCamera: Camera;
    @SerializeField() private editCanvas: GameObject;
    @SerializeField() private editRenderCanvas: GameObject;
    @SerializeField() private stickerButtons: Button[] = [];
    @SerializeField() private stickerPrefabs: GameObject[] = [];
    private stickerButtonInfos: ButtonInfo[] = [];

    @Header("Result Mode")
    @SerializeField() private renderTextureCamera: Camera;
    @SerializeField() private renderTexture: RenderTexture;
    @SerializeField() private resultCanvas: GameObject;
    @SerializeField() private feedMessage: string;
    @SerializeField() private toastSuccessMessage: GameObject;
    @SerializeField() private toastErrorMessage: GameObject;
    
    private renderState: RenderPhotoMode = RenderPhotoMode.Default;
    private controller: GameObject;
    private wait: YieldInstruction;

    Start() {
        this.stickerPool.gameObject.SetActive(false);
        
        // TEST
        if(this.renderButton) {
            this.renderButton.onClick.AddListener(() => this.RenderPhotoModeChanger(RenderPhotoMode.Edit_Mode));
        }
        
        /* Set Sticker Button */
        for(let i=0; i<this.stickerButtons.length; i++) {
            const btn = this.stickerButtons[i];
            const item = this.stickerPrefabs[i];
            const info:ButtonInfo = {
                button:btn,
                count:0,
                countText:btn.GetComponentInChildren<Text>(),
                countImage:btn.transform.GetChild(0).GetComponent<Image>(),
                instances:[],
            };
            this.stickerButtonInfos.push(info);
            btn.onClick.AddListener(() => this.GetStickerObject(item, info));
        }

        /* Set UI Init */
        this.SetTextureCanvas();
        this.SetEditCanvas();
    }

    /* Render Mode Changer */
    private RenderPhotoModeChanger(renderChange:RenderPhotoMode) {
        console.log(`Current : ${this.renderState}`);
        switch(+renderChange) {
            case RenderPhotoMode.Edit_Mode:
                ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(false);
                this.renderEditCamera.gameObject.SetActive(true);
                this.mainCanvas.SetActive(false);
                this.editCanvas.SetActive(true);
                this.resultCanvas.SetActive(false);
                this.ControllerSet(false);
                this.InfoDataUpdate();
                console.log(`Change to Render Edit Mode`);
                break;

            case RenderPhotoMode.Result_Mode:
                ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(false);
                this.renderEditCamera.gameObject.SetActive(true);
                this.TakeStickerScreen();
                this.mainCanvas.SetActive(false);
                this.editCanvas.SetActive(false);
                this.resultCanvas.SetActive(true);
                this.ControllerSet(false);
                this.InfoDataUpdate();
                console.log(`Change to Render Texure Mode`);
                break;
                
            default: // to Default
                ZepetoPlayers.instance.ZepetoCamera.gameObject.SetActive(true);
                this.renderEditCamera.gameObject.SetActive(false);
                this.mainCanvas.SetActive(true);
                this.editCanvas.SetActive(false);
                this.resultCanvas.SetActive(false);
                this.ControllerSet(true);
                this.InfoDataUpdate();
                for(const info of this.stickerButtonInfos) {
                    this.ReturnAllInstantiateSticker(info);
                }
                this.renderState = RenderPhotoMode.Default;
                console.log(`Change to Default`);
                break;
        }
    }

    /* Set Texture Canvas */
    private SetTextureCanvas() {
        /* Buttons */
        const resultPanel = this.resultCanvas.transform.GetChild(1);
        const saveButton = resultPanel.GetChild(0).GetChild(0).GetComponent<Button>();
        const shareButton = resultPanel.GetChild(0).GetChild(1).GetComponent<Button>();
        const feedButton = resultPanel.GetChild(0).GetChild(2).GetComponent<Button>();
        const exitButton = resultPanel.GetChild(1).GetComponent<Button>();
        const returnButton = resultPanel.GetChild(2).GetComponent<Button>();

        /* Button Scripts */
        saveButton.onClick.AddListener(() => {
            ZepetoWorldContent.SaveToCameraRoll(this.renderTexture, (result: boolean) => { console.log(`${result}`) });
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.screenShotSaveCompleted));
        });

        shareButton.onClick.AddListener(() => {
            ZepetoWorldContent.Share(this.renderTexture, (result: boolean) => { console.log(`${result}`) });
        });

        feedButton.onClick.AddListener(() => {
            ZepetoWorldContent.CreateFeed(this.renderTexture, this.feedMessage, (result: boolean) => {
                if (result) {
                    feedButton.gameObject.SetActive(false);
                    this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedCompleted));
                } else {
                    this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedFailed));
                }
            });
            this.StartCoroutine(this.ShowToastMessage(TOAST_MESSAGE.feedUploading));
        });

        exitButton.onClick.AddListener(() => {
            this.RenderPhotoModeChanger(RenderPhotoMode.Default);
        });

        returnButton.onClick.AddListener(() => {
            this.RenderPhotoModeChanger(RenderPhotoMode.Edit_Mode);
        });
    }

    /* Set Edit Canvas */
    private SetEditCanvas() {
        /* Buttons */
        const controlPanel = this.editCanvas.transform.GetChild(1);
        const exitButton = controlPanel.GetChild(0).GetComponent<Button>();
        const renderButton = controlPanel.GetChild(1).GetComponent<Button>();
        const clearButton = controlPanel.GetChild(2).GetComponent<Button>();
        const resetButton = controlPanel.GetChild(3).GetComponent<Button>();
        const removeButton = controlPanel.GetChild(4).GetComponent<Button>();

        /* Button Scripts */
        exitButton.onClick.AddListener(() => {
            this.RenderPhotoModeChanger(RenderPhotoMode.Default);
        });

        renderButton.onClick.AddListener(() => {
            this.RenderPhotoModeChanger(RenderPhotoMode.Result_Mode);
        });

        clearButton.onClick.AddListener(() => {
            for(const info of this.stickerButtonInfos) {
                this.ReturnAllInstantiateSticker(info);
            }
        });

        resetButton.onClick.AddListener(() => {
            // NEED ITEM
            const item:GameObject = null;
            item.transform.localScale = Vector3.one;
            item.transform.rotation = Quaternion.identity;
        });

        removeButton.onClick.AddListener(() => {
            // NEED ITEM AND INFO
            const item:GameObject = null;
            this.ReturnInstantiateSticker(item);
        });
    }

    /* Toast */
    private * ShowToastMessage(text: string) {
        const resultPanel = this.resultCanvas.transform.GetChild(1);
        yield this.wait;

        const originObject = text == TOAST_MESSAGE.feedFailed ? this.toastErrorMessage : this.toastSuccessMessage;
        const toastMessage = GameObject.Instantiate<GameObject>(originObject);
        toastMessage.transform.SetParent(resultPanel);
        toastMessage.GetComponentInChildren<Text>().text = text;
        GameObject.Destroy(toastMessage, 1);
    }

    /* Sticker Screen Shot */
    private TakeStickerScreen() {
        this.renderTextureCamera.gameObject.SetActive(true);
        this.renderTextureCamera.targetTexture = this.renderTexture;

        /* Camera Render */
        this.StartCoroutine(this.CameraRender());
    }
    private * CameraRender() {
        yield new WaitForEndOfFrame();
        this.renderTextureCamera.Render();
        this.renderTextureCamera.targetTexture = null;
        this.renderTextureCamera.gameObject.SetActive(false);

        GameManager.instance.ClearStampMission(StampType.STAMP_STICKER);
        /* Camera Render END */
        this.StopCoroutine(this.CameraRender());
    }

    /* Controller Set */
    private ControllerSet(controlable:boolean) {
        if(!this.controller) {
            const controller = ZepetoPlayers.instance.gameObject.GetComponentInChildren<UIZepetoPlayerControl>();
            this.controller = controller.gameObject;
        }
        this.controller.gameObject.SetActive(controlable);
        if(controlable) {
            ZepetoPlayers.instance.controllerData.inputAsset.Enable();
            // this.controller.gameObject.SetActive(controlable);
        } else {
            ZepetoPlayers.instance.controllerData.inputAsset.Disable();
            // this.controller.gameObject.SetActive(controlable);
        }
    }

    /* Get Find Button Info */
    private GetFindButtonInfo(item:GameObject) {
        for(const info of this.stickerButtonInfos) {
            if(info.button.name == item.name) {
                return info;
            }
        }
        return null;
    }

    /* Get Find Sticker Object */
    private GetStickerObject(item:GameObject, info:ButtonInfo) {
        if(!(info.count > 0) || !(this.StringToNumber(info.countText.text) > 0)) return;
        for(const instance of info.instances) {
            if(instance.transform.parent == this.stickerPool) {
                const editCanvas = this.editRenderCanvas.transform;
                instance.transform.position = new Vector3(editCanvas.position.x, editCanvas.position.y, 40.5);
                instance.transform.rotation = Quaternion.identity;
                instance.transform.parent = editCanvas;
                instance.SetActive(true);
                info.countText.text = `${Mathf.Clamp(this.StringToNumber(info.countText.text)-1, 0, info.count)}`;
                // console.log(` >>>>>>>>>>>>> GetStickerObject`);
                if(this.StringToNumber(info.countText.text) == 0) this.ButtonColorChanger(info, false);
                return;
            }
        }
        this.InstantiateSticker(item, info);
    }

    /* Instantiate Sticker */
    private InstantiateSticker(item:GameObject, info:ButtonInfo) {
        if(!(info.count > 0)) return;

        const editCanvas = this.editRenderCanvas.transform;
        const clone = GameObject.Instantiate(item, editCanvas) as GameObject;
        info.instances.push(clone);
        clone.name = info.button.name;
        clone.transform.position = new Vector3(editCanvas.position.x, editCanvas.position.y, 40.5);
        clone.transform.rotation = Quaternion.identity;
        clone.SetActive(true);
        info.countText.text = `${Mathf.Clamp(this.StringToNumber(info.countText.text)-1, 0, info.count)}`;
        // console.log(` >>>>>>>>>>>>> InstantiateSticker`);
        if(this.StringToNumber(info.countText.text) == 0) this.ButtonColorChanger(info, false);
    }

    /* Return Instantiate in pool */
    private ReturnInstantiateSticker(item:GameObject, info:ButtonInfo = null) {
        if(!info) info = this.GetFindButtonInfo(item);
        for(const instance of info.instances) {
            if(item == instance) {
                instance.transform.parent = this.stickerPool;
                instance.transform.position = this.stickerPool.position;
                instance.transform.rotation = Quaternion.identity;
                instance.SetActive(false);
                info.countText.text = `${Mathf.Clamp(this.StringToNumber(info.countText.text)+1, 0, info.count)}`;
                if(this.StringToNumber(info.countText.text) > 0) this.ButtonColorChanger(info, true);
                break;
            }
        }
    }

    /* Return All Instantiate in pool */
    private ReturnAllInstantiateSticker(info:ButtonInfo) {
        // SyncIndexManager.STICKERS
        for(const instance of info.instances) {
            if(instance.transform.parent != this.stickerPool) {
                instance.transform.parent = this.stickerPool;
                instance.transform.position = this.stickerPool.position;
                instance.transform.rotation = Quaternion.identity;
                instance.SetActive(false);
            }
        }
        info.countText.text = `${info.count}`;
        this.ButtonColorChanger(info, info.count > 0);
    }

    /* Sticker Count Update */
    private InfoDataUpdate() {
        for(const info of this.stickerButtonInfos) {
            if(SyncIndexManager.STICKERS.has(info.button.name)) {
                const sticker = SyncIndexManager.STICKERS.get(info.button.name);
                info.count = sticker.count;
            }
        }
    }

    /* Color Changer */
    private ButtonColorChanger(info:ButtonInfo, enable:boolean) {
        if(enable) {
            info.countImage.color = UIManager.instance.enabledColor;
        } else {
            info.countImage.color = UIManager.instance.disabledColor;
        }
    }

    /* Function String ===> Number */
    private StringToNumber(num:string) {
        return parseInt(num) as number;
    }
}