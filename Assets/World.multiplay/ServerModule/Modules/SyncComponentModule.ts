import { SandboxPlayer } from "ZEPETO.Multiplay";
import { IModule } from "../IModule";
import {sVector3, sQuaternion, SyncTransform, PlayerAdditionalValue, ZepetoAnimationParam, EquipData, Stamp, Sticker} from "ZEPETO.Multiplay.Schema";
import { DataStorage } from "ZEPETO.Multiplay.DataStorage";

export default class SyncComponentModule extends IModule {
    private sessionIdQueue: string[] = [];
    private instantiateObjCaches : InstantiateObj[] = [];
    private masterClient: Function = (): SandboxPlayer | undefined => this.server.loadPlayer(this.sessionIdQueue[0]);
    private flumeWait:boolean = false;

    async OnCreate() {
        /**Zepeto Player Sync**/
        this.server.onMessage(MESSAGE.SyncPlayer, (client, message) => {
            const player = this.server.state.players.get(client.sessionId);
            if (player) {
                const animationParam = new ZepetoAnimationParam();
                player.animationParam = Object.assign(animationParam, message.animationParam);
                player.gestureName = message.gestureName ?? null;
                player.samdasu.SamdasuState = message.animationParam.SamdasuState;

                if (message.playerAdditionalValue) {
                    const pAdditionalValue = new PlayerAdditionalValue();
                    player.playerAdditionalValue = Object.assign(pAdditionalValue, message.playerAdditionalValue);
                }
            }
        });

        /**Transform Sync**/
        this.server.onMessage(MESSAGE.SyncTransform, (client, message) => {
            const { Id, position, localPosition, rotation, scale, sendTime } = message;
            let syncTransform = this.server.state.SyncTransforms.get(Id.toString());

            if (!syncTransform) {
                syncTransform = new SyncTransform();
                this.server.state.SyncTransforms.set(Id.toString(), syncTransform);
            }

            Object.assign(syncTransform.position, position);
            Object.assign(syncTransform.localPosition, localPosition);
            Object.assign(syncTransform.rotation, rotation);
            Object.assign(syncTransform.scale, scale);
            syncTransform.sendTime = sendTime;
        });

        this.server.onMessage(MESSAGE.SyncTransformStatus, (client, message) => {
            const syncTransform = this.server.state.SyncTransforms.get(message.Id);
            if(syncTransform !== undefined) {
                syncTransform.status = message.Status;
            }
        });

        /** Sync Animaotr **/
        this.server.onMessage(MESSAGE.SyncAnimator, (client, message) => {
            const animator: SyncAnimator = {
                Id: message.Id,
                clipNameHash: message.clipNameHash,
                clipNormalizedTime: message.clipNormalizedTime,
            };
            const masterClient = this.masterClient();
            if (masterClient !== null && masterClient !== undefined) {
                this.server.broadcast(MESSAGE.ResponseAnimator + message.Id, animator, {except: masterClient});
            }
        });

        /** SyncTransform Util **/
        this.server.onMessage(MESSAGE.ChangeOwner, (client,message:string) => {
            this.server.broadcast(MESSAGE.ChangeOwner+message, client.sessionId);
        });
        this.server.onMessage(MESSAGE.Instantiate, (client,message:InstantiateObj) => {
            const InstantiateObj: InstantiateObj = {
                Id: message.Id,
                prefabName: message.prefabName,
                ownerSessionId: message.ownerSessionId,
                spawnPosition: message.spawnPosition,
                spawnRotation: message.spawnRotation,
            };
            this.instantiateObjCaches.push(InstantiateObj);
            this.server.broadcast(MESSAGE.Instantiate, InstantiateObj);
        });

        this.server.onMessage(MESSAGE.RequestInstantiateCache, (client) => {
            for (const obj of this.instantiateObjCaches) {
                client.send(MESSAGE.Instantiate, obj);
            }
        });

        /**SyncDOTween**/
        this.server.onMessage(MESSAGE.SyncDOTween, (client, message: syncTween) => {
            const tween: syncTween = {
                Id: message.Id,
                position: message.position,
                nextIndex: message.nextIndex,
                loopCount: message.loopCount,
                sendTime: message.sendTime,
            };
            const masterClient = this.masterClient();
            if (masterClient !== null && masterClient !== undefined) {
                this.server.broadcast(MESSAGE.ResponsePosition + message.Id, tween, {except: masterClient});
            }
        });

        /**Common**/
        this.server.onMessage(MESSAGE.CheckServerTimeRequest, (client, message) => {
            let Timestamp = +new Date();
            client.send(MESSAGE.CheckServerTimeResponse, Timestamp);
        });
        this.server.onMessage(MESSAGE.CheckMaster, (client, message) => {
            console.log(`[${MESSAGE.CheckMaster}] master->, ${this.sessionIdQueue[0]}`);
            this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
        });
        this.server.onMessage(MESSAGE.PauseUser, (client) => {
            if(this.sessionIdQueue.includes(client.sessionId)) {
                const pausePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
                this.sessionIdQueue.splice(pausePlayerIndex, 1);

                if (pausePlayerIndex == 0) {
                    console.log(`[${MESSAGE.PauseUser}] master->, ${this.sessionIdQueue[0]}`);
                    this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
                }
            }
        });
        this.server.onMessage(MESSAGE.UnPauseUser, (client) => {
            if(!this.sessionIdQueue.includes(client.sessionId)) {
                this.sessionIdQueue.push(client.sessionId);
                this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
            }
        });

        this.server.onMessage(MESSAGE.Leaderboard_Update, (client) => {
            this.server.broadcast(MESSAGE.Leaderboard_Update);
        });


        /** Sample Code **/
        this.server.onMessage(MESSAGE.BlockEnter, (client,transformId:string) => {
            this.server.broadcast(MESSAGE.BlockEnter+transformId, client.sessionId);
        });
        this.server.onMessage(MESSAGE.BlockExit, (client,transformId:string) => {
            this.server.broadcast(MESSAGE.BlockExit+transformId, client.sessionId);
        });
        this.server.onMessage(MESSAGE.SendBlockEnterCache, (client,blockCache) => {
            this.server.loadPlayer(blockCache.newJoinSessionId)?.send(MESSAGE.BlockEnter+blockCache.transformId, client.sessionId);
        });

        this.server.onMessage(MESSAGE.CoinAcquired, (client,transformId:string) => {
            this.masterClient()?.send(MESSAGE.CoinAcquired+transformId, client.sessionId);
        });
        

        /** Samdasu **/
        this.server.onMessage(MESSAGE.SyncObjectAnimation, (client, message) => {
            const currentTime = new Date().getTime() - this.server.state.serverStartTime;
            const currentProgress: number = currentTime % message.cliplength;

            console.log(`[Time] ${currentProgress}`);

            const SyncroRide = {
                currentProgress: currentProgress,
            }
            client.send(MESSAGE.SyncObjectAnimation, SyncroRide);
        });

        this.server.onMessage(MESSAGE.Clear_Stamp, (client, message) => {
            if(!message.stamp) return;
            const player = this.server.state.players.get(client.sessionId);
            for(const stamp of player.samdasu.Stamps) {
                if(stamp.name == message.stamp.name) {
                    stamp.isClear = message.stamp.isClear;
                    break;
                }
            }
            const data = {
                sessionId:client.sessionId,
                stamp:{
                    name:message.stamp.name,
                    isClear:message.stamp.isClear,
                },
            }
            client.send(MESSAGE.Clear_Stamp, data);
        });

        this.server.onMessage(MESSAGE.Pick_Trash, (client, trash) => {
            if(!trash.Pick_Trash) return;
            const player = this.server.state.players.get(client.sessionId);
            player.samdasu.TrashCount += 1;
        });
        
        this.server.onMessage(MESSAGE.Add_Sticker, (client, message) => {
            const player = this.server.state.players.get(client.sessionId);
            // 1st Check
            if(player.samdasu.TrashCount < 10) {
                client.send(MESSAGE.Add_Sticker, null);
                return;
            }

            // 2nd Check
            const addSticker:Add_Sticker = {
                OwnerSessionId: client.sessionId,
                Selected_A: null,
                Selected_B: null,
            };
            for(const sticker of player.samdasu.Stickers) {
                if(sticker.name == message.Selected_A) addSticker.Selected_A = sticker;
                if(sticker.name == message.Selected_B) addSticker.Selected_B = sticker;
            }
            if(!addSticker.Selected_A || !addSticker.Selected_B) {
                client.send(MESSAGE.Add_Sticker, null);
                return;
            } else if(addSticker.Selected_A.count >= 100) {
                // count limit 100
                client.send(MESSAGE.Add_Sticker, null);
                return;
            }

            // Add Sticker
            player.samdasu.TrashCount -= 10;
            addSticker.Selected_A.count++;
            addSticker.Selected_B.count++;
            client.send(MESSAGE.Add_Sticker, addSticker);
        });
        
        this.server.onMessage(MESSAGE.Add_Point, (client, message) => {
            const player = this.server.state.players.get(client.sessionId);
            if(player.samdasu.TrashCount >= message.trashCount) {
                player.samdasu.TrashCount -= message.trashCount;
                player.samdasu.Score += message.trashCount * 10;
            }
        });
        
        this.server.onMessage(MESSAGE.Ride_Horse, (client, message) => {
            const syncRide:syncRide = {
                OwnerSessionId: client.sessionId,
                isRide: true,
                isComplete: false,
                SamdasuState: SamdasuState.Ride_Horse,
            };
            this.server.broadcast(MESSAGE.Ride_Horse, syncRide);
            // const player = this.server.state.players.get(client.sessionId);
        });
        
        this.server.onMessage(MESSAGE.Ride_Wheel, (client, message) => {
            const syncRide:syncRide = {
                OwnerSessionId: client.sessionId,
                isRide: true,
                isComplete: false,
                SamdasuState: SamdasuState.Ride_Wheel,
            };
            this.server.broadcast(MESSAGE.Ride_Wheel, syncRide);
        });
        
        this.server.onMessage(MESSAGE.Ride_MGR, (client, message) => {
            const syncRide:syncRide = {
                OwnerSessionId: client.sessionId,
                isRide: true,
                isComplete: false,
                SamdasuState: SamdasuState.Ride_MGR,
            };
            this.server.broadcast(MESSAGE.Ride_MGR, syncRide);
        });
        
        this.server.onMessage(MESSAGE.Ride_OFF, (client, message) => {
            const syncRide:syncRide = {
                OwnerSessionId: client.sessionId,
                isRide: false,
                isComplete: message.isComplete,
                SamdasuState: SamdasuState.NONE,
            };
            this.server.broadcast(message.SamdasuState, syncRide);
        });
        
        this.server.onMessage(MESSAGE.MGR_Play, (client, message) => {
            this.server.broadcast(MESSAGE.MGR_Play, message);
        });
        /** Samdasu END **/

        this.server.onMessage(MESSAGE.Play_Effect, (client: SandboxPlayer, message) => {
            this.server.broadcast(MESSAGE.Play_Effect, message.effectType);
        });
        
        this.server.onMessage(MESSAGE.ChairSit, (client: SandboxPlayer, message) => {
            const chairMsg :syncChair = {
                chairId : message.chairId,
                OwnerSessionId : client.sessionId,
                onOff: !message.isSit,
            };
            const msg = message.isSit ? MESSAGE.ChairSitDown : MESSAGE.ChairSitUp;
            this.server.broadcast(msg, chairMsg);
            // this.broadcast(msg, chairMsg, {except: client});
            // client.send(msg, chairMsg);
        });
        
        this.server.onMessage(MESSAGE.Equip, (client: SandboxPlayer, message) => {
            let msg = MESSAGE.Equip;
            const equipData:EquipData = new EquipData();
            equipData.sessionId = client.sessionId;
            equipData.itemName = message.name;
            equipData.bone = message.attach;
            equipData.key = `${client.sessionId}_${equipData.bone}`;
            console.log(`${MESSAGE.Equip} : ${equipData.key} ${equipData.itemName}`);

            if(this.server.state.equipDatas.has(equipData.key)) {
                const prevData = this.server.state.equipDatas.get(equipData.key);
                if(prevData.sessionId == client.sessionId) {
                    equipData.prevItemName = prevData.itemName;
                    equipData.prevBone = prevData.bone;
                    msg = MESSAGE.EquipChange;
                }
            }
            this.server.state.equipDatas.set(equipData.key, equipData);
            this.server.broadcast(msg, equipData);
        });
        
        this.server.onMessage(MESSAGE.Unequip, (client: SandboxPlayer, message) => {
            const equipData:EquipData = new EquipData();
            equipData.sessionId = client.sessionId;
            equipData.itemName = message.name;
            equipData.bone = message.attach;
            equipData.key = `${client.sessionId}_${equipData.bone}`;
            console.log(`${MESSAGE.Unequip} : ${equipData.key} ${equipData.itemName}`);
            
            if(this.server.state.equipDatas.has(equipData.key)) {
                const prevData = this.server.state.equipDatas.get(equipData.key);
                if(prevData.sessionId == client.sessionId) {
                    equipData.prevItemName = prevData.itemName;
                    equipData.prevBone = prevData.bone;
                }
                this.server.state.equipDatas.delete(equipData.key);
            }
            this.server.broadcast(MESSAGE.Unequip, equipData);
        });
        
        this.server.onMessage(MESSAGE.Visible, (client, message) => {
            this.server.broadcast(MESSAGE.Visible, message);
            // this.server.state.visibleZones
        });
        
        this.server.onMessage(MESSAGE.FlumeRide, (client, message) => {
            if(this.flumeWait && message.NeedTo_wait) return;
            this.flumeWait = message.NeedTo_wait;
            const datas = {
                OwnerSessionId:client.sessionId,
                NeedTo_wait:message.NeedTo_wait,
            }
            this.server.broadcast(MESSAGE.FlumeRide, datas);
        });

        /** Racing Game **/
        let isStartGame:boolean = false;
        let startServerTime:number;
        this.server.onMessage(MESSAGE.StartRunningRequest, (client) => {
            if(!isStartGame) {
                isStartGame = true;
                startServerTime = +new Date();

                this.server.broadcast(MESSAGE.CountDownStart, startServerTime);
            }
        });
        this.server.onMessage(MESSAGE.FinishPlayer, (client,finishTime:number) => {
            let playerLapTime = (finishTime-startServerTime)/1000;
            console.log(`${client.sessionId}is enter! ${playerLapTime}`);
            const gameReport: GameReport = {
                playerUserId: client.userId,
                playerLapTime: playerLapTime,
            };
            this.server.broadcast(MESSAGE.ResponseGameReport, gameReport);
            if(isStartGame) {
                isStartGame = false;
                let gameEndTime:number = +new Date();
                this.server.broadcast(MESSAGE.FirstPlayerGetIn, gameEndTime);
            }
        });
    }

