import cmd from "./CaoThap.Cmd";
import MiniGame from "../../../Lobby/src/MiniGame";
import MiniGameNetworkClient from "../../../scripts/networks/MiniGameNetworkClient";
import InPacket from "../../../scripts/networks/Network.InPacket";
import Utils from "../../../scripts/common/Utils";
import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import Configs from "../../../scripts/common/Configs";
import Tween from "../../../scripts/common/Tween";

const { ccclass, property } = cc._decorator;

@ccclass("CaoThap.ButtonBet")
export class ButtonBet {
    @property(cc.Button)
    button: cc.Button = null;
    @property(cc.SpriteFrame)
    sfNormal: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    sfActive: cc.SpriteFrame = null;

    _isActive = false;

    setActive(isActive: boolean) {
        this._isActive = isActive;
        this.button.getComponent(cc.Sprite).spriteFrame = isActive ? this.sfActive : this.sfNormal;
        this.button.interactable = !isActive;
    }
}

@ccclass
export default class CaoThapController extends MiniGame {
    @property(cc.SpriteAtlas)
    sprAtlasCards: cc.SpriteAtlas = null;
    @property([ButtonBet])
    buttonBets: ButtonBet[] = [];
    @property(cc.Label)
    lblJackpot: cc.Label = null;
    @property(cc.Label)
    lblSession: cc.Label = null;
    @property(cc.Label)
    lblUp: cc.Label = null;
    @property(cc.Label)
    lblCurrent: cc.Label = null;
    @property(cc.Label)
    lblDown: cc.Label = null;
    @property(cc.Label)
    lblStatus: cc.Label = null;
    @property(cc.Label)
    lblTime: cc.Label = null;
    @property(cc.Button)
    btnNewTurn: cc.Button = null;
    @property(cc.Button)
    btnClose: cc.Button = null;
    @property(cc.Button)
    btnPlay: cc.Button = null;
    @property(cc.Button)
    btnUp: cc.Button = null;
    @property(cc.Button)
    btnDown: cc.Button = null;
    @property(cc.Sprite)
    sprAt: cc.Sprite = null;
    @property(cc.Sprite)
    sprCard: cc.Sprite = null;
    @property(cc.Label)
    lblToast: cc.Label = null;
    @property(cc.Label)
    lblWinCoin: cc.Label = null;
    @property([cc.Node])
    public popups: cc.Node[] = [];

    private readonly listBet = [1000, 10000, 50000, 100000, 500000];
    private betIdx = 0;
    private oldBetIdx = 0;
    private isCanChangeBet = true;
    private currentTime = 0;
    private currentTimeInt = 0;
    private isPlaying = false;
    private numA = 0;
    private cardNameMap = new Object();

