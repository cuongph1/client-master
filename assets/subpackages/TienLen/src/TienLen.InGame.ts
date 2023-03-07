
import Utils from "../../../scripts/common/Utils";
import Player from "./TienLen.Player"
import Card from "./TienLen.Card";
import TienLenNetworkClient from "../../../scripts/networks/TienLenNetworkClient";
import TienLenCmd from "./TienLen.Cmd";
import TienLenConstant from "./TienLen.Constant";
import Room from "./TienLen.Room";
import CardGroup from "./TienLen.CardGoup";
import Res from "./TienLen.Res";

const {ccclass, property} = cc._decorator;

@ccclass
export default class InGame extends cc.Component {

    public static instance: InGame = null;

    @property(cc.Label)
    lbRoomId: cc.Label = null;
    @property(cc.Label)
    lbRoomBet: cc.Label = null;
    @property(Player)
    players: Player[] = [];
    @property(cc.Label)
    lbTimeCountDown: cc.Label = null;
    @property(cc.SpriteFrame)
    cards: cc.SpriteFrame[] = [];
    @property(cc.Node)
    cardLine: cc.Node = null;
    @property(cc.Prefab)
    cardItem: cc.Prefab = null;
    @property(cc.Node)
    board: cc.Node = null;
    @property(cc.Node)
    btnsInGame: cc.Node = null;
    @property(cc.Label)
    lblToast: cc.Label = null;

     // UI Chat
     @property(cc.Node)
     UI_Chat: cc.Node = null;
     @property(cc.EditBox)
     edtChatInput: cc.EditBox = null;
 

    cardsOnHand = {};
    buttons = {};
    myChair = 0;
    sortBySuit = true;
    currTurnCards = [];
    checkTurn = false;

    onLoad () {
        InGame.instance = this;
        this.initRes();
    }

    initRes() {
        Res.getInstance();
        this.btnsInGame.children.forEach(btn => {
            this.buttons[btn.name] = btn;
        });
    }

