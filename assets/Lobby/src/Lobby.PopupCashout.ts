import Dialog from "../../scripts/common/Dialog";
import cmd from "./Lobby.Cmd";
import InPacket from "../../scripts/networks/Network.InPacket";
import MiniGameNetworkClient from "../../scripts/networks/MiniGameNetworkClient";
import Dropdown from "../../scripts/common/Dropdown";
import Configs from "../../scripts/common/Configs";
import App from "../../scripts/common/App";
import Http from "../../scripts/common/Http";
import Utils from "../../scripts/common/Utils";
import BroadcastReceiver from "../../scripts/common/BroadcastReceiver";
import VersionConfig from "../../scripts/common/VersionConfig";
import ShootFishNetworkClient from "../../scripts/networks/ShootFishNetworkClient";
import PopupGiftCode from "./Lobby.PopupGiftCode";
import Lobby from "../../subpackages/ShootFish/src/ShootFish.Lobby";

const { ccclass, property } = cc._decorator;

@ccclass("Lobby.PopupCashout.TabRutThe")
export class TabRutThe {
    @property(Dropdown)
    dropdownTelco: Dropdown = null;
    @property(Dropdown)
    dropdownAmount: Dropdown = null;
    @property(Dropdown)
    dropdownQuantity: Dropdown = null;
    @property(cc.Label)
    lblBalance: cc.Label = null;
    @property(cc.Label)
    lblSum: cc.Label = null;
    @property(cc.Label)
    lblFee: cc.Label = null;
    
    
    private sumCashout : number = 0;

    start() {
       this.lblBalance.string = Utils.formatNumber(Configs.Login.Coin);
       let fee = Configs.App.SERVER_CONFIG.ratioRutThe - 1;
       let feeNum = fee > 0 ? Math.ceil(fee * 100) : 0;
       this.lblFee.string = Utils.formatNumber(feeNum)+ "%"
    }

    reset() {
        this.dropdownTelco.setOptions(["Chọn nhà mạng"].concat(Configs.App.CASHOUT_CARD_CONFIG.listTenNhaMang));
        this.dropdownQuantity.setOptions(["Chọn số lượng"].concat(Configs.App.CASHOUT_CARD_CONFIG.listQuantity))
        let listMenhGia = ["Chọn mệnh giá"];
        for (let i = 0; i < Configs.App.CASHOUT_CARD_CONFIG.listMenhGiaNapThe.length; i++) {
            listMenhGia.push(Utils.formatNumber(Configs.App.CASHOUT_CARD_CONFIG.listMenhGiaNapThe[i]));
        }
        this.dropdownAmount.setOptions(listMenhGia);
        let that = this;
        this.dropdownAmount.setOnValueChange((idx)=>{
            that.setSumblb()
        });
        this.dropdownQuantity.setOnValueChange((idx)=>{
            that.setSumblb()
        });
        this.dropdownTelco.setOnValueChange((idx)=>{
            that.setSumblb()
        });
        this.resetForm();
    }

    setSumblb(){
        let amount = this.dropdownAmount.getValue();
        let telco = this.dropdownTelco.getValue();
        let quanitySelected = this.dropdownQuantity.getValue();
        if(quanitySelected == 0 || amount == 0 || telco == 0){
            this.lblSum.string = "0";
            return;
        }
        let amountNum = Configs.App.CASHOUT_CARD_CONFIG.listMenhGiaNapThe[amount - 1];
        let quantity = Configs.App.CASHOUT_CARD_CONFIG.listQuantity[quanitySelected - 1];
        let sum = amountNum * Number(quantity);
        sum *= Configs.App.SERVER_CONFIG.ratioRutThe;
        this.sumCashout = sum;
        this.lblSum.string = Utils.formatNumber(sum);
    }

    resetForm() {
        this.dropdownTelco.setValue(0);
        this.dropdownAmount.setValue(0);
        this.dropdownQuantity.setValue(0);
        
    }

