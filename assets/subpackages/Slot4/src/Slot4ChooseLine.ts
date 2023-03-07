// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Slot4ChooseLine extends cc.Component {

    @property(cc.Button)
    btnClose: cc.Button = null;
    @property(cc.Node)
    lineParent: cc.Node = null;

    listToggle: cc.Toggle[] = [];

    onSelectedChanged: (lines: Array<number>) => void = null;
    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        for(let i = 0; i < this.lineParent.childrenCount; i++) {
            let node = this.lineParent.children[i];
            let toggle = node.getComponent(cc.Toggle);
            this.listToggle.push(toggle);
            node.on('click', () => {
                if(this.onSelectedChanged != null) this.onSelectedChanged(this.getLineSelected());                
            });
        }
    }
    

    getLineSelected() {
        let lines = new Array<number>();
        for(let i = 0; i < this.lineParent.childrenCount; i++) {
            let node = this.lineParent.children[i];
            if(node.getComponent(cc.Toggle).isChecked) {
                lines.push(i+1);
            }
        }
       
        this.btnClose.interactable = lines.length > 0;
        return lines;
    }

    selectAll() {
        this.listToggle.forEach(element => {
            element.isChecked = true;
        });
        if(this.onSelectedChanged != null) this.onSelectedChanged(this.getLineSelected());
    }

    deSelectAll() {
        this.listToggle.forEach(element => {
            element.isChecked = false;
        });
        if(this.onSelectedChanged != null) this.onSelectedChanged(this.getLineSelected());
    }

    selectEven() {
        for(let i = 0; i < this.listToggle.length; i++) {            
            this.listToggle[i].isChecked = i % 2 !== 0;           
        }
        if(this.onSelectedChanged != null) this.onSelectedChanged(this.getLineSelected());
    }

    selectOdd() {
        for(let i = 0; i < this.listToggle.length; i++) {            
            this.listToggle[i].isChecked = i % 2 == 0;           
        }
        if(this.onSelectedChanged != null) this.onSelectedChanged(this.getLineSelected());
    }

    show() {
        this.node.active = true;
    }

    hide() {
        this.node.active = false;
    }



    // update (dt) {}
}
