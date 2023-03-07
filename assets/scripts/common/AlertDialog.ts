import Dialog from "./Dialog";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

class AlertDialogQueueItem {
    msg: string;
    doneTitle: string;
    onDismissed: ()=>void;

    constructor(msg: string, doneTitle: string, onDismissed: ()=>void){
        this.msg = msg;
        this.doneTitle = doneTitle;
        this.onDismissed = onDismissed;
    }
}

@ccclass
export default class AlertDialog extends Dialog {

    @property(cc.Label)
    lblMessage: cc.Label = null;
    @property(cc.Label)
    lblDone: cc.Label = null;

    onDismissed: any = null;

    queue: Array<AlertDialogQueueItem> = new Array<AlertDialogQueueItem>();

    showMsg(msg: string){
        this.show4(msg, null, null, false);
    }

    showMsgWithOnDismissed(msg: string, onDismissed: ()=>void){
        this.show4(msg, null, onDismissed);
    }

    show3(msg: string, onDismissed: ()=>void, addQueue: boolean = false){
        this.show4(msg, null, onDismissed, addQueue);
    }

    show4(msg: string, doneTitle: string, onDismissed: ()=>void, addQueue: boolean = false, forceAddQueue: boolean = true) : void {
        if(addQueue){
            this.queue.push(new AlertDialogQueueItem(msg, doneTitle, onDismissed));
            if(this.queue.length == 1){
                this.lblDone.string = !doneTitle ? "Đóng" : doneTitle;
                this.onDismissed = onDismissed;
                this.lblMessage.string = msg;
                super.show();
            }
        }else{
            if(this.queue.length > 0 && forceAddQueue){
                this.queue.push(new AlertDialogQueueItem(msg, doneTitle, onDismissed));
            }else{
                this.lblDone.string = !doneTitle ? "Đóng" : doneTitle;
                this.onDismissed = onDismissed;
                this.lblMessage.string = msg;
                super.show()
            }
        }
    }

    _onShowed() {
        super._onShowed();
    }

    _onDismissed() {
        super._onDismissed();
        if (typeof this.onDismissed === "function") this.onDismissed();
        if(this.queue.length > 0){
            this.queue.splice(0, 1);
            if(this.queue.length > 0){
                this.show4(this.queue[0].msg, this.queue[0].doneTitle, this.queue[0].onDismissed, false, false);
            }
        }
    }

    dismiss(){
        if(!this.isAnimated) return;
        super.dismiss();
    }
}
