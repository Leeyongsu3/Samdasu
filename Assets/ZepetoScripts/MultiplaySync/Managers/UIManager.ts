import { GameObject, Transform } from 'UnityEngine';
import { Button, Image, Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { ZepetoWorldMultiplay } from 'ZEPETO.World';
import { Room, RoomData } from 'ZEPETO.Multiplay';
import SyncIndexManager from '../Common/SyncIndexManager';
import GameManager, { MESSAGE } from './GameManager';

export default class UIManager extends ZepetoScriptBehaviour {

    /* UIManagers Default Properties */
    @Header("UI Manager Field")
    @SerializeField() public canvas: GameObject;
    private loadingUIs: GameObject[];
    private openUI: GameObject;
    private isPlaying: boolean;
    private isLoading: boolean;
    public multiplay: ZepetoWorldMultiplay;
    public room: Room;
    
    /* Samdasu Property */
    @Header("Samdasu Field")
    @SerializeField() private trashCountText: Text;
    @SerializeField() private trashScoreText: Text;
    @SerializeField() private npcUI: Transform;

    /* Singleton */
    private static _instance: UIManager = null;
    public static get instance(): UIManager {
        if (this._instance === null) {
            this._instance = GameObject.FindObjectOfType<UIManager>();
            if (this._instance === null) {
                this._instance = new GameObject(UIManager.name).AddComponent<UIManager>();
            }
        }
        return this._instance;
    }

    private Awake() {
        if (UIManager._instance !== null && UIManager._instance !== this) {
            GameObject.Destroy(this.gameObject);
        } else {
            UIManager._instance = this;
            GameObject.DontDestroyOnLoad(this.gameObject);
        }

        const images = this.canvas.GetComponentsInChildren<Image>();
        this.loadingUIs = new Array<GameObject>();
        
        for(const img of images) {
            switch(img.tag) {
                case "Loading": 
                    this.loadingUIs.push(img.gameObject);
                    img.gameObject.SetActive(false);
                    break;
            }
        }
    }

    Start() {
        if(!this.multiplay)
            this.multiplay = GameObject.FindObjectOfType<ZepetoWorldMultiplay>();
        
        this.multiplay.RoomJoined += (room: Room) => {
            this.room = room;
        }

        /* Samdasu */
        this.SetTrashCountUI();
        const closeButton = this.npcUI.GetChild(1).GetComponent<Button>();
        const pointButton = this.npcUI.GetChild(2).GetComponent<Button>();
        const stickButton = this.npcUI.GetChild(3).GetComponent<Button>();

        closeButton.onClick.AddListener(() => {
            // close UI
            this.npcUI.gameObject.SetActive(false);
        });
        stickButton.onClick.AddListener(() => {
            // get sticker
            if(SyncIndexManager.TrashCount > 10) {
                const stickers = GameManager.instance.GetPlayersStickers();
                console.log(` stickers : ${stickers} `);
                console.log(` stickers : ${stickers.Count} `);
                console.log(` stickers[0].name : ${stickers[0].name} `);
                console.log(` stickers[0].has : ${stickers[0].has} `);
                
                
                // Math.Random(0, 0);
                // const data = new RoomData();
                // data.Add("First", );
                // this.room.Send(MESSAGE.Add_Sticker, true);
            } else {

            }
        });
        pointButton.onClick.AddListener(() => {
            // get point
            // if(SyncIndexManager.TrashCount > 10) {
            //     this.room.Send(MESSAGE.Add_Point, true);
            // }
        });
    }

    /* Find GameObject */ 
    FindLoadingImage(type:LoadingType) : GameObject {
        const tName :string = type.toString();
        for (const item of this.loadingUIs) {
            if(item.name == tName) return item;
        }
        return null;
    }

    /* Samdasu Trash Count */
    public SetTrashCountUI() {
        this.trashCountText.text = `${SyncIndexManager.TrashCount}`;
        this.trashScoreText.text = `${SyncIndexManager.Score}`;
    }
}

export enum LoadingType {
    Start = "UI_Loarding_Start",
    Teleport = "UI_Loarding_Teleport",
    NONE = "",
}