    start() {
        for (let i = 0; i < 13; i++) {
            for (let j = 0; j < 4; j++) {
                let cardPoint = (i + 2).toString();
                switch (cardPoint) {
                    case "11":
                        cardPoint = "J";
                        break;
                    case "12":
                        cardPoint = "Q";
                        break;
                    case "13":
                        cardPoint = "K";
                        break;
                    case "14":
                        cardPoint = "A";
                        break;
                }
                let cardSuit = "";
                switch (j) {
                    case 0:
                        cardSuit = "♠";
                        break;
                    case 1:
                        cardSuit = "♣";
                        break;
                    case 2:
                        cardSuit = "♦";
                        break;
                    case 3:
                        cardSuit = "♥";
                        break;
                }
                this.cardNameMap[i * 4 + j] = cardPoint + cardSuit;
            }
        }

        for (let i = 0; i < this.buttonBets.length; i++) {
            var btn = this.buttonBets[i];
            btn.setActive(i == this.betIdx);
            btn.button.node.on("click", () => {
                if (!this.isCanChangeBet) {
                    this.showToast("Bạn thao tác quá nhanh.");
                    return;
                }
                this.oldBetIdx = this.betIdx;
                this.betIdx = i;
                for (let i = 0; i < this.buttonBets.length; i++) {
                    this.buttonBets[i].setActive(i == this.betIdx);
                }
                this.isCanChangeBet = false;
                this.scheduleOnce(() => {
                    this.isCanChangeBet = true;
                }, 1);
                MiniGameNetworkClient.getInstance().send(new cmd.SendChangeRoom(this.oldBetIdx, this.betIdx));
            });
        }

        BroadcastReceiver.register(BroadcastReceiver.USER_LOGOUT, () => {
            if (!this.node.active) return;
            this.dismiss();
        }, this);

        MiniGameNetworkClient.getInstance().addOnClose(() => {
            if (!this.node.active) return;
            this.dismiss();
        }, this);

        MiniGameNetworkClient.getInstance().addListener((data: Uint8Array) => {
            if (!this.node.active) return;
            let inpacket = new InPacket(data);
            switch (inpacket.getCmdId()) {
                case cmd.Code.SCRIBE: {
                    let res = new cmd.ReceiveScribe(data);
                    // console.log(res);
                    this.betIdx = res.roomId;
                    for (let i = 0; i < this.buttonBets.length; i++) {
                        this.buttonBets[i].setActive(i == this.betIdx);
                    }
                    this.btnPlay.interactable = true;
                    for (let i = 0; i < this.buttonBets.length; i++) {
                        this.buttonBets[i].button.interactable = true;
                    }
                    break;
                }
                case cmd.Code.UPDATE_INFO: {
                    let res = new cmd.ReceiveUpdateInfo(data);
                    // console.log(res);
                    this.numA = res.numA;
                    this.lblUp.string = res.money1 == 0 ? "" : Utils.formatNumber(res.money1);
                    this.lblCurrent.string = Utils.formatNumber(res.money2);
                    this.lblDown.string = res.money3 == 0 ? "" : Utils.formatNumber(res.money3);
                    this.lblSession.string = "#" + res.referenceId.toString();
                    this.sprCard.spriteFrame = this.sprAtlasCards.getSpriteFrame("card" + res.card);
                    this.sprAt.fillRange = this.numA / 3;
                    this.currentTime = res.time;
                    this.btnNewTurn.interactable = res.step > 1;
                    this.btnPlay.node.active = false;
                    this.lblStatus.string = "";
                    this.btnUp.interactable = res.money1 > 0;
                    this.btnDown.interactable = res.money3 > 0;
                    for (let i = 0; i < this.buttonBets.length; i++) {
                        this.buttonBets[i].button.interactable = false;
                    }

                    let cards = res.cards.split(",");
                    for (let i = 0; i < cards.length - 1; i++) {
                        if (i > 0) this.lblStatus.string += ",";
                        this.lblStatus.string += this.cardNameMap[cards[i]];
                    }
                    this.isPlaying = true;
                    break;
                }
                case cmd.Code.UPDATE_TIME: {
                    let res = new cmd.ReceiveUpdateTime(data);
                    // console.log(res);
                    this.currentTime = res.time;
                    break;
                }
                case cmd.Code.START: {
                    let res = new cmd.ReceiveStart(data);
                    // console.log(res);
                    if (res.error != 0) {
                        if (res.error == 3) {
                            this.showToast("Số dư không đủ, vui lòng nạp thêm");
                            this.btnPlay.node.active = true;
                        }
                        return
                    }
                    Configs.Login.Coin = res.currentMoney;
                    BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                    this.lblStatus.string = "";
                    this.lblUp.string = "";
                    this.lblDown.string = "";
                    this.lblCurrent.string = Utils.formatNumber(res.money2);
                    this.lblSession.string = "#" + res.referenceId.toString();
                    this.sprAt.fillRange = 0;
                    this.btnNewTurn.interactable = false;
                    for (let i = 0; i < this.buttonBets.length; i++) {
                        this.buttonBets[i].button.interactable = false;
                    }
                    if (48 == res.card || 49 == res.card || 50 == res.card || 51 == res.card) {
                        this.numA++;
                    }
                    this.spinCard(res.card, () => {
                        this.lblStatus.string += this.cardNameMap[res.card];
                        this.lblUp.string = res.money1 == 0 ? "" : Utils.formatNumber(res.money1);
                        this.lblDown.string = res.money3 == 0 ? "" : Utils.formatNumber(res.money3);

                        this.btnUp.interactable = true && this.isPlaying && res.money1 > 0;
                        this.btnDown.interactable = true && this.isPlaying && res.money3 > 0;
                        this.sprAt.fillRange = this.numA / 3;
                    });
                    this.currentTime = 120;
                    this.isPlaying = true;
                    break;
                }
                case cmd.Code.PLAY: {
                    let res = new cmd.ReceivePlay(data);
                    // console.log(res);
                    this.currentTime = 120;
                    for (let i = 0; i < this.buttonBets.length; i++) {
                        this.buttonBets[i].button.interactable = false;
                    }
                    if (48 == res.card || 49 == res.card || 50 == res.card || 51 == res.card) {
                        this.numA++;
                    }
                    this.spinCard(res.card, () => {
                        if (this.lblStatus.string != "") this.lblStatus.string += ",";
                        this.lblStatus.string += this.cardNameMap[res.card];

                        this.lblUp.string = res.money1 == 0 ? "" : Utils.formatNumber(res.money1);
                        this.lblCurrent.string = Utils.formatNumber(res.money2);
                        this.lblDown.string = res.money3 == 0 ? "" : Utils.formatNumber(res.money3);

                        this.btnUp.interactable = this.isPlaying && res.money1 > 0;
                        this.btnDown.interactable = this.isPlaying && res.money3 > 0;
                        this.btnNewTurn.interactable = this.isPlaying;
                    });
                    break;
                }
                case cmd.Code.STOP: {
                    let res = new cmd.ReceiveStop(data);
                    // console.log(res);
                    this.isPlaying = false;
                    let timeDelay = 3;
                    switch (res.result) {
                        case 4:
                            timeDelay = 0.5;
                            break;
                    }
                    Configs.Login.Coin = res.currentMoney;
                    this.scheduleOnce(() => {
                        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                        this.lblStatus.string = "Nhấn nút \"Play\" để bắt đầu";
                        this.sprCard.spriteFrame = this.sprAtlasCards.getSpriteFrame("card52");
                        this.btnNewTurn.interactable = false;
                        this.btnPlay.node.active = true;
                        this.sprAt.fillRange = 0;
                        this.numA = 0;
                        for (let i = 0; i < this.buttonBets.length; i++) {
                            this.buttonBets[i].button.interactable = true;
                        }
                        this.lblTime.string = "2:00";
                        this.currentTime = 0;

                        this.lblUp.string = "";
                        this.lblDown.string = "";
                        this.lblCurrent.string = Utils.formatNumber(this.listBet[this.betIdx]);

                        //show win coin
                        this.lblWinCoin.node.stopAllActions();
                        this.lblWinCoin.node.position = cc.v2(-26, -16);
                        this.lblWinCoin.node.opacity = 0;
                        this.lblWinCoin.string = "+" + Utils.formatNumber(res.moneyExchange);
                        this.lblWinCoin.node.active = true;
                        this.lblWinCoin.node.runAction(cc.sequence(
                            cc.spawn(cc.fadeIn(0.2), cc.moveBy(2, cc.v2(0, 100))),
                            cc.fadeOut(0.15),
                            cc.callFunc(() => {
                                this.lblWinCoin.node.active = false;
                            })
                        ));
                    }, timeDelay);
                    break;
                }
                case cmd.Code.CHANGE_ROOM: {
                    let res = new cmd.ReceiveChangeRoom(data);
                    // console.log(res);
                    if (res.status != 0) {
                        this.betIdx = this.oldBetIdx;
                        for (let i = 0; i < this.buttonBets.length; i++) {
                            this.buttonBets[i].setActive(i == this.betIdx);
                        }
                    }
                    break;
                }
                case cmd.Code.UPDATE_JACKPOT: {
                    let res = new cmd.ReceiveUpdateJackpot(data);
                    Tween.numberTo(this.lblJackpot, res.value, 0.3);
                    break;
                }
            }
        }, this);
    }