    async OnJoin(client: SandboxPlayer) {
        if(!this.sessionIdQueue.includes(client.sessionId)) {
            this.sessionIdQueue.push(client.sessionId.toString());
        }
    }
    
    async OnJoined(client: SandboxPlayer) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(client.sessionId);

        /* load storage */
        const storage: DataStorage = client.loadDataStorage();

        /* Visit Count */
        let visit_cnt = await storage.get(StorageName.VisitCount) as number;
        if (visit_cnt == null) visit_cnt = 0;
        player.visit = visit_cnt;
        await storage.set(StorageName.VisitCount, ++visit_cnt);
        console.log(`[OnJoin] ${client.sessionId}'s visiting count : ${visit_cnt}`)

        /* Trash Count */
        let trashCount = await storage.get(StorageName.TrashCounts) as number;
        if (trashCount == null) trashCount = 0;
        console.log(`[OnJoin] ${client.sessionId}'s trash count : ${trashCount}`)
        player.samdasu.TrashCount = trashCount;
        await storage.set(StorageName.TrashCounts, trashCount);

        /* Trash Score */
        let score = await storage.get(StorageName.TrashScore) as number;
        if (score == null) score = 0;
        console.log(`[OnJoin] ${client.sessionId}'s score : ${score}`)
        player.samdasu.Score = score;
        await storage.set(StorageName.TrashScore, score);

