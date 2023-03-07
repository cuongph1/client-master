import Dialog from "../../../scripts/common/Dialog";

const { ccclass, property } = cc._decorator;

@ccclass
export class PopupGuide extends Dialog {

    @property([cc.Node])
    pages: cc.Node[] = [];
    @property(cc.Node)
    btnNext: cc.Node = null;
    @property(cc.Node)
    btnPrev: cc.Node = null;
    @property({ type: cc.AudioClip })
    soundClick: cc.AudioClip = null;

    private page = 0;

    private soundSlotState = null;

    start() {
    }


    show() {
        if (this.canPlaySound()) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        super.show();
        this.page = 0;
        this.btnPrev.active = true;
        this.reloadData();
    }

    actNext() {
        if (this.page < this.pages.length - 1) {
            this.page++;
        }
        this.reloadData();
        if (this.page == this.pages.length - 1) {
            this.btnNext.active = false;
        }
        this.btnPrev.active = true;
    }

    actPrev() {
        if (this.page > 0) {
            this.page--;
        }
        this.reloadData();
        if (this.page == 0) {
            this.btnPrev.active = false;
        }
        this.btnNext.active = true;
    }

    private reloadData() {
        for (let i = 0; i < this.pages.length; i++) {
            this.pages[i].active = i == this.page;
        }
    }

    dismiss() {
        if (this.canPlaySound()) {
            cc.audioEngine.play(this.soundClick, false, 1);
        }
        super.dismiss();
    }

    canPlaySound() {
        if(this.soundClick == null) return false;
        var soundSave = cc.sys.localStorage.getItem("sound_Slot_1");
        if (soundSave != null) {
            this.soundSlotState = parseInt(soundSave);
        } else {
            this.soundSlotState = 1;
        }

        if (this.soundSlotState == 1) {
            return true;
        } else {
            return false;
        }
    }
}
export default PopupGuide;