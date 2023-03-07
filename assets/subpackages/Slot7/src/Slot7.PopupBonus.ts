import Dialog from "../../../scripts/common/Dialog";
import Tween from "../../../scripts/common/Tween";
import Utils from "../../../scripts/common/Utils";

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
    lblTotal: cc.Label = null;
    @property(cc.Label)
    lblSpecial: cc.Label = null;
    @property([cc.SpriteFrame])
    sprFramesFactor: cc.SpriteFrame[] = [];

    private left = 0;
    private onFinished: () => void = null;
    private dataBonus: Array<number> = [];
    private factors: number[] = [];
    private totalCoin = 0;
    private cbAutoClose: Function = null;

    start() {
        for (let i = 0; i < this.items.childrenCount; i++) {
            let node = this.items.children[i];
            node["btn"] = node.getChildByName("btn").getComponent(cc.Button);
            node["icon"] = node.getChildByName("icon");
            node["label"] = node.getChildByName("label").getComponent(cc.Label);

            node["btn"].node.on("click", () => {
                var value = this.dataBonus[this.dataBonus.length - this.left];
                node.getChildByName("btn").active = false;
                node.getChildByName("icon").active = true;
                node["label"].node.active = true;
                node["label"].string = "0";
                Tween.numberTo(node["label"], value, 0.3);

                this.totalCoin += value;
                Tween.numberTo(this.lblTotal, this.totalCoin, 0.3);

                this.left--;
                if (this.left <= 0) {
                    for (let i = 0; i < this.items.childrenCount; i++) {
                        this.items.children[i]["btn"].interactable = false;
                    }
                    this.scheduleOnce(() => {
                        this.showSpecial();
                    }, 1.5);
                }

                this.unschedule(this.cbAutoClose);
            });
        }
        for (let i = 0; i < this.itemSpecial.childrenCount; i++) {
            let node = this.itemSpecial.children[i];
            node["btn"] = node.getChildByName("btn").getComponent(cc.Button);
            node["icon"] = node.getChildByName("icon").getComponent(cc.Sprite);
            node["btn"].node.on("click", () => {
                let factorOtherIdx = 0;
                for (let j = 0; j < this.itemSpecial.childrenCount; j++) {
                    let node2 = this.itemSpecial.children[j];
                    node2["btn"].interactable = false;
                    node2["icon"].node.active = true;
                    if (j == i) {
                        node2["btn"].node.active = false;
                        node2["icon"].spriteFrame = this.sprFramesFactor[this.factors[0] - 1];
                    } else {
                        factorOtherIdx++;
                        node2["icon"].spriteFrame = this.sprFramesFactor[this.factors[factorOtherIdx] - 1];
                    }
                }
                this.lblSpecial.string = Utils.formatNumber(this.totalCoin) + " x " + this.factors[0] + " = " + Utils.formatNumber(this.totalCoin * this.factors[0]);
                this.hidden();
            });
        }
    }

    showBonus(bonus: string, onFinished: () => void) {
        super.show();
        this.special.active = false;
        for (let i = 0; i < this.items.childrenCount; i++) {
            let node = this.items.children[i];
            let btn = node.getChildByName("btn").getComponent(cc.Button);
            btn.node.active = true;
            btn.interactable = true;
            node.getChildByName("icon").active = false;
            node.getChildByName("label").active = false;
        }
        this.onFinished = onFinished;
        let arrBonus = bonus.split(",");
        this.dataBonus = [];
        for (let i = 0; i < arrBonus.length - 2; i++) {
            this.dataBonus.push(Number(arrBonus[i]));
        }
        this.left = this.dataBonus.length;

        let factor = Number(arrBonus[arrBonus.length - 2]);
        this.factors.length = 0;
        this.factors.push(factor);
        for (let i = 1; i <= 3; i++) {
            if (i != factor) {
                this.factors.push(i);
            }
        }
        this.lblTotal.string = "0";
        this.totalCoin = 0;
        this.cbAutoClose = () => {
            this.dismiss();
            this.onFinished();
        };
        this.scheduleOnce(this.cbAutoClose, 10);
    }

    private showSpecial() {
        for (let i = 0; i < this.itemSpecial.childrenCount; i++) {
            let node = this.itemSpecial.children[i];
            let btn = node.getChildByName("btn").getComponent(cc.Button);
            btn.node.active = true;
            btn.interactable = true;
            node.getChildByName("icon").active = false;
        }
        this.lblSpecial.string = "";
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