        /* Trash Sticker */
        let JSON_stickers = await storage.get(StorageName.SamdasuStickers) as string;
        if (JSON_stickers == null) {
            this.StickerInit(client.sessionId);
            JSON_stickers = JSON.stringify(player.samdasu.Stickers);
        } else {
            this.StickerConvert(client.sessionId, JSON_stickers);
        }
        console.log(`[OnJoin] ${client.sessionId}'s stickers : ${JSON_stickers}`);
        await storage.set(StorageName.SamdasuStickers, JSON_stickers);

        /* Clear Stamp */
        let JSON_stamps = await storage.get(StorageName.SamdasuStamps) as string;
        if (JSON_stamps == null) {
            this.StampInit(client.sessionId);
            JSON_stamps = JSON.stringify(player.samdasu.Stamps);
        } else {
            this.StampConvert(client.sessionId, JSON_stamps);
        }
        console.log(`[OnJoin] ${client.sessionId}'s stamps : ${JSON_stamps}`)
        await storage.set(StorageName.SamdasuStamps, JSON_stamps);

        /* onJoined End */
        this.server.state.players.set(client.sessionId, player);
    }

    async OnLeave(client: SandboxPlayer) {
        // const player = this.server.state.players.get(client.sessionId);
        const player = this.server.state.players.get(client.sessionId);

        /* Trash Count */
        console.log(`[onLeave] ${client.sessionId}'s trash count : ${player.samdasu.TrashCount}`)
        await client.loadDataStorage().set(StorageName.TrashCounts, player.samdasu.TrashCount);

        /* Trash Score */
        console.log(`[onLeave] ${client.sessionId}'s score : ${player.samdasu.Score}`)
        await client.loadDataStorage().set(StorageName.TrashScore, player.samdasu.Score);

        /* Trash Sticker */
        const stickers = JSON.stringify(player.samdasu.Stickers);
        console.log(`[onLeave] ${client.sessionId}'s stickers : ${stickers}`)
        await client.loadDataStorage().set(StorageName.SamdasuStickers, stickers);

        /* Clear Stamp */
        const stamps = JSON.stringify(player.samdasu.Stamps);
        console.log(`[onLeave] ${client.sessionId}'s stamps : ${stamps}`)
        await client.loadDataStorage().set(StorageName.SamdasuStamps, stamps);
        
        if(this.sessionIdQueue.includes(client.sessionId)) {
            const leavePlayerIndex = this.sessionIdQueue.indexOf(client.sessionId);
            this.sessionIdQueue.splice(leavePlayerIndex, 1);
            if (leavePlayerIndex == 0) {
                console.log(`[onLeave] master->, ${this.sessionIdQueue[0]}`);
                this.server.broadcast(MESSAGE.MasterResponse, this.sessionIdQueue[0]);
            }
        }
    }

    OnTick(deltaTime: number) {
    }

    /** Samdasu */
    /* Trash Stamp */
    StampInit(sessionId: string) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(sessionId);

        /* Set Array Data */
        player.samdasu.Stamps.push(this.ProcessingStamp(StampType.STAMP_LAND));
        player.samdasu.Stamps.push(this.ProcessingStamp(StampType.STAMP_OX_QUIZ));
        player.samdasu.Stamps.push(this.ProcessingStamp(StampType.STAMP_STICKER));
        player.samdasu.Stamps.push(this.ProcessingStamp(StampType.STAMP_TRASH));
        player.samdasu.Stamps.push(this.ProcessingStamp(StampType.STAMP_WATER));
        player.samdasu.Stamps.push(this.ProcessingStamp(StampType.STAMP_HORSE));
    }

    /* Trash Sticker */
    StickerInit(sessionId: string) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(sessionId);

        /* Set Array Data */
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.airplane));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.backrockdam));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.candle25));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.congraturation));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.flower_red));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.flower_yellow));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.haenyeo));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.halbang));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.hanrabong));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.horse));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.mulbangul));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.samdasu));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.songee));
        player.samdasu.Stickers.push(this.ProcessingSticker(StickerType.volcano));
    }

    /* Trash Stamp Load */
    StampConvert(sessionId:string, JSON_stamps:string) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(sessionId);

        /* Push Array Data */
        const stampList = JSON.parse(JSON_stamps);
        for(const item of stampList) {
            const stamp = new Stamp();
            stamp.name = item.name;
            stamp.isClear = item.isClear;
            player.samdasu.Stamps.push(stamp);
        }
    }

    /* Trash Stamp Load */
    StickerConvert(sessionId:string, JSON_stickers:string) {
        /* get player */
        const players = this.server.state.players;
        const player = players.get(sessionId);

        /* Push Array Data */
        const stickerList = JSON.parse(JSON_stickers);
        for(const item of stickerList) {
            const sticker = new Sticker();
            sticker.name = item.name;
            sticker.count = item.count;
            player.samdasu.Stickers.push(sticker);
        }
    }

    /* Samdasu Processing Stamp UI */
    private ProcessingStamp(key:StampType) {
        const stamp = new Stamp();
        stamp.name = key.toString();
        stamp.isClear = false;
        return stamp;
    }

    /* Samdasu Processing Sticker UI */
    private ProcessingSticker(key:StickerType) {
        const sticker = new Sticker();
        sticker.name = key.toString();
        sticker.count = 0;
        return sticker;
    }

}
interface syncTween {
    Id: string,
    position: sVector3,
    nextIndex: number,
    loopCount: number,
    sendTime: number,
}