    submit() {
        let ddTelcoValue = this.dropdownTelco.getValue();
        let ddAmountValue = this.dropdownAmount.getValue();
        let ddQuantityValue = this.dropdownQuantity.getValue();
        
        if (ddTelcoValue == 0) {
            App.instance.alertDialog.showMsg("Vui lòng chọn nhà mạng.");
            return;
        }
        if (ddAmountValue == 0) {
            App.instance.alertDialog.showMsg("Vui lòng chọn mệnh giá.");
            return;
        }
        if (ddQuantityValue == 0) {
            App.instance.alertDialog.showMsg("Vui lòng chọn Số lượng.");
            return;
        }
        
        let telcoId = Configs.App.CASHOUT_CARD_CONFIG.listIdNhaMang[ddTelcoValue - 1];
        let amount = Configs.App.CASHOUT_CARD_CONFIG.listMenhGiaNapThe[ddAmountValue - 1];
        let quantity = Number(Configs.App.CASHOUT_CARD_CONFIG.listQuantity[ddQuantityValue - 1]);
        let sum = amount * Number(quantity);
        sum *= Configs.App.SERVER_CONFIG.ratioRutThe;
        if(sum > Configs.Login.Coin){
            App.instance.alertDialog.showMsg("Số dư không đủ!");
            return;
        }
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqCashoutCard(telcoId, amount, quantity));
       
        
    }
}


@ccclass("Lobby.PopupCashout.TabBank")
export class TabBank {
    
    @property(cc.Node)
    txtSum: cc.Node = null;

    @property(cc.Label)
    lblCoin: cc.Label = null;
    @property(cc.Label)
    lblSum: cc.Label = null;
    @property(cc.Label)
    lblFee: cc.Label = null;

    @property(Dropdown)
    dropdownBank: Dropdown = null;

    @property(cc.EditBox)
    edbAmount: cc.EditBox = null;

    @property(cc.EditBox)
    edbBankNumber: cc.EditBox = null;

    @property(cc.EditBox)
    edbBankAccountName: cc.EditBox = null;

    private _listBank = [];

    private fee: number = 1;
    private minCashout = 0;
    private maxCashout = 0;
    private isAllowCashout = false;
    private sum = 0;

    start() {
        this.lblCoin.string = Utils.formatNumber(Configs.Login.Coin);
        App.instance.showLoading(true);
        Http.get(Configs.App.API, { "c": 130 }, (err, res) => {
            App.instance.showLoading(false);
            if (err == null) {
                if(res.list_bank_cashout === undefined || res.list_bank_cashout.length == 0){

                    return;
                }

                let listBank = res.list_bank_cashout;
                this._listBank = listBank;
                let bankName = ["Chọn ngân hàng"];
                for(let i = 0; i < listBank.length; i ++){
                    bankName.push(listBank[i].bankName);
                }
                this.dropdownBank.setOptions(bankName);

                this.fee = res.ratio_cashout_bank;
                this.minCashout = res.cashout_bank_min;
                this.maxCashout = res.cashout_bank_max;
                this.isAllowCashout = res.is_cashout_bank == 1 ? false : true;

                this.lblFee.string = Math.round((this.fee - 1) * 100) + "%";
                
            }
        });
        
    }

    submit() {
        if(!this.isAllowCashout){
            App.instance.alertDialog.showMsg("Rút qua ngân hàng đang bảo trì, vui lòng thử lại sau!");
            return;
        }
        let ddBank = this.dropdownBank.getValue();
        if (ddBank == 0) {
            App.instance.alertDialog.showMsg("Vui lòng chọn ngân hàng.");
            return;
        }
        let bankSelected = this._listBank[ddBank - 1].bankName;
        
        let amountSt = this.edbAmount.string.trim();
        let amount = Number(amountSt);
        if(isNaN(amount) || amount <= 0 ){
            App.instance.alertDialog.showMsg("Số tiền nạp không hợp lệ");
            return;
        }

        if(amount > this.maxCashout){
            App.instance.alertDialog.showMsg("Số tiền rút tối đa là "+ Utils.formatNumber(this.maxCashout));
            return;
        }
        if(amount < this.minCashout){
            App.instance.alertDialog.showMsg("Số tiền rút tối thiểu là "+ Utils.formatNumber(this.minCashout));
            return;
        }
        this.sum = amount * this.fee;
        if(this.sum > Configs.Login.Coin){
            App.instance.alertDialog.showMsg("Số dư không đủ");

            return;
        }

        let bankNumber = this.edbBankNumber.string.trim();
        if(bankNumber == ""){
            App.instance.alertDialog.showMsg("Vui lòng nhập số tài khoản!");
            return;
        }
        let bankActName = this.edbBankAccountName.string.trim();
        if(bankActName == ""){
            App.instance.alertDialog.showMsg("Vui lòng nhập tên tài khoản");
            return;
        }

        
        
        App.instance.showLoading(true);
        
        MiniGameNetworkClient.getInstance().send(new cmd.ReqCashoutBank(bankSelected, bankNumber,bankActName, amount ));
    }

