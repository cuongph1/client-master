import cmd from './Slot4Cmd';
import SlotNetworkClient from '../../../scripts/networks/SlotNetworkClient';
import InPacket from "../../../scripts/networks/Network.InPacket";
import Tween from "../../../scripts/common/Tween";
import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import App from "../../../scripts/common/App";
import Configs from "../../../scripts/common/Configs";
import Utils from "../../../scripts/common/Utils";
import Slot4ChooseLine from './Slot4ChooseLine';
import Slot4TrialResult from './Slot4TrialResult';
import AlertDialog from '../../../scripts/common/AlertDialog';


const { ccclass, property } = cc._decorator;

@ccclass
export default class Slot4Controller extends cc.Component {

    @property
    colPadding: number = 5; // 5

    @property
    iconHeight: number = 90;  // 112

    @property
    numberOfItemInCol: number = 20;

    @property(cc.Prefab)
    iconPrefab: cc.Prefab = null;

    @property(cc.Node)
    colParent: cc.Node = null;

    @property([cc.SpriteFrame])
    listItemSpirte: cc.SpriteFrame[] = [];

    @property([cc.Color])
    pickLineColor: cc.Color[] = []; // 0: inactive, 1: active

    @property(cc.Label)
    jackpotLabel: cc.Label = null;

    @property(cc.Label)
    moneyLabel: cc.Label = null;

    @property(cc.Label)
    currentBetLabel: cc.Label = null;
    @property(cc.Label)
    totalLineLabel: cc.Label = null;

    @property(cc.Button)
    btnSpin: cc.Button = null;
    @property(cc.Toggle)
    toggleAuto: cc.Toggle = null;
    @property(cc.Toggle)
    toggleFast: cc.Toggle = null;
    @property(cc.Toggle)
    toggleTrial: cc.Toggle = null;

    //win
    @property(cc.Node)
    winNormalBg: cc.Node = null;
    @property(cc.Node)
    bonusNode: cc.Node = null;
    @property(cc.Node)
    bigWinNode: cc.Node = null;
    @property(cc.Node)
    jackpotNode: cc.Node = null;

    @property(cc.Label)
    winLabel: cc.Label = null;

    //line win
    @property(cc.Node)
    lineWinParent: cc.Node = null;

    //show result
    @property(cc.Label)
    totalWinLabel: cc.Label = null;
    @property(cc.Label)
    totalBetLabel: cc.Label = null;

    //choose line
    @property(Slot4ChooseLine)
    chooseLineScript: Slot4ChooseLine = null;
    @property(cc.Node)
    chooseLinePanel: cc.Node = null;

    @property(cc.Node)
    popupChooseBet: cc.Node = null;
    @property(cc.Label)
    labelRoom100: cc.Label = null;
    @property(cc.Label)
    labelRoom1k: cc.Label = null;
    @property(cc.Label)
    labelRoom5k: cc.Label = null;
    @property(cc.Label)
    labelRoom10k: cc.Label = null;
    @property(cc.Node)
    popupGuide: cc.Node = null;

    @property(cc.Node)
    musicOff: cc.Node = null;
    @property({ type: cc.AudioClip })
    musicBackground: cc.AudioClip[] = [];

    @property({ type: cc.AudioClip })
    soundSpinMis: cc.AudioClip = null;
    @property({ type: cc.AudioClip })
    soundSpinWin: cc.AudioClip = null;
    @property({ type: cc.AudioClip })
    soundBigWin: cc.AudioClip = null;
    @property({ type: cc.AudioClip })
    soundJackpot: cc.AudioClip = null;
    @property({ type: cc.AudioClip })
    soundBonus: cc.AudioClip = null;
    @property({ type: cc.AudioClip })
    soundClick: cc.AudioClip = null;
    @property({ type: cc.AudioClip })
    soundSpin: cc.AudioClip = null;

    private listCol: cc.Node[] = [];                //list 5 col
    private listActiveItem: cc.Node[] = [];         //list 15 item nhin thay tren man hinh

    private TIME_COL_FINISH: number = 2;
    private TIME_DELAY_BETWEEN_COL: number = 0.3;
    private TIME_DELAY_SHOW_LINE: number = 1;
    private SPEED: number = 1;