interface SyncAnimator {
    Id: string,
    clipNameHash: number,
    clipNormalizedTime: number,
}

interface InstantiateObj{
    Id:string;
    prefabName:string;
    ownerSessionId?:string;
    spawnPosition?:sVector3;
    spawnRotation?:sQuaternion;
}

/* Chair */
interface syncChair {
    chairId: string,
    OwnerSessionId: string,
    onOff: boolean,
}

/** racing game **/
interface GameReport{
    playerUserId : string;
    playerLapTime : number;
}

enum MESSAGE {
    SyncPlayer = "SyncPlayer",
    SyncTransform = "SyncTransform",
    SyncTransformStatus = "SyncTransformStatus",
    SyncAnimator = "SyncAnimator",
    ResponseAnimator = "ResponseAnimator",
    ChangeOwner = "ChangeOwner",
    Instantiate = "Instantiate",
    RequestInstantiateCache = "RequestInstantiateCache",
    ResponsePosition = "ResponsePosition",
    SyncDOTween = "SyncDOTween",
    CheckServerTimeRequest = "CheckServerTimeRequest",
    CheckServerTimeResponse = "CheckServerTimeResponse",
    CheckMaster = "CheckMaster",
    MasterResponse = "MasterResponse",
    PauseUser = "PauseUser",
    UnPauseUser = "UnPauseUser",