    amountChange(){
        let amount = this.edbAmount.string.trim();
        if (amount == "" || parseInt(amount) <= 0 || isNaN(Number(amount)) ) {
            this.txtSum.active = false;
            return;
        }
        let amountSend = Number(amount);
        if(amountSend < this.minCashout || amountSend > this.maxCashout)
        { 
            this.txtSum.active = false;
            return;
        }
       
        this.sum = Math.floor(amountSend * this.fee);

        if(this.sum > Configs.Login.Coin){
            this.txtSum.active = false;
            return;
        }
        this.lblSum.string = Utils.formatNumber(this.sum);
        this.txtSum.active = true;
    }

    

    
}

@ccclass("Lobby.PopupCashout.TabMomo")
export class TabMomo {
    @property(cc.Node)
    txtSum: cc.Node = null;

    @property(cc.Label)
    lblCoin: cc.Label = null;
    @property(cc.Label)
    lblSum: cc.Label = null;
    @property(cc.Label)
    lblFee: cc.Label = null;

    @property(cc.EditBox)
    edbAmount: cc.EditBox = null;
    @property(cc.EditBox)
    edbPhone: cc.EditBox = null;

    private fee: number = 1;
    private minCashout = 0;
    private maxCashout = 0;
    private isAllowCashout = false;
    private sum = 0;
    start() {
       
        //get config from server 
        App.instance.showLoading(true);
        this.lblCoin.string = Utils.formatNumber(Configs.Login.Coin);
        Http.get(Configs.App.API, { "c": 130 }, (err, res) => {
            App.instance.showLoading(false);
            this.fee = res.ratio_cashout_momo;
            this.minCashout = res.cashout_momo_min;
            this.maxCashout = res.cashout_momo_max;
            this.isAllowCashout = res.is_cashout_momo == 1 ? false : true;

            this.lblFee.string = Math.round((this.fee - 1) * 100) + "%";
        });
       

    }
    amountChange(){
        let amount = this.edbAmount.string.trim();
        if (amount == "" || parseInt(amount) <= 0 || isNaN(Number(amount)) ) {
            this.txtSum.active = false;
            return;
        }
        let amountSend = Number(amount);
        if(amountSend < this.minCashout || amountSend > this.maxCashout)
        { 
            this.txtSum.active = false;
            return;
        }
       
        this.sum = Math.floor(amountSend * this.fee);

        if(this.sum > Configs.Login.Coin){
            this.txtSum.active = false;
            return;
        }
        this.lblSum.string = Utils.formatNumber(this.sum);
        this.txtSum.active = true;
    }

    submit() {
        if(!this.isAllowCashout){
            App.instance.alertDialog.showMsg("Rút Momo đang bảo trì, vui lòng thử lại sau!");
            return;
        }
        let amount = this.edbAmount.string.trim();
        let phoneSend = this.edbPhone.string.trim();
        
        if (amount == "" || parseInt(amount) <= 0 || isNaN(Number(amount))) {
            App.instance.alertDialog.showMsg("Số tiền không hợp lệ");
            return;
        }
        
        if (phoneSend == "") {
            App.instance.alertDialog.showMsg("Vui lòng nhập số điện thoại nhận tiền");
            return;
        }
        let amountSend = Number(amount);
        if(amountSend > this.maxCashout){
            App.instance.alertDialog.showMsg("Số tiền rút tối đa là "+ Utils.formatNumber(this.maxCashout));
            return;
        }
        if(amountSend < this.minCashout){
            App.instance.alertDialog.showMsg("Số tiền rút tối thiểu là "+ Utils.formatNumber(this.minCashout));
            return;
        }
        this.sum = amountSend * this.fee;
        if(this.sum > Configs.Login.Coin){
            App.instance.alertDialog.showMsg("Số dư không đủ");

            return;
        }

        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqCashoutMomo(phoneSend, amountSend));
    }


    

    
}


@ccclass
export default class PopupCashout extends Dialog {

    @property(cc.ToggleContainer)
    tabs: cc.ToggleContainer = null;
    @property(cc.Node)
    tabContents: cc.Node = null;

    @property(TabRutThe)
    tabNapThe: TabRutThe = null;
    
    @property(TabMomo)
    tabMomo: TabMomo = null;
    

    

    @property([cc.Label])
    lblContainsBotOTPs: cc.Label[] = [];


    @property(TabBank)
    tabBank: TabBank = null;