    update(dt: number) {
        if (this.currentTime > 0) {
            this.currentTime = Math.max(0, this.currentTime - dt);

            let _currentTimeInt = parseInt(this.currentTime.toString());
            if (this.currentTimeInt != _currentTimeInt) {
                this.currentTimeInt = _currentTimeInt;
                this.lblTime.string = this.longToTime(this.currentTimeInt);
            }
        }
    }

    private showToast(message: string) {
        this.lblToast.string = message;
        let parent = this.lblToast.node.parent;
        parent.stopAllActions();
        parent.active = true;
        parent.opacity = 0;
        parent.runAction(cc.sequence(cc.fadeIn(0.1), cc.delayTime(2), cc.fadeOut(0.2), cc.callFunc(() => {
            parent.active = false;
        })));
    }

    private spinCard(id: number, onFinished: () => void) {
        let c = 15;
        this.schedule(() => {
            c--;
            if (c == 0) {
                this.sprCard.node.color = cc.Color.WHITE;
                this.sprCard.spriteFrame = this.sprAtlasCards.getSpriteFrame("card" + id);
                onFinished();
            } else {
                this.sprCard.node.color = cc.Color.BLACK.fromHEX("#CCCCCC");
                this.sprCard.spriteFrame = this.sprAtlasCards.getSpriteFrame("card" + Utils.randomRangeInt(0, 52));
            }
        }, 0.1, c - 1, 0);
    }

