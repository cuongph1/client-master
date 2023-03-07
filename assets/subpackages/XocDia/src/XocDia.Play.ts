import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import cmd from "./XocDia.Cmd";
import Player from "./XocDia.Player";
import Random from "../../../scripts/common/Random";
import Configs from "../../../scripts/common/Configs";
import XocDiaController from "./XocDia.XocDiaController";
import BtnPayBet from "./XocDia.BtnPayBet";
import XocDiaNetworkClient from "./XocDia.XocDiaNetworkClient";
import InPacket from "../../../scripts/networks/Network.InPacket";
import TimeUtils from "../../../scripts/common/TimeUtils";
import PanelPayDoor from "./XocDia.PanelPayDoor";
import App from "../../../scripts/common/App";
import BtnBet from "./XocDia.BtnBet";
import Utils from "../../../scripts/common/Utils";
import BankerControl from "./XocDia.BankerControl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Play extends cc.Component {

    @property(Player)
    mePlayer: Player = null;
    @property([Player])
    players: Player[] = [];
    @property([BtnBet])
    btnBets: BtnBet[] = [];
    @property([BtnPayBet])
    btnPayBets: BtnPayBet[] = [];
    @property(sp.Skeleton)
    dealer: sp.Skeleton = null;
    @property(cc.Node)
    dealerHandPoint: cc.Node = null;
    @property(sp.Skeleton)
    bowl: sp.Skeleton = null;
    @property([cc.SpriteFrame])
    sprChipSmalls: cc.SpriteFrame[] = [];
    @property(cc.Node)
    chips: cc.Node = null;
    @property(cc.Node)
    chipTemplate: cc.Node = null;
    @property(cc.Sprite)
    sprProgressTime: cc.Sprite = null;
    @property(PanelPayDoor)
    panelPayDoor: PanelPayDoor = null;
    @property(cc.Label)
    lblHistoryOdd: cc.Label = null;
    @property(cc.Label)
    lblHistoryEven: cc.Label = null;
    @property(cc.SpriteFrame)
    sfOdd: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    sfEven: cc.SpriteFrame = null;
    @property(cc.Node)
    lblHistoryItems: cc.Node = null;
    @property(cc.Button)
    btnLamCai: cc.Button = null;
    @property(cc.Button)
    btnHuyLamCai: cc.Button = null;
    @property(BankerControl)
    bankerControl: BankerControl = null;

    private inited = false;
    private roomId = 0;

    private chipsInDoors: any = {};
    private lastBowlStateName = "";
    private curTime = 0;
    private gameState = 0;
    private readonly listBets = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
    private betIdx = 0;
    private minBetIdx = 0;
    private isBanker = false;
    private banker = "";

    private lastUpdateTime = TimeUtils.currentTimeMillis();

    start() {
        for (let i = 0; i < this.btnPayBets.length; i++) {
            let btn = this.btnPayBets[i];
            btn.node.on("click", () => {
                if (this.gameState != 2) {
                    console.log("Khong phai thoi gian dat cuoc");
                    return;
                }
                if (i >= 2 && this.banker == "") {
                    App.instance.alertDialog.showMsg("Không thể đặt vị khi chưa có người chơi làm cái.");
                    return;
                }
                if (this.isBanker) {
                    App.instance.alertDialog.showMsg("Bạn đang làm cái.");
                    return;
                }
                XocDiaNetworkClient.getInstance().send(new cmd.SendPutMoney(i, this.listBets[this.betIdx]));
            });
        }

        for (let i = 0; i < this.btnBets.length; i++) {
            let btnBet = this.btnBets[i];
            btnBet.node.on("click", () => {
                this.betIdx = this.minBetIdx + i;
                for (let j = 0; j < this.btnBets.length; j++) {
                    this.btnBets[j].active.active = j == i;
                }
            });
        }
    }

    update(dt) {
        if (this.curTime > 0) {
            let timeLeft = Math.max(0, this.curTime - TimeUtils.currentTimeMillis());
            this.sprProgressTime.fillRange = timeLeft / 30000;
            if (timeLeft == 0) {
                this.curTime = 0;
            }
        }

        let t = TimeUtils.currentTimeMillis();
        if (t - this.lastUpdateTime > 2000) {
            console.log("on resume");
            this.node.stopAllActions();
            App.instance.showLoading(true);
            XocDiaNetworkClient.getInstance().send(new cmd.SendJoinRoomById(this.roomId));
        }
        this.lastUpdateTime = t;
    }

    public init() {
        if (this.inited) return;
        this.inited = true;

        BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
            if (!this.node.active) return;
            this.mePlayer.setCoin(Configs.Login.Coin);
        }, this);
        BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);

        XocDiaNetworkClient.getInstance().addListener((data) => {
            let inpacket = new InPacket(data);
            switch (inpacket.getCmdId()) {
                case cmd.Code.JOIN_ROOM_SUCCESS:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceiveJoinRoomSuccess(data);
                        this.show(res);
                    }
                    break;
                case cmd.Code.USER_JOIN_ROOM_SUCCESS:
                    {
                        let res = new cmd.ReceiveUserJoinRoom(data);
                        console.log(res);
                        let player = this.getRandomEmptyPlayer();
                        if (player != null) {
                            player.set(res.nickname, res.avatar, res.money, false);
                        }
                    }
                    break;
                case cmd.Code.USER_OUT_ROOM:
                    {
                        let res = new cmd.ReceiveUserOutRoom(data);
                        console.log(res);
                        let player = this.getPlayer(res.nickname);
                        if (player != null) player.leave();
                    }
                    break;
                case cmd.Code.QUIT_ROOM:
                    {
                        let res = new cmd.ReceiveLeavedRoom(data);
                        console.log(res);
                        this.node.active = false;
                        XocDiaController.instance.lobby.show();
                        switch (res.reason) {
                            case 1:
                                App.instance.alertDialog.showMsg("Bạn không đủ tiền để tham gia phòng!");
                                break;
                            case 2:
                                App.instance.alertDialog.showMsg("Hệ thống đang tạm thời bảo trì!");
                                break;
                            case 5:
                                App.instance.alertDialog.showMsg("Bạn bị mời ra khỏi phòng vì quá lâu không tương tác!");
                                break;
                            case 6:
                                App.instance.alertDialog.showMsg("Nhà cái đã kick bạn ra khỏi phòng!");
                                break;
                        }
                    }
                    break;
                case cmd.Code.DANG_KY_THOAT_PHONG:
                    {
                        let res = new cmd.ReceiveLeaveRoom(data);
                        console.log(res);
                        if (res.bRegis) {
                            App.instance.alertDialog.showMsg("Đã đăng ký rời phòng.");
                        } else {
                            App.instance.alertDialog.showMsg("Đã huỷ đăng ký rời phòng.");
                        }
                    }
                    break;
                case cmd.Code.ACTION_IN_GAME:
                    {
                        let res = new cmd.ReceiveActionInGame(data);
                        console.log(res);
                        let msg = "";
                        this.gameState = res.action;
                        switch (res.action) {
                            case 1://bat dau van moi
                                msg = "Bắt đầu ván mới";
                                this.sprProgressTime.node.parent.active = false;
                                break;
                            case 2://bat dau dat cua
                                msg = "Bắt đầu đặt cửa";
                                this.sprProgressTime.node.parent.active = true;
                                this.curTime = TimeUtils.currentTimeMillis() + res.time * 1000;
                                break;
                            case 3://bat dau ban cua
                                msg = "Bắt đầu bán cửa";
                                this.sprProgressTime.node.parent.active = false;
                                break;
                            case 4://nha cai can tien, hoan tien
                                msg = "Nhà cái cân tiền, hoàn tiền";
                                this.sprProgressTime.node.parent.active = false;
                                break;
                            case 5://bat dau hoan tien
                                msg = "Bắt đầu hoàn tiền";
                                this.sprProgressTime.node.parent.active = false;
                                break;
                            case 6://bat dau tra thuong
                                msg = "Bắt đầu trả thưởng";
                                this.sprProgressTime.node.parent.active = false;
                                break;
                        }
                        if (msg != "") {
                            this.dealer.setAnimation(0, "noti", false);
                            this.dealer.addAnimation(0, "cho", true);
                            let label = this.dealer.getComponentInChildren(cc.Label);
                            label.string = msg;
                            label.node.active = false;
                            this.scheduleOnce(() => {
                                label.node.active = true;
                                this.scheduleOnce(() => {
                                    label.node.active = false;
                                }, 0.9);
                            }, 0.3);
                        }
                    }
                    break;
                case cmd.Code.START_GAME:
                    {
                        let res = new cmd.ReceiveStartGame(data);
                        console.log(res);

                        if (res.banker != "" && res.banker != Configs.Login.Nickname && this.isBanker) {
                            App.instance.alertDialog.showMsg("Bạn không đủ tiền để tiếp tục làm cái!");
                        }

                        this.banker = res.banker;
                        this.isBanker = this.banker == Configs.Login.Nickname;

                        for (let i = 0; i < this.players.length; i++) {
                            let player = this.players[i];
                            player.banker.active = player.nickname != "" && player.nickname == this.banker;
                        }

                        if (this.isBanker) {
                            this.btnHuyLamCai.node.active = true;
                            this.btnLamCai.node.active = false;
                        } else {
                            this.btnLamCai.node.active = true;
                            this.btnHuyLamCai.node.active = false;
                        }

                        this.btnPayBets.forEach(e => e.reset());
                        this.clearChips();

                        switch (this.lastBowlStateName) {
                            case "4 trang mo":
                                this.bowl.setAnimation(0, "4 trang up", false);
                                break;
                            case "4 do mo":
                                this.bowl.setAnimation(0, "4 do up", false);
                                break;
                            case "3 do 1 trang mo":
                                this.bowl.setAnimation(0, "3 do 1 trang up", false);
                                break;
                            case "3 trang 1 do mo":
                                this.bowl.setAnimation(0, "3 trang 1 do up", false);
                                break;
                            case "2 trang 2 do mo":
                                this.bowl.setAnimation(0, "2 trang 2 do up", false);
                                break;
                            default:
                                this.bowl.setAnimation(0, "bat up", false);
                                break;
                        }
                        this.bowl.addAnimation(0, "lac bat", false);
                        this.bowl.addAnimation(0, "bat up", false);
                    }
                    break;
                case cmd.Code.PUT_MONEY:
                    {
                        let res = new cmd.ReceivePutMoney(data);
                        console.log(res);

                        let btnPayBet = this.btnPayBets[res.potId];
                        btnPayBet.setTotalBet(res.potMoney);

                        if (res.nickname == Configs.Login.Nickname) {
                            switch (res.error) {
                                case 0:
                                    break;
                                case 1:
                                    App.instance.alertDialog.showMsg("Bạn không đủ tiền!");
                                    return;
                                case 2:
                                    App.instance.alertDialog.showMsg("Không thể đặt quá hạn mức của cửa!");
                                    return;
                                default:
                                    App.instance.alertDialog.showMsg("Lỗi " + res.error + ", không xác định.");
                                    return;
                            }
                            Configs.Login.Coin = res.currentMoney;
                            BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                        }

                        let player = this.getPlayer(res.nickname);
                        if (player != null) {
                            player.setCoin(res.currentMoney);
                            let listCoin = this.convertMoneyToChipMoney(res.betMoney);
                            for (let i = 0; i < listCoin.length; i++) {
                                let chip = this.getChip(listCoin[i]);
                                chip.name = player.nickname;
                                chip.position = player.node.position;
                                if (!this.chipsInDoors.hasOwnProperty(res.potId)) {
                                    this.chipsInDoors[res.potId] = [];
                                }
                                this.chipsInDoors[res.potId].push(chip);

                                let position = btnPayBet.node.position.clone();
                                position.x += Random.rangeInt(-btnPayBet.node.width / 2 + 20, btnPayBet.node.width / 2 - 20);
                                position.y += Random.rangeInt(-btnPayBet.node.height / 2, btnPayBet.node.height / 2 - 70);
                                chip.runAction(cc.moveTo(0.5, position).easing(cc.easeSineOut()));
                            }
                        }
                    }
                    break;
                case cmd.Code.BANKER_SELL_GATE:
                    {
                        let res = new cmd.ReceiveBankerSellGate(data);
                        console.log(res);

                        if (res.action != 1) {
                            this.panelPayDoor.show(res.action, res.moneySell);
                        }
                    }
                    break;
                case cmd.Code.BUY_GATE:
                    {
                        let res = new cmd.ReceiveBuyGate(data);
                        console.log(res);

                        if (res.nickname == Configs.Login.Nickname) {
                            let msg = "";
                            switch (res.error) {
                                case 0:
                                    //nothing
                                    break;
                                case 1:
                                    msg = "Bạn không đủ tiền để mua cửa!";
                                    break;
                                case 2:
                                    msg = "Nhà cái đã bán cửa xong!";
                                    break;
                                default:
                                    msg = "Lỗi " + res.error + ", không xác định.";
                                    break;
                            }
                            if (msg != "") {
                                App.instance.alertDialog.showMsg(msg);
                                break;
                            }
                        }
                        this.panelPayDoor.addUser(res.nickname, res.moneyBuy, res.rmMoneySell);
                    }
                    break;
                case cmd.Code.REFUN_MONEY:
                    {
                        let res = new cmd.ReceiveRefunMoney(data);
                        console.log(res);

                        this.panelPayDoor.node.active = false;
                        this.bankerControl.node.active = false;

                        for (let i = 0; i < res.playerInfosRefun.length; i++) {
                            let rfData = res.playerInfosRefun[i];
                            let player = this.getPlayer(rfData["nickname"]);
                            if (player != null) {
                                player.showRefundCoin(rfData["moneyRefund"]);
                                player.setCoin(rfData["currentMoney"]);
                            }
                            if (rfData["nickname"] == Configs.Login.Nickname) {
                                Configs.Login.Coin = rfData["currentMoney"];
                                BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                            }
                        }

                        for (let i = 0; i < res.potID.length; i++) {
                            let potData = res.potID[i];
                            this.btnPayBets[i].setTotalBet(potData["totalMoney"]);
                        }
                    }
                    break;
                case cmd.Code.FINISH_GAME:
                    {
                        let res = new cmd.ReceiveFinishGame(data);
                        console.log(res);

                        this.panelPayDoor.node.active = false;
                        this.bankerControl.node.active = false;

                        for (let i = 0; i < res.playerInfoWin.length; i++) {
                            let playerData = res.playerInfoWin[i];
                            if (playerData["nickname"] == Configs.Login.Nickname) {
                                Configs.Login.Coin = playerData["currentMoney"];
                                BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                                break;
                            }
                        }

                        let countRed = 0;
                        let countWhite = 0;
                        for (let i = 0; i < res.diceIDs.length; i++) {
                            if (res.diceIDs[i] == 1) countRed++;
                            else countWhite++;
                        }
                        let isChan = (res.diceIDs[0] + res.diceIDs[1] + res.diceIDs[2] + res.diceIDs[3]) % 2 == 0;
                        let isLe3do1trang = countRed - countWhite == 2;
                        let isLe3trang1do = countWhite - countRed == 2;
                        let isChan4do = countRed - countWhite == 4;
                        let isChan4trang = countWhite - countRed == 4;
                        let doorWins = [];
                        if (isChan) {
                            doorWins.push(0);
                            this.btnPayBets[0].active.active = true;
                            if (isChan4do) {
                                doorWins.push(2);
                                this.btnPayBets[2].active.active = true;

                                this.lastBowlStateName = "4 do mo";
                                this.bowl.setAnimation(0, this.lastBowlStateName, false);
                            } else if (isChan4trang) {
                                doorWins.push(3);
                                this.btnPayBets[3].active.active = true;

                                this.lastBowlStateName = "4 trang mo";
                                this.bowl.setAnimation(0, this.lastBowlStateName, false);
                            } else {
                                this.lastBowlStateName = "2 trang 2 do mo";
                                this.bowl.setAnimation(0, this.lastBowlStateName, false);
                            }
                        } else {
                            doorWins.push(1);
                            this.btnPayBets[1].active.active = true;
                            if (isLe3do1trang) {
                                doorWins.push(5);
                                this.btnPayBets[5].active.active = true;

                                this.lastBowlStateName = "3 do 1 trang mo";
                                this.bowl.setAnimation(0, this.lastBowlStateName, false);
                            } else if (isLe3trang1do) {
                                doorWins.push(4);
                                this.btnPayBets[4].active.active = true;

                                this.lastBowlStateName = "3 trang 1 do mo";
                                this.bowl.setAnimation(0, this.lastBowlStateName, false);
                            }
                        }

                        let chipsWithNickname: any = {};
                        for (let k in this.chipsInDoors) {
                            let doorId = parseInt(k);
                            let chips: Array<cc.Node> = this.chipsInDoors[doorId];
                            if (doorWins.indexOf(doorId) == -1) {
                                let btnPayBet = this.btnPayBets[doorId];
                                let position = btnPayBet.node.position.clone();
                                position.y -= 10;
                                let positionAdd = position.clone();
                                for (let i = 0; i < chips.length; i++) {
                                    chips[i].runAction(cc.moveTo(0.5, position).easing(cc.easeSineOut()));
                                }
                                this.scheduleOnce(() => {
                                    let node = new cc.Node();
                                    node.parent = this.chips;
                                    node.opacity = 0;
                                    for (let i = 0; i < chips.length; i++) {
                                        chips[i].parent = node;
                                        chips[i].position = positionAdd;
                                        positionAdd.y += 3;
                                    }
                                    node.runAction(cc.sequence(
                                        cc.fadeIn(0.1),
                                        cc.delayTime(0.3),
                                        cc.spawn(
                                            cc.scaleTo(0.5, 0),
                                            cc.moveTo(0.5, this.dealerHandPoint.position)
                                        ),
                                        cc.fadeOut(0.1),
                                        cc.callFunc(() => {
                                            for (let i = 0; i < chips.length; i++) {
                                                chips[i].parent = this.chips;
                                                chips[i].opacity = 255;
                                                chips[i].active = false;
                                            }
                                            node.destroy();
                                        })
                                    ))
                                }, 0.8);
                            } else {
                                for (let i = 0; i < chips.length; i++) {
                                    let chip = chips[i];
                                    let nickname = chip.name;
                                    if (!chipsWithNickname.hasOwnProperty(nickname)) {
                                        chipsWithNickname[nickname] = [];
                                    }
                                    chipsWithNickname[nickname].push(chip);
                                }
                            }
                        }

                        this.scheduleOnce(() => {
                            for (let k in chipsWithNickname) {
                                let player = this.getPlayer(k);
                                if (player != null) {
                                    let chips = chipsWithNickname[k];
                                    let positionAdd = player.chipsPoint.position.clone();
                                    let positionAdd2 = player.chipsPoint2.position.clone();
                                    for (let i = 0; i < chips.length; i++) {
                                        let chip: cc.Node = chips[i];
                                        chip.runAction(cc.sequence(
                                            cc.moveTo(0.5, positionAdd).easing(cc.easeSineOut()),
                                            cc.delayTime(1 + (chips.length * 0.03 - i * 0.03)),
                                            cc.moveTo(0.5, player.node.position).easing(cc.easeSineOut()),
                                            cc.callFunc(() => {
                                                chip.active = false;
                                            })
                                        ));

                                        let dealerChip = this.getChip(0);
                                        dealerChip.getComponent(cc.Sprite).spriteFrame = chip.getComponent(cc.Sprite).spriteFrame;
                                        dealerChip.opacity = 0;
                                        dealerChip.position = this.dealerHandPoint.position;
                                        dealerChip.runAction(cc.sequence(
                                            cc.delayTime(0.5),
                                            cc.fadeIn(0.2),
                                            cc.moveTo(0.5, positionAdd2).easing(cc.easeSineOut()),
                                            cc.delayTime(0.3 + (chips.length * 0.03 - i * 0.03)),
                                            cc.moveTo(0.5, player.node.position).easing(cc.easeSineOut()),
                                            cc.callFunc(() => {
                                                dealerChip.active = false;
                                            })
                                        ));

                                        positionAdd.y += 3;
                                        positionAdd2.y += 3;
                                    }
                                }
                            }
                        }, 1.5);

                        this.scheduleOnce(() => {
                            for (let i = 0; i < res.playerInfoWin.length; i++) {
                                let playerData = res.playerInfoWin[i];
                                let player = this.getPlayer(playerData["nickname"]);
                                if (player != null) {
                                    player.showWinCoin(playerData["moneyWin"]);
                                    player.setCoin(playerData["currentMoney"]);
                                }
                            }
                            BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                        }, 3);

                        if (this.isBanker) {
                            this.mePlayer.showWinCoin(res.moneyBankerExchange);
                            this.mePlayer.setCoin(res.moneyBankerAfter);
                            Configs.Login.Coin = res.moneyBankerAfter;
                            BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                        }

                        XocDiaNetworkClient.getInstance().send(new cmd.CmdSendGetCau());
                    }
                    break;
                case cmd.Code.SOI_CAU:
                    {
                        let res = new cmd.ReceiveGetCau(data);
                        console.log(res);

                        this.lblHistoryOdd.string = Utils.formatNumber(res.totalOdd);
                        this.lblHistoryEven.string = Utils.formatNumber(res.totalEven);
                        for (let i = 0; i < this.lblHistoryItems.childrenCount; i++) {
                            if (i < res.arrayCau.length) {
                                this.lblHistoryItems.children[i].getComponent(cc.Sprite).spriteFrame = res.arrayCau[i] == 0 ? this.sfOdd : this.sfEven;
                                this.lblHistoryItems.children[i].active = true;
                            } else {
                                this.lblHistoryItems.children[i].active = false;
                            }
                        }
                    }
                    break;
                case cmd.Code.ORDER_BANKER:
                    {
                        let res = new cmd.ReceiveOrderBanker(data);
                        console.log(res);
                        switch (res.error) {
                            case 0:
                                break;
                            case 1:
                                App.instance.alertDialog.showMsg("Bạn cần " + Utils.formatNumber(res.moneyRequire) + " Xu để làm cái!");
                                this.btnLamCai.node.active = true;
                                break;
                            default:
                                App.instance.alertDialog.showMsg("Lỗi " + res.error + ", không xác định.");
                                this.btnLamCai.node.active = true;
                                break;
                        }
                    }
                    break;
                case cmd.Code.HUY_LAM_CAI:
                    {
                        let res = new cmd.ReceiveCancelBanker(data);
                        console.log(res);
                        if (res.bDestroy && this.isBanker) {
                            App.instance.alertDialog.showMsg("Đăng ký huỷ làm cái thành công.");
                        }
                    }
                    break;
                case cmd.Code.INFO_GATE_SELL:
                    {
                        let res = new cmd.ReceiveInfoGateSell(data);
                        console.log(res);
                        this.bankerControl.show(res.moneyOdd, res.moneyEven);
                    }
                    break;
                case cmd.Code.INFO_MONEY_AFTER_BANKER_SELL:
                    {
                        let res = new cmd.ReceiveInfoMoneyAfterBankerSell(data);
                        console.log(res);
                    }
                    break;
                default:
                    console.log("inpacket.getCmdId(): " + inpacket.getCmdId());
                    break;
            }
        }, this);
    }

    private resetView() {
        this.mePlayer.leave();
        this.players.forEach(e => e.leave());
        this.btnPayBets.forEach(e => e.reset());

        this.dealer.setAnimation(0, "cho", true);
        this.dealer.getComponentInChildren(cc.Label).node.active = false;
        this.bowl.setAnimation(0, "bat up", false);
        this.clearChips();

        this.sprProgressTime.node.parent.active = false;
        this.curTime = 0;
        this.panelPayDoor.node.active = false;
        this.bankerControl.node.active = false;
    }

    private getRandomEmptyPlayer(): Player {
        let emptyPlayers = new Array<Player>();
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].nickname == "") emptyPlayers.push(this.players[i]);
        }
        if (emptyPlayers.length > 0) {
            return emptyPlayers[Random.rangeInt(0, emptyPlayers.length)];
        }
        return null;
    }

    private getPlayer(nickname: string): Player {
        console.log("getPlayer: " + nickname);
        for (let i = 0; i < this.players.length; i++) {
            let player = this.players[i];
            if (player.nickname != "" && player.nickname == nickname) return player;
        }
        return null;
    }

    private listChip: cc.Node[] = [];
    private getChip(coin: number): cc.Node {
        let ret: cc.Node = null;
        for (let i = 0; i < this.listChip.length; i++) {
            if (!this.listChip[i].active) {
                ret = this.listChip[i];
                break;
            }
        }
        if (ret == null) {
            ret = cc.instantiate(this.chipTemplate);
            ret.parent = this.chips;
            this.listChip.push(ret);
        }
        let chipIdx = 0;
        for (let i = 0; i < this.listBets.length; i++) {
            if (this.listBets[i] == coin) {
                chipIdx = i;
                break;
            }
        }
        chipIdx -= this.minBetIdx;
        ret.getComponent(cc.Sprite).spriteFrame = this.sprChipSmalls[chipIdx];
        ret.opacity = 255;
        ret.active = true;
        ret.setSiblingIndex(this.chips.childrenCount - 1);
        return ret;
    }

    private clearChips() {
        this.chipTemplate.active = false;
        for (let i = 0; i < this.listChip.length; i++) {
            this.listChip[i].active = false;
        }
        this.chipsInDoors = {};
    }

    private convertMoneyToChipMoney(coin: number): Array<number> {
        let ret = new Array<number>();
        let _coin = coin;
        let minCoin = this.listBets[this.minBetIdx];
        let counter = 0;
        while (_coin >= minCoin || counter < 15) {
            for (let i = this.minBetIdx + this.btnBets.length; i >= this.minBetIdx; i--) {
                if (_coin >= this.listBets[i]) {
                    ret.push(this.listBets[i]);
                    _coin -= this.listBets[i];
                    break;
                }
            }
            counter++;
        }
        return ret;
    }

    public show(data: cmd.ReceiveJoinRoomSuccess) {
        this.node.active = true;
        this.resetView();
        this.roomId = data.roomId;
        this.lastUpdateTime = TimeUtils.currentTimeMillis();

        Configs.Login.Coin = data.money;
        this.isBanker = data.banker;
        this.banker = "";
        if (this.isBanker) {
            this.btnHuyLamCai.node.active = true;
            this.btnLamCai.node.active = false;
            this.banker = Configs.Login.Nickname;
        } else {
            this.btnLamCai.node.active = true;
            this.btnHuyLamCai.node.active = false;
        }

        this.mePlayer.set(Configs.Login.Nickname, Configs.Login.Avatar, Configs.Login.Coin, data.banker);
        for (let i = 0; i < data.playerInfos.length; i++) {
            let playerData = data.playerInfos[i];
            let player = this.getRandomEmptyPlayer();
            if (player != null) {
                player.set(playerData["nickname"], playerData["avatar"], playerData["money"], playerData["banker"]);
                if (playerData["banker"]) {
                    this.banker = playerData["nickname"];
                }
            } else {
                break;
            }
        }

        for (let i = 0; i < data.potID.length; i++) {
            let potData = data.potID[i];
            let btnPayBet = this.btnPayBets[i];
            btnPayBet.setTotalBet(potData["totalMoney"]);
        }

        for (let i = 0; i < this.listBets.length; i++) {
            if (data.moneyBet <= this.listBets[i]) {
                this.betIdx = i;
                this.minBetIdx = this.betIdx;
                break;
            }
        }
        console.log("this.betIdx : " + this.betIdx);
        for (let i = 0; i < this.btnBets.length; i++) {
            let btnBet = this.btnBets[i];
            btnBet.label.string = Utils.formatNumberMin(this.listBets[this.betIdx + i]);
            btnBet.active.active = i == 0;
        }

        this.gameState = data.gameState;
        let msg = "";
        switch (this.gameState) {
            case 1://bat dau van moi
                msg = "Bắt đầu ván mới";
                break;
            case 2://bat dau dat cua
                {
                    msg = "Bắt đầu đặt cửa";
                    this.sprProgressTime.node.parent.active = true;
                    this.curTime = TimeUtils.currentTimeMillis() + data.countTime * 1000;
                }
                break;
            case 3://bat dau ban cua
                {
                    if (this.isBanker) {
                        this.bankerControl.show(data.moneyPurchaseOdd, data.moneyPurchaseEven);
                    } else {
                        msg = "Bắt đầu bán cửa";
                        if (data.purchaseStatus != 1) {
                            this.panelPayDoor.show(data.purchaseStatus, data.moneyRemain);
                        }
                        for (let i = 0; i < data.list_buy_gate.length; i++) {
                            let playerData = data.list_buy_gate[i];
                            this.panelPayDoor.addUser(playerData["nickname"], playerData["money"], data.moneyRemain);
                        }
                    }
                }
                break;
            case 4://nha cai can tien, hoan tien
                msg = "Nhà cái cân tiền, hoàn tiền";
                break;
            case 5://bat dau hoan tien
                msg = "Bắt đầu hoàn tiền";
                break;
            case 6://bat dau tra thuong
                msg = "Bắt đầu trả thưởng";
                break;
        }
        if (msg != "") {
            this.dealer.setAnimation(0, "noti", false);
            this.dealer.addAnimation(0, "cho", true);
            let label = this.dealer.getComponentInChildren(cc.Label);
            label.string = msg;
            label.node.active = false;
            this.scheduleOnce(() => {
                label.node.active = true;
                this.scheduleOnce(() => {
                    label.node.active = false;
                }, 0.9);
            }, 0.3);
        }

        XocDiaNetworkClient.getInstance().send(new cmd.CmdSendGetCau());
    }

    public actBack() {
        XocDiaNetworkClient.getInstance().send(new cmd.SendLeaveRoom());
    }

    public actBuyGate() {
        XocDiaNetworkClient.getInstance().send(new cmd.SendBuyGate(this.panelPayDoor.coin));
    }

    public actOrderBanker() {
        this.btnLamCai.node.active = false;
        XocDiaNetworkClient.getInstance().send(new cmd.SendOrderBanker());
    }

    public actCancelBanker() {
        this.btnHuyLamCai.node.active = false;
        XocDiaNetworkClient.getInstance().send(new cmd.SendCancelBanker());
    }

    // update (dt) {}
}
