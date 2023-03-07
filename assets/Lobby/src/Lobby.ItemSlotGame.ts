import ItemGame from "./Lobby.ItemGame";
import Utils from "../../scripts/common/Utils";
import Random from "../../scripts/common/Random";
import Tween from "../../scripts/common/Tween";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemSlotGame extends ItemGame {
    @property([cc.Label])
    lblJackpots: cc.Label[] = [];
    @property
    fakeJackpot: boolean = false;

    private jackpot0 = 0;
    private jackpotMax0 = 0;
    private jackpot1 = 0;
    private jackpotMax1 = 0;
    private jackpot2 = 0;
    private jackpotMax2 = 0;
    private updateNext0 = 0;
    private updateNext1 = 0;
    private updateNext2 = 0;

    start() {
        if (this.fakeJackpot) {
            let scale = 1000;
            this.jackpot0 = Utils.randomRangeInt(5000 * scale, 6000 * scale);
            scale = 1000;
            this.jackpot1 = Utils.randomRangeInt(5000 * scale, 6000 * scale);
            scale = 10000;
            this.jackpot2 = Utils.randomRangeInt(5000 * scale, 6000 * scale);

            scale = 1000;
            this.jackpotMax0 = this.jackpot0 + Utils.randomRangeInt(2000 * scale, 4000 * scale);
            scale = 1000;
            this.jackpotMax1 = this.jackpot1 + Utils.randomRangeInt(2000 * scale, 4000 * scale);
            scale = 10000;
            this.jackpotMax2 = this.jackpot2 + Utils.randomRangeInt(2000 * scale, 4000 * scale);

            Tween.numberTo(this.lblJackpots[0], this.jackpot0, 1);
            Tween.numberTo(this.lblJackpots[1], this.jackpot1, 1);
            Tween.numberTo(this.lblJackpots[2], this.jackpot2, 1);

            this.updateNext0 = Utils.randomRangeInt(3, 10);
            this.updateNext1 = Utils.randomRangeInt(3, 10);
            this.updateNext2 = Utils.randomRangeInt(3, 10);
        }
    }

    update(dt: number) {
        if (this.fakeJackpot) {
            if (this.updateNext0 > 0) {
                this.updateNext0 -= dt;
                if (this.updateNext0 < 0) {
                    this.updateNext0 = Utils.randomRangeInt(3, 10);

                    let scale = 1000;
                    this.jackpot0 += Utils.randomRangeInt(0.5 * scale, 0.7 * scale);
                    if (this.jackpot0 > this.jackpotMax0) {
                        this.jackpot0 = 5000 * scale;
                        this.jackpotMax0 = this.jackpot0 + Utils.randomRangeInt(2000 * scale, 4000 * scale);
                    }
                    Tween.numberTo(this.lblJackpots[0], this.jackpot0, 1);
                    this.lblJackpots[0].string = Utils.formatNumber(this.jackpot0);
                }
            }

            if (this.updateNext1 > 0) {
                this.updateNext1 -= dt;
                if (this.updateNext1 < 0) {
                    this.updateNext1 = Utils.randomRangeInt(3, 10);

                    let scale = 1000;
                    this.jackpot1 += Utils.randomRangeInt(5 * scale, 7 * scale);
                    if (this.jackpot1 > this.jackpotMax1) {
                        this.jackpot1 = 5000 * scale;
                        this.jackpotMax1 = this.jackpot1 + Utils.randomRangeInt(2000 * scale, 4000 * scale);
                    }
                    Tween.numberTo(this.lblJackpots[1], this.jackpot1, 1);
                    this.lblJackpots[1].string = Utils.formatNumber(this.jackpot1);
                }
            }

            if (this.updateNext2 > 0) {
                this.updateNext2 -= dt;
                if (this.updateNext2 < 0) {
                    this.updateNext2 = Utils.randomRangeInt(3, 10);

                    let scale = 10000;
                    this.jackpot2 += Utils.randomRangeInt(50 * scale, 70 * scale);
                    if (this.jackpot2 > this.jackpotMax2) {
                        this.jackpot2 = 5000 * scale;
                        this.jackpotMax2 = this.jackpot2 + Utils.randomRangeInt(2000 * scale, 4000 * scale);
                    }
                    Tween.numberTo(this.lblJackpots[2], this.jackpot2, 1);
                    this.lblJackpots[2].string = Utils.formatNumber(this.jackpot2);
                }
            }
        }
    }
}