    private longToTime(time: number): string {
        let m = parseInt((time / 60).toString());
        let s = time % 60;
        return m + ":" + (s < 10 ? "0" : "") + s;
    }

    show() {
        if (this.node.active) {
            this.reOrder();
            return;
        }
        super.show();

        this.lblToast.node.parent.active = false;
        this.lblStatus.string = "Nhấn nút \"Play\" để bắt đầu";
        this.lblSession.string = "";
        this.lblUp.string = "";
        this.lblDown.string = "";
        this.lblCurrent.string = Utils.formatNumber(this.listBet[this.betIdx]);
        this.sprAt.fillRange = 0;
        this.btnNewTurn.interactable = false;
        this.btnUp.interactable = false;
        this.btnDown.interactable = false;
        this.btnPlay.interactable = false;
        this.lblWinCoin.node.active = false;

        this.isCanChangeBet = true;
        this.betIdx = 0;
        for (let i = 0; i < this.buttonBets.length; i++) {
            this.buttonBets[i].setActive(i == this.betIdx);
        }

        MiniGameNetworkClient.getInstance().send(new cmd.SendScribe(this.betIdx));
    }

    actStart() {
        this.btnPlay.node.active = false;
        MiniGameNetworkClient.getInstance().send(new cmd.SendStart(this.listBet[this.betIdx]));
    }

    actUp() {
        this.btnUp.interactable = false;
        this.btnDown.interactable = false;
        this.btnNewTurn.interactable = false;
        MiniGameNetworkClient.getInstance().send(new cmd.SendPlay(this.listBet[this.betIdx], true));
    }

    actDown() {
        this.btnUp.interactable = false;
        this.btnDown.interactable = false;
        this.btnNewTurn.interactable = false;
        MiniGameNetworkClient.getInstance().send(new cmd.SendPlay(this.listBet[this.betIdx], false));
    }

    actStop() {
        this.btnNewTurn.interactable = false;
        MiniGameNetworkClient.getInstance().send(new cmd.SendStop(this.listBet[this.betIdx]));
    }

    dismiss() {
        super.dismiss();
        for (let i = 0; i < this.popups.length; i++) {
            this.popups[i].active = false;
        }
        MiniGameNetworkClient.getInstance().send(new cmd.SendUnScribe(this.betIdx));
    }
}
