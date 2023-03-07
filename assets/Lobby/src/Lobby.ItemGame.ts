const { ccclass, property } = cc._decorator;

export enum ItemGameType {
    OTHER,
    SLOT,
    CARD
}

@ccclass
export default class ItemGame extends cc.Component {
    @property
    id: string = "";
    @property({ type: cc.Enum(ItemGameType) })
    type: ItemGameType = ItemGameType.OTHER;
}
