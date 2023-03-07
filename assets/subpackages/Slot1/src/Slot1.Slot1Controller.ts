import cmd from "./Slot1.Cmd";
import Tween from "../../../scripts/common/Tween";
import InPacket from "../../../scripts/networks/Network.InPacket";
import SlotNetworkClient from "../../../scripts/networks/SlotNetworkClient";
import Configs from "../../../scripts/common/Configs";
import Utils from "../../../scripts/common/Utils";
import TrialResults from "./Slot1.TrialResults";
import PopupSelectLine from "./Slot1.PopupSelectLine";
import PopupBonus from "./Slot1.PopupBonus";
import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import App from "../../../scripts/common/App";

const { ccclass, property } = cc._decorator;

@ccclass
export class Slot1Controller extends cc.Component {

    @property([cc.SpriteFrame])
    sprFrameItems: cc.SpriteFrame[] = [];
    @property([cc.SpriteFrame])
    sprFrameItemsBlur: cc.SpriteFrame[] = [];
    @property(cc.Node)
    columns: cc.Node = null;
    @property(cc.Node)
    itemTemplate: cc.Node = null;
    @property(cc.Label)
    lblJackpot: cc.Label = null;
    @property(cc.Label)
    lblCoin: cc.Label = null;
    @property(cc.Label)
    lblWinNow: cc.Label = null;
    @property(cc.Label)
    lblLine: cc.Label = null;
    @property(cc.Label)
    lblBet: cc.Label = null;
    @property(cc.Label)
    lblTotalBet: cc.Label = null;
    @property(cc.Node)
    toast: cc.Node = null;
    @property(cc.Toggle)
    toggleAuto: cc.Toggle = null;
    @property(cc.Toggle)
    toggleBoost: cc.Toggle = null;
    @property(cc.Button)
    btnTrial: cc.Button = null;
    @property(cc.SpriteFrame)
    sprFrameTrial: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    sprFrameTrial2: cc.SpriteFrame = null;
    @property(cc.Button)
    btnSpin: cc.Button = null;
    @property(cc.Button)
    btnBack: cc.Button = null;
    @property(cc.Button)
    btnBet: cc.Button = null;
    @property(cc.Button)
    btnLine: cc.Button = null;
    @property(cc.Node)
    linesWin: cc.Node = null;
    @property(cc.Node)
    panelSetting: cc.Node = null;
    @property(cc.Node)
    effectWinCash: cc.Node = null;
    @property(cc.Node)
    effectBigWin: cc.Node = null;
    @property(cc.Node)
    effectJackpot: cc.Node = null;
    @property(cc.Node)
    effectBonus: cc.Node = null;
    @property(PopupSelectLine)
    popupSelectLine: PopupSelectLine = null;
    @property(PopupBonus)
    popupBonus: PopupBonus = null;

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
    @property(cc.Label)
    labelUsername: cc.Label = null;
    @property(cc.Node)
    fxVoLong: cc.Node = null;
    @property(cc.Node)
    fxDuongPho: cc.Node = null;
    @property(cc.Node)
    fxChuyenNghiep: cc.Node = null;
    @property(cc.Node)
    fxVuThan: cc.Node = null;

    @property(cc.Node)
    soundOff: cc.Node = null;
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

    private rollStartItemCount = 15;
    private rollAddItemCount = 10;
    private spinDuration = 1.2;
    private addSpinDuration = 0.3;
    private itemHeight = 0;
    private betIdx = 0;
    private listBet = [100, 1000, 5000, 10000];
    private listBetLabel = ["100", "1K", "5K", "10K"];
    private arrLineSelect = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    private isSpined = true;
    private isTrial = false;
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
    private lastSpinRes = null;

    private musicSlotState = null;
    private soundSlotState = null;
    private remoteMusicBackground = null;

    settingMusic() {
        this.musicOff.active = !this.musicOff.active;
        if (this.musicOff.active) {
            cc.audioEngine.stop(this.remoteMusicBackground);
            this.musicSlotState = 0;
        } else {
            var musicId = this.randomBetween(0, 4);
            this.remoteMusicBackground = cc.audioEngine.playMusic(this.musicBackground[musicId], true);
            this.musicSlotState = 1;
        }
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        cc.sys.localStorage.setItem("music_Slot_1", "" + this.musicSlotState);
    }

