import BroadcastReceiver from "../../../scripts/common/BroadcastReceiver";
import Utils from "../../../scripts/common/Utils";

import App from "../../../scripts/common/App";
import InPacket from "../../../scripts/networks/Network.InPacket";
import cmdNetwork from "../../../scripts/networks/Network.Cmd";
import Configs from "../../../scripts/common/Configs";
import cmd from "./Poker.Cmd";

import PokerNetworkClient from "./Poker.NetworkClient";
import CardUtils from "./Poker.CardUtil"

var configPlayer = [  // 9 Players
    // {
    //     seatId: 0,
    //     playerId: -1,
    //     playerPos: -1,
    //     isViewer: true
    // }
];

// defaultPlayerPos[0 -> 8][0] = player_pos of me
let defaultPlayerPos = [ // 9 players
    [0, 1, 2, 3, 4, 5, 6, 7, 8],
    [1, 2, 3, 4, 5, 6, 7, 8, 0],
    [2, 3, 4, 5, 6, 7, 8, 0, 1],
    [3, 4, 5, 6, 7, 8, 0, 1, 2],
    [4, 5, 6, 7, 8, 0, 1, 2, 3],
    [5, 6, 7, 8, 0, 1, 2, 3, 4],
    [6, 7, 8, 0, 1, 2, 3, 4, 5],
    [7, 8, 0, 1, 2, 3, 4, 5, 6],
    [8, 0, 1, 2, 3, 4, 5, 6, 7],
]

const { ccclass, property } = cc._decorator;

@ccclass
export default class PokerController extends cc.Component {

    public static instance: PokerController = null;

    // UI Rooms
    @property(cc.Node)
    UI_ChooseRoom: cc.Node = null;
    @property(cc.Label)
    labelNickName: cc.Label = null;
    @property(cc.Label)
    labelCoin: cc.Label = null;
    @property(cc.Node)
    contentListRooms: cc.Node = null;
    @property(cc.Prefab)
    prefabItemRoom: cc.Prefab = null;
    @property(cc.ScrollView)
    scrollListRoom: cc.ScrollView = null;
    @property(cc.EditBox)
    edtFindRoom: cc.EditBox = null;
    @property(cc.Toggle)
    btnHideRoomFull: cc.Toggle = null;

    public isInitedUIRoom = false;

    // UI Playing
    @property(cc.Node)
    UI_Playing: cc.Node = null;
    @property(cc.Node)
    meCards: cc.Node = null;
    @property(cc.Node)
    groupPlayers: cc.Node = null;
    @property(cc.SpriteFrame)
    spriteCards: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    spriteCardBack: cc.SpriteFrame = null;
    @property(cc.Node)
    matchPot: cc.Node = null;
    @property(cc.Label)
    labelMatchPot: cc.Label = null;
    @property(cc.Node)
    cardsDeal: cc.Node = null;
    @property(cc.Node)
    cardsCenter: cc.Node = null;
    @property(cc.Node)
    btnBet: cc.Node = null;
    @property(cc.Node)
    btnOpenCard: cc.Node = null;
    @property(cc.Button)
    btnLeaveRoom: cc.Button = null;
    @property(cc.Node)
    hubChips: cc.Node = null;
    @property(cc.Label)
    labelRoomId: cc.Label = null;
    @property(cc.Label)
    labelRoomBet: cc.Label = null;
    @property(cc.Node)
    actionBetting: cc.Node = null;
    @property(cc.Node)
    betChooseValue: cc.Node = null;
    @property(cc.Node)
    betChooseValueTarget: cc.Node = null;
    @property(sp.Skeleton)
    FxDealer: sp.Skeleton = null;
    @property(cc.Node)
    btnBuyCashIn: cc.Node = null;

    @property(cc.Node)
    popupBuyIn: cc.Node = null;
    @property(cc.Label)
    labelBuyInMin: cc.Label = null;
    @property(cc.Label)
    labelBuyInMax: cc.Label = null;
    @property(cc.EditBox)
    edtBuyIn: cc.EditBox = null;
    @property(cc.Toggle)
    toggleAutoBuyIn: cc.Toggle = null;

    // Notify
    @property(cc.Node)
    notifyTimeStart: cc.Node = null;
    @property(cc.Node)
    notifyTimeEnd: cc.Node = null;
    @property(cc.Node)
    notifyTimeBet: cc.Node = null;

    // UI Chat
    @property(cc.Node)
    UI_Chat: cc.Node = null;
    @property(cc.EditBox)
    edtChatInput: cc.EditBox = null;

    // Popup
    @property(cc.Node)
    popupNodity: cc.Node = null;
    @property(cc.Label)
    labelNotifyContent: cc.Label = null;

    private seatOwner = null;
    private currentRoomBet = null;

    private gameState = null;

    private minutes = null;
    private seconds = null;


    private timeAutoStart = null;
    private timeEnd = null;
    private timeBet = null;
    private timeThinking = null;
    private intervalWaitting = null;
    private intervalEnd = null;
    private intervalBetting = null;
    private intervalThinking = null;

    private currentCard = null;
    private currentCenterCard = null;
    private numCardOpened = 0;

    // bet
    private arrBetValue = [];
    private arrBetPos = [-157.5, -52.5, 52.5, 157.5];
    private currentBetSelectedIndex = 0;

    private currentMatchPotValue = 0;

    private timeoutEndGame = null;
    private timeoutChiaBaiDone = null;


    private minCashIn = null;
    private maxCashIn = null;

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        PokerController.instance = this;

        this.seatOwner = -1;

