import MiniGameNetworkClient from "../../scripts/networks/MiniGameNetworkClient";
import InPacket from "../../scripts/networks/Network.InPacket";
import App from "../../scripts/common/App";
import cmd from "./Lobby.Cmd";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ButtonMiniGame extends cc.Component {

    @property(cc.Label)
    labelTime: cc.Label = null;

    @property(cc.Node)
    button: cc.Node = null;

    @property(cc.Node)
    panel: cc.Node = null;

    @property(cc.Node)
    container: cc.Node = null;

    private buttonClicked = true;
    private buttonMoved = cc.Vec2.ZERO;

    onLoad() {
        this.panel.active = false;
        this.button.active = false;
        this.labelTime.string = "00";

        this.button.on(cc.Node.EventType.TOUCH_START, (event: cc.Event.EventTouch) => {
            this.buttonClicked = true;
            this.buttonMoved = cc.Vec2.ZERO;
        }, this);

        this.button.on(cc.Node.EventType.TOUCH_MOVE, (event: cc.Event.EventTouch) => {
            this.buttonMoved = this.buttonMoved.add(event.getDelta());
            if (this.buttonClicked) {
                if (Math.abs(this.buttonMoved.x) > 30 || Math.abs(this.buttonMoved.y) > 30) {
                    let pos = this.button.position;
                    pos.x += this.buttonMoved.x;
                    pos.y += this.buttonMoved.y;
                    this.button.position = pos;
                    this.buttonClicked = false;
                }
            } else {
                let pos = this.button.position;
                pos.x += event.getDeltaX();
                pos.y += event.getDeltaY();
                this.button.position = pos;
            }
        }, this);

        this.button.on(cc.Node.EventType.TOUCH_END, (event: cc.Event.EventTouch) => {
            if (this.buttonClicked) {
                this.actButton();
            }
        }, this);

        MiniGameNetworkClient.getInstance().addListener((data: Uint8Array) => {
            let inpacket = new InPacket(data);
            switch (inpacket.getCmdId()) {
                case cmd.Code.UPDATE_TIME_BUTTON:
                    {
                        let res = new cmd.ReceiveUpdateTimeButton(data);
                        this.labelTime.string = res.remainTime > 9 ? res.remainTime.toString() : "0" + res.remainTime;
                    }
                    break;
            }
        }, this);
    }

    show() {
        this.panel.active = false;
        this.button.active = true;
        this.labelTime.string = "00";
    }

    hidden() {
        this.panel.active = false;
        this.button.active = false;
    }

    showTimeTaiXiu(isShow: boolean) {
        // console.log(isShow);
        this.labelTime.node.parent.active = isShow;
    }

    actButton() {
        this.panel.active = true;
        this.button.active = false;
    }

    actHidden() {
        this.panel.active = false;
        this.button.active = true;
    }

    actTaiXiu() {
        App.instance.openGameTaiXiuMini();
        this.actHidden();
    }

    actMiniPoker() {
        App.instance.openGameMiniPoker();
        this.actHidden();
    }

    actSlot3x3() {
        App.instance.openGameSlot3x3();
        this.actHidden();
    }

    actCaoThap() {
        App.instance.openGameCaoThap();
        this.actHidden();
    }

    actBauCua() {
        App.instance.openGameBauCua();
        this.actHidden();
    }

    actChimDien(){
        App.instance.alertDialog.showMsg("Game sắp ra mắt.");
        this.actHidden();
    }
    actMaintain(){
        App.instance.alertDialog.showMsg("Game đang bảo trì.");
        this.actHidden();
    }

    actOanTuTi(){
        App.instance.openGameOanTuTi();
        this.actHidden();
    }
}