    settingSound() {
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        this.soundOff.active = !this.soundOff.active;
        if (this.soundOff.active) {
            this.soundSlotState = 0;
        } else {
            this.soundSlotState = 1;
        }
        cc.sys.localStorage.setItem("sound_Slot_1", "" + this.soundSlotState);
    }

    start() {
        // musicSave :   0 == OFF , 1 == ON
        var musicSave = cc.sys.localStorage.getItem("music_Slot_1");
        if (musicSave != null) {
            this.musicSlotState = parseInt(musicSave);
        } else {
            this.musicSlotState = 1;
            cc.sys.localStorage.setItem("music_Slot_1", "1");
        }

        // soundSave :   0 == OFF , 1 == ON
        var soundSave = cc.sys.localStorage.getItem("sound_Slot_1");
        if (soundSave != null) {
            this.soundSlotState = parseInt(soundSave);
        } else {
            this.soundSlotState = 1;
            cc.sys.localStorage.setItem("sound_Slot_1", "1");
        }

        if (this.musicSlotState == 0) {
            this.musicOff.active = true;
        } else {
            this.musicOff.active = false;
        }

        if (this.soundSlotState == 0) {
            this.soundOff.active = true;
        } else {
            this.soundOff.active = false;
        }

        if (this.musicSlotState == 1) {
            var musicId = this.randomBetween(0, 4);
            this.remoteMusicBackground = cc.audioEngine.playMusic(this.musicBackground[musicId], true);
        }

        this.itemHeight = this.itemTemplate.height;
        for (let i = 0; i < this.columns.childrenCount; i++) {
            let column = this.columns.children[i];
            let count = this.rollStartItemCount + i * this.rollAddItemCount;
            for (let j = 0; j < count; j++) {
                let item = cc.instantiate(this.itemTemplate);
                item.parent = column;
                if (j >= 3) {
                    item.children[0].active = true;
                    item.children[1].active = false;
                    item.children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItemsBlur[Utils.randomRangeInt(0, this.sprFrameItemsBlur.length)];
                } else {
                    var iconId = Utils.randomRangeInt(0, this.sprFrameItems.length);
                    item.children[0].active = false;
                    item.children[1].active = false;
                    if (iconId == 0) {
                        item.children[1].active = true;
                    } else {
                        item.children[0].active = true;
                        item.children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[iconId];
                    }
                }
            }
        }
        this.itemTemplate.removeFromParent();
        this.itemTemplate = null;

        SlotNetworkClient.getInstance().addOnClose(() => {
            this.actBack();
        }, this);

        SlotNetworkClient.getInstance().addListener((data) => {
            let inpacket = new InPacket(data);
            switch (inpacket.getCmdId()) {
                case cmd.Code.UPDATE_POT:
                    {
                        let res = new cmd.ReceiveUpdatePot(data);

                        cc.log("Slot1 Jackpot res : ", JSON.stringify(res));
                        this.fxVoLong.active = false;
                        this.fxDuongPho.active = false;
                        this.fxChuyenNghiep.active = false;
                        this.fxVuThan.active = false;

                        Tween.numberTo(this.labelRoom100, res.valueRoom1, 0.3);
                        Tween.numberTo(this.labelRoom1k, res.valueRoom2, 0.3);
                        Tween.numberTo(this.labelRoom5k, res.valueRoom3, 0.3);
                        Tween.numberTo(this.labelRoom10k, res.valueRoom4, 0.3);

                        switch (this.betIdx) {
                            case 0:
                                Tween.numberTo(this.lblJackpot, res.valueRoom1, 0.3);
                                this.fxVoLong.active = true;
                                break;
                            case 1:
                                Tween.numberTo(this.lblJackpot, res.valueRoom2, 0.3);
                                this.fxDuongPho.active = true;
                                break;
                            case 2:
                                Tween.numberTo(this.lblJackpot, res.valueRoom3, 0.3);
                                this.fxChuyenNghiep.active = true;
                                break;
                            case 3:
                                Tween.numberTo(this.lblJackpot, res.valueRoom4, 0.3);
                                this.fxVuThan.active = true;
                                break;
                        }
                    }
                    break;
                case cmd.Code.UPDATE_RESULT:
                    {
                        let res = new cmd.ReceiveResult(data);
                        this.onSpinResult(res);
                    }
                    break;
            }
        }, this);

        SlotNetworkClient.getInstance().send(new cmd.SendSubcribe(this.betIdx));
        this.stopShowLinesWin();
        this.toast.active = false;
        this.effectWinCash.active = false;
        this.effectJackpot.active = false;
        this.effectBigWin.active = false;
        // this.panelSetting.active = false;
        this.popupSelectLine.onSelectedChanged = (lines) => {
            this.arrLineSelect = lines;
            this.lblLine.string = this.arrLineSelect.length.toString();
            Tween.numberTo(this.lblTotalBet, this.arrLineSelect.length * this.listBet[this.betIdx], 0.3);
        }
        this.lblTotalBet.string = Utils.formatNumber(this.arrLineSelect.length * this.listBet[this.betIdx]);

        BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
            Tween.numberTo(this.lblCoin, Configs.Login.Coin, 0.3);
        }, this);
        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);

        App.instance.showErrLoading("Đang kết nối tới server...");
        SlotNetworkClient.getInstance().checkConnect(() => {
            App.instance.showLoading(false);
        });

        this.labelUsername.string = Configs.Login.Nickname;

    }

    actBet() {
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        if (this.isTrial) {
            this.showToast("Tính năng này không hoạt động ở chế độ chơi thử.");
            return;
        }
        this.popupChooseBet.active = !this.popupChooseBet.active;
    }

    chooseBet(event, bet) {
        // var oldIdx = this.betIdx;
        // this.betIdx++;
        // if (this.betIdx == this.listBet.length) {
        //     this.betIdx = 0;
        // }
        // this.lblBet.string = this.listBetLabel[this.betIdx];
        // Tween.numberTo(this.lblTotalBet, this.arrLineSelect.length * this.listBet[this.betIdx], 0.3);
        // SlotNetworkClient.getInstance().send(new cmd.SendChangeRoom(oldIdx, this.betIdx));

        var oldIdx = this.betIdx;
        this.betIdx = parseInt(bet);
        if (this.betIdx == this.listBet.length) {
            this.betIdx = 0;
        }
        this.lblBet.string = this.listBetLabel[this.betIdx];
        Tween.numberTo(this.lblTotalBet, this.arrLineSelect.length * this.listBet[this.betIdx], 0.3);
        SlotNetworkClient.getInstance().send(new cmd.SendChangeRoom(oldIdx, this.betIdx));

        this.popupChooseBet.active = false;

        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
    }

    actLine() {
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        if (this.isTrial) {
            this.showToast("Tính năng này không hoạt động ở chế độ chơi thử.");
            return;
        }
        this.popupSelectLine.show();
    }

    actBack() {
        SlotNetworkClient.getInstance().send(new cmd.SendUnSubcribe(this.betIdx));
        cc.audioEngine.stopAll();
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        App.instance.loadScene("Lobby");
    }

    actSpin() {
        cc.audioEngine.stopAllEffects();
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        this.spin();
    }

    actHidden() {
        this.showToast("Tính năng đang phát triển.");
    }

    actTrial() {
        this.isTrial = !this.isTrial;
        this.btnTrial.getComponent(cc.Sprite).spriteFrame = this.isTrial ? this.sprFrameTrial2 : this.sprFrameTrial;
        if (this.isTrial) {
            this.lblLine.string = "20";
            this.lblBet.string = "100";
            Tween.numberTo(this.lblTotalBet, 2000, 0.3);
        } else {
            this.lblLine.string = this.arrLineSelect.length.toString();
            this.lblBet.string = this.listBetLabel[this.betIdx];
            Tween.numberTo(this.lblTotalBet, this.arrLineSelect.length * this.listBet[this.betIdx], 0.3);
        }
    }

    actSetting() {
        this.panelSetting.active = !this.panelSetting.active;
    }

    toggleAutoOnCheck() {
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        if (this.toggleAuto.isChecked && this.isTrial) {
            this.toggleAuto.isChecked = false;
            this.showToast("Tính năng này không hoạt động ở chế độ chơi thử.");
            return;
        }
        if (this.toggleAuto.isChecked) {
            this.spin();
            this.toggleBoost.interactable = false;
        } else {
            this.toggleBoost.interactable = true;
            if (this.isSpined) {
                this.setEnabledAllButtons(true);
            }
        }
    }

    toggleBoostOnCheck() {
        if (this.soundSlotState == 1) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        if (this.toggleBoost.isChecked && this.isTrial) {
            this.toggleBoost.isChecked = false;
            this.showToast("Tính năng này không hoạt động ở chế độ chơi thử.");
            return;
        }
        if (this.toggleBoost.isChecked) {
            this.spin();
            this.toggleAuto.interactable = false;
        } else {
            this.toggleAuto.interactable = true;
            if (this.isSpined) {
                this.setEnabledAllButtons(true);
            }
        }
    }

    private spin() {
        if (!this.isSpined) return;
        this.isSpined = false;
        this.stopAllEffects();
        this.stopShowLinesWin();
        this.setEnabledAllButtons(false);
        if (!this.isTrial) {
            SlotNetworkClient.getInstance().send(new cmd.SendPlay(this.listBet[this.betIdx], this.arrLineSelect.toString()));
        } else {
            var rIdx = Utils.randomRangeInt(0, TrialResults.results.length);
            this.onSpinResult(TrialResults.results[rIdx]);
        }
    }

    private stopSpin() {
        for (var i = 0; i < this.columns.childrenCount; i++) {
            var roll = this.columns.children[i];
            roll.stopAllActions();
            roll.setPosition(cc.v2(roll.getPosition().x, 0));
        }
    }

    private setEnabledAllButtons(enabled: boolean) {
        this.btnSpin.interactable = enabled;
        this.btnBack.interactable = enabled;
        this.btnBet.interactable = enabled;
        this.btnLine.interactable = enabled;
        this.btnTrial.interactable = enabled;
    }

    private onSpinResult(res: cmd.ReceiveResult | any) {
        this.stopSpin();

        var successResult = [0, 1, 2, 3, 5, 6];
        //res.result == 5 //bonus
        //res.result == 0 //khong an
        //res.result == 1 //thang thuong
        //res.result == 2 //thang lon
        //res.result == 3 //no hu
        //res.result == 6 //thang cuc lon
        if (successResult.indexOf(res.result) === -1) {
            this.isSpined = true;

            this.toggleAuto.isChecked = false;
            this.toggleAuto.interactable = true;
            this.toggleBoost.isChecked = false;
            this.toggleBoost.interactable = true;


            this.setEnabledAllButtons(true);
            switch (res.result) {
                case 102:
                    this.showToast("Số dư không đủ, vui lòng nạp thêm.");
                    break;
                default:
                    this.showToast("Có lỗi sảy ra, vui lòng thử lại.");
                    break;
            }
            return;
        }
        this.lastSpinRes = res;

        if (!this.isTrial) {
            let curMoney = Configs.Login.Coin - this.arrLineSelect.length * this.listBet[this.betIdx];
            Tween.numberTo(this.lblCoin, curMoney, 0.3);
            Configs.Login.Coin = res.currentMoney;
        }

        let matrix = res.matrix.split(",");
        let timeScale = this.toggleBoost.isChecked ? 0.5 : 1;
        for (let i = 0; i < this.columns.childrenCount; i++) {
            let roll = this.columns.children[i];
            let step1Pos = this.itemHeight * 0.3;
            let step2Pos = -this.itemHeight * roll.childrenCount + this.itemHeight * 3 - this.itemHeight * 0.3;
            let step3Pos = -this.itemHeight * roll.childrenCount + this.itemHeight * 3;
            roll.runAction(cc.sequence(
                cc.delayTime(0.2 * i * timeScale),
                cc.moveTo(0.2 * timeScale, cc.v2(roll.position.x, step1Pos)).easing(cc.easeQuadraticActionOut()),
                cc.moveTo((this.spinDuration + this.addSpinDuration * i) * timeScale, cc.v2(roll.position.x, step2Pos)).easing(cc.easeQuadraticActionInOut()),
                cc.moveTo(0.2 * timeScale, cc.v2(roll.position.x, step3Pos)).easing(cc.easeQuadraticActionIn()),
                cc.callFunc(() => {
                    roll.setPosition(cc.v2(roll.position.x, 0));
                    if (i === 4) {
                        this.spined();
                    }
                })
            ));
            roll.runAction(cc.sequence(
                cc.delayTime((0.47 + 0.2 * i) * timeScale),
                cc.callFunc(() => {
                    var children = roll.children;

                    children[2].children[0].active = false;
                    children[2].children[1].active = false;
                    if (parseInt(matrix[i]) == 0) {
                        children[2].children[1].active = true;
                    } else {
                        children[2].children[0].active = true;
                        children[2].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[i])];
                    }

                    children[1].children[0].active = false;
                    children[1].children[1].active = false;
                    if (parseInt(matrix[5 + i]) == 0) {
                        children[1].children[1].active = true;
                    } else {
                        children[1].children[0].active = true;
                        children[1].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[5 + i])];
                    }

                    children[0].children[0].active = false;
                    children[0].children[1].active = false;
                    if (parseInt(matrix[10 + i]) == 0) {
                        children[0].children[1].active = true;
                    } else {
                        children[0].children[0].active = true;
                        children[0].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[10 + i])];
                    }


                    children[children.length - 1].children[0].active = false;
                    children[children.length - 1].children[1].active = false;
                    if (parseInt(matrix[i]) == 0) {
                        children[children.length - 1].children[1].active = true;
                    } else {
                        children[children.length - 1].children[0].active = true;
                        children[children.length - 1].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[i])];
                    }

                    children[children.length - 2].children[0].active = false;
                    children[children.length - 2].children[1].active = false;
                    if (parseInt(matrix[5 + i]) == 0) {
                        children[children.length - 2].children[1].active = true;
                    } else {
                        children[children.length - 2].children[0].active = true;
                        children[children.length - 2].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[5 + i])];
                    }

                    children[children.length - 3].children[0].active = false;
                    children[children.length - 3].children[1].active = false;
                    if (parseInt(matrix[10 + i]) == 0) {
                        children[children.length - 3].children[1].active = true;
                    } else {
                        children[children.length - 3].children[0].active = true;
                        children[children.length - 3].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[10 + i])];
                    }


                    // children[2].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[i])];
                    // children[1].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[5 + i])];
                    // children[0].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[10 + i])];

                    // children[children.length - 1].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[i])];
                    // children[children.length - 2].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[5 + i])];
                    // children[children.length - 3].children[0].getComponent(cc.Sprite).spriteFrame = this.sprFrameItems[parseInt(matrix[10 + i])];
                })
            ));
        }
    }

    private spined() {
        var successResult = [0, 1, 3, 5, 6];
        switch (this.lastSpinRes.result) {
            case 0://k an
                if (this.soundSlotState == 1) {
                    cc.audioEngine.play(this.soundSpinMis, false, 1);
                }
                this.showLineWins();
                break;
            case 1:// thang thuong
                if (this.soundSlotState == 1) {
                    cc.audioEngine.play(this.soundSpinWin, false, 1);
                }
                this.showLineWins();
                break;
            case 2:// thang lon
                if (this.soundSlotState == 1) {
                    cc.audioEngine.play(this.soundBigWin, false, 1);
                }
                this.showEffectBigWin(this.lastSpinRes.prize, () => {
                    this.showLineWins();
                });
                break;
            case 3://jackpot
                if (this.soundSlotState == 1) {
                    cc.audioEngine.play(this.soundJackpot, false, 1);
                }
                this.showEffectJackpot(this.lastSpinRes.prize, () => {
                    this.showLineWins();
                });
                break;
            case 6://thang sieu lon
                if (this.soundSlotState == 1) {
                    cc.audioEngine.play(this.soundBigWin, false, 1);
                }
                this.showEffectBigWin(this.lastSpinRes.prize, () => {
                    this.showLineWins();
                });
                break;
            case 5://bonus
                if (this.soundSlotState == 1) {
                    cc.audioEngine.play(this.soundBonus, false, 1);
                }
                this.showEffectBonus(() => {
                    this.popupBonus.showBonus(this.isTrial ? 100 : this.listBet[this.betIdx], this.lastSpinRes.haiSao, () => {
                        this.showLineWins();
                    });
                });
                break;
        }
    }

    private stopAllEffects() {
        this.effectJackpot.stopAllActions();
        this.effectJackpot.active = false;
        this.effectBigWin.stopAllActions();
        this.effectBigWin.active = false;
    }

    private showLineWins() {
        this.isSpined = true;
        Tween.numberTo(this.lblWinNow, this.lastSpinRes.prize, 0.3);
        if (!this.isTrial) BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
        if (!this.toggleAuto.isChecked && !this.toggleBoost.isChecked) this.setEnabledAllButtons(true);

        this.linesWin.stopAllActions();
        let linesWin = this.lastSpinRes.linesWin.split(",");
        linesWin = Utils.removeDups(linesWin);
        let matrix = this.lastSpinRes.matrix.split(",");
        let linesWinChildren = this.linesWin.children;
        let rolls = this.columns.children;
        let actions = [];
        for (let i = 0; i < linesWinChildren.length; i++) {
            linesWinChildren[i].active = linesWin.indexOf("" + (i + 1)) >= 0;;
        }
        if (this.lastSpinRes.prize > 0) {
            this.showWinCash(this.lastSpinRes.prize);
            actions.push(cc.delayTime(1.5));
            actions.push(cc.callFunc(function () {
                for (let i = 0; i < linesWinChildren.length; i++) {
                    linesWinChildren[i].active = false;
                }
            }));
            actions.push(cc.delayTime(0.3));
            if (!this.toggleBoost.isChecked) {
                for (let i = 0; i < linesWin.length; i++) {
                    let lineIdx = parseInt(linesWin[i]) - 1;
                    let line = linesWinChildren[lineIdx];
                    actions.push(cc.callFunc(() => {
                        line.active = true;
                        let mLine = this.mapLine[lineIdx];
                        let countWin = {};
                        let wildId = "1";
                        let itemCount3Win = ["0", "1", "2", "3", "4"];
                        let itemCount4Win = ["6", "5"];
                        for (let i = 0; i < mLine.length; i++) {
                            let itemId = matrix[mLine[i]];
                            if (countWin.hasOwnProperty(itemId)) {
                                countWin[itemId]++;
                            } else {
                                countWin[itemId] = 1;
                            }
                        }
                        let itemIdTemp = [];
                        if (countWin.hasOwnProperty(wildId)) {
                            itemIdTemp.push(wildId);
                            if (countWin[wildId] < 5) {
                                for (var k in countWin) {
                                    if (k !== wildId) {
                                        countWin[k] += countWin[wildId];
                                    }
                                }
                            }
                        }
                        // console.log(countWin);
                        for (let k in countWin) {
                            if (itemCount3Win.indexOf(k) >= 0 && countWin[k] >= 3) {
                                itemIdTemp.push(k);
                            } else if (itemCount4Win.indexOf(k) >= 0 && countWin[k] >= 4) {
                                itemIdTemp.push(k);
                            }
                        }
                        // console.log(itemIdTemp);
                        for (let i = 0; i < mLine.length; i++) {
                            let itemId = mLine[i];
                            let itemIdInMatrix = matrix[mLine[i]];
                            let itemIdNumber = parseInt(itemId.toString());
                            let itemRow = parseInt((itemIdNumber / 5).toString());
                            if (itemIdTemp.indexOf(itemIdInMatrix) >= 0) {
                                rolls[i].children[2 - itemRow].stopAllActions();
                                rolls[i].children[2 - itemRow].runAction(cc.repeatForever(cc.sequence(
                                    cc.scaleTo(0.2, 1.1),
                                    cc.scaleTo(0.2, 1)
                                )));
                            }
                            // console.log("itemId: "+itemId + "itemIdx: "+itemRow);
                        }
                    }));
                    actions.push(cc.delayTime(1));
                    actions.push(cc.callFunc(() => {
                        line.active = false;
                        this.stopAllItemEffect();
                    }));
                    actions.push(cc.delayTime(0.1));
                }
            }
        }
        if (actions.length == 0) {
            actions.push(cc.callFunc(() => {
                //fixed call cc.sequence.apply
            }))
        }
        actions.push(cc.callFunc(() => {
            if (this.toggleBoost.isChecked || this.toggleAuto.isChecked) {
                this.spin();
            }
        }));
        this.linesWin.runAction(cc.sequence.apply(null, actions));
    }

    private stopShowLinesWin() {
        this.linesWin.stopAllActions();
        for (var i = 0; i < this.linesWin.childrenCount; i++) {
            this.linesWin.children[i].active = false;
        }
        this.stopAllItemEffect();
    }

    private showWinCash(cash: number) {
        this.effectWinCash.stopAllActions();
        this.effectWinCash.active = true;
        let label = this.effectWinCash.getComponentInChildren(cc.Label);
        label.string = "0";
        this.effectWinCash.opacity = 0;
        this.effectWinCash.runAction(cc.sequence(
            cc.fadeIn(0.3),
            cc.callFunc(() => {
                Tween.numberTo(label, cash, 0.5);
            }),
            cc.delayTime(1.5),
            cc.fadeOut(0.3),
            cc.callFunc(() => {
                this.effectWinCash.active = false;
            })
        ));
    }

    private showEffectBigWin(cash: number, cb: () => void) {
        this.effectBigWin.stopAllActions();
        this.effectBigWin.active = true;
        this.effectBigWin.getComponentInChildren(sp.Skeleton).setAnimation(0, "animation", false);
        let label = this.effectBigWin.getComponentInChildren(cc.Label);
        label.node.active = false;

        this.effectBigWin.runAction(cc.sequence(
            cc.delayTime(1),
            cc.callFunc(() => {
                label.string = "";
                label.node.active = true;
                Tween.numberTo(label, cash, 1);
            }),
            cc.delayTime(3),
            cc.callFunc(() => {
                this.effectBigWin.active = false;
                if (cb != null) cb();
            })
        ));
    }

    private showEffectJackpot(cash: number, cb: () => void = null) {
        this.effectJackpot.stopAllActions();
        this.effectJackpot.active = true;
        this.effectJackpot.getComponentInChildren(sp.Skeleton).setAnimation(0, "animation", false);
        let label = this.effectJackpot.getComponentInChildren(cc.Label);
        label.node.active = false;

        this.effectJackpot.runAction(cc.sequence(
            cc.delayTime(1),
            cc.callFunc(() => {
                label.string = "";
                label.node.active = true;
                Tween.numberTo(label, cash, 1);
            }),
            cc.delayTime(3),
            cc.callFunc(() => {
                this.effectJackpot.active = false;
                if (cb != null) cb();
            })
        ));
    }

    private showEffectBonus(cb: () => void) {
        this.effectBonus.stopAllActions();
        this.effectBonus.active = true;
        this.effectBonus.getComponentInChildren(sp.Skeleton).setAnimation(0, "animation", false);

        this.effectBonus.runAction(cc.sequence(
            cc.delayTime(3),
            cc.callFunc(() => {
                this.effectBonus.active = false;
                if (cb != null) cb();
            })
        ));
    }

    private stopAllItemEffect() {
        for (let i = 0; i < this.columns.childrenCount; i++) {
            let children = this.columns.children[i].children;
            children[0].stopAllActions();
            children[1].stopAllActions();
            children[2].stopAllActions();

            children[0].runAction(cc.scaleTo(0.1, 1));
            children[1].runAction(cc.scaleTo(0.1, 1));
            children[2].runAction(cc.scaleTo(0.1, 1));
        }
    }

    private showToast(msg: string) {
        this.toast.getComponentInChildren(cc.Label).string = msg;
        this.toast.stopAllActions();
        this.toast.active = true;
        this.toast.runAction(cc.sequence(cc.delayTime(2), cc.callFunc(() => {
            this.toast.active = false;
        })));
    }

    randomBetween(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}
export default Slot1Controller;