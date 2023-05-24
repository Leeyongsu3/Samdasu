import { GameObject, RectTransform, Transform, Vector2, Vector3 } from 'UnityEngine';
import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GetRangeRankResponse, LeaderboardAPI, ResetRule, SetScoreResponse } from 'ZEPETO.Script.Leaderboard';
import { Users, ZepetoWorldHelper } from 'ZEPETO.World';
import SyncIndexManager from '../Common/SyncIndexManager';
import { RankData, RankUI } from './TypeManager';

export default class LeaderBoardManager extends ZepetoScriptBehaviour {

    /* Properties */
    @SerializeField() private rankCanvas:Transform;
    private rankUIs:RankUI[] = [];
    private _isStarted: boolean = false;
    public get isStarted(): boolean { return this._isStarted; }
    private set isStarted(value: boolean) { this._isStarted = value; }

    /* From GameManager */
    public RemoteStart() {
        for(let i=0; i<this.rankCanvas.childCount; i++) {
            const panel = this.rankCanvas.GetChild(i);
            this.SetRankPanel(panel, i);
        }
        this.UpdateRankData();
        this.isStarted = true;
    }

    /* Init Rank Panel UI */
    private SetRankPanel(panel:Transform, index:number) {
        const text_Id = panel.GetChild(0).GetComponent<Text>();
        const text_Score = panel.GetChild(1).GetComponent<Text>();
        
        /* Set Clean */
        text_Id.text = RankData.Empty;
        text_Score.text = RankData.Zero;
        
        /* Pushed Array */
        const ui:RankUI = {
            panel:panel.gameObject,
            rank:index,
            text_Id:text_Id,
            text_Score:text_Score,
        };
        this.rankUIs.push(ui);
    }

    /* Update Local Player's Score */
    public UpdateScore() {
        LeaderboardAPI.SetScore(RankData.TrashScoreId, SyncIndexManager.Score, (result:SetScoreResponse) => {
            this.UpdateRankData();
        }, (error:string) => {
            console.error(` UpdateScore error : ${error} `);
        })
    }

    /* Leaderboard + UserInfo */
    private UpdateRankData() {
        console.log(`[LeaderBoard] Try to GetRangeRank`);
        LeaderboardAPI.GetRangeRank(RankData.TrashScoreId, RankData.Rank_Start, RankData.Rank_End, ResetRule.week, false, (result: GetRangeRankResponse) => {
            console.log(`[LeaderBoard] success GetRangeRank`);
            /* Text Clear */
            for(let i=0; i<this.rankUIs.length; i++) {
                const ui = this.rankUIs[i];
                ui.text_Id.text = RankData.Empty;
                ui.text_Score.text = RankData.Zero;
            }
            
            /* Get Player Datas */
            const mems:string[] = [];
            const ids:string[] = [];
            if (result.rankInfo.rankList) {
                for (let i=0; i < result.rankInfo.rankList.length; i++) {
                    if(9 < i) {
                        break;
                    } else {
                        const data = result.rankInfo.rankList.get_Item(i);
                        mems.push(data.member);
                    }
                }
            }

            /* Get Player ID */
            ZepetoWorldHelper.GetUserInfo(mems, (info: Users[]) => {
                console.log(`[LeaderBoard] success GetUserInfo `);
                for (const data of info) {
                    if(data.zepetoId) ids.push(this.ProcessingId(data.zepetoId))
                    else ids.push(this.ProcessingId(data.name))
                }

                /* Update Rank Text */
                if (result.rankInfo.rankList) {
                    for (let i=0; i < result.rankInfo.rankList.length; i++) {
                        if(9 < i) break;
                        const data = result.rankInfo.rankList.get_Item(i);
                        const ui = this.rankUIs[i];
                        ui.text_Id.text = ids[i];
                        ui.text_Score.text = data.score.toString();
                    }
                }
            }, (error) => {
                return console.log(error);
            });
        }, (error: string) => {
            console.error(error);
        });
    }

    private ProcessingId(beforeId:string): string {
        if(beforeId.length < 8) {
            return beforeId;
        }
        return `${beforeId.slice(0, 6)}***`;
    }
}