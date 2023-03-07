import Dialog from "../../../scripts/common/Dialog";
import Tween from "../../../scripts/common/Tween";

const { ccclass, property } = cc._decorator;

@ccclass
export class PopupBonus extends Dialog {
    @property(cc.Node)
    items: cc.Node = null;
    @property(cc.Node)
    special: cc.Node = null;
    @property(cc.Node)
    itemSpecial: cc.Node = null;
    @property(cc.Label)
    lblLeft: cc.Label = null;
    @property(cc.Label)
    lblFactor: cc.Label = null;

    private factor = 1;
    private left = 0;
    private betValue = 0;
    private onFinished: () => void = null;
    private onSpecialFinished: () => void = null;
    private dataBonus: Array<number> = [];
    private dataSpecial: number = -1;

    start() {
        for (let i = 0; i < this.items.childrenCount; i++) {
            let node = this.items.children[i];
            node["btn"] = node.getChildByName("btn").getComponent(cc.Button);
            node["icon"] = node.getChildByName("icon");
            node["label"] = node.getChildByName("label").getComponent(cc.Label);
            node["factor"] = node.getChildByName("factor");

            node["btn"].node.on("click", () => {
                var value = this.dataBonus[this.dataBonus.length - this.left];
                switch (value) {
                    case 0:
                        this.factor++;
                        this.lblFactor.string = "x" + this.factor;
                        node["btn"].node.active = false;
                        node["factor"].active = true;
                        break;
                    case 1:
                        node.getChildByName("btn").active = false;
                        node.getChildByName("icon").active = true;
                        node["label"].node.active = true;
                        node["label"].string = "0";
                        Tween.numberTo(node["label"], 4 * this.betValue * this.factor, 0.3);
                        break;
                    case 2:
                        this.showSpecial(10, () => {
                            node["btn"].node.active = false;
                            node["icon"].active = true;
                            node["label"].node.active = true;
                            node["label"].string = "0";
                            Tween.numberTo(node["label"], 10 * this.betValue * this.factor, 0.3);
                            if (this.left <= 0) {
                                this.hidden();
                            }
                        });
                        break;
                    case 3:
                        this.showSpecial(15, () => {
                            node["btn"].node.active = false;
                            node["icon"].active = true;
                            node["label"].node.active = true;
                            node["label"].string = "0";
                            Tween.numberTo(node["label"], 15 * this.betValue * this.factor, 0.3);
                            if (this.left <= 0) {
                                this.hidden();
                            }
                        });
                        break;
                    case 4:
                        this.showSpecial(20, () => {
                            node["btn"].node.active = false;
                            node["icon"].active = true;
                            node["label"].node.active = true;
                            node["label"].string = "0";
                            Tween.numberTo(node["label"], 20 * this.betValue * this.factor, 0.3);
                            if (this.left <= 0) {
                                this.hidden();
                            }
                        });
                        break;
                }
                this.left--;
                this.lblLeft.string = "" + this.left;
                if (this.left <= 0) {
                    if (value === 0 || value === 1) {
                        this.hidden();
                    }
                    for (let i = 0; i < this.items.childrenCount; i++) {
                        this.items.children[i]["btn"].interactable = false;
                    }
                }
            });
        }
        for (let i = 0; i < this.itemSpecial.childrenCount; i++) {
            let node = this.itemSpecial.children[i];
            node["btn"] = node.getChildByName("btn").getComponent(cc.Button);
            node["icon"] = node.getChildByName("icon");
            node["label"] = node.getChildByName("label").getComponent(cc.Label);
            node["btn"].node.on("click", () => {
                node["btn"].node.active = false;
                node["icon"].active = true;
                node["label"].node.active = true;
                node["label"].string = "0";
                Tween.numberTo(node["label"], this.dataSpecial * this.betValue * this.factor, 0.3);
                for (let i = 0; i < this.itemSpecial.childrenCount; i++) {
                    this.itemSpecial.children[i]["btn"].interactable = false;
                }
                this.scheduleOnce(() => {
                    this.special.active = false;
                    this.onSpecialFinished();
                }, 1);
            });
        }
    }

    showBonus(betValue: number, bonus: string, onFinished: () => void) {
        super.show();
        this.special.active = false;
        for (let i = 0; i < this.items.childrenCount; i++) {
            let node = this.items.children[i];
            let btn = node.getChildByName("btn").getComponent(cc.Button);
            btn.node.active = true;
            btn.interactable = true;
            node.getChildByName("icon").active = false;
            node.getChildByName("label").active = false;
            node.getChildByName("factor").active = false;
        }
        this.betValue = betValue;
        this.onFinished = onFinished;
        let arrBonus = bonus.split(",");
        this.dataBonus = [];
        for (let i = 0; i < arrBonus.length; i++) {
            this.dataBonus.push(Number(arrBonus[i]));
        }
        this.left = this.dataBonus.length;
        this.factor = 1;
        this.lblLeft.string = "" + this.left;
        this.lblFactor.string = "x" + this.factor;
    }

    private showSpecial(data: number, onFinished: () => void) {
        for (let i = 0; i < this.itemSpecial.childrenCount; i++) {
            let node = this.itemSpecial.children[i];
            let btn = node.getChildByName("btn").getComponent(cc.Button);
            btn.node.active = true;
            btn.interactable = true;
            node.getChildByName("icon").active = false;
            node.getChildByName("label").active = false;
        }
        this.onSpecialFinished = onFinished;
        this.dataSpecial = data;
        this.special.active = true;
    }

    hidden() {
        this.scheduleOnce(() => {
            this.dismiss();
            this.onFinished();
        }, 1.5);
    }
}
export default PopupBonus;