        this.initConfigPlayer();
    }

    start() {
        this.showUIRooms();

        App.instance.showErrLoading("Đang kết nối tới server...");
        PokerNetworkClient.getInstance().addOnOpen(() => {
            App.instance.showErrLoading("Đang đang đăng nhập...");
            PokerNetworkClient.getInstance().send(new cmdNetwork.SendLogin(Configs.Login.Nickname, Configs.Login.AccessToken));
        }, this);
        PokerNetworkClient.getInstance().addOnClose(() => {
            App.instance.loadScene("Lobby");
        }, this);
        PokerNetworkClient.getInstance().connect();
    }

    // Request UI Room
    joinRoom(info) {
        cc.log("Poker joinRoom roomInfo : ", info);
        App.instance.showLoading(true);
        PokerNetworkClient.getInstance().send(new cmd.SendJoinRoomById(info["id"]));
    }

    refeshListRoom() {
        this.contentListRooms.removeAllChildren(true);
        PokerNetworkClient.getInstance().send(new cmd.SendGetListRoom());
    }

    findRoomId() {
        cc.log("Poker findRoomId id : ", this.edtFindRoom.string);
        let text = this.edtFindRoom.string.trim();
        if (text.length > 0) {
            let idFind = parseInt(text);
            for (let index = 0; index < this.contentListRooms.childrenCount; index++) {
                let roomItem = this.contentListRooms.children[index].getComponent("Poker.ItemRoom");
                if (roomItem.roomInfo["id"] != idFind) {
                    this.contentListRooms.children[index].active = false;
                }
            }
        } else {
            for (let index = 0; index < this.contentListRooms.childrenCount; index++) {
                this.contentListRooms.children[index].active = true;
            }
        }
    }

    hideRoomFull() {
        if (this.btnHideRoomFull.isChecked) {
            for (let index = 0; index < this.contentListRooms.childrenCount; index++) {
                let roomItem = this.contentListRooms.children[index].getComponent("Poker.ItemRoom");
                if (roomItem.roomInfo["userCount"] == roomItem.roomInfo["maxUserPerRoom"]) {
                    this.contentListRooms.children[index].active = false;
                }
            }
        } else {
            for (let index = 0; index < this.contentListRooms.childrenCount; index++) {
                this.contentListRooms.children[index].active = true;
            }
        }
    }

    showUIRooms() {
        this.UI_ChooseRoom.active = true;
        if (this.isInitedUIRoom) {
            BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
        } else {
            this.labelNickName.string = Configs.Login.Nickname;
            BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
                this.labelCoin.string = Utils.formatNumber(Configs.Login.Coin);
            }, this);
            BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);

            this.setupListener();
        }
    }

    closeUIRoom() {
        this.UI_ChooseRoom.active = false;
    }

    createRoom() {
        cc.log("Poker createRoom");
    }

    playingNow() {
        cc.log("Poker playingNow");
        for (let index = 0; index < this.contentListRooms.childrenCount; index++) {
            let roomItem = this.contentListRooms.children[index].getComponent("Poker.ItemRoom");
            if (roomItem.roomInfo["userCount"] < roomItem.roomInfo["maxUserPerRoom"]) {
                cc.log("Poker playingNow con Slot");
                cc.log("Poker playingNow requiredMoney : ", roomItem.roomInfo["requiredMoney"]);
                cc.log("Poker playingNow Coin : ", Configs.Login.Coin);
                if (roomItem.roomInfo["requiredMoney"] < Configs.Login.Coin) {
                    cc.log("Poker playingNow Du tien requiredMoney");
                    cc.log("Poker playingNow result : ", roomItem.roomInfo);
                    this.joinRoom(roomItem.roomInfo);
                    index = 100000; // break
                    return;
                }
            }
        }

    }

    // Chat
    showUIChat() {
        this.UI_Chat.active = true;
        this.UI_Chat.runAction(
            cc.moveTo(0.5, 420, 0)
        );
    }

    closeUIChat() {
        this.UI_Chat.runAction(
            cc.moveTo(0.5, 1000, 0)
        );
    }

    chatEmotion(event, id) {
        cc.log("Poker chatEmotion id : ", id);
        PokerNetworkClient.getInstance().send(new cmd.SendChatRoom(1, id));
        this.closeUIChat();
    }

    chatMsg() {
        if (this.edtChatInput.string.trim().length > 0) {
            PokerNetworkClient.getInstance().send(new cmd.SendChatRoom(0, this.edtChatInput.string));
            this.edtChatInput.string = "";
            this.closeUIChat();
        }
    }

    backToLobby() {
        PokerNetworkClient.getInstance().close();
        App.instance.loadScene("Lobby");
    }

    // Playing
    showUIPlaying() {
        this.UI_Playing.active = true;
    }

    closeUIPlaying() {
        this.actionLeaveRoom();
    }

    setupMatch(data: cmd.ReceivedJoinRoomSucceed) {
        this.showUIPlaying();
        this.closeUIChat();
        cc.log("Poker setupMatch data : ", data);

        // {
        //     "myChair": 0,
        //     "moneyBet": 128000,
        //     "roomOwner": 0,
        //     "roomId": 23808,
        //     "gameId": 100609,
        //     "moneyType": 0,
        //     "rule": 0,
        //     "playerSize": 0,
        //     "playerStatus": [],
        //     "playerInfos": [],
        //     "handCardSizeSize": 0,
        //     "handCardSizeList": [],
        //     "minBuyInTiLe": 0,
        //     "maxBuyInTiLe": 0
        //   }

        let myChair = data["myChair"];
        let moneyBet = data["moneyBet"];
        let roomOwner = data["roomOwner"];
        let roomId = data["roomId"];
        let gameId = data["gameId"];
        let moneyType = data["moneyType"];
        let rule = data["rule"];
        let playerSize = data["playerSize"];
        let playerStatus = data["playerStatus"];
        let playerInfos = data["playerInfos"];
        let handCardSizeSize = data["handCardSizeSize"];
        let handCardSizeList = data["handCardSizeList"];
        let minBuyInTiLe = data["minBuyInTiLe"];
        let maxBuyInTiLe = data["maxBuyInTiLe"]

        cc.log("Poker setupMatch myChair  : ", myChair);
        cc.log("Poker setupMatch moneyBet  : ", moneyBet);
        cc.log("Poker setupMatch roomOwner  : ", roomOwner);
        cc.log("Poker setupMatch roomId  : ", roomId);
        cc.log("Poker setupMatch gameId  : ", gameId);
        cc.log("Poker setupMatch moneyType  : ", moneyType);
        cc.log("Poker setupMatch rule  : ", rule);
        cc.log("Poker setupMatch playerSize  : ", playerSize);
        cc.log("Poker setupMatch playerStatus  : ", playerStatus);
        cc.log("Poker setupMatch playerInfos  : ", playerInfos);
        cc.log("Poker setupMatch handCardSizeSize  : ", handCardSizeSize);
        cc.log("Poker setupMatch handCardSizeList  : ", handCardSizeList);
        cc.log("Poker setupMatch minBuyInTiLe  : ", minBuyInTiLe);
        cc.log("Poker setupMatch maxBuyInTiLe  : ", maxBuyInTiLe);

        // Kiem tra, chon 1 thoi
        this.gameState = cmd.Code.STATE_JOIN_ROOM;

        this.labelRoomId.string = "POKER - PHÒNG: " + roomId;
        this.labelRoomBet.string = "MỨC CƯỢC: " + Utils.formatNumber(moneyBet) + "$";

        this.currentRoomBet = moneyBet;

        this.resetCenterCards();

        configPlayer[0].playerId = Configs.Login.Nickname;
        configPlayer[0].playerPos = myChair;
        cc.log("Poker setupMatch configPlayer Me : ", configPlayer[0]);
        cc.log("Poker setupMatch configPlayer  : ", configPlayer);

        var numPlayers = 0;
        var arrPlayerPosExist = [];
        var arrPlayerInfo = [];
        var arrPlayerStatus = [];

        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
            if (playerInfos[index].nickName !== "") {
                numPlayers += 1;
                arrPlayerPosExist.push(index);
                arrPlayerInfo.push(playerInfos[index]);
                arrPlayerStatus.push(playerStatus[index]);
            }
        }
        cc.log("Poker setupMatch numPlayers : ", numPlayers);
        cc.log("Poker setupMatch arrPlayerStatus : ", arrPlayerStatus);
        cc.log("Poker setupMatch arrPlayerInfo : ", arrPlayerInfo);
        cc.log("Poker setupMatch arrPlayerPosExist : ", arrPlayerPosExist);

        this.resetHubChips();

        // setup configPlayer
        for (let a = 0; a < configPlayer.length; a++) {
            configPlayer[a].playerPos = defaultPlayerPos[myChair][a];
        }

        // set State of Seat : Yes | No exist Player
        for (let index = 0; index < configPlayer.length; index++) {
            let findPos = arrPlayerPosExist.indexOf(configPlayer[index].playerPos);

            var seatId = configPlayer[index].seatId;
            this.getPlayerHouse(seatId).resetPlayerInfo();
            if (findPos > -1) {
                // Exist player -> Set Player Info
                if (seatId == 0 && arrPlayerStatus[findPos] == cmd.Code.PLAYER_STATUS_SITTING) {
                    this.showPopupBuyIn(minBuyInTiLe, maxBuyInTiLe, moneyBet);
                }

                if (arrPlayerStatus[findPos] == cmd.Code.PLAYER_STATUS_SITTING || arrPlayerStatus[findPos] == cmd.Code.PLAYER_STATUS_PLAYING) {
                    configPlayer[index].isViewer = false;
                    this.getPlayerHouse(seatId).setIsViewer(false);
                } else {
                    configPlayer[index].isViewer = true;
                    this.getPlayerHouse(seatId).setIsViewer(true);
                }
                this.setupSeatPlayer(seatId, arrPlayerInfo[findPos]);
            } else {
                // Not Exist player  -> Active Btn Add player
                this.getPlayerHouse(seatId).showBtnInvite(true);
                configPlayer[index].isViewer = true;
            }
        }

        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
            this.getPlayerHouse(index).setOwner(false);
        }
        let seatOwner = this.findPlayerSeatByPos(roomOwner);
        if (seatOwner !== -1) {
            this.getPlayerHouse(seatOwner).setOwner(true);
            this.seatOwner = seatOwner;
        }

        cc.log("Poker setupMatch configPlayer : ", configPlayer);
    }


    // Time Start
    startThinkingCountDown(seatId, turnTime) {
        this.timeThinking = turnTime;
        this.unschedule(this.intervalThinking);
        this.schedule(this.intervalThinking = () => {
            this.timeThinking--;
            var rate = (this.timeThinking / turnTime).toFixed(2);
            this.getPlayerHouse(seatId).processThinking(rate);
            if (this.timeThinking < 1) {
                this.unschedule(this.intervalThinking);
                this.getPlayerHouse(seatId).hidePlayCountdown();
            }
        }, 1)
    }

    startWaittingCountDown(timeWait) {
        this.timeAutoStart = timeWait;
        this.setTimeWaittingCountDown();
        this.notifyTimeStart.active = true;
        this.unschedule(this.intervalWaitting);
        this.schedule(this.intervalWaitting = () => {
            this.timeAutoStart--;
            this.setTimeWaittingCountDown();
            if (this.timeAutoStart < 1) {
                this.unschedule(this.intervalWaitting);
                this.notifyTimeStart.active = false;
            }
        }, 1)
    }

    setTimeWaittingCountDown() {
        this.seconds = Math.floor(this.timeAutoStart % 60);
        this.notifyTimeStart.getComponent(cc.Label).string = " Bắt đầu sau : " + this.seconds + "s ";
    }

    // Time End
    startEndCountDown(timeWait) {
        this.timeEnd = timeWait;
        this.setTimeEndCountDown();
        this.notifyTimeEnd.active = true;
        this.unschedule(this.intervalEnd);
        this.schedule(this.intervalEnd = () => {
            this.timeEnd--;
            this.setTimeEndCountDown();
            if (this.timeEnd < 1) {
                this.unschedule(this.intervalEnd);
                this.notifyTimeEnd.active = false;
            }
        }, 1)
    }

    setTimeEndCountDown() {
        this.seconds = Math.floor(this.timeEnd % 60);
        this.notifyTimeEnd.getComponent(cc.Label).string = " Kết thúc sau : " + this.seconds + "s ";
    }

    // Time Bet
    startBettingCountDown(turnTime) {
        cc.log("Poker startBettingCountDown turnTime : ", turnTime);
        this.timeBet = turnTime;
        this.actionBetting.active = true;
        this.processBetting(1);
        this.unschedule(this.intervalBetting);
        this.schedule(this.intervalBetting = () => {
            this.timeBet--;
            var rate = (this.timeBet / turnTime).toFixed(1);
            this.processBetting(rate);
            if (this.timeBet < 1) {
                this.unschedule(this.intervalBetting);
                this.actionBetting.active = false;
            }
        }, 1);
    }

    processBetting(rate) {
        cc.log("Poker processBetting rate : ", rate);
        cc.log("Poker processBetting fillRange : ", this.actionBetting.children[0].getComponent(cc.Sprite).fillRange);
        this.actionBetting.children[0].getComponent(cc.Sprite).fillRange = rate;
    }

    // Open Me Card
    openMeCard(event, itemId) {
        // Open Me cards
        let cardPos = parseInt(itemId);
        cc.log("Poker openMeCard cardPos : ", cardPos);
        cc.log("Poker openMeCard currentCard : ", this.currentCard);

        this.getPlayerHouse(0).prepareCardReal(cardPos);
        let spriteCardId = CardUtils.getNormalId(this.currentCard[cardPos]);
        this.getPlayerHouse(0).transformToCardReal(cardPos, this.spriteCards[spriteCardId]);

        this.numCardOpened += 1;
        if (this.numCardOpened == 3) {
            this.btnOpenCard.active = true;
            this.btnBet.active = false;

            let score = 0;
            for (let a = 0; a < 3; a++) {
                score += CardUtils.getDiemById(this.currentCard[a]);
            }
            if (score > 10) {
                this.getPlayerHouse(0).showCardName((score % 10) + " Điểm");
            } else {
                this.getPlayerHouse(0).showCardName(score + " Điểm");
            }

            setTimeout(() => {
                this.getPlayerHouse(0).resetCardReady();
            }, 200);
        }
    }

    moveChipsToHubNow(index) {
        this.hubChips.children[2 * index].position = cc.v2(25, 80);
        this.hubChips.children[2 * index].scale = 0;
        this.hubChips.children[(2 * index) + 1].position = cc.v2(25, 80);
        this.hubChips.children[(2 * index) + 1].scale = 0;
    }

    fxMoveChips(chips, delay, toX, toY) {
        chips.runAction(
            cc.sequence(
                cc.delayTime(delay),
                cc.scaleTo(0, 1, 1),
                cc.spawn(
                    cc.moveTo(0.8, toX, toY),
                    cc.scaleTo(0.8, 0, 0)
                )
            )
        );
    }

    resetHubChips() {
        var arrFromX = [70, 280, 280, 260, 100, -260, -375, -360];
        var arrFromY = [-195, -150, -55, 70, 90, 85, -30, -155];

        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
            this.hubChips.children[2 * index].position = cc.v2(arrFromX[index], arrFromY[index]);
            this.hubChips.children[(2 * index) + 1].position = cc.v2(arrFromX[index], arrFromY[index]);
        }

        for (let index = 0; index < 16; index++) {
            this.hubChips.children[index].active = false;
        }
    }

    setupBet() {
        // arrBetValue
        this.currentBetSelectedIndex = 0;
        this.betChooseValueTarget.y = this.arrBetPos[this.currentBetSelectedIndex];
    }

    showPopupBuyIn(min, max, bet) {
        this.minCashIn = min;
        this.maxCashIn = max;
        this.popupBuyIn.active = true;
        this.labelBuyInMin.string = Utils.formatNumber(bet * min);
        if (Configs.Login.Coin > bet * max) {
            this.labelBuyInMax.string = Utils.formatNumber(bet * max);
        } else {
            this.labelBuyInMax.string = Utils.formatNumber(Configs.Login.Coin);
        }
        this.edtBuyIn.string = "";
        this.toggleAutoBuyIn.isChecked = true;
    }

    closePopupBuyIn() {
        this.popupBuyIn.active = false;
    }

    textChange(event) {
        if (event.length > 0) {
            var rawNumber = "";
            for (let index = 0; index < event.length; index++) {
                if (event[index] == "0"
                    || event[index] == "1"
                    || event[index] == "2"
                    || event[index] == "3"
                    || event[index] == "4"
                    || event[index] == "5"
                    || event[index] == "6"
                    || event[index] == "7"
                    || event[index] == "8"
                    || event[index] == "9") {
                    rawNumber += event[index];
                }
            }
            cc.log("Poker onTextChange rawNumber : ", rawNumber);
            if (rawNumber !== "") {
                this.edtBuyIn.string = Utils.formatNumber(parseInt(rawNumber));
            } else {
                this.edtBuyIn.string = "";
            }
        }
    }

    // show Center Cards
    showAllCenterCards(centerCards) {
        this.currentCenterCard = centerCards;
        for (let index = 0; index < centerCards.length; index++) {
            let spriteCardId = CardUtils.getNormalId(centerCards[index]);
            this.cardsCenter.children[index].getComponent(cc.Sprite).spriteFrame = this.spriteCards[spriteCardId];
        }

        // dua 3 la len -175, -10 roi xoe ra ben phai
        setTimeout(() => {
            this.cardsCenter.children[0].runAction(
                cc.spawn(
                    cc.moveTo(0.1, -170, -45),
                    cc.scaleTo(0.1, 1, 1)
                )
            );
            this.cardsCenter.children[1].runAction(
                cc.sequence(
                    cc.spawn(
                        cc.moveTo(0.1, -17, -45),
                        cc.scaleTo(0.1, 1, 1)
                    ),
                    cc.delayTime(0.1),
                    cc.moveTo(0.2, -85, -45)
                )
            );
            this.cardsCenter.children[2].runAction(
                cc.sequence(
                    cc.spawn(
                        cc.moveTo(0.1, -170, -45),
                        cc.scaleTo(0.1, 1, 1)
                    ),
                    cc.delayTime(0.1),
                    cc.moveTo(0.2, 0, -45)
                )
            );

            this.cardsCenter.children[3].runAction(
                cc.sequence(
                    cc.delayTime(1),
                    cc.spawn(
                        cc.moveTo(0.1, 85, -45),
                        cc.scaleTo(0.1, 1, 1)
                    ),
                )
            );

            this.cardsCenter.children[4].runAction(
                cc.sequence(
                    cc.delayTime(1.5),
                    cc.spawn(
                        cc.moveTo(0.1, 170, -45),
                        cc.scaleTo(0.1, 1, 1)
                    )
                )
            );
        }, 400);
    }

    // addListener
    setupListener() {
        PokerNetworkClient.getInstance().addListener((data) => {
            let inpacket = new InPacket(data);
            switch (inpacket.getCmdId()) {
                case cmd.Code.JOIN_ROOM_SUCCESS:
                    {
                        cc.log("Poker JOIN_ROOM_SUCCESS");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedJoinRoomSucceed(data);
                        cc.log("Poker JOIN_ROOM_SUCCESS res : ", JSON.stringify(res));
                        this.closeUIRoom();
                        this.setupMatch(res);
                    }
                    break;
                case cmd.Code.THONG_TIN_BAN_CHOI:
                    {
                        cc.log("Poker THONG_TIN_BAN_CHOI");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedGameInfo(data);
                        cc.log("Poker THONG_TIN_BAN_CHOI res : ", JSON.stringify(res));
                        this.closeUIRoom();
                        this.showUIPlaying();
                        this.closeUIChat();
                    }
                    break;
                case cmd.Code.DANG_KY_THOAT_PHONG:
                    {
                        cc.log("Poker DANG_KY_THOAT_PHONG");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedNotifyRegOutRoom(data);
                        cc.log("Poker DANG_KY_THOAT_PHONG res : ", JSON.stringify(res));
                        let outChair = res["outChair"];
                        let isOutRoom = res["isOutRoom"];

                        let seatId = this.findPlayerSeatByPos(outChair);
                        if (seatId !== -1) {
                            this.getPlayerHouse(seatId).showNotify("Sắp rời bàn !");
                        }
                    }
                    break;
                case cmd.Code.NEW_USER_JOIN:
                    {
                        cc.log("Poker NEW_USER_JOIN");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedUserJoinRoom(data);
                        cc.log("Poker NEW_USER_JOIN res : ", JSON.stringify(res));

                        let nickName = res["info"]["nickName"];
                        let avatar = res["info"]["avatar"];
                        let currentMoney = res["info"]["money"];
                        let chair = res["uChair"];
                        let status = res["uStatus"];

                        // set State of Seat : Yes | No exist Player
                        for (let index = 0; index < configPlayer.length; index++) {
                            if (configPlayer[index].playerPos == chair) {
                                // Exist player -> Set Player Info
                                var seat = configPlayer[index].seatId;
                                this.getPlayerHouse(seat).resetPlayerInfo();
                                var customPlayerInfo = {
                                    "avatar": avatar,
                                    "nickName": nickName,
                                    "currentMoney": currentMoney,
                                }


                                this.setupSeatPlayer(seat, customPlayerInfo);

                                if (status == cmd.Code.PLAYER_STATUS_VIEWER) {
                                    this.getPlayerHouse(seat).setIsViewer(true);
                                    configPlayer[seat].isViewer = true;
                                    // this.getPlayerHouse(seat).playFxViewer();
                                } else {
                                    this.getPlayerHouse(seat).setIsViewer(false);
                                    configPlayer[seat].isViewer = false;
                                }
                            }
                        }
                    }
                    break;
                case cmd.Code.LEAVE_GAME:
                    {
                        cc.log("Poker LEAVE_GAME");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedUserLeaveRoom(data);
                        cc.log("Poker LEAVE_GAME res : ", JSON.stringify(res));
                        let chair = res["chair"];

                        let seatId = this.findPlayerSeatByPos(chair);
                        if (seatId !== -1) {
                            // Need clear configPlayer
                            for (let index = 0; index < configPlayer.length; index++) {
                                if (configPlayer[index].seatId == seatId) {
                                    configPlayer[index].playerId = -1;
                                    configPlayer[index].isViewer = true;
                                }
                            }

                            // Change UI
                            this.getPlayerHouse(seatId).resetPlayerInfo();
                            this.getPlayerHouse(seatId).showBtnInvite(true);

                            let arrSeatExistLast = this.getNumPlayers();
                            if (arrSeatExistLast.length == 1) {
                                this.resetPlayersPlaying();
                                this.resetCenterCards();
                                this.matchPot.active = false;
                            }

                            if (seatId == 0) {
                                // Me leave
                                // Change UI
                                this.UI_Playing.active = false;
                                this.UI_ChooseRoom.active = true;
                            }
                        }
                    }
                    break;
                case cmd.Code.TAKE_TURN:
                    {
                        cc.log("Poker TAKE_TURN");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedTakeTurn(data);
                        cc.log("Poker TAKE_TURN res : ", JSON.stringify(res));

                        let actionChair = res["actionChair"];
                        let action = res["action"];
                        let lastRaise = res["lastRaise"];
                        let currentBet = res["currentBet"];
                        let maxBet = res["maxBet"];
                        let currentMoney = res["currentMoney"];
                        let raiseStep = res["raiseStep"];
                        let raiseBlock = res["raiseBlock"];

                        cc.log("Poker TAKE_TURN actionChair : ", actionChair);
                        cc.log("Poker TAKE_TURN action : ", action);
                        cc.log("Poker TAKE_TURN lastRaise : ", lastRaise);
                        cc.log("Poker TAKE_TURN currentBet : ", currentBet);
                        cc.log("Poker TAKE_TURN maxBet : ", maxBet);
                        cc.log("Poker TAKE_TURN currentMoney : ", currentMoney);
                        cc.log("Poker TAKE_TURN raiseStep : ", raiseStep);
                        cc.log("Poker TAKE_TURN raiseBlock : ", raiseBlock);

                        let seatId = this.findPlayerSeatByPos(actionChair);
                        if (seatId != -1) {
                            let actionName = "";
                            switch (action) {
                                case cmd.Code.GAME_ACTION_FOLD:
                                    actionName = "FOLD";
                                    break;
                                case cmd.Code.GAME_ACTION_CHECK:
                                    actionName = "CHECK";
                                    break;
                                case cmd.Code.GAME_ACTION_CALL:
                                    actionName = "CALL";
                                    break;
                                case cmd.Code.GAME_ACTION_RAISE:
                                    actionName = "RAISE";
                                    break;
                                case cmd.Code.GAME_ACTION_ALL_IN:
                                    actionName = "ALL-IN";
                                    break;
                                default:
                                    break;
                            }
                            this.getPlayerHouse(seatId).showActionState(actionName);
                        }
                    }
                    break;
                case cmd.Code.SELECT_DEALER:
                    {
                        cc.log("Poker SELECT_DEALER");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedSelectDealer(data);
                        cc.log("Poker SELECT_DEALER res : ", JSON.stringify(res));

                        let dealerChair = res["dealerChair"];
                        let smallBlindChair = res["smallBlindChair"];
                        let bigBlindChair = res["bigBlindChair"];
                        let hasInfoSize = res["hasInfoSize"];
                        let hasInfoList = res["hasInfoList"];
                        let playerStatusList = res["playerStatusList"];
                        let gameId = res["gameId"];
                        let isCheat = res["isCheat"];
                        let currentMoneySize = res["currentMoneySize"];
                        let currentMoneyList = res["currentMoneyList"];
                        let size = res["size"];
                        let listBetBigBlind = res["listBetBigBlind"];

                        cc.log("Poker SELECT_DEALER dealerChair : ", dealerChair);
                        cc.log("Poker SELECT_DEALER smallBlindChair : ", smallBlindChair);
                        cc.log("Poker SELECT_DEALER bigBlindChair : ", bigBlindChair);
                        cc.log("Poker SELECT_DEALER hasInfoSize : ", hasInfoSize);
                        cc.log("Poker SELECT_DEALER hasInfoList : ", hasInfoList);
                        cc.log("Poker SELECT_DEALER playerStatusList : ", playerStatusList);
                        cc.log("Poker SELECT_DEALER gameId : ", gameId);
                        cc.log("Poker SELECT_DEALER isCheat : ", isCheat);
                        cc.log("Poker SELECT_DEALER currentMoneySize : ", currentMoneySize);
                        cc.log("Poker SELECT_DEALER currentMoneyList : ", currentMoneyList);
                        cc.log("Poker SELECT_DEALER size : ", size);
                        cc.log("Poker SELECT_DEALER listBetBigBlind : ", listBetBigBlind);

                        // set Dealer, SB, BB state
                        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
                            this.getPlayerHouse(index).setDealer(false);
                            this.getPlayerHouse(index).setSmallBind(false);
                            this.getPlayerHouse(index).setBigBind(false);
                        }

                        let seatIdDealer = this.findPlayerSeatByPos(dealerChair);
                        if (seatIdDealer != -1) {
                            this.getPlayerHouse(seatIdDealer).setDealer(true);
                        }

                        let seatIdSmallBind = this.findPlayerSeatByPos(smallBlindChair);
                        if (seatIdSmallBind != -1) {
                            this.getPlayerHouse(seatIdSmallBind).setSmallBind(true);
                        }

                        let seatIdBigBind = this.findPlayerSeatByPos(bigBlindChair);
                        if (seatIdBigBind != -1) {
                            this.getPlayerHouse(seatIdBigBind).setBigBind(true);
                        }

                        // update Gold
                        for (let index = 0; index < currentMoneyList.length; index++) {
                            if (currentMoneyList[index] > 0) {
                                let seatId = this.findPlayerSeatByPos(index);
                                this.getPlayerHouse(seatId).setGold(currentMoneyList[index]);
                                this.getPlayerHouse(seatId).addChips();
                            }
                        }
                    }
                    break;
                case cmd.Code.BUY_IN:
                    {
                        cc.log("Poker BUY_IN");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedBuyIn(data);
                        cc.log("Poker BUY_IN res : ", JSON.stringify(res));

                        let chair = res["chair"];
                        let buyInMoney = res["buyInMoney"];

                        cc.log("Poker BUY_IN chair : ", chair);
                        cc.log("Poker BUY_IN buyInMoney : ", buyInMoney);

                        let seatId = this.findPlayerSeatByPos(chair);
                        if (seatId != -1) {
                            if (seatId == 0) {
                                // Me buy in
                                App.instance.showLoading(false);
                            }
                            this.getPlayerHouse(seatId).setGold(buyInMoney);
                        }
                    }
                    break;
                case cmd.Code.DEAL_PRIVATE_CARD:
                    {
                        cc.log("Poker DEAL_PRIVATE_CARD");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedDealCards(data);
                        cc.log("Poker DEAL_PRIVATE_CARD res : ", JSON.stringify(res));

                        let chair = res["chair"];
                        let sizeCard = res["sizeCard"];
                        let myCards = res["myCards"];
                        let boBaiId = res["boBaiId"];

                        cc.log("Poker DEAL_PRIVATE_CARD chair : ", chair);
                        cc.log("Poker DEAL_PRIVATE_CARD sizeCard : ", sizeCard);
                        cc.log("Poker DEAL_PRIVATE_CARD myCards : ", myCards);
                        cc.log("Poker DEAL_PRIVATE_CARD boBaiId : ", boBaiId);

                        this.btnBet.active = false;
                        this.btnOpenCard.active = false;
                        this.matchPot.active = true;

                        this.currentCard = myCards;
                        cc.log("Poker ReceivedChiaBai currentCard : ", this.currentCard);

                        var arrSeatExist = this.getNumPlayers();
                        let numPlayer = arrSeatExist.length;
                        cc.log("Poker ReceivedChiaBai arrSeatExist : ", arrSeatExist);
                        cc.log("Poker ReceivedChiaBai numPlayer : ", numPlayer);

                        // Open | Hide cards not use
                        for (let index = 0; index < cmd.Code.MAX_PLAYER * 2; index++) { // 8 players * 2 cards
                            this.cardsDeal.children[index].active = index >= numPlayer * 2 ? false : true;
                            this.cardsDeal.children[index].position = cc.v2(0, 0);
                        }

                        // Move Cards used to each player joined
                        for (let a = 0; a < 2; a++) { // players x 2 cards
                            for (let b = 0; b < numPlayer; b++) {
                                let seatId = arrSeatExist[b];
                                if (seatId !== -1) {
                                    let card4Me = this.cardsDeal.children[(a * numPlayer) + b];
                                    let rawPlayerPos = this.groupPlayers.children[seatId].position;
                                    cc.log("Poker CHIA_BAI delayTime : ", ((a * numPlayer) + b) * 0.15);
                                    card4Me.runAction(
                                        cc.sequence(
                                            cc.delayTime(((a * numPlayer) + b) * 0.15),
                                            cc.moveTo(0.2, rawPlayerPos)
                                        )
                                    );
                                }
                            }
                        }

                        let delayOver2Under = 0.2;
                        var maxDelay = ((1 * numPlayer) + (numPlayer - 1)) * 0.15; // ((a * numPlayer) + b) * 0.15
                        let timeUnderLayer = (maxDelay + 0.2 + delayOver2Under) * 1000;
                        cc.log("CHIA_BAI timeUnderLayer : ", timeUnderLayer);
                        clearTimeout(this.timeoutChiaBaiDone);
                        this.timeoutChiaBaiDone = setTimeout(() => {
                            for (let index = 0; index < cmd.Code.MAX_PLAYER * 2; index++) { // 8 players * 2 cards
                                cc.log("CHIA_BAI cardsDeal index : ", index);
                                this.cardsDeal.children[index].active = false;
                            }

                            for (let index = 0; index < numPlayer; index++) {
                                let seatId = arrSeatExist[index];
                                if (seatId !== -1) {
                                    // Drop layer
                                    this.getPlayerHouse(seatId).showCardReady(true);
                                    this.getPlayerHouse(seatId).showCardReal(false);
                                }
                            }

                            // Open Me cards
                            for (let a = 0; a < 2; a++) {
                                cc.log("Poker cardId : ", myCards[a]);
                                let spriteCardId = CardUtils.getNormalId(myCards[a]);
                                this.getPlayerHouse(0).prepareToTransform();
                                this.getPlayerHouse(0).transformToCardReal(a, this.spriteCards[spriteCardId]);
                            }
                            let cardName = this.getCardsName(boBaiId);
                            this.getPlayerHouse(0).showCardName(cardName);
                        }, timeUnderLayer);

                    }
                    break;
                case cmd.Code.NEW_ROUND:
                    {
                        cc.log("Poker NEW_ROUND");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedNewBetRound(data);
                        cc.log("Poker NEW_ROUND res : ", JSON.stringify(res));

                        let roundId = res["roundId"];
                        let sizeCard = res["sizeCard"];
                        let plusCards = res["plusCards"];
                        let cardName = res["cardName"];
                        let potAmount = res["potAmount"];

                        cc.log("Poker NEW_ROUND roundId : ", roundId);
                        cc.log("Poker NEW_ROUND sizeCard : ", sizeCard);
                        cc.log("Poker NEW_ROUND plusCards : ", plusCards);
                        cc.log("Poker NEW_ROUND cardName : ", cardName);
                        cc.log("Poker NEW_ROUND potAmount : ", potAmount);

                        this.matchPot.active = true;
                        this.currentMatchPotValue = potAmount;
                        this.labelMatchPot.string = Utils.formatNumber(potAmount);
                    }
                    break;
                case cmd.Code.CHANGE_TURN:
                    {
                        cc.log("Poker CHANGE_TURN");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedChangeTurn(data);
                        cc.log("Poker CHANGE_TURN res : ", JSON.stringify(res));

                        let roundId = res["roundId"];
                        let chair = res["chair"];
                        let betTime = res["betTime"];

                        cc.log("Poker CHANGE_TURN roundId : ", roundId);
                        cc.log("Poker CHANGE_TURN chair : ", chair);
                        cc.log("Poker CHANGE_TURN betTime : ", betTime);

                        let seatId = this.findPlayerSeatByPos(chair);
                        if (seatId != -1) {
                            this.getPlayerHouse(seatId).showPlayCountdown();
                            this.startThinkingCountDown(seatId, betTime);
                            if (seatId == 0) {
                                this.btnBet.active = true;
                                this.btnOpenCard.active = false;
                            }
                        }
                    }
                    break;
                case cmd.Code.KET_THUC:
                    {
                        cc.log("Poker KET_THUC");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedEndGame(data);
                        cc.log("Poker KET_THUC res : ", JSON.stringify(res));

                        // {
                        //     "potAmount": 1500,
                        //     "rankSize": 9,
                        //     "rankList": [1, 10, 0, 0, 0, 0, 0, 0, 0],
                        //     "kqttSize": 9,
                        //     "kqttList": [1490, 0, 0, 0, 0, 0, 0, 0, 0],
                        //     "booleanWinerSize": 9,
                        //     "booleanWinerList": [1, 0, 0, 0, 0, 0, 0, 0, 0],
                        //     "moneyArraySize": 9,
                        //     "currentMoney": [20490, 19500, 0, 0, 0, 0, 0, 0, 0],
                        //     "gameMoney": [4370306, 6467652, 0, 0, 0, 0, 0, 0, 0],
                        //     "gameMoneySize": 9,
                        //     "publicCardSize": 5,
                        //     "publicCards": [10, 26, 2, 21, 7],
                        //     "hasInfoSize": 9,
                        //     "hasInfoList": [3, 1, 0, 0, 0, 0, 0, 0, 0],
                        //     "privateCardList": [
                        //         [18, 16], [], [], [], [], [], [], [], []
                        //     ],
                        //     "maxCardList": [
                        //         [18, 16, 26, 21, 10],
                        //         [10, 9, 43, 26, 21],
                        //         [],
                        //         [],
                        //         [],
                        //         [],
                        //         [],
                        //         [],
                        //         []
                        //     ],
                        //     "cardNameList": [8, 8, 0, 0, 0, 0, 0, 0, 0]
                        // }

                        let potAmount = res["potAmount"];
                        let rankSize = res["rankSize"];
                        let rankList = res["rankList"];
                        let kqttSize = res["kqttSize"];
                        let kqttList = res["kqttList"];
                        let booleanWinerSize = res["booleanWinerSize"];
                        let booleanWinerList = res["booleanWinerList"];
                        let moneyArraySize = res["moneyArraySize"];
                        let currentMoney = res["currentMoney"];
                        let gameMoney = res["gameMoney"];
                        let gameMoneySize = res["gameMoneySize"];
                        let publicCardSize = res["publicCardSize"];
                        let publicCards = res["publicCards"];
                        let hasInfoSize = res["hasInfoSize"];
                        let hasInfoList = res["hasInfoList"];
                        let privateCardList = res["privateCardList"];
                        let maxCardList = res["maxCardList"];
                        let cardNameList = res["cardNameList"];

                        this.matchPot.active = true;
                        this.currentMatchPotValue = potAmount;
                        this.labelMatchPot.string = Utils.formatNumber(potAmount);

                        // show Fx win

                        // find Players is Playing
                        let arrPlayerPosExist = [];
                        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
                            if (maxCardList[index].length > 0) {
                                arrPlayerPosExist.push(index);
                            }
                        }

                        // find Winner
                        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
                            if (booleanWinerList[index] == 1) {
                                // Winner
                                let seatId = this.findPlayerSeatByPos(index);
                                if (seatId != -1) {
                                    this.getPlayerHouse(seatId).fxWin({
                                        moneyChange: kqttList[index],
                                        currentMoney: currentMoney[index]
                                    });

                                    if (seatId == 0) {
                                        // Me win
                                        this.btnOpenCard.active = true;
                                        this.btnBet.active = false;
                                    }
                                }
                            } else {
                                // Lose : can kiem tra xem co phai isPlaying k
                                let findId = arrPlayerPosExist.indexOf(index);
                                if (findId !== -1) {
                                    let seatId = this.findPlayerSeatByPos(index);
                                    this.getPlayerHouse(seatId).fxLose({
                                        moneyChange: kqttList[index],
                                        currentMoney: currentMoney[index]
                                    });
                                }
                            }
                        }

                        // show Center Cards
                        this.showAllCenterCards(publicCards);

                        // reshow Me cards for reconnect

                        // find Me max cards
                        let endMeCards = this.currentCard;
                        let endCenterCards = publicCards;
                        let endMeMaxCards = maxCardList[configPlayer[0].playerPos];

                        cc.log("Poker KET_THUC endMeCards : ", endMeCards);
                        cc.log("Poker KET_THUC endCenterCards : ", endCenterCards);
                        cc.log("Poker KET_THUC endMeMaxCards : ", endMeMaxCards);
                        if (endMeMaxCards.length > 0) {
                            for (let index = 0; index < endMeCards.length; index++) {
                                let findId = endMeMaxCards.indexOf(endMeCards[index]);
                                if (findId !== -1) {
                                    this.getPlayerHouse(0).setCardWin(index, true);
                                } else {
                                    this.getPlayerHouse(0).setCardWin(index, false);
                                }
                            }

                            for (let index = 0; index < endCenterCards.length; index++) {
                                let findId = endMeMaxCards.indexOf(endCenterCards[index]);
                                if (findId !== -1) {
                                    this.cardsCenter.children[index].color = cc.Color.WHITE;
                                } else {
                                    this.cardsCenter.children[index].color = cc.Color.GRAY;
                                }
                            }
                        }

                        // show Cards Name
                        for (let index = 0; index < arrPlayerPosExist.length; index++) {
                            let cardName = this.getCardsName(cardNameList[arrPlayerPosExist[index]]);
                            let seatId = this.findPlayerSeatByPos(arrPlayerPosExist[index]);
                            if (seatId != -1) {
                                this.getPlayerHouse(seatId).showCardName(cardName);
                            }
                        }
                    }
                    break;
                case cmd.Code.UPDATE_MATCH:
                    {
                        cc.log("Poker UPDATE_MATCH");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedUpdateMatch(data);
                        cc.log("Poker UPDATE_MATCH res : ", JSON.stringify(res));

                        // {
                        //     "chair": 1,
                        //     "hasInfoSize": 9,
                        //     "hasInfoList": [1, 1, 0, 0, 0, 0, 0, 0, 0],
                        //     "currentMoneyList": [19990, 19990, 0, 0, 0, 0, 0, 0, 0],
                        //     "statusList": [2, 2, 0, 0, 0, 0, 0, 0, 0]
                        // }

                        let chair = res["chair"];
                        let hasInfoSize = res["hasInfoSize"];
                        let hasInfoList = res["hasInfoList"];
                        let currentMoneyList = res["currentMoneyList"];
                        let statusList = res["statusList"];

                        cc.log("Poker setupMatch configPlayer : ", configPlayer);
                        // theo Pos khong phai SeatId
                        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
                            let pos = configPlayer[index]["playerPos"];
                            if (hasInfoList[pos] == 1) {
                                // setGold se inactive isViewer nen dat no len dau de ben duoi config lai
                                this.getPlayerHouse(index).setGold(currentMoneyList[pos]);
                                if (statusList[pos] == cmd.Code.PLAYER_STATUS_SITTING || statusList[pos] == cmd.Code.PLAYER_STATUS_PLAYING) {
                                    configPlayer[index].isViewer = false;
                                    configPlayer[index]["isViewer"] = false;
                                    this.getPlayerHouse(index).setIsViewer(false);
                                } else {
                                    configPlayer[index].isViewer = true;
                                    configPlayer[index]["isViewer"] = true;
                                    this.getPlayerHouse(index).setIsViewer(true);
                                }
                            } else {
                                configPlayer[index]["playerId"] = -1;
                                configPlayer[index]["isViewer"] = true;
                            }
                        }
                        cc.log("Poker setupMatch configPlayer : ", configPlayer);
                    }
                    break;
                case cmd.Code.SHOW_CARD:
                    {
                        cc.log("Poker SHOW_CARD");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedShowCard(data);
                        cc.log("Poker SHOW_CARD res : ", JSON.stringify(res));

                        let chair = res["chair"];

                        cc.log("Poker SHOW_CARD chair : ", chair);
                    }
                    break;
                case cmd.Code.REQUEST_BUY_IN:
                    {
                        cc.log("Poker REQUEST_BUY_IN");
                    }
                    break;
                case cmd.Code.REQUEST_STAND_UP:
                    {
                        cc.log("Poker REQUEST_STAND_UP");
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedStandUp(data);
                        cc.log("Poker REQUEST_STAND_UP res : ", JSON.stringify(res));
                        let isUp = res["isUp"];

                        cc.log("Poker REQUEST_STAND_UP isUp : ", isUp);
                    }
                    break;



                case cmd.Code.LOGIN:
                    App.instance.showLoading(false);
                    this.refeshListRoom();
                    PokerNetworkClient.getInstance().send(new cmd.CmdReconnectRoom());
                    break;
                case cmd.Code.TOPSERVER:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker TOPSERVER");
                    }
                    break;
                case cmd.Code.CMD_PINGPONG:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker CMD_PINGPONG");
                    }
                    break;
                case cmd.Code.CMD_JOIN_ROOM:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker CMD_JOIN_ROOM");
                    }
                    break;
                case cmd.Code.CMD_RECONNECT_ROOM:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker CMD_RECONNECT_ROOM");
                    }
                    break;
                case cmd.Code.CMD_RECONNECT_ROOM:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker CMD_RECONNECT_ROOM");
                    }
                    break;
                case cmd.Code.MONEY_BET_CONFIG:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker MONEY_BET_CONFIG");
                    }
                    break;
                case cmd.Code.JOIN_ROOM_FAIL:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedJoinRoomFail(data);
                        cc.log("Poker JOIN_ROOM_FAIL res : ", JSON.stringify(res));
                        let msg = "Lỗi " + res.getError() + ", không xác định.";
                        switch (res.getError()) {
                            case 1:
                                msg = "Lỗi kiểm tra thông tin!";
                                break;
                            case 2:
                                msg = "Không tìm được phòng thích hợp. Vui lòng thử lại sau!";
                                break;
                            case 3:
                                msg = "Bạn không đủ tiền vào phòng chơi này!";
                                break;
                            case 4:
                                msg = "Không tìm được phòng thích hợp. Vui lòng thử lại sau!";
                                break;
                            case 5:
                                msg = "Mỗi lần vào phòng phải cách nhau 10 giây!";
                                break;
                            case 6:
                                msg = "Hệ thống bảo trì!";
                                break;
                            case 7:
                                msg = "Không tìm thấy phòng chơi!";
                                break;
                            case 8:
                                msg = "Mật khẩu phòng chơi không đúng!";
                                break;
                            case 9:
                                msg = "Phòng chơi đã đủ người!";
                                break;
                            case 10:
                                msg = "Bạn bị chủ phòng không cho vào bàn!"
                        }
                        App.instance.alertDialog.showMsg(msg);
                    }
                    break;
                case cmd.Code.GET_LIST_ROOM:
                    {
                        let res = new cmd.ReceivedGetListRoom(data);
                        cc.log(res);
                        for (let i = 0; i < res.list.length; i++) {
                            let itemData = res.list[i];
                            let item = cc.instantiate(this.prefabItemRoom);
                            item.getComponent("Poker.ItemRoom").initItem(itemData);
                            this.contentListRooms.addChild(item);
                        }
                        this.scrollListRoom.scrollToTop(0.2);
                    }
                    break;
                case cmd.Code.JOIN_GAME_ROOM_BY_ID:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker JOIN_GAME_ROOM_BY_ID");
                    }
                    break;

                // ------------------------ Game ---------------------------     
                // case cmd.Code.MO_BAI:
                //     {
                //         App.instance.showLoading(false);
                //         let res = new cmd.ReceivedMoBai(data);
                //         cc.log("Poker ReceivedMoBai res : ", JSON.stringify(res));
                //         // {
                //         // "chairMoBai": 0,
                //         // "cardSize": 3,
                //         // "cards": [
                //         //   19,
                //         //   17,
                //         //   32
                //         // ]
                //         // }

                //         let chairMoBai = res["chairMoBai"];
                //         let cards = res["cards"];

                //         let seatId = this.findPlayerSeatByPos(chairMoBai);
                //         if (seatId != -1 && seatId != 0) {
                //             this.getPlayerHouse(seatId).prepareToTransform();
                //             let score = 0;
                //             for (let a = 0; a < 3; a++) {
                //                 score += CardUtils.getDiemById(cards[a]);
                //                 let spriteCardId = CardUtils.getNormalId(cards[a]);
                //                 this.getPlayerHouse(seatId).transformToCardReal(a, this.spriteCards[spriteCardId]);
                //             }
                //             if (score > 10) {
                //                 this.getPlayerHouse(seatId).showCardName((score % 10) + " Điểm");
                //             } else {
                //                 this.getPlayerHouse(seatId).showCardName(score + " Điểm");
                //             }
                //         }

                //     }
                //     break;
                // case cmd.Code.BAT_DAU:
                //     {
                //         App.instance.showLoading(false);
                //         cc.log("Poker BAT_DAU");
                //         let res = new cmd.ReceivedFirstTurnDecision(data);
                //         cc.log("Poker ReceivedFirstTurnDecision res : ", JSON.stringify(res));

                //         this.resetHubChips();

                //     }
                //     break;
                case cmd.Code.KET_THUC:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedEndGame(data);
                        cc.log("Poker ReceivedEndGame res : ", JSON.stringify(res));

                        // {
                        //     "statusList": [3, 3, 0, 0, 0, 0, 0, 0],
                        //     "cardList": [
                        //         [6, 23, 21],
                        //         [11, 25, 28],
                        //         [],
                        //         [],
                        //         [],
                        //         [],
                        //         [],
                        //         []
                        //     ],
                        //     "tienThangChuong": -20000,
                        //     "tienThangGa": 0,
                        //     "keCuaMoneyList": [0, 0, 0, 0, 0, 0, 0, 0],
                        //     "danhBienMoneyList": [0, 0, 0, 0, 0, 0, 0, 0],
                        //     "tongTienCuoiVan": -20000,
                        //     "tongTienCuocList": [-20000, 20000, 0, 0, 0, 0, 0, 0],
                        //     "tongDanhBienList": [0, 0, 0, 0, 0, 0, 0, 0],
                        //     "tongKeCuaList": [0, 0, 0, 0, 0, 0, 0, 0],
                        //     "tongCuocGaList": [0, 0, 0, 0, 0, 0, 0, 0],
                        //     "tongCuoiVanList": [-20000, 19600, 0, 0, 0, 0, 0, 0],
                        //     "currentMoneyList": [4643704, 411662, 0, 0, 0, 0, 0, 0],
                        //     "timeEndGame": 12
                        // }

                        this.unschedule(this.intervalEnd);
                        this.notifyTimeEnd.active = false;

                        // // Mo het cac la bai neu no chua dc mo
                        // if (!this.isBtnOpenCardShowed && !configPlayer[0].isViewer) {
                        //     let cardReady = this.getPlayerHouse(0).node.children[2].children[0];
                        //     for (let index = 0; index < 3; index++) {
                        //         if (cardReady.children[index].scale == 1) {
                        //             let spriteCardId = CardUtils.getNormalId(this.currentCard[index]);
                        //             this.getPlayerHouse(0).transformToCardReal(index, this.spriteCards[spriteCardId]);
                        //         }
                        //     }
                        // }



                        // 
                        let cardList = res["cardList"];
                        let tienThangChuong = res["tienThangChuong"];
                        let tienThangGa = res["tienThangGa"];
                        let keCuaMoneyList = res["keCuaMoneyList"];
                        let danhBienMoneyList = res["danhBienMoneyList"];
                        let tongTienCuoiVan = res["tongTienCuoiVan"];
                        let tongTienCuocList = res["tongTienCuocList"];
                        let tongDanhBienList = res["tongDanhBienList"];
                        let tongKeCuaList = res["tongKeCuaList"];
                        let tongCuocGaList = res["tongCuocGaList"];
                        let tongCuoiVanList = res["tongCuoiVanList"];
                        let currentMoneyList = res["currentMoneyList"];
                        let timeEndGame = res["timeEndGame"];

                        let posPlaying = [];
                        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
                            if (cardList[index].length > 0) {
                                posPlaying.push(index);
                            }
                        }
                        cc.log("Poker ReceivedEndGame posPlaying : ", posPlaying);

                        let result = [];
                        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
                            let findId = posPlaying.indexOf(configPlayer[index].playerPos);
                            if (findId !== -1) {
                                cc.log("--------------------------------");
                                cc.log("playerId : ", configPlayer[index].playerId);
                                cc.log("bet : ", tongTienCuocList[posPlaying[findId]]);
                                cc.log("bien : ", tongDanhBienList[posPlaying[findId]]);
                                cc.log("ke : ", tongKeCuaList[posPlaying[findId]]);
                                cc.log("ga : ", tongCuocGaList[posPlaying[findId]]);
                                cc.log("total : ", tongCuoiVanList[posPlaying[findId]]);
                                cc.log("money : ", currentMoneyList[posPlaying[findId]]);

                                let cards = cardList[posPlaying[findId]];
                                let cardReady = this.getPlayerHouse(index).node.children[2].children[0];


                                let score = 0;
                                for (let a = 0; a < 3; a++) {
                                    score += CardUtils.getDiemById(cards[a]);
                                    if (cardReady.children[a].scale == 1) {
                                        let spriteCardId = CardUtils.getNormalId(cards[a]);
                                        this.getPlayerHouse(index).transformToCardReal(a, this.spriteCards[spriteCardId]);
                                    }
                                }
                                if (score > 10) {
                                    this.getPlayerHouse(index).showCardName((score % 10) + " Điểm");
                                } else {
                                    this.getPlayerHouse(index).showCardName(score + " Điểm");
                                }

                                result.push({
                                    userName: configPlayer[index].playerId,
                                    bet: tongTienCuocList[posPlaying[findId]],
                                    bien: tongDanhBienList[posPlaying[findId]],
                                    ke: tongKeCuaList[posPlaying[findId]],
                                    ga: tongCuocGaList[posPlaying[findId]],
                                    total: tongCuoiVanList[posPlaying[findId]]
                                });

                                let info = {
                                    moneyChange: tongCuoiVanList[posPlaying[findId]],
                                    money: currentMoneyList[posPlaying[findId]],
                                    ga: tongCuocGaList[posPlaying[findId]],
                                }
                                if (info.moneyChange >= 0) {
                                    // Win
                                    this.getPlayerHouse(index).fxWin(info);
                                } else {
                                    // Lose
                                    this.getPlayerHouse(index).fxLose(info);
                                }
                            }
                        }
                    }
                    break;
                // case cmd.Code.CHIA_BAI:
                //     {
                //         App.instance.showLoading(false);
                //         let res = new cmd.ReceivedChiaBai(data);
                //         cc.log("Poker ReceivedChiaBai res : ", JSON.stringify(res));
                //         // {
                //         //     "cardSize": 3,
                //         //     "cards": [
                //         //       17,
                //         //       28,
                //         //       33
                //         //     ],
                //         //     "gameId": 1567389,
                //         //     "timeChiaBai": 20
                //         //   }

                //         this.btnBet.active = false;
                //         this.btnOpenCard.active = false;

                //         for (let index = 1; index < cmd.Code.MAX_PLAYER; index++) {
                //             this.getPlayerHouse(index).showPopupBet(false);
                //         }

                //         this.matchPot.getComponent(cc.Button).interactable = false;
                //         this.matchPot.children[0].color = cc.Color.GRAY;

                //         let cards = res["cards"];
                //         let timeChiaBai = res["timeChiaBai"];

                //         clearTimeout(this.timeoutEndGame);
                //         this.timeoutEndGame = setTimeout(() => {
                //             this.startEndCountDown(timeChiaBai);
                //         }, 2000);

                //         this.currentCard = cards;
                //         cc.log("Poker ReceivedChiaBai currentCard : ", this.currentCard);

                //         var arrSeatExist = this.getNumPlayers();
                //         let numPlayer = arrSeatExist.length;

                //         // Open | Hide cards not use
                //         for (let index = 0; index < cmd.Code.MAX_PLAYER * 3; index++) { // 8 players * 3 cards
                //             this.cardsDeal.children[index].active = index >= numPlayer * 3 ? false : true;
                //             this.cardsDeal.children[index].position = cc.v2(0, 0);
                //         }

                //         // Move Cards used to each player joined
                //         for (let a = 0; a < 3; a++) { // players x 3 cards
                //             for (let b = 0; b < numPlayer; b++) {
                //                 let seatId = arrSeatExist[b];
                //                 if (seatId !== -1) {
                //                     let card4Me = this.cardsDeal.children[(a * numPlayer) + b];
                //                     let rawPlayerPos = this.groupPlayers.children[seatId].position;
                //                     cc.log("Poker CHIA_BAI delayTime : ", ((a * numPlayer) + b) * 0.15);
                //                     card4Me.runAction(
                //                         cc.sequence(
                //                             cc.delayTime(((a * numPlayer) + b) * 0.15),
                //                             cc.moveTo(0.2, rawPlayerPos)
                //                         )
                //                     );
                //                 }
                //             }
                //         }

                //         let delayOver2Under = 0.2;
                //         var maxDelay = ((2 * numPlayer) + (numPlayer - 1)) * 0.15; // ((a * numPlayer) + b) * 0.15
                //         let timeUnderLayer = (maxDelay + 0.2 + delayOver2Under) * 1000;
                //         cc.log("CHIA_BAI timeUnderLayer : ", timeUnderLayer);
                //         clearTimeout(this.timeoutChiaBaiDone);
                //         this.timeoutChiaBaiDone = setTimeout(() => {
                //             for (let index = 0; index < cmd.Code.MAX_PLAYER * 3; index++) { // 8 players * 3 cards
                //                 cc.log("CHIA_BAI cardsDeal index : ", index);
                //                 this.cardsDeal.children[index].active = false;
                //             }

                //             for (let index = 0; index < numPlayer; index++) {
                //                 let seatId = arrSeatExist[index];
                //                 if (seatId !== -1) {
                //                     // Drop layer
                //                     if (seatId == 0) {
                //                         this.getPlayerHouse(seatId).resetCardReady();
                //                     }
                //                     this.getPlayerHouse(seatId).showCardReady(true);
                //                     this.getPlayerHouse(seatId).showCardReal(false);
                //                 }
                //             }
                //         }, timeUnderLayer);
                //     }
                //     break;
                case cmd.Code.TU_DONG_BAT_DAU:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedAutoStart(data);
                        cc.log("Poker ReceiveAutoStart res : ", JSON.stringify(res));
                        // {
                        //     "isAutoStart": true,
                        //     "timeAutoStart": 5
                        // }
                        if (res.isAutoStart) {
                            this.resetCenterCards();
                            this.resetHubChips();
                            this.startWaittingCountDown(res.timeAutoStart);
                            this.btnBet.active = false;
                            this.btnOpenCard.active = false;

                            this.matchPot.active = false;
                            this.resetPlayersPlaying();
                        }
                    }
                    break;
                // case cmd.Code.DAT_CUOC:
                //     {
                //         App.instance.showLoading(false);
                //         let res = new cmd.ReceivedDatCuoc(data);
                //         cc.log("Poker ReceivedDatCuoc res : ", JSON.stringify(res));
                //         // {
                //         //     "chairDatCuoc": 1,
                //         //     "level": 2
                //         //   }

                //         let chairDatCuoc = res["chairDatCuoc"];
                //         let level = res["level"];

                //         let seatId = this.findPlayerSeatByPos(chairDatCuoc);
                //         if (seatId != -1) {
                //             this.getPlayerHouse(seatId).setBet(this.arrBetValue[level - 1]);
                //             this.getPlayerHouse(seatId).addChips();
                //         }
                //     }
                //     break;
                case cmd.Code.THONG_TIN_BAN_CHOI:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedGameInfo(data);
                        cc.log("Poker ReceivedGameInfo res : ", JSON.stringify(res));

                        // case Reconnect
                        // user dang o trong 1 phong nao do
                        // neu req join room nhan dc cai nay thi -> dua vao phong dang choi

                        // {
                        //     "myChair": 3,
                        //     "chuongChair": 4,
                        //     "cards": [22, 34, 32],
                        //     "cuocDanhBienList": [0, 0, 0, 0, 0, 0, 0, 0],
                        //     "cuocKeCuaList": [0, 0, 0, 0, 0, 0, 0, 0],
                        //     "gameServerState": 1,
                        //     "isAutoStart": true,
                        //     "gameAction": 2,
                        //     "countDownTime": 13,
                        //     "moneyType": 1,
                        //     "moneyBet": 100,
                        //     "gameId": 1828082,
                        //     "roomId": 98,
                        //     "hasInfo": [true, true, true, true, true, false, false, false],
                        //     "players": [[], [], [], [], [], [], [], []]
                        // }

                        this.closeUIRoom();
                        this.showUIPlaying();
                        this.closeUIChat();

                        let myChair = res["myChair"];
                        let chuongChair = res["chuongChair"];
                        let cards = res["cards"];
                        let cuocDanhBienList = res["cuocDanhBienList"];
                        let cuocKeCuaList = res["cuocKeCuaList"];
                        let gameServerState = res["gameServerState"];
                        let isAutoStart = res["isAutoStart"];
                        let gameAction = res["gameAction"];
                        let countDownTime = res["countDownTime"];
                        let moneyType = res["moneyType"];
                        let moneyBet = res["moneyBet"];
                        let gameId = res["gameId"];
                        let roomId = res["roomId"];
                        let hasInfo = res["hasInfo"];
                        let players = res["players"];

                        this.labelRoomId.string = "BA CÂY - PHÒNG: " + roomId;
                        this.labelRoomBet.string = "MỨC CƯỢC: " + Utils.formatNumber(moneyBet) + "$";

                        this.currentRoomBet = moneyBet;
                        this.gameState = gameAction;

                        this.currentCard = cards;

                        configPlayer[0].playerId = Configs.Login.Nickname;
                        configPlayer[0].playerPos = myChair;
                        cc.log("Poker setupMatch configPlayer Me : ", configPlayer[0]);
                        cc.log("Poker setupMatch configPlayer  : ", configPlayer);

                        var numPlayers = 0;
                        var arrPlayerPosExist = [];

                        for (let index = 0; index < hasInfo.length; index++) {
                            if (hasInfo[index]) {
                                numPlayers += 1;
                                arrPlayerPosExist.push(index);
                            }
                        }
                        cc.log("Poker numPlayers : ", numPlayers);

                        // setup configPlayer
                        for (let a = 0; a < configPlayer.length; a++) {
                            configPlayer[a].playerPos = defaultPlayerPos[myChair][a];
                        }

                        // set State of Seat : Yes | No exist Player
                        for (let index = 0; index < configPlayer.length; index++) {
                            let findPos = arrPlayerPosExist.indexOf(configPlayer[index].playerPos);

                            var seatId = configPlayer[index].seatId;
                            this.getPlayerHouse(seatId).resetPlayerInfo();

                            if (findPos > -1) {
                                // Exist player -> Set Player Info

                                // dang thieu thong tin -> se k hien dc UserInfo

                                // if (arrPlayerStatus[findPos] == cmd.Code.PLAYER_STATUS_READY) {
                                //     configPlayer[index].isViewer = false;
                                //     this.getPlayerHouse(seatId).setIsViewer(false);
                                // } else {
                                //     configPlayer[index].isViewer = true;
                                //     this.getPlayerHouse(seatId).setIsViewer(true);
                                // }

                                this.getPlayerHouse(seatId).setIsViewer(false);
                                this.setupSeatPlayer(seatId, {
                                    nickName: "",
                                    avatar: Utils.randomRange(1, 9),
                                    currentMoney: ""
                                });
                            } else {
                                // Not Exist player  -> Active Btn Add player
                                this.getPlayerHouse(seatId).showBtnInvite(true);
                                configPlayer[index].isViewer = true;
                            }
                        }

                        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
                            this.getPlayerHouse(index).setOwner(false);
                        }
                        let seatOwner = this.findPlayerSeatByPos(chuongChair);
                        if (seatOwner !== -1) {
                            this.getPlayerHouse(seatOwner).setOwner(true);
                            this.seatOwner = seatOwner;
                        }

                        this.resetHubChips();
                    }
                    break;
                case cmd.Code.DANG_KY_THOAT_PHONG:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedNotifyRegOutRoom(data);
                        cc.log("Poker ReceivedNotifyRegOutRoom res : ", JSON.stringify(res));
                        // {
                        //     "outChair": 1,
                        //     "isOutRoom": true
                        //   }

                        let outChair = res["outChair"];
                        let isOutRoom = res["isOutRoom"];

                        let seatId = this.findPlayerSeatByPos(outChair);
                        if (seatId !== -1) {
                            this.getPlayerHouse(seatId).showNotify("Sắp rời bàn !");
                        }
                    }
                    break;
                case cmd.Code.MOI_DAT_CUOC:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedMoiDatCuoc(data);
                        cc.log("Poker ReceivedMoiDatCuoc res : ", JSON.stringify(res));
                        // {
                        //     "timeDatCuoc": 20
                        //   }
                        this.startBettingCountDown(res.timeDatCuoc);
                        this.arrBetValue = [];
                        this.matchPot.active = true;
                        this.currentMatchPotValue = 0;
                        this.labelMatchPot.string = "0";

                        for (let index = 0; index < 4; index++) {
                            this.arrBetValue.push(this.currentRoomBet * (index + 1));
                            this.betChooseValue.children[index].children[0].getComponent(cc.Label).string = Utils.formatNumberMin(this.currentRoomBet * (4 - index));
                        }

                        // set bet default
                        for (let index = 0; index < configPlayer.length; index++) {
                            if (index !== this.seatOwner
                                && !configPlayer[index].isViewer
                                && configPlayer[index].playerId !== -1) {
                                cc.log("Poker ReceivedMoiDatCuoc index : ", index);
                                this.getPlayerHouse(index).setBet(this.currentRoomBet);
                                this.getPlayerHouse(index).addChips();
                                if (index != 0) { // k ke cua, danh bien duoc len chinh minh
                                    this.getPlayerHouse(index).setupBetValue(this.currentRoomBet);
                                }
                            }
                        }

                        // {
                        //     seatId: 0,
                        //     playerId: -1,
                        //     playerPos: -1,
                        //     isViewer: true
                        // }

                        if (this.seatOwner == 0) { // Me la Chuong -> K dc bet va k dc vao ga
                            this.btnOpenCard.active = false;
                            this.btnBet.active = false;
                        } else {
                            this.btnBet.active = true;
                            this.btnOpenCard.active = false;
                            this.setupBet();
                            cc.log("Poker MOI_DAT_CUOC this.arrBetValue : ", this.arrBetValue);
                        }

                        this.numCardOpened = 0;
                    }
                    break;
                case cmd.Code.CHEAT_CARDS:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker CHEAT_CARDS");
                    }
                    break;
                case cmd.Code.DANG_KY_CHOI_TIEP:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker DANG_KY_CHOI_TIEP");
                    }
                    break;
                case cmd.Code.UPDATE_OWNER_ROOM:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker UPDATE_OWNER_ROOM");
                    }
                    break;
                case cmd.Code.JOIN_ROOM_SUCCESS:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedJoinRoomSucceed(data);
                        this.closeUIRoom();
                        this.setupMatch(res);
                    }
                    break;
                case cmd.Code.LEAVE_GAME:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedUserLeaveRoom(data);
                        cc.log("Poker ReceivedUserLeaveRoom res : ", JSON.stringify(res));

                        // {
                        //     "chair": 1,
                        //     "nickName": "chaoae99"
                        //   }

                        let chair = res["chair"];

                        let seatId = this.findPlayerSeatByPos(chair);
                        if (seatId !== -1) {
                            // Need clear configPlayer
                            for (let index = 0; index < configPlayer.length; index++) {
                                if (configPlayer[index].seatId == seatId) {
                                    configPlayer[index].playerId = -1;
                                    configPlayer[index].isViewer = true;
                                }
                            }

                            // Change UI
                            this.getPlayerHouse(seatId).resetPlayerInfo();
                            this.getPlayerHouse(seatId).showBtnInvite(true);

                            let arrSeatExistLast = this.getNumPlayers();
                            if (arrSeatExistLast.length == 1) {
                                this.resetPlayersPlaying();
                                this.matchPot.active = false;
                            }

                            if (seatId == 0) {
                                // Me leave
                                // Change UI
                                this.UI_Playing.active = false;
                                this.UI_ChooseRoom.active = true;
                            }
                        }
                    }
                    break;
                case cmd.Code.NOTIFY_KICK_FROM_ROOM:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedKickOff(data);
                        cc.log("Poker ReceivedKickOff res : ", JSON.stringify(res));
                    }
                    break;
                case cmd.Code.NEW_USER_JOIN:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedUserJoinRoom(data);
                        cc.log("Poker ReceivedUserJoinRoom res : ", JSON.stringify(res));
                        // {
                        //     "info": {
                        //       "nickName": "Ahoang88",
                        //       "avatar": "7",
                        //       "money": 10230080
                        //     },
                        //     "uChair": 5,
                        //     "uStatus": 1
                        //   }

                        let info = res["info"];
                        let uChair = res["uChair"];
                        let uStatus = res["uStatus"];

                        // set State of Seat : Yes | No exist Player
                        for (let index = 0; index < configPlayer.length; index++) {
                            if (configPlayer[index].playerPos == uChair) {
                                // Exist player -> Set Player Info
                                var seat = configPlayer[index].seatId;
                                this.getPlayerHouse(seat).resetPlayerInfo();
                                var customPlayerInfo = {
                                    "avatar": info["avatar"],
                                    "nickName": info["nickName"],
                                    "currentMoney": info["money"],
                                }

                                this.setupSeatPlayer(seat, customPlayerInfo);

                                if (uStatus == cmd.Code.PLAYER_STATUS_VIEWER) {
                                    this.getPlayerHouse(seat).setIsViewer(true);
                                    configPlayer[seat].isViewer = true;
                                    // this.getPlayerHouse(seat).playFxViewer();
                                } else {
                                    this.getPlayerHouse(seat).setIsViewer(false);
                                    configPlayer[seat].isViewer = false;
                                }
                            }
                        }
                    }
                    break;
                case cmd.Code.NOTIFY_USER_GET_JACKPOT:
                    {
                        App.instance.showLoading(false);
                        cc.log("Poker NOTIFY_USER_GET_JACKPOT");
                    }
                    break;
                case cmd.Code.UPDATE_MATCH:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedUpdateMatch(data);
                        cc.log("Poker ReceivedUpdateMatch res : ", JSON.stringify(res));
                        // {
                        //     "myChair": 2,
                        //     "hasInfo": [
                        //       true,
                        //       true,
                        //       true,
                        //       true,
                        //       false,
                        //       true,
                        //       false,
                        //       false
                        //     ],
                        //     "infos": [
                        //       {
                        //         "nickName": "nestle103",
                        //         "avatar": "7",
                        //         "money": 5560860,
                        //         "status": 2
                        //       },
                        //       {
                        //         "nickName": "imeldda",
                        //         "avatar": "2",
                        //         "money": 3852854,
                        //         "status": 2
                        //       },
                        //       {
                        //         "nickName": "VN_Star1",
                        //         "avatar": "2",
                        //         "money": 5703572,
                        //         "status": 2
                        //       },
                        //       {
                        //         "nickName": "gvngvn4567",
                        //         "avatar": "2",
                        //         "money": 2749687,
                        //         "status": 2
                        //       },
                        //       {},
                        //       {
                        //         "nickName": "skypenon",
                        //         "avatar": "5",
                        //         "money": 5051363,
                        //         "status": 2
                        //       },
                        //       {},
                        //       {}
                        //     ]
                        //   }

                        let myChair = res["myChair"];
                        let hasInfo = res["hasInfo"];
                        let infos = res["infos"];

                        cc.log("Poker setupMatch configPlayer : ", configPlayer);
                        // theo Pos khong phai SeatId
                        for (let index = 0; index < hasInfo.length; index++) {
                            let pos = configPlayer[index]["playerPos"];
                            if (hasInfo[pos]) {
                                // setGold se inactive isViewer nen dat no len dau de ben duoi config lai
                                this.getPlayerHouse(index).setGold(infos[pos]["money"]);
                                configPlayer[index]["playerId"] = infos[pos]["nickName"];
                                if (infos[pos]["status"] == cmd.Code.PLAYER_STATUS_SITTING || infos[pos]["status"] == cmd.Code.PLAYER_STATUS_PLAYING) {
                                    configPlayer[index]["isViewer"] = false;
                                    this.getPlayerHouse(index).setIsViewer(false);
                                } else {
                                    configPlayer[index]["isViewer"] = true;
                                    this.getPlayerHouse(index).setIsViewer(true);
                                }
                                this.setupSeatPlayer(index, infos[pos]);
                            } else {
                                configPlayer[index]["playerId"] = -1;
                                configPlayer[index]["isViewer"] = true;
                            }
                        }
                        cc.log("Poker setupMatch configPlayer : ", configPlayer);
                    }
                    break;
                case cmd.Code.CHAT_ROOM:
                    {
                        App.instance.showLoading(false);
                        let res = new cmd.ReceivedChatRoom(data);
                        cc.log("Poker CHAT_ROOM res : ", JSON.stringify(res));

                        // {
                        //     "chair": 0,
                        //     "isIcon": true,
                        //     "content": "6",
                        //     "nickname": "chaoae99"
                        //   }

                        // {
                        //     "chair": 0,
                        //     "isIcon": false,
                        //     "content": "lalal",
                        //     "nickname": "chaoae99"
                        //   }

                        let chair = res["chair"];
                        let isIcon = res["isIcon"];
                        let content = res["content"];
                        if (isIcon) {
                            // Chat Icon
                            let seatId = this.findPlayerSeatByPos(chair);
                            if (seatId != -1) {
                                this.getPlayerHouse(seatId).showChatEmotion(content);
                            }
                        } else {
                            // Chat Msg
                            let seatId = this.findPlayerSeatByPos(chair);
                            if (seatId != -1) {
                                this.getPlayerHouse(seatId).showChatMsg(content);
                            }
                        }
                    }
                    break;
                default:
                    cc.log("--inpacket.getCmdId(): " + inpacket.getCmdId());
                    break;
            }
        }, this);
    }

    // request
    actionLeaveRoom() {
        cc.log("Poker actionLeaveRoom");
        PokerNetworkClient.getInstance().send(new cmd.CmdSendRequestLeaveGame());
    }

    actionOpenCard() {
        cc.log("Poker actionOpenCard");
        PokerNetworkClient.getInstance().send(new cmd.SendShowCard());
        this.btnOpenCard.active = false;
    }

    actionSendVaoGa() {
        cc.log("Poker actionSendVaoGa");

    }

    increaseBetValue() {
        if (this.currentBetSelectedIndex == (this.arrBetValue.length - 1)) {

        } else {
            this.currentBetSelectedIndex += 1;
        }

        this.betChooseValueTarget.y = this.arrBetPos[this.currentBetSelectedIndex];
    }

    decreaseBetValue() {
        if (this.currentBetSelectedIndex == 0) {

        } else {
            this.currentBetSelectedIndex -= 1;
        }

        this.betChooseValueTarget.y = this.arrBetPos[this.currentBetSelectedIndex];
    }

    actionAll_In() {
        cc.log("Poker actionAll_In");
        this.btnBet.active = false;
        PokerNetworkClient.getInstance().send(new cmd.SendTakeTurn(0, 0, 0, 1, 0));
    }

    actionRaise() {
        cc.log("Poker actionRaise");
        this.btnBet.active = false;
        let rawMeGold = this.getPlayerHouse(0).userGold.string.replace(/\./g, "");
        cc.log("Poker actionRaise raw : ", this.getPlayerHouse(0).userGold.string);
        cc.log("Poker actionRaise rawMeGold : ", rawMeGold);
        let currentMeMoney = parseInt(rawMeGold);
        cc.log("Poker actionRaise currentMeMoney : ", currentMeMoney);
        cc.log("Poker actionRaise betted : ", this.arrBetValue[this.currentBetSelectedIndex]);
        let betValue = Math.min(this.arrBetValue[this.currentBetSelectedIndex], currentMeMoney);
        PokerNetworkClient.getInstance().send(new cmd.SendTakeTurn(0, 0, 0, 0, betValue));

    }

    actionCheck() {
        cc.log("Poker actionCheck");
        this.btnBet.active = false;
        PokerNetworkClient.getInstance().send(new cmd.SendTakeTurn(0, 1, 0, 0, 0));

    }

    actionCall() {
        cc.log("Poker actionCall");
        this.btnBet.active = false;
        PokerNetworkClient.getInstance().send(new cmd.SendTakeTurn(0, 0, 1, 0, 0));

    }

    actionFold() {
        cc.log("Poker actionFold");
        this.btnBet.active = false;
        PokerNetworkClient.getInstance().send(new cmd.SendTakeTurn(1, 0, 0, 0, 0));
    }

    actionBuyIn() {
        cc.log("Poker actionBuyIn");
        cc.log("Poker input : ", this.edtBuyIn.string);
        let event = this.edtBuyIn.string;
        if (event.length > 0) {
            var rawNumber = "";
            for (let index = 0; index < event.length; index++) {
                if (event[index] == "0"
                    || event[index] == "1"
                    || event[index] == "2"
                    || event[index] == "3"
                    || event[index] == "4"
                    || event[index] == "5"
                    || event[index] == "6"
                    || event[index] == "7"
                    || event[index] == "8"
                    || event[index] == "9") {
                    rawNumber += event[index];
                }
            }
            cc.log("Poker actionBuyIn rawNumber : ", rawNumber);
            if (rawNumber !== "") {
                if (Configs.Login.Coin < this.maxCashIn) {
                    this.maxCashIn = Configs.Login.Coin;
                }

                if (parseInt(rawNumber) < this.minCashIn * this.currentRoomBet) {
                    App.instance.alertDialog.showMsg("Số tiền Buy In phải lớn hơn " + Utils.formatNumber(this.minCashIn * this.currentRoomBet));
                    return;
                }

                if (parseInt(rawNumber) > this.maxCashIn * this.currentRoomBet) {
                    App.instance.alertDialog.showMsg("Số tiền Buy In phải nhỏ hơn " + Utils.formatNumber(this.maxCashIn * this.currentRoomBet));
                    return;
                }
                cc.log("Poker actionBuyIn Cash In : ", parseInt(rawNumber));
                if (this.toggleAutoBuyIn.isChecked) {
                    PokerNetworkClient.getInstance().send(new cmd.SendBuyIn(parseInt(rawNumber), 1));
                } else {
                    PokerNetworkClient.getInstance().send(new cmd.SendBuyIn(parseInt(rawNumber), 0));
                }
                App.instance.showLoading(true);
                this.closePopupBuyIn();
            } else {
                App.instance.alertDialog.showMsg("Số tiền không hợp lệ.");
            }
        }
    }

    // State
    initConfigPlayer() {
        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
            configPlayer.push({
                seatId: index,
                playerId: -1,
                playerPos: -1,
                isViewer: true
            });
        }
        cc.log("Poker configPlayer : ", configPlayer);
    }

    resetCenterCards() {
        for (let index = 0; index < 5; index++) {
            this.cardsCenter.children[index].position = cc.v2(0, 100);
            this.cardsCenter.children[index].scale = 0;
            this.cardsCenter.children[index].color = cc.Color.WHITE;
        }
    }

    resetPlayersPlaying() {
        for (let index = 0; index < cmd.Code.MAX_PLAYER; index++) {
            this.getPlayerHouse(index).resetMatchHistory();
        }
    }

    // handle Game Players
    getCardsName(boBaiId) {
        let name = "";
        switch (boBaiId) {
            case cmd.Code.EG_SANH_VUA:
                name = "Sảnh Vua";
                break;
            case cmd.Code.EG_THUNG_PHA_SANH:
                name = "Thùng Phá Sảnh";
                break;
            case cmd.Code.EG_TU_QUY:
                name = "Tứ Quý";
                break;
            case cmd.Code.EG_CU_LU:
                name = "Cù Lũ";
                break;
            case cmd.Code.EG_THUNG:
                name = "Thùng";
                break;
            case cmd.Code.EG_SANH:
                name = "Sảnh";
                break;
            case cmd.Code.EG_XAM_CO:
                name = "Xám Cô";
                break;
            case cmd.Code.EG_HAI_DOI:
                name = "Hai Đôi";
                break;
            case cmd.Code.EG_DOI:
                name = "Đôi";
                break;
            case cmd.Code.EG_MAU_THAU:
                name = "Mậu Thầu";
                break;
            default:
                break;
        }
        return name;
    }

    setupSeatPlayer(seatId, playerInfo) {
        cc.log("Poker setupSeatPlayer playerInfo : ", playerInfo);
        configPlayer[seatId].playerId = playerInfo.nickName;
        this.getPlayerHouse(seatId).setAvatar(playerInfo.avatar);
        this.getPlayerHouse(seatId).setName(playerInfo.nickName);
        this.getPlayerHouse(seatId).setGold(playerInfo.currentMoney);
    }

    findPlayerSeatByUid(uid) {
        let seat = -1;
        for (let index = 0; index < configPlayer.length; index++) {
            if (configPlayer[index].playerId === uid) {
                seat = configPlayer[index].seatId;
            }
        }
        return seat;
    }

    findPlayerPosBySeat(seat) {
        return configPlayer[seat].playerPos;
    }

    findPlayerSeatByPos(pos) {
        if (pos == -1) {
            return -1;
        }

        let seat = -1;
        for (let index = 0; index < configPlayer.length; index++) {
            if (configPlayer[index].playerPos === pos) {
                seat = configPlayer[index].seatId;
            }
        }
        return seat;
    }

    getPlayerHouse(seatId) {
        return this.groupPlayers.children[seatId].getComponent("Poker.Player");
    }

    getNumPlayers() {
        cc.log("playerPosEntry configPlayer : ", configPlayer);
        var playerPosEntry = [];
        for (let index = 0; index < configPlayer.length; index++) {
            cc.log("playerPosEntry playerId : ", configPlayer[index].playerId);
            cc.log("playerPosEntry isViewer : ", configPlayer[index].isViewer);
            cc.log("-------------------------------------");
            if (configPlayer[index].playerId !== -1 && !configPlayer[index].isViewer) {
                playerPosEntry.push(configPlayer[index].seatId);
                cc.log("playerPosEntry seatId : ", configPlayer[index].seatId);
            }
        }
        cc.log("playerPosEntry : ", playerPosEntry);
        return playerPosEntry;
    }

    update(dt) {

    }
}