    /** Sample Code **/
    BlockEnter = "BlockEnter",
    BlockExit = "BlockExit",
    SendBlockEnterCache = "SendBlockEnterCache",
    CoinAcquired = "CoinAcquired",

    Play_Effect = "Play_Effect",
    ChairSit = "ChairSit",
    ChairSitDown = "ChairSitDown",
    ChairSitUp = "ChairSitUp",

    Equip = "Equip",
    EquipChange = "EquipChange",
    Unequip = "Unequip",
    SyncObjectAnimation = "SyncObjectAnimation",
    Visible = "Visible",
    Leaderboard_Update = "Leaderboard_Update",

    /** Racing Game **/
    StartRunningRequest = "StartRunningRequest",
    FinishPlayer = "FinishPlayer",
    FirstPlayerGetIn = "FirstPlayerGetIn",
    CountDownStart = "CountDownStart",
    ResponseGameReport = "ResponseGameReport",

    /** Samdasu **/
    Clear_Stamp = "Clear_Stamp",
    Pick_Trash = "Pick_Trash",
    Add_Sticker = "Add_Sticker",
    Add_Point = "Add_Point",
    Ride_Horse = "Ride_Horse",
    Ride_Wheel = "Ride_Wheel",
    Ride_MGR = "Ride_MGR",
    Ride_OFF = "Ride_OFF",
    MGR_Play = "MGR_Play",
    FlumeRide = "FlumeRide",
}