    private tabSelectedIdx = 0;

    start() {
        for (let i = 0; i < this.lblContainsBotOTPs.length; i++) {
            let lbl = this.lblContainsBotOTPs[i];
            lbl.string = lbl.string.replace("$bot_otp", "@" + Configs.App.getLinkTelegram());
        }

        for (let i = 0; i < this.tabs.toggleItems.length; i++) {
            this.tabs.toggleItems[i].node.on("toggle", () => {
                this.tabSelectedIdx = i;
                this.onTabChanged();
            });
        }

        MiniGameNetworkClient.getInstance().addListener((data) => {
            let inpacket = new InPacket(data);
            console.log(inpacket.getCmdId());
            switch (inpacket.getCmdId()) {
               case cmd.Code.CASHOUT_CARD: {
                App.instance.showLoading(false);
                let res = new cmd.ResCashoutCard(data);
                console.log(JSON.stringify(res));
                if(res.error == 0){
                    Configs.Login.Coin = res.currentMoney;
                    BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                    App.instance.popupCardInfo.setListItem(res.listCard);
                }else if(res.error == 7){
                    App.instance.alertDialog.showMsg("Bạn cần xác minh số điện thoại để rút thẻ");
                }
                else{
                    App.instance.alertDialog.showMsg("Rút thẻ không thành công!");
                }
                break;

                //console.log(res);
               }
               case cmd.Code.CASHOUT_BANK: {
                   App.instance.showLoading(false);
                   let res = new cmd.ResCashoutBank(data);
                   if(res.error == 0){
                    Configs.Login.Coin = res.currentMoney;
                    BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                    App.instance.alertDialog.showMsg("Rút tiền thành công, vui lòng chờ 1h-24h để nhân viên xử lý");
                   } else{
                    App.instance.alertDialog.showMsg("Rút tiền không thành công!");
                   }
                   break;
               }
               case cmd.Code.CASHOUT_MOMO: {
                App.instance.showLoading(false);
                let res = new cmd.ResCashoutMomo(data);
                if(res.error == 0){
                 Configs.Login.Coin = res.currentMoney;
                 BroadcastReceiver.send(BroadcastReceiver.USER_UPDATE_COIN);
                 App.instance.alertDialog.showMsg("Rút tiền thành công, vui lòng chờ 1h-24h để nhân viên xử lý");
                } else{
                 App.instance.alertDialog.showMsg("Rút tiền không thành công!");
                }
                break;
            }
            }
        }, this);

        BroadcastReceiver.register(BroadcastReceiver.USER_UPDATE_COIN, () => {
            if (!this.node.active) return;
            this.tabNapThe.lblBalance.string = Utils.formatNumber(Configs.Login.Coin);
            this.tabBank.lblCoin.string = Utils.formatNumber(Configs.Login.Coin);
            this.tabMomo.lblCoin.string = Utils.formatNumber(Configs.Login.Coin);
        }, this);

        this.tabNapThe.start();
       
        this.tabBank.start();
        this.tabMomo.start();
    }

    private onTabChanged() {
        for (let i = 0; i < this.tabContents.childrenCount; i++) {
            this.tabContents.children[i].active = i == this.tabSelectedIdx;
        }
        for (let j = 0; j < this.tabs.toggleItems.length; j++) {
            this.tabs.toggleItems[j].node.getComponentInChildren(cc.Label).node.color = j == this.tabSelectedIdx ? cc.Color.YELLOW : cc.Color.WHITE;
        }
        switch (this.tabSelectedIdx) {
            case 0:
                this.tabNapThe.reset();
                break;
            
            case 1:
                
                break;
            
        }
    }

    private longToTime(l: number): string {
        return (l / 60) + " giờ " + (l % 60) + " phút";
    }

    show() {
        super.show();
        this.tabSelectedIdx = 0;
        this.tabs.toggleItems[this.tabSelectedIdx].isChecked = true;
        this.onTabChanged();
    }

    

    actSubmitNapThe() {
        this.tabNapThe.submit();
    }

    actSubmitMomo() {
        this.tabMomo.submit();
    }

    

    actGetOTP() {
        App.instance.showLoading(true);
        MiniGameNetworkClient.getInstance().send(new cmd.ReqGetOTP());
    }
    
    actSubmitNapNganHang() {
        this.tabBank.submit();
    }
    changeAmountMomo(){
        this.tabMomo.amountChange();
    }
    changeAmountBank(){
        this.tabBank.amountChange();
    }

    
}
