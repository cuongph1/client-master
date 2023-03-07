
const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {



    // LIFE-CYCLE CALLBACKS:

    @property(cc.Node)
    nodeIcon: cc.Node = null;
    @property(cc.Node)

    private animation: cc.Animation;

    onLoad() {
        this.animation = this.getComponent(cc.Animation);
    }

    start() {

    }

    setSprite(sf: cc.SpriteFrame) {
        this.nodeIcon.active = true;


        this.nodeIcon.getComponent(cc.Sprite).spriteFrame = sf;
    }

    setSpine(id) {
        this.nodeIcon.active = false;

    }

    scale() {
        if (this.nodeIcon.active) {
            this.animation.play();
        }
    }

    // update (dt) {}
}