    private betId = 0;
    private listBet = [100, 1000, 10000];
    private listBetString = ["100", "1K", "10K"];
    private arrLineSelected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    private isTrial: Boolean = false;
    private isSpining: Boolean = false;
    private mapLine = [
        [5, 6, 7, 8, 9],
        [0, 1, 2, 3, 4],
        [10, 11, 12, 13, 14],
        [5, 6, 2, 8, 9],
        [5, 6, 12, 8, 9],
        [0, 1, 7, 3, 4],
        [10, 11, 7, 13, 14],
        [0, 11, 2, 13, 4],
        [10, 1, 12, 3, 14],
        [5, 1, 12, 3, 9],
        [10, 6, 2, 8, 14],
        [0, 6, 12, 8, 4],
        [5, 11, 7, 3, 9],
        [5, 1, 7, 13, 9],
        [10, 6, 7, 8, 14],
        [0, 6, 7, 8, 4],
        [5, 1, 2, 3, 9],
        [5, 11, 12, 13, 9],
        [10, 11, 7, 3, 4],
        [0, 1, 7, 13, 14]
    ];

    private musicSlotState = null;
    private remoteMusicBackground = null;

    //CHANGE BET

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    settingMusic() {
        this.musicOff.active = !this.musicOff.active;
        if (this.musicOff.active) {
            cc.audioEngine.stop(this.remoteMusicBackground);
            this.musicSlotState = 0;
        } else {
            var musicId = this.randomBetween(0, 1);
            this.remoteMusicBackground = cc.audioEngine.playMusic(this.musicBackground[musicId], true);
            this.musicSlotState = 1;
        }

        cc.sys.localStorage.setItem("music_Slot_4", "" + this.musicSlotState);
    }

