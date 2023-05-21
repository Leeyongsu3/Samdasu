import { GameObject, RectTransform, Transform, Vector2, Vector3 } from 'UnityEngine';
import { Text } from 'UnityEngine.UI';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'
import { GetRangeRankResponse, LeaderboardAPI, ResetRule, SetScoreResponse } from 'ZEPETO.Script.Leaderboard';
import SyncIndexManager from '../Common/SyncIndexManager';
import { RankData, RankUI } from './TypeManager';

export default class LeaderBoardManager extends ZepetoScriptBehaviour {

    /* Properties */
    @SerializeField() private rankCanvas:Transform;
    private rankUIs:RankUI[] = [];

    /* From GameManager */
    public RemoteStart() {
        for(let i=0; i<this.rankCanvas.childCount; i++) {
            const panel = this.rankCanvas.GetChild(i);
            this.SetRankPanel(panel, i);
        }
        this.UpdateRankData();
    }

    /* Init Rank Panel UI */
    private SetRankPanel(panel:Transform, index:number) {
        const text_Id = panel.GetChild(1).GetComponent<Text>();
        const text_Score = panel.GetChild(2).GetComponent<Text>();
        
        /* Set Clear */
        text_Id.text = RankData.Empty;
        text_Score.text = RankData.Empty;
        
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
        LeaderboardAPI.SetScore(RankData.ScoreId, SyncIndexManager.Score, (result:SetScoreResponse) => {
            this.UpdateRankData();
        }, (error:string) => {
            console.error(` UpdateScore error : ${error} `);
        })
    }

    private UpdateRankData() {
        this.GetSetRank();
    }

    /* Leaderboard + UserInfo */
    private GetSetRank() {
        LeaderboardAPI.GetRangeRank(RankData.ScoreId, RankData.Rank_Start, RankData.Rank_End, ResetRule.week, false, (result: GetRangeRankResponse) => {
            /* Text Clear */
            for(let i=0; i<this.rankUIs.length; i++) {
                const ui = this.rankUIs[i];
                ui.text_Id.text = RankData.Empty;
                ui.text_Score.text = RankData.Empty;
            }

            /* Update Rank Text */
            if (result.rankInfo.rankList) {
                for (let i=0; i < result.rankInfo.rankList.length; i++) {
                    const data = result.rankInfo.rankList.get_Item(i);
                    const ui = this.rankUIs[data.rank-1];
                    ui.text_Id.text = data.name;
                    ui.text_Score.text = data.score.toString();
                    console.log(ui.panel.name, data.name, data.score);
                }
            }
        }, (error: string) => {
            console.error(error);
        });
    }
}