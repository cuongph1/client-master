import Dialog from "./Dialog";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ConfirmDialog extends Dialog {

    @property(cc.Label)
    lblMessage: cc.Label = null;
    @property(cc.Label)
    lblDone: cc.Label = null;
    @property(cc.Label)
    lblConfirm: cc.Label = null;

    onDismissed: (isConfirm: boolean)=>void = null;
    onConfirmClicked: Function = null;
    isClickdConfirm: boolean = false;

    show1(msg: string){
        this.show4(msg);
    }

    show2(msg: string, onDismissed: (isConfirm: boolean)=>void){
        this.show4(msg, null, null, onDismissed);
    }

    show3(msg: string, confirmTitle: string, onDismissed: (isConfirm: boolean)=>void){
        this.show4(msg, null, confirmTitle, onDismissed);
    }

    show4(msg: string, doneTitle?: string, confirmTitle?: string, onDismissed?: (isConfirm: boolean)=>void) : void {
        this.isClickdConfirm = false;
        this.lblDone.string = !doneTitle ? "Hủy" : doneTitle;
        this.lblConfirm.string = !confirmTitle ? "Đồng ý" : confirmTitle;
        this.onDismissed = onDismissed;
        this.lblMessage.string = msg;
        super.show()
    }

    actConfirm(){
        this.isClickdConfirm = true;
        this.dismiss();
    }

    _onShowed() {
        Dialog.prototype._onShowed.call(this);
    }

    _onDismissed() {
        Dialog.prototype._onDismissed.call(this);
        if (typeof this.onDismissed === "function") this.onDismissed(this.isClickdConfirm);
    }
}
