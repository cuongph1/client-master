import MiniGame from "../../../Lobby/src/MiniGame";
import MiniGameNetworkClient from "../../../scripts/networks/MiniGameNetworkClient";
import cmd from "./BauCua.Cmd";
import InPacket from "../../../scripts/networks/Network.InPacket";
import ButtonPayBet from "./BauCua.ButtonPayBet";
import Utils from "../../../scripts/common/Utils";
import Configs from "../../../scripts/common/Configs";
import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";

const { ccclass, property } = cc._decorator;

@ccclass("BauCua.ButtonBet")
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
export default class BauCuaController extends MiniGame {

    static instance: BauCuaController = null;
    static lastBeted = null;

    @property([cc.SpriteFrame])
    public sprSmallDices: cc.SpriteFrame[] = [];
    @property(cc.Label)
    public lblSession: cc.Label = null;
    @property(cc.Label)
    public lblTime: cc.Label = null;
    @property(cc.Label)
    public lblToast: cc.Label = null;
    @property(cc.Label)
    public lblWinCoin: cc.Label = null;
    @property([ButtonBet])
    public buttonBets: ButtonBet[] = [];
    @property([ButtonPayBet])
    public btnPayBets: ButtonPayBet[] = [];
    @property(cc.Node)
    public nodeSoiCau: cc.Node = null;
    @property(cc.Node)
    public nodeHistories: cc.Node = null;
    @property(cc.Node)
    public itemHistoryTemplate: cc.Node = null;
    @property(cc.Button)
    public btnConfirm: cc.Button = null;
    @property(cc.Button)
    public btnCancel: cc.Button = null;
    @property(cc.Button)
    public btnReBet: cc.Button = null;
    @property([cc.Label])
    public lblsSoiCau: cc.Label[] = [];
    @property([cc.Node])
    public popups: cc.Node[] = [];

    private readonly listBet = [1000, 5000, 10000, 50000, 100000];
    private roomId = 0;
    private betIdx = 0;
    private isBetting = false;
    private historiesData = [];
    private beted = [0, 0, 0, 0, 0, 0];
    private betting = [0, 0, 0, 0, 0, 0];
    private inited = false;

