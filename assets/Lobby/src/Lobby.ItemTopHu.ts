
import Tween from "../../scripts/common/Tween";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {

    @property(cc.Label)
    labelName: cc.Label = null;
    @property(cc.Label)
    label: cc.Label = null;
    @property(cc.Sprite)
    icon: cc.Sprite = null;
    @property([cc.SpriteFrame])
    spriteFrames: cc.SpriteFrame[] = [];

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        //this.icon.spriteFrame=SpriteFrame;
    }

    start() {
        this.icon.spriteFrame = this.spriteFrames[0];
    }
    public SetData(data: Tophudata) {
        this.labelName.string = data.gamename;
        this.ChangeIcon(data.gameid)
        Tween.numberTo(this.label, data.value, 2);
    }
    private ChangeIcon(id: string) {
        switch (id) {
            case "audition":
                this.icon.spriteFrame = this.spriteFrames[0];
                break;
            case "captain":
                this.icon.spriteFrame = this.spriteFrames[1];
                break;
            case "spartans":
                this.icon.spriteFrame = this.spriteFrames[2];
                break;
            case "tamhung":
                this.icon.spriteFrame = this.spriteFrames[3];
                break;
            case "aztec":
                this.icon.spriteFrame = this.spriteFrames[4];
                break;
            case "zeus":
                this.icon.spriteFrame = this.spriteFrames[5];
                break;
            case "gainhay":
                this.icon.spriteFrame = this.spriteFrames[6];
                break;
            case "shootfish":
                this.icon.spriteFrame = this.spriteFrames[7];
                break;
            case "":
                this.icon.spriteFrame = this.spriteFrames[8];
                break;
            case "":
                this.icon.spriteFrame = this.spriteFrames[9];
                break;
            default:
                this.icon.spriteFrame = this.spriteFrames[0];
                break;

        }
    }

    // update (dt) {}
}
export class Tophudata {
    gameid: string;
    gamename: string;
    value: number;

    constructor(gameid: string, gamename: string, value: number) {
        this.gameid = gameid;
        this.gamename = gamename;
        this.value = value;
    }
}
