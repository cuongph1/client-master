const {ccclass, property} = cc._decorator;

@ccclass
export default class BtnBet extends cc.Component {

    @property(cc.Node)
    active: cc.Node = null;
    @property(cc.Label)
    label: cc.Label = null;
}