    start() {
        // musicSave :   0 == OFF , 1 == ON
        var musicSave = cc.sys.localStorage.getItem("music_Slot_4");
        if (musicSave != null) {
            this.musicSlotState = parseInt(musicSave);
        } else {
            this.musicSlotState = 1;
            cc.sys.localStorage.setItem("music_Slot_4", "1");
        }

        if (this.musicSlotState == 0) {
            this.musicOff.active = true;
        } else {
            this.musicOff.active = false;
        }

        if (this.musicSlotState == 1) {
            var musicId = this.randomBetween(0, 1);
            this.remoteMusicBackground = cc.audioEngine.playMusic(this.musicBackground[musicId], true);
        }

        this.init();
        SlotNetworkClient.getInstance().addListener((data) => {
            let inpacket = new InPacket(data);
            console.log(inpacket.getCmdId());
            switch (inpacket.getCmdId()) {
                case cmd.Code.UPDATE_POT:
                    {
                        let res = new cmd.ReceiveUpdatePot(data);
                        Tween.numberTo(this.labelRoom100, res.valueRoom1, 0.3);
                        Tween.numberTo(this.labelRoom1k, res.valueRoom2, 0.3);
                        Tween.numberTo(this.labelRoom10k, res.valueRoom3, 0.3);
                      
                        switch (this.betId) {
                            case 0:
                                Tween.numberTo(this.jackpotLabel, res.valueRoom1, 0.3);
                                break;
                            case 1:
                                Tween.numberTo(this.jackpotLabel, res.valueRoom2, 0.3);
                                break;
                            case 2:
                                Tween.numberTo(this.jackpotLabel, res.valueRoom3, 0.3);
                                break;
                          
                        }
                    }
                    break;
                case cmd.Code.UPDATE_RESULT:
                    {
                        let res = new cmd.ReceiveResult(data);
                        this.spinResult(res);
                    }
                    break;
            }
        }, this);

        SlotNetworkClient.getInstance().send(new cmd.SendSubcribe(this.betId));

        BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
            Tween.numberTo(this.moneyLabel, Configs.Login.Coin, 0.3);
        }, this);
        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);

        App.instance.showErrLoading("Đang kết nối tới server...");
        SlotNetworkClient.getInstance().checkConnect(() => {
            App.instance.showLoading(false);
        });

        this.currentBetLabel.string = Utils.formatNumber(this.listBet[this.betId]);

        this.chooseLineScript.onSelectedChanged = (lines) => {
            this.arrLineSelected = lines;
            this.totalLineLabel.string = lines.length.toString();
            Tween.numberTo(this.totalBetLabel, lines.length * this.listBet[this.betId], 0.3);
        }

    }

    init() {
        //declare 5 col
        this.listCol = [];
        for (let i = 0; i < this.colParent.childrenCount; i++) {
            let col = this.colParent.children[i];
            this.listCol.push(col);
        }
        this.randomFirst();
    }

    /**
     * random 15 icon, theo hang ngang
     */
    randomFirst() {
        for (let i = 0; i < this.listCol.length; i++) {
            for (let j = 0; j < this.numberOfItemInCol; j++) {
                let icon = cc.instantiate(this.iconPrefab);
                icon.parent = this.listCol[i];
                let randomSprite = this.randomBetween(0, this.listItemSpirte.length - 1);
                if (randomSprite < 3) {
                    icon.getComponent("Slot4Icon").setSpine(randomSprite);
                } else {
                    icon.getComponent("Slot4Icon").setSprite(this.listItemSpirte[randomSprite]);
                }
            }
        }
    }

    /**
     * random between, min, max included
     */
    randomBetween(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    spinClick() {
        if (Configs.Login.Coin < this.listBet[this.betId] * this.arrLineSelected.length) {
            App.instance.alertDialog.showMsg("Số dư không đủ");
            return;
        }
        if (this.toggleAuto.isChecked || this.toggleFast.isChecked) {

        } else {
            if (this.musicSlotState == 1) {
                cc.audioEngine.play(this.soundClick, false, 1);
            }
        }

        //hide effect
        this.hideWinEffect();
        this.hideLineWin(true);
        this.setButtonEnable(false);
        // this.setButtonAuto(false);
        // this.setButtonFlash(false);

        if (!this.isTrial) {
            SlotNetworkClient.getInstance().send(new cmd.SendPlay(this.arrLineSelected.toString()));
        } else {
            var rIdx = Utils.randomRangeInt(0, Slot4TrialResult.results.length);
            this.spinResult(Slot4TrialResult.results[rIdx]);
        }
    }

    spinEffect(matrix: Array<number>) {

        cc.log("GGGGG : ", matrix);

        //set vi tri cac col ve 0
        for (let i = 0; i < this.listCol.length; i++) {
            this.listCol[i].position = cc.v2(this.listCol[i].position.x, 0);
        }

        //add cac node vao 1 list rieng de? show win line
        this.listActiveItem = [];
        //set icon cho cac item o cuoi
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 5; j++) {
                let indexInCol = this.numberOfItemInCol - 1 - i;
                let col = this.listCol[j];
                let item = col.children[indexInCol];
                let sprite = matrix[i * 5 + j];

                // sprite dang la String : nen can parseInt ben setSpine de switch case hoat dong
                if (sprite < 3) {
                    item.getComponent("Slot4Icon").setSpine(sprite);
                } else {
                    item.getComponent("Slot4Icon").setSprite(this.listItemSpirte[sprite]);
                }

                this.listActiveItem.push(item);
            }
        }

        //move item
        for (let i = 0; i < this.listCol.length; i++) {
            let col = this.listCol[i];
            // let newPos = cc.v2(col.position.x, -(this.numberOfItemInCol - 3) * (this.colPadding + this.iconHeight) + 15);
            let newPos = cc.v2(col.position.x, -1668);
            let moveAction1 = cc.moveTo(0.1, cc.v2(col.position.x, 20));
            let moveAction2 = cc.moveTo(this.TIME_COL_FINISH * this.SPEED, newPos);

            col.runAction(cc.sequence(
                cc.delayTime(this.TIME_DELAY_BETWEEN_COL * i * this.SPEED),
                moveAction1,
                moveAction2,
                cc.callFunc(() => {
                    //set item, roi move ve 0
                    // col.position = cc.v2(col.position.x, 0);
                    console.log(col.position.y);
                })
            ));
        }
        this.node.runAction(cc.sequence(
            cc.delayTime(this.TIME_COL_FINISH * this.SPEED + this.TIME_DELAY_BETWEEN_COL * 4 * this.SPEED),
            cc.callFunc(() => {
                //set lai icon cho cac item o dau hang
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 5; j++) {
                        let indexInCol = 2 - i;
                        let col = this.listCol[j];
                        let item = col.children[indexInCol];
                        let sprite = matrix[i * 5 + j];
                        if (sprite < 3) {
                            item.getComponent("Slot4Icon").setSpine(sprite);
                        } else {
                            item.getComponent("Slot4Icon").setSprite(this.listItemSpirte[sprite]);
                        }
                    }
                }
            })
        ));

    }

    spinResult(res: cmd.ReceiveResult | any) {
        // console.log(res);
        this.isSpining = true;

        if (this.musicSlotState == 1) {
            cc.audioEngine.play(this.soundSpin, false, 1);
        }

        let that = this;
        let successResult = [0, 1, 2, 3, 5, 6];
        let result = res.result;
        if (successResult.indexOf(result) === -1) {
            //fail
            if (result === 102) {
                //khong du tien
                console.log("so du khong du");
                App.instance.alertDialog.showMsg("Số dư tài khoản không đủ");

            } else {
                console.log("co loi xay ra");
            }
            return;
        }

        //set icon
        let matrix = res.matrix.split(",");
        this.spinEffect(matrix);

        if (!this.isTrial) {
            //tru tien
            let currentMoney = Configs.Login.Coin - this.arrLineSelected.length * this.listBet[this.betId];
            Tween.numberTo(this.moneyLabel, currentMoney, 0.3);
            Configs.Login.Coin = res.currentMoney;
        }

        //xong spin effect
        this.node.runAction(cc.sequence(
            cc.delayTime(this.TIME_COL_FINISH * this.SPEED + this.TIME_DELAY_BETWEEN_COL * 5 * this.SPEED),
            cc.callFunc(() => {
                // that.setButtonEnable(true);
                that.showWinEffect(res.prize, res.currentMoney, result);
                if (this.toggleFast.isChecked) {
                    that.spinFinish(true);
                } else {
                    if (res.linesWin !== "") that.showLineWin(res.linesWin.split(","));
                    else that.spinFinish(false);
                }

            })
        ));

        switch (result) {
            //res.result == 5 //bonus
            //res.result == 0 //khong an
            //res.result == 1 //thang thuong
            //res.result == 2 //thang lon
            //res.result == 3 //no hu
            //res.result == 6 //thang cuc lon
        }
    }

    spinFinish(hasDelay: boolean) {
        this.isSpining = false;
        var that = this;
        this.node.runAction(
            cc.sequence(
                cc.delayTime(hasDelay ? 1 : 0),
                cc.callFunc(() => {
                    if (that.toggleAuto.isChecked || that.toggleFast.isChecked) {
                        cc.log("spinFinish case 1 ");
                        that.spinClick();
                    } else {
                        cc.log("spinFinish case 2 ");
                        that.setButtonEnable(true);
                        that.setButtonAuto(true);
                        that.setButtonFlash(true);
                    }
                })
            )
        )

    }

    showWinEffect(prize: number, currentMoney: number, result: number) {
        //res.result == 5 //bonus
        //res.result == 0 //khong an
        //res.result == 1 //thang thuong
        //res.result == 2 //thang lon
        //res.result == 3 //no hu
        //res.result == 6 //thang cuc lon
        if (prize > 0) {
            if (result == 5) {
                //bonus
                if (this.musicSlotState == 1) {
                    cc.audioEngine.play(this.soundBonus, false, 1);
                }
                this.bonusNode.active = true;
                let label = this.bonusNode.getComponentInChildren(cc.Label);
                label.string = "";
                Tween.numberTo(label, prize, 0.3);

            } else if (result == 2 || result == 6) {
                //thang lon                
                if (this.musicSlotState == 1) {
                    cc.audioEngine.play(this.soundBigWin, false, 1);
                }
                this.bigWinNode.active = true;
                let label = this.bigWinNode.getComponentInChildren(cc.Label);
                label.string = "";
                Tween.numberTo(label, prize, 0.3);
            } else if (result == 3) {
                //no hu
                if (this.musicSlotState == 1) {
                    cc.audioEngine.play(this.soundJackpot, false, 1);
                }
                this.jackpotNode.active = true;
                let label = this.jackpotNode.getComponentInChildren(cc.Label);
                label.string = "";
                Tween.numberTo(label, prize, 0.3);
            } else {
                if (this.musicSlotState == 1) {
                    cc.audioEngine.play(this.soundSpinWin, false, 1);
                }
                this.winNormalBg.active = true;
            }

            Tween.numberTo(this.winLabel, prize, 0.3);
        } else {
            // K an
            if (this.musicSlotState == 1) {
                cc.audioEngine.play(this.soundSpinMis, false, 1);
            }
        }
        Tween.numberTo(this.totalWinLabel, prize, 0.3);
        Tween.numberTo(this.totalBetLabel, this.arrLineSelected.length * this.listBet[this.betId], 0.3);
        if (!this.isTrial) Tween.numberTo(this.moneyLabel, currentMoney, 0.3);

    }

    hideWinEffect() {
        this.winNormalBg.active = false;
        this.winLabel.string = "0";
        this.bonusNode.active = false;
        this.bigWinNode.active = false;
        this.jackpotNode.active = false;
    }

    showLineWin(lines: Array<number>) {
        cc.log("__________ showLineWin");
        if (lines.length == 0) return;
        cc.log("__________ showLineWin lines.length : ", lines.length);
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            let lineNode = this.lineWinParent.children[line - 1];
            lineNode.active = true;
        }

        let that = this;
        //hide all line
        this.lineWinParent.runAction(
            cc.sequence(
                cc.delayTime(1),
                cc.callFunc(() => {
                    that.hideWinEffect();
                    that.hideLineWin(false);
                })
            )
        );

        this.lineWinParent.runAction(
            cc.sequence(
                cc.delayTime(1.5),
                cc.callFunc(() => {
                    //active line one by one
                    for (let i = 0; i < lines.length; i++) {
                        let line = lines[i];
                        let lineNode = this.lineWinParent.children[line - 1];
                        this.lineWinParent.runAction(
                            cc.sequence(
                                cc.delayTime(i * this.TIME_DELAY_SHOW_LINE),
                                cc.callFunc(() => {
                                    lineNode.active = true;
                                    let mapLineArr = that.mapLine[line - 1];
                                    for (let i = 0; i < mapLineArr.length; i++) {
                                        let node = this.listActiveItem[mapLineArr[i]];
                                        node.getComponent("Slot4Icon").scale();
                                    }
                                }),
                                cc.delayTime(this.TIME_DELAY_SHOW_LINE),
                                cc.callFunc(() => {
                                    lineNode.active = false;
                                    cc.log("__________ showLineWin truoc spinFinish ");
                                    cc.log("__________ showLineWin truoc spinFinish lines.length - 1 : ", lines.length - 1);
                                    cc.log("__________ showLineWin truoc spinFinish i : ", i);
                                    if (i == lines.length - 1)
                                        that.spinFinish(false);
                                })
                            )

                        );
                    }
                })
            )
        );

    }

    hideLineWin(stopAction: boolean) {
        if (stopAction) this.lineWinParent.stopAllActions();
        this.lineWinParent.children.forEach(element => {
            element.active = false;
        });
    }

    setButtonEnable(active: boolean) {
        this.btnSpin.interactable = active;
    }

    setButtonAuto(active: boolean) {
        this.toggleAuto.interactable = active;
        this.toggleAuto.node.children[0].color = active ? cc.Color.WHITE : cc.Color.GRAY;
    }

    setButtonFlash(active: boolean) {
        this.toggleFast.interactable = active;
        this.toggleFast.node.children[0].color = active ? cc.Color.WHITE : cc.Color.GRAY;
    }

    //#region CHANGE BET
    changeBet() {
        if (this.musicSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }

        this.popupChooseBet.active = !this.popupChooseBet.active;
    }

    chooseBet(event, bet) {
        let oldIdx = this.betId;
        this.betId = parseInt(bet);;
        if (this.betId >= this.listBet.length) {
            this.betId = 0;
        }
        console.log("tam hung betId: "+this.betId);
        SlotNetworkClient.getInstance().send(new cmd.SendChangeRoom(oldIdx, this.betId));
       // SlotNetworkClient.getInstance().send(new cmd.SendSubcribe(this.betId));

        this.currentBetLabel.string = Utils.formatNumber(this.listBet[this.betId]);
        this.popupChooseBet.active = false;
    }


    showGuide() {
        this.popupGuide.active = true;
    }

    closeGuide() {
        this.popupGuide.active = false;
    }


    //#endregion

    //#region CHOOSE LINE
    showChooseLine() {
        if (this.musicSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        this.chooseLineScript.show();
    }
    //#endregion

    changeSpeed() {
        if (this.musicSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        this.SPEED = this.toggleFast.isChecked ? 0.5 : 1;
        this.setButtonAuto(!this.toggleFast.isChecked);
        if (this.toggleFast.isChecked && !this.isSpining) {
            this.spinClick();
        }
    }

    setAutoSpin() {
        if (this.musicSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        cc.log("Slot 4 setAutoSpin toggleAuto : ", this.toggleAuto.isChecked);
        cc.log("Slot 4 setAutoSpin isSpining : ", this.isSpining);
        this.setButtonFlash(!this.toggleAuto.isChecked);
        if (this.toggleAuto.isChecked && !this.isSpining) {
            this.spinClick();
        }
    }

    changeMode() {
        this.isTrial = this.toggleTrial.isChecked;
    }
    // update (dt) {}

    actBack() {
        if (this.musicSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        cc.audioEngine.stopAll();
        SlotNetworkClient.getInstance().send(new cmd.SendSubcribe(this.betId));
        App.instance.loadScene("Lobby");
    }
}