enum StorageName {
    VisitCount = "VisitCount",
    TrashCounts = "TrashCounts",
    TrashScore = "TrashScore",
    SamdasuStickers = "SamdasuStickers",
    SamdasuStamps = "SamdasuStamps",
}

/** Samdasu **/
enum SamdasuState {
    NONE = 0,
    Ride_Horse = 10,
    Ride_Wheel = 20,
    Ride_MGR = 30,
    Pick_Item = 40, Samdasu_Drink = 41,
    Swim = 50,
}

enum StampType {
    STAMP_LAND = "STAMP_LAND",
    STAMP_HORSE = "STAMP_HORSE",
    STAMP_WATER = "STAMP_WATER",
    STAMP_TRASH = "STAMP_TRASH",
    STAMP_OX_QUIZ = "STAMP_OX_QUIZ",
    STAMP_STICKER = "STAMP_STICKER",
}

enum StickerType {
    candle25 = "candle25",
    flower_red = "flower_red",
    mulbangul = "mulbangul",
    backrockdam = "backrockdam",
    airplane = "airplane",
    samdasu = "samdasu",
    songee = "songee",
    flower_yellow = "flower_yellow",
    horse = "horse",
    congraturation = "congraturation",
    halbang = "halbang",
    hanrabong = "hanrabong",
    haenyeo = "haenyeo",
    volcano = "volcano",
}

interface Add_Sticker {
    OwnerSessionId: string,
    Selected_A: Sticker,
    Selected_B: Sticker,
}

interface syncRide {
    OwnerSessionId: string,
    isRide: boolean,
    isComplete: boolean,
    SamdasuState: number,
}