    public show(isShow: boolean, roomInfo = null) {
        for (let i = 0; i < this.players.length; i++) {
                this.players[i].clearCardLine();
                this.players[i].lbStatus.string="";
        }
        if (isShow) {
            this.node.active = true;
            this.setRoomInfo(roomInfo);
        } else {
            this.node.active = false;
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
        TienLenNetworkClient.getInstance().send(new TienLenCmd.SendChatRoom(1, id));
        this.closeUIChat();
    }

    chatMsg() {
        if (this.edtChatInput.string.trim().length > 0) {
            if(this.edtChatInput.string.trim().length>30)
            {
                this.showToast("Bạn chat quá dài !");
                return;
            }
            TienLenNetworkClient.getInstance().send(new TienLenCmd.SendChatRoom(0, this.edtChatInput.string));
            this.edtChatInput.string = "";
            this.closeUIChat();
        }
    }

    actLeaveRoom() {
        TienLenNetworkClient.getInstance().send(new TienLenCmd.SendRequestLeaveGame());
    }

    setRoomInfo(room) {
        this.lbRoomId.string = room.roomId;
        this.lbRoomBet.string = Utils.formatNumber(room.moneyBet);
        this.myChair = room.myChair;
        this.setPlayersInfo(room);
    }

    setPlayersInfo(room) {
        for (let i = 0; i < room.playerInfos.length; i++) {
            var info = room.playerInfos[i];
            if (room.playerStatus[i] != 0) {
                var chair = this.convertChair(i,this.players.length);
                var pl = this.players[chair];
                if (pl) pl.setPlayerInfo(info);
            }
            else
            {
                var chair = this.convertChair(i,this.players.length);
                var pl = this.players[chair];
                pl.setLeaveRoom();
            }
        }
    }

    updateGameInfo(data) {
        this.show(true, data);
    }

    onUserJoinRoom(user) {
        if (user.uStatus != 0) {
            this.players[this.convertChair(user.uChair,this.players.length)].setPlayerInfo(user.info);
        }
    }

    autoStart(autoInfo) {
        if (autoInfo.isAutoStart)
            this.setTimeCountDown(autoInfo.autoStartTime);
    }

    setTimeCountDown(t) {
        this.lbTimeCountDown.string = t;
        this.lbTimeCountDown.node.active = true;
        var countDown = setInterval(()=> {
            t--;
            if (t < 0) {
                clearInterval(countDown);
                this.lbTimeCountDown.node.active = false;
            } else {
                this.lbTimeCountDown.string = t;
            }
        }, 1000);
    }

    firstTurn(data) {
        this.cleanCardLine();

        for (let i = 0; i < data.cards.length; i++) {
            var card = data.cards[i];
            var pl = this.players[this.convertChair(i,this.players.length)]
            if (pl.active)
                pl.setFirstCard(card);
        }
    }

    chiaBai(data) {
        this.setCardsOnHand(this.sortCards(data.cards));
        if (data.toiTrang > 0) {

        }
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].active) {
                this.players[i].offFirstCard();
                if (i > 0)
                    this.players[i].setCardRemain(data.cardSize);
            }
        }
        this.setActiveButtons(["bt_sort"], [true]);
    }
    playerChat(res) {
        let chair = res["chair"];
        let isIcon = res["isIcon"];
        let content = res["content"];

        let seatId = this.convertChair(chair,this.players.length);
        if (isIcon) {
            // Chat Icon
            this.players[seatId].showChatEmotion(content);
        } else {
            // Chat Msg
            this.players[seatId].showChatMsg(content);
        }
    }
    changeTurn(turn) {
        var chair = this.convertChair(turn.chair,this.players.length);
        for (let i = 0; i < this.players.length; i++) {
            if (i==chair) {
                this.players[i].setTimeRemain(turn.time);
            }
            else
            {
                this.players[i].setTimeRemain(0);
            }
        }
        if (chair == 0) {
            this.setActiveButtons(["bt_submit_turn", "bt_pass_turn"], [true, true]);
            this.checkTurn = true;
        }
        if (turn.newRound) {
            this.cleanCardsOnBoard();
            this.currTurnCards = [];
            this.checkTurn = false;
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].active) {
                    this.players[i].setStatus();
                }
            }    
        }
    }

    submitTurn(turn) {
        this.setActiveButtons(["bt_submit_turn", "bt_pass_turn"], [false, false]);
        this.players[0].setTimeRemain(0);
        var cards = this.sortCards(turn.cards);
        var cardHalf = (cards.length - 1) / 2;
        var ranX = Math.floor(Math.random() * 100) - 50;
        var ranY = Math.floor(Math.random() * 100) - 50;
        var chair = this.convertChair(turn.chair,this.players.length);
        var pl = this.players[chair];
        if (chair == 0) {
            for (let i = 0; i < cards.length; i++) {
                var cardIndex = cards[i];
                var _card = this.cardsOnHand[cardIndex];
                var pos = _card.parent.convertToWorldSpaceAR(_card.position)
                pos = this.board.convertToNodeSpaceAR(pos);
                _card.parent = this.board;
                _card.setPosition(pos);
                _card.runAction(cc.moveTo(0.2, cc.v2((i - cardHalf) * 30 + ranX, ranY)));
                _card.runAction(cc.scaleTo(0.2, 0.6, 0.6));
                delete this.cardsOnHand[cardIndex];
            }
        } else {
            var pos = pl.node.parent.convertToWorldSpaceAR(pl.node.position)
            pos = this.board.convertToNodeSpaceAR(pos);
            for (let i = 0; i < cards.length; i++) {
                var cardItem = cc.instantiate(this.cardItem);
                cardItem.parent = this.board;
                cardItem.setScale(0.6, 0.6);
                cardItem.setPosition(pos);
                cardItem.getComponent(Card).setCardData(cards[i]);
                cardItem.runAction(cc.moveTo(0.2, cc.v2((i - cardHalf) * 30 + ranX, ranY)));
            }
            pl.setCardRemain(turn.numberCard);
            this.currTurnCards = cards;
        }
    }

    passTurn(turn) {
        this.players[this.convertChair(turn.chair,this.players.length)].setStatus("Bỏ lượt");
        this.setActiveButtons(["bt_submit_turn", "bt_pass_turn"], [false, false]);
        this.players[this.convertChair(turn.chair,this.players.length)].setTimeRemain(0);
    }

    actSubmitTurn() {
        var cardSelected = [];
        this.cardLine.children.forEach(card => {
            var _card = card.getComponent(Card);
            if (_card.isSelected)
                cardSelected.push(_card.getCardIndex());
        });
        this.sendSubmitTurn(cardSelected);

        this.checkTurn = false;
    }

    sendSubmitTurn(cardSelected) {
        TienLenNetworkClient.getInstance().send(new TienLenCmd.SendDanhBai(!1, cardSelected));
    }

    actPassTurn() {
        this.sendPassTurn();

        this.checkTurn = false;
    }

    sendPassTurn() {
        TienLenNetworkClient.getInstance().send(new TienLenCmd.SendBoLuot(!0));
    }

    sortCards(cards) {
        cards = CardGroup.indexsToCards(cards);
        var _cards = [];
        if (this.sortBySuit)
            _cards = new CardGroup(cards).getOrderedBySuit();
        else
            _cards = CardGroup.sortCards(cards);
        return CardGroup.cardsToIndexs(_cards);
    }

    actSort() {
        this.sortBySuit = !this.sortBySuit;
        var cards = this.getCardsOnHand();
        cards = this.sortCards(cards);
        this.sortCardsOnHand(cards);
        this.setToggleCardsOnHand();
    }

    setCardsOnHand(cards) {
        cards.forEach(card => {
            var cardItem = cc.instantiate(this.cardItem);
            cardItem.parent = this.cardLine;
            cardItem.getComponent(Card).setCardData(card, this.onCardSelectCallback.bind(this));
            this.cardsOnHand[card] = cardItem;
        });
    }

    onCardSelectCallback(card) {
        if (this.currTurnCards
            && this.currTurnCards.length == 1
            && this.currTurnCards[0].card >= 48) //1 la khac 2
        {
            this.setToggleCardsOnHand();
            this.setToggleCardsOnHand([card]);
        } else
            this.checkSuggestion(card);
    }

    checkSuggestion(data) {
        data = CardGroup.indexToCard(data);
        var cardsOnHand = CardGroup.indexsToCards(this.getCardsOnHand());
        var turnCards = CardGroup.indexsToCards(this.currTurnCards);
        var suggestionCards;
        if (this.checkTurn)
            suggestionCards = new CardGroup(cardsOnHand).getSuggestionCards(turnCards, data, () => {
                let tmp = new Array();
                for (var key in this.cardsOnHand) {
                    let tmpCard = this.cardsOnHand[key].getComponent(Card);
                    if (tmpCard.isSelected) {
                        tmp.push(tmpCard);
                    }
                }
                return new CardGroup(cardsOnHand).getSuggestionNoCards(tmp, data, true);
            });
        else {
            let tmp = new Array();
            for (var key in this.cardsOnHand) {
                let tmpCard = this.cardsOnHand[key].getComponent(Card);
                if (tmpCard.isSelected) {
                    tmp.push(tmpCard);
                }
            }
            suggestionCards = new CardGroup(cardsOnHand).getSuggestionNoCards(tmp, data);
        }
        if (suggestionCards) {
            for (let i = 0; i < suggestionCards.length; i++) {
                for (let j = 0; j < suggestionCards[i].length; j++) {
                    if (CardGroup.cardToIndex(data) == CardGroup.cardToIndex(suggestionCards[i][j])) {
                        this.setToggleCardsOnHand(CardGroup.cardsToIndexs(suggestionCards[i]));
                    }
                }
            }
        }
    }

    getCardsOnHand() {
        var cards = [];
        for (var key in this.cardsOnHand) {
            cards.push(this.cardsOnHand[key].getComponent(Card).getCardIndex());
        }
        return cards;
    }

    cleanCardsOnHand() {
        for (var key in this.cardsOnHand)
            delete this.cardsOnHand[key];
    }

    cleanCardsOnBoard() {
        this.board.removeAllChildren();
    }

    setToggleCardsOnHand(cards = null) {
        if (cards === null) {
            for (var key in this.cardsOnHand) {
                this.cardsOnHand[key].getComponent(Card).deSelect();
            }
        } else {
            for (var key in this.cardsOnHand) {
                this.cardsOnHand[key].getComponent(Card).deSelect();
            }
            for (let i = 0; i < cards.length; i++) {
                this.cardsOnHand[cards[i]].getComponent(Card).select();
            }
        }
    }

    sortCardsOnHand(cards) {
        for (let i = 0; i < cards.length; i++) {
            var index = cards[i];
            this.cardsOnHand[index].setSiblingIndex(i);
        }
    }

    cleanCardLine() {
        this.cardLine.removeAllChildren();

        for (let i = 1; i < this.players.length; i++) {
            this.players[i].clearCardLine();
        }
    }

    setActiveButtons(btnNames, actives) {
        for (let i = 0; i < btnNames.length; i++) {
            this.buttons[btnNames[i]].active = actives[i];
        }
    }

    endGame(data) {
        var coinChanges = data.ketQuaTinhTienList;
        for (let i = 0; i < coinChanges.length; i++) {
            var chair = this.convertChair(i,this.players.length);
            if (i < TienLenConstant.Config.MAX_PLAYER) {
                this.players[chair].setCoinChange(coinChanges[i]);
                this.players[chair].setCoin(data.currentMoney[i]);
            }
        }
        for (let i = 0; i < data.cards.length; i++) {
            var chair = this.convertChair(i,this.players.length);
            if (chair != 0) {
                this.players[chair].setCardLine(data.cards[i]);
                this.players[chair].setCardRemain(0);
            }
        }
        this.setActiveButtons(["bt_sort"], [false]);
        this.setTimeCountDown(data.countDown -2);
        this.cleanCardsOnBoard();
        // this.cleanCardLine();
        this.cleanCardsOnHand();
    }
    OnChatChong(data) {
        var seatIdWin = this.convertChair(data.uChairWin,this.players.length);
        var seatIdLost = this.convertChair(data.uChairLost,this.players.length);
        setTimeout(() => {
            this.players[seatIdWin].setCoinChange(data.moneyWin);
            this.players[seatIdLost].setCoinChange(data.moneyLost);
            this.players[seatIdWin].setCoin(data.currentMoneyWin);
            this.players[seatIdLost].setCoin(data.currentMoneyLost);
            setTimeout(() => {
                this.players[seatIdWin].setStatus("");
                this.players[seatIdLost].setStatus("");
            }, 2000);
        }, 1000);
    }

    updateMatch(data) {

    }

    userLeaveRoom(data) {
        var chair = this.convertChair(data.chair,this.players.length);
        this.players[chair].setLeaveRoom();
        if (chair == 0) {
            this.show(false);
            Room.instance.show(true);
            Room.instance.refreshRoom();
        }
    }
    RequestLeaveRoom(data) {
        var chair = this.convertChair(data.chair,this.players.length);
        let name=this.players[chair].info.nickName;

        if(data.isleave==1)
        this.showToast(name+" đăng ký rời bàn thành công");
        else
        {
            this.showToast(name+" hủy đăng ký rời bàn thành công");
        }
    }

    convertChair(a,b) {
        return (a - this.myChair + b) % b;
    }

    showToast(message: string) {
        this.lblToast.string = message;
        let parent = this.lblToast.node.parent;
        parent.stopAllActions();
        parent.active = true;
        parent.opacity = 0;
        parent.runAction(cc.sequence(cc.fadeIn(0.1), cc.delayTime(2), cc.fadeOut(0.2), cc.callFunc(() => {
            parent.active = false;
        })));
    }
}