    start() {
        BauCuaController.instance = this;

        this.itemHistoryTemplate.active = false;

        for (let i = 0; i < this.buttonBets.length; i++) {
            var btn = this.buttonBets[i];
            btn.setActive(i == this.betIdx);
            btn.button.node.on("click", () => {
                this.betIdx = i;
                for (let i = 0; i < this.buttonBets.length; i++) {
                    this.buttonBets[i].setActive(i == this.betIdx);
                }
            });
        }

        for (let i = 0; i < this.btnPayBets.length; i++) {
            this.btnPayBets[i].node.on("click", () => {
                this.betting[i] += this.listBet[this.betIdx];
                this.btnPayBets[i].lblBeted.node.color = cc.Color.RED;
                this.btnPayBets[i].lblBeted.string = this.moneyToK(this.betting[i] + this.beted[i]);
                // console.log(i);
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

        MiniGameNetworkClient.getInstance().addListener((data) => {
            if (!this.node.active) return;
            let inpacket = new InPacket(data);
            switch (inpacket.getCmdId()) {
                case cmd.Code.INFO: {
                    this.inited = true;

                    let res = new cmd.ReceiveInfo(data);

                    // console.log(res);
                    this.isBetting = res.bettingState;
                    this.lblSession.string = "#" + res.referenceId;
                    this.lblTime.string = this.longToTime(res.remainTime);


                    let totalBets = res.potData.split(",");
                    let beted = res.betData.split(",");
                    for (let i = 0; i < this.btnPayBets.length; i++) {
                        let btnPayBet = this.btnPayBets[i];
                        btnPayBet.lblTotal.string = this.moneyToK(parseInt(totalBets[i]));
                        btnPayBet.lblBeted.string = this.moneyToK(parseInt(beted[i]));
                        btnPayBet.overlay.active = true;
                        btnPayBet.button.interactable = this.isBetting;
                        btnPayBet.lblFactor.node.active = false;
                        this.beted[i] = parseInt(beted[i]);
                    }

                    if (!this.isBetting) {
                        this.btnPayBets[res.dice1].overlay.active = false;
                        this.btnPayBets[res.dice2].overlay.active = false;
                        this.btnPayBets[res.dice3].overlay.active = false;

                        if (res.xValue > 1) {
                            this.btnPayBets[res.xPot].lblFactor.node.active = true;
                            this.btnPayBets[res.xPot].lblFactor.string = "x" + res.xValue;
                        }
                    }

                    if (res.lichSuPhien != "") {
                        let histories = res.lichSuPhien.split(",");
                        for (let i = 0; i < histories.length; i++) {
                            this.addHistory([
                                parseInt(histories[i]),
                                parseInt(histories[++i]),
                                parseInt(histories[++i])
                            ]);
                            ++i;
                            ++i;
                        }
                        this.caculatorSoiCau();
                    }
                    break;
                }
                case cmd.Code.START_NEW_GAME: {
                    let res = new cmd.ReceiveNewGame(data);
                    // console.log(res);
                    this.lblSession.string = "#" + res.referenceId;
                    for (let i = 0; i < this.btnPayBets.length; i++) {
                        let btnPayBet = this.btnPayBets[i];
                        btnPayBet.lblBeted.string = "0";
                        btnPayBet.lblBeted.node.color = cc.Color.WHITE;
                        btnPayBet.lblTotal.string = "0";
                        btnPayBet.overlay.active = false;
                        btnPayBet.button.interactable = true;
                        btnPayBet.lblFactor.node.active = false;
                    }
                    this.beted = [0, 0, 0, 0, 0, 0];
                    this.betting = [0, 0, 0, 0, 0, 0];
                    this.btnConfirm.interactable = true;
                    this.btnCancel.interactable = true;
                    this.btnReBet.interactable = true;
                    break;
                }
                case cmd.Code.UPDATE: {
                    let res = new cmd.ReceiveUpdate(data);
                    // console.log(res);
                    this.lblTime.string = this.longToTime(res.remainTime);

                    this.isBetting = res.bettingState == 1;
                    let totalBets = res.potData.split(",");
                    for (let i = 0; i < this.btnPayBets.length; i++) {
                        let btnPayBet = this.btnPayBets[i];
                        btnPayBet.lblTotal.string = this.moneyToK(parseInt(totalBets[i]));
                        if (this.isBetting) {
                            btnPayBet.overlay.active = false;
                            btnPayBet.lblFactor.node.active = false;
                        } else {
                            btnPayBet.button.interactable = false;
                            btnPayBet.lblBeted.string = this.moneyToK(this.beted[i]);
                            btnPayBet.lblBeted.node.color = cc.Color.WHITE;
                        }
                    }
                    break;
                }
                case cmd.Code.RESULT: {
                    let res = new cmd.ReceiveResult(data);
                    // console.log(res);
                    this.spin(() => {
                        for (let i = 0; i < this.btnPayBets.length; i++) {
                            let btnPayBet = this.btnPayBets[i];
                            btnPayBet.overlay.active = true;
                        }
                        this.btnPayBets[res.dice1].overlay.active = false;
                        this.btnPayBets[res.dice2].overlay.active = false;
                        this.btnPayBets[res.dice3].overlay.active = false;

                        if (res.xValue > 1) {
                            this.btnPayBets[res.xPot].lblFactor.node.active = true;
                            this.btnPayBets[res.xPot].lblFactor.string = "x" + res.xValue;
                        }

                        this.addHistory([res.dice1, res.dice2, res.dice3]);
                        this.caculatorSoiCau();
                    });
                    break;
                }
                case cmd.Code.PRIZE: {
                    let res = new cmd.ReceivePrize(data);
                    // console.log(res);
                    //show win coin
                    Configs.Login.Coin = res.currentMoney;
                    BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                    this.lblWinCoin.node.stopAllActions();
                    this.lblWinCoin.node.position = cc.v2(-26, -16);
                    this.lblWinCoin.node.opacity = 0;
                    this.lblWinCoin.string = "+" + Utils.formatNumber(res.prize);
                    this.lblWinCoin.node.active = true;
                    this.lblWinCoin.node.runAction(cc.sequence(
                        cc.spawn(cc.fadeIn(0.2), cc.moveBy(2, cc.v2(0, 100))),
                        cc.fadeOut(0.15),
                        cc.callFunc(() => {
                            this.lblWinCoin.node.active = false;
                        })
                    ));
                    break;
                }
                case cmd.Code.BET: {
                    let res = new cmd.ReceiveBet(data);
                     console.log("==========================="+res.result);
                    switch (res.result) {
                        case 100:
                            this.showToast("Đặt cược thất bại.");
                            break;
                        case 101:
                            this.showToast("Chưa tới thời gian đặt cược.");
                            break;
                        case 102:
                            this.showToast("Số dư không đủ.");
                            break;
                        case 103:
                            this.showToast("chỉ được cược tối đa 1000.000.");
                            this.btnConfirm.interactable = true;
                            this.btnCancel.interactable = true;
                            this.btnReBet.interactable = true;
                            break;
                    }
                    if (res.result != 1) {
                        break;
                    }
                    Configs.Login.Coin = res.currentMoney;
                    BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                    for (let i = 0; i < this.btnPayBets.length; i++) {
                        this.beted[i] += this.betting[i];
                        this.betting[i] = 0;

                        let btnPayBet = this.btnPayBets[i];
                        btnPayBet.lblBeted.string = this.moneyToK(this.beted[i]);
                        btnPayBet.lblBeted.node.color = cc.Color.WHITE;
                    }
                    BauCuaController.lastBeted = this.beted;
                    this.showToast("Đặt cược thành công.");
                    this.btnConfirm.interactable = true;
                    this.btnCancel.interactable = true;
                    this.btnReBet.interactable = true;
                    break;
                }
            }
        }, this);
    }

    private spin(cb: () => void) {
        for (let i = 0; i < this.btnPayBets.length; i++) {
            let btnPayBet = this.btnPayBets[i];
            btnPayBet.overlay.active = true;
        }
        let idx = 0;
        let count = 24;
        this.schedule(() => {
            for (let i = 0; i < this.btnPayBets.length; i++) {
                let btnPayBet = this.btnPayBets[i];
                btnPayBet.overlay.active = i != idx;
            }
            idx++;
            count--;
            if (idx == this.btnPayBets.length - 1) {
                idx = 0;
            }
            if (count == 0) {
                cb();
            }
        }, 0.07, count - 1, 0);
    }

    private longToTime(time: number): string {
        let m = parseInt((time / 60).toString());
        let s = time % 60;
        // return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
        return (s < 10 ? "0" : "") + s;
    }

    private moneyToK(money: number): string {
        if (money < 100000) {
            return Utils.formatNumber(money);
        }
        money = parseInt((money / 1000).toString());
        return Utils.formatNumber(money) + "K";
    }

    private addHistory(dices: Array<number>) {
        if (this.itemHistoryTemplate.parent.childrenCount > 50) {
            this.itemHistoryTemplate.parent.children[1].removeFromParent();
            this.historiesData.splice(0, 1);
        }
        this.historiesData.push(dices);
        let item = cc.instantiate(this.itemHistoryTemplate);
        item.parent = this.itemHistoryTemplate.parent;
        item.active = true;
        item.getChildByName("dice1").getComponent(cc.Sprite).spriteFrame = this.sprSmallDices[dices[0]];
        item.getChildByName("dice2").getComponent(cc.Sprite).spriteFrame = this.sprSmallDices[dices[1]];
        item.getChildByName("dice3").getComponent(cc.Sprite).spriteFrame = this.sprSmallDices[dices[2]];
    }

    private caculatorSoiCau() {
        let counts = [0, 0, 0, 0, 0, 0];
        for (let i = 0; i < this.historiesData.length; i++) {
            let dices = this.historiesData[i];
            for (let j = 0; j < 3; j++) {
                counts[dices[j]]++;
            }
        }
        for (let i = 0; i < this.lblsSoiCau.length; i++) {
            this.lblsSoiCau[i].string = counts[i].toString();
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

    actSoiCau() {
        this.nodeHistories.active = !this.nodeHistories.active;
        this.nodeSoiCau.active = !this.nodeHistories.active;
    }

    actCancel() {
        if (!this.inited) return;
        for (let i = 0; i < this.btnPayBets.length; i++) {
            let btnPayBet = this.btnPayBets[i];
            btnPayBet.lblBeted.node.color = cc.Color.WHITE;
            btnPayBet.lblBeted.string = this.moneyToK(this.beted[i]);
            this.betting[i] = 0;
        }
    }

    actConfirm() {
        if (!this.inited) return;
        if (!this.isBetting) {
            this.showToast("Chưa đến thời gian đặt cược.");
            return;
        }
        let total = 0;
        for (let i = 0; i < this.betting.length; i++) {
            total += this.betting[i];
        }
        if (total <= 0) {
            this.showToast("Bạn chưa đặt cửa.");
            return;
        }
        MiniGameNetworkClient.getInstance().send(new cmd.SendBet(this.betting.toString()));
        this.btnConfirm.interactable = false;
        this.btnCancel.interactable = false;
        this.btnReBet.interactable = false;
    }

    actReBet() {
        if (!this.inited) return;
        if (!this.isBetting) {
            this.showToast("Chưa đến thời gian đặt cược.");
            return;
        }
        if (BauCuaController.lastBeted == null) {
            this.showToast("Bạn chưa đặt cược trước đó.");
            return;
        }
        let totalBeted = 0;
        for (let i = 0; i < this.beted.length; i++) {
            totalBeted += this.beted[i];
        }
        if (totalBeted > 0) {
            this.showToast("Bạn chỉ có thể đặt lại cho lần cược đầu tiên.");
            return;
        }
        this.betting = BauCuaController.lastBeted;
        MiniGameNetworkClient.getInstance().send(new cmd.SendBet(BauCuaController.lastBeted.toString()));
        this.btnConfirm.interactable = false;
        this.btnCancel.interactable = false;
        this.btnReBet.interactable = false;
    }

    show() {
        if (this.node.active) {
            this.reOrder();
            return;
        }
        super.show();

        this.inited = false;
        this.lblToast.node.parent.active = false;
        this.lblWinCoin.node.active = false;
        this.betIdx = 0;
        this.betting = [0, 0, 0, 0, 0, 0];
        this.beted = [0, 0, 0, 0, 0, 0];
        this.historiesData = [];

        this.nodeHistories.active = true;
        this.nodeSoiCau.active = !this.nodeHistories.active;
        this.nodeHistories.getComponent(cc.ScrollView).scrollToTop(0);

        for (let i = 0; i < this.buttonBets.length; i++) {
            this.buttonBets[i].setActive(i == this.betIdx);
        }
        for (let i = 0; i < this.btnPayBets.length; i++) {
            let btnPayBet = this.btnPayBets[i];
            btnPayBet.lblBeted.string = "0";
            btnPayBet.lblBeted.node.color = cc.Color.WHITE;
            btnPayBet.lblTotal.string = "0";
            btnPayBet.lblFactor.node.active = false;
            btnPayBet.overlay.active = true;
            btnPayBet.button.interactable = false;
        }

        MiniGameNetworkClient.getInstance().send(new cmd.SendScribe(this.roomId));
    }

    dismiss() {
        super.dismiss();
        for (let i = 0; i < this.popups.length; i++) {
            this.popups[i].active = false;
        }
        for (let i = 1; i < this.itemHistoryTemplate.parent.childrenCount; i++) {
            this.itemHistoryTemplate.parent.children[i].destroy();
        }
        MiniGameNetworkClient.getInstance().send(new cmd.SendUnScribe(this.roomId));
    }
}
