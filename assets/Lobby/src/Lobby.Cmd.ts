import InPacket from "../../scripts/networks/Network.InPacket";
import OutPacket from "../../scripts/networks/Network.OutPacket";
import Utils from "../../scripts/common/Utils";

export namespace cmd {
    export class Code {
        static readonly UPDATE_TIME_BUTTON = 2124;
        static readonly INSERT_GIFTCODE = 20017;
        static readonly DEPOSIT_CARD = 20012;
        static readonly CHECK_NICKNAME_TRANSFER = 20018;
        static readonly SUBCRIBE_HALL_SLOT = 10001;
        static readonly UNSUBCRIBE_HALL_SLOT = 10002;
        static readonly UPDATE_JACKPOT_SLOTS = 10003;
        static readonly SPIN_LUCKY_WHEEL = 20042;
        static readonly GET_SECURITY_INFO = 20050;
        static readonly UPDATE_USER_INFO = 20002;
        static readonly GET_OTP = 20220;
        static readonly SEND_OTP = 20019;
        static readonly RESULT_ACTIVE_MOBILE = 20026;
        static readonly RESULT_ACTIVE_NEW_MOBILE = 20028;
        static readonly RESULT_CHANGE_MOBILE_ACTIVED = 20027;
        static readonly ACTIVE_PHONE = 20006;
        static readonly CHANGE_PHONE_NUMBER = 20007;
        static readonly TRANSFER_COIN = 20014;
        static readonly RESULT_TRANSFER_COIN = 20034;
        static readonly SAFES = 20009;
        static readonly RESULT_SAFES = 20029;
        static readonly CHANGE_PASSWORD = 20000;
        static readonly RESULT_CHANGE_PASSWORD = 20020;
        static readonly EXCHANGE_VIP_POINT = 20001;
        static readonly RESULT_EXCHANGE_VIP_POINT = 20021;
        static readonly NOTIFY_MARQUEE = 20100;
        static readonly UPDATE_JACKPOTS = 20101;
        static readonly SUBCRIBE_JACPORTS = 20102;
        static readonly UNSUBCRIBE_JACPORTS = 20103;
        static readonly GET_MONEY_USE = 20051;
        static readonly DEPOSIT_BANK = 20201;
        static readonly DEPOSIT_MOMO = 20202;

        static readonly CASHOUT_CARD = 20211;
        static readonly CASHOUT_BANK = 20219;
        static readonly CASHOUT_MOMO = 20215;
    }

    export class ReceiveUpdateTimeButton extends InPacket {
        remainTime = 0;
        bettingState = false;

        constructor(data: Uint8Array) {
            super(data);
            this.remainTime = this.getByte();
            this.bettingState = this.getBool();
        }
    }

    export class ReqInsertGiftcode extends OutPacket {
        constructor(code: string) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.INSERT_GIFTCODE);
            this.packHeader();
            this.putString(code);
            this.updateSize();
        }
    }

    export class ResInsertGiftcode extends InPacket {
        error = 0;
        currentMoneyVin = 0;
        currentMoneyXu = 0;
        moneyGiftCodeVin = 0;
        moneyGiftCodeXu = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoneyVin = this.getLong();
            this.currentMoneyXu = this.getLong();
            this.moneyGiftCodeVin = this.getLong();
            this.moneyGiftCodeXu = this.getLong();
        }
    }

    export class ReqDepositCard extends OutPacket {
        constructor(telcoId: number, serial: string, code: string, amount: string) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.DEPOSIT_CARD);
            this.packHeader();
            this.putByte(telcoId);
            this.putString(serial);
            this.putString(code);
            this.putString(amount);
            this.updateSize();
        }
    }
    export class ReqDepositBank extends OutPacket {
        constructor(bankNumber: string,  amount: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.DEPOSIT_BANK);
            this.packHeader();
            this.putString(bankNumber)
            this.putLong(amount);
            this.updateSize();
        }
    }
    export class ResDepositBank extends InPacket {
        error = 0;
        currentMoney = 0;
        timeFail = 0;
        numFail = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoney = this.getLong();
            this.timeFail = this.getLong();
            this.numFail = this.getInt();
        }
    }
    export class ReqDepositMomo extends OutPacket {
        constructor(amount: number, phoneSent: string) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.DEPOSIT_MOMO);
            this.packHeader();
            
            this.putLong(amount);
            this.putString(phoneSent);
            this.updateSize();
        }
    }
    export class ResDepositMomo extends InPacket {
        error = 0;
        currentMoney = 0;
        timeFail = 0;
        numFail = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoney = this.getLong();
            this.timeFail = this.getLong();
            this.numFail = this.getInt();
        }
    }

    export class ResDepositCard extends InPacket {
        error = 0;
        currentMoney = 0;
        timeFail = 0;
        numFail = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoney = this.getLong();
            this.timeFail = this.getLong();
            this.numFail = this.getInt();
        }
    }

    export class ReqCheckNicknameTransfer extends OutPacket {
        constructor(nickname: string) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.CHECK_NICKNAME_TRANSFER);
            this.packHeader();
            this.putString(nickname);
            this.updateSize();
        }
    }

    export class ResCheckNicknameTransfer extends InPacket {
        error = 0;
        type = 0;
        fee = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.type = this.getByte();
            this.fee = this.getByte();
        }
    }

    export class ReqSpinLuckyWheel extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.SPIN_LUCKY_WHEEL);
            this.packHeader();
            this.updateSize();
        }
    }

    export class ResSpinLuckyWheel extends InPacket {
        error = 0;
        prizeVin = "";
        prizeXu = "";
        prizeSlot = "";
        remainCount = 0;
        currentMoneyVin = 0;
        currentMoneyXu = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.prizeVin = this.getString();
            this.prizeXu = this.getString();
            this.prizeSlot = this.getString();
            this.remainCount = this.getShort();
            this.currentMoneyVin = this.getLong();
            this.currentMoneyXu = this.getLong();
        }
    }

    export class ReqGetSecurityInfo extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.GET_SECURITY_INFO);
            this.packHeader();
            this.updateSize();
        }
    }

    export class ResGetSecurityInfo extends InPacket {
        error = 0;
        username = "";
        cmt = "";
        email = "";
        mobile = "";
        mobileSecure = 0;
        emailSecure = 0;
        appSecure = 0;
        loginSecure = 0;
        moneyLoginOtp = 0;
        moneyUse = 0;
        safe = 0;
        configGame = "";

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.username = this.getString();
            this.cmt = this.getString();
            this.email = this.getString();
            this.mobile = this.getString();
            this.mobileSecure = this.getByte();
            this.emailSecure = this.getByte();
            this.appSecure = this.getByte();
            this.loginSecure = this.getByte();
            this.moneyLoginOtp = this.getLong();
            this.moneyUse = this.getLong();
            this.safe = this.getLong();
            this.configGame = this.getString();
        }
    }

    export class ReqUpdateUserInfo extends OutPacket {
        constructor(phoneNumber: string) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.UPDATE_USER_INFO);
            this.packHeader();
            this.putString("");
            this.putString("");
            this.putString(phoneNumber);
            this.updateSize();
        }
    }
    export class ResUpdateUserInfo extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ReqGetOTP extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.GET_OTP);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ResGetOTP extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ReqSendOTP extends OutPacket {
        constructor(otp: string, type: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.SEND_OTP);
            this.packHeader();
            this.putString(otp);
            this.putByte(type);//0: sms, 1: telegram
            this.updateSize();
        }
    }
    export class ResSendOTP extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ResResultActiveMobie extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ResResultActiveNewMobie extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ReqChangePhoneNumber extends OutPacket {
        constructor(phoneNumber: string) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.CHANGE_PHONE_NUMBER);
            this.packHeader();
            this.putString(phoneNumber);
            this.updateSize();
        }
    }
    export class ResChangePhoneNumber extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ReqActivePhone extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.ACTIVE_PHONE);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ResActivePhone extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ReqTransferCoin extends OutPacket {
        constructor(nickname: string, coin: number, note: string) {
            super();
            // console.log(nickname);
            // console.log(coin);
            // console.log(unescape(encodeURIComponent(note)));
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.TRANSFER_COIN);
            this.packHeader();
            this.putString(nickname);
            this.putLong(coin);
            this.putString(unescape(encodeURIComponent(note)));
            this.updateSize();
        }
    }
    export class ResTransferCoin extends InPacket {
        error = 0;
        moneyUse = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.moneyUse = this.getLong();
        }
    }
    export class ResResultTransferCoin extends InPacket {
        error = 0;
        moneyUse = 0;
        currentMoney = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.moneyUse = this.getLong();
            this.currentMoney = this.getLong();
        }
    }

    export class ReqSafes extends OutPacket {
        constructor(coin: number, action: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.SAFES);
            this.packHeader();
            this.putByte(action);//0: rút, 1: nạp
            this.putLong(coin);
            this.updateSize();
        }
    }
    export class ResSafes extends InPacket {
        error = 0;
        moneyUse = 0;
        safe = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.moneyUse = this.getLong();
            this.safe = this.getLong();
        }
    }
    export class ResResultSafes extends InPacket {
        error = 0;
        moneyUse = 0;
        safe = 0;
        currentMoney = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.moneyUse = this.getLong();
            this.safe = this.getLong();
            this.currentMoney = this.getLong();
        }
    }

    export class ReqChangePassword extends OutPacket {
        constructor(oldPassword: string, newPassword: string) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.CHANGE_PASSWORD);
            this.packHeader();
            this.putString(md5(oldPassword));
            this.putString(md5(newPassword));
            this.updateSize();
        }
    }
    export class ResChangePassword extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }
    export class ResResultChangePassword extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }

    export class ReqExchangeVipPoint extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.EXCHANGE_VIP_POINT);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ResExchangeVipPoint extends InPacket {
        error = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
        }
    }
    export class ResResultExchangeVipPoint extends InPacket {
        error = 0;
        currentMoney = 0;
        moneyAdd = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoney = this.getLong();
            this.moneyAdd = this.getLong()
        }
    }

    export class ResNotifyMarquee extends InPacket {
        message = "";

        constructor(data: Uint8Array) {
            super(data);
            this.message = this.getString();
        }
    }

    export class ReqSubcribeJackpots extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.SUBCRIBE_JACPORTS);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ReqUnSubcribeJackpots extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.UNSUBCRIBE_JACPORTS);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ResUpdateJackpots extends InPacket {
        miniPoker100 = 0;
        miniPoker1000 = 0;
        miniPoker10000 = 0;
        pokeGo100 = 0;
        pokeGo1000 = 0;
        pokeGo10000 = 0;
        khoBau100 = 0;
        khoBau1000 = 0;
        khoBau10000 = 0;
        NDV100 = 0;
        NDV1000 = 0;
        NDV10000 = 0;
        Avengers100 = 0;
        Avengers1000 = 0;
        Avengers10000 = 0;
        Vqv100 = 0;
        Vqv1000 = 0;
        Vqv10000 = 0;
        fish100 = 0;
        fish1000 = 0;

        //spartan
        spartan100 = 0;
        spartan1000 = 0;
        spartan5000 = 0;
        spartan10000 = 0;
        constructor(data: Uint8Array) {
            super(data);
            this.miniPoker100 = this.getLong();
            this.miniPoker1000 = this.getLong();
            this.miniPoker10000 = this.getLong();
            this.pokeGo100 = this.getLong();
            this.pokeGo1000 = this.getLong();
            this.pokeGo10000 = this.getLong();
            this.khoBau100 = this.getLong();
            this.khoBau1000 = this.getLong();
            this.khoBau10000 = this.getLong();
            this.NDV100 = this.getLong();
            this.NDV1000 = this.getLong();
            this.NDV10000 = this.getLong();
            this.Avengers100 = this.getLong();
            this.Avengers1000 = this.getLong();
            this.Avengers10000 = this.getLong();
            this.Vqv100 = this.getLong();
            this.Vqv1000 = this.getLong();
            this.Vqv10000 = this.getLong();
            this.fish100 = this.getLong();
            this.fish1000 = this.getLong();
            //spartan game
            this.spartan100 = this.getLong();
            this.spartan1000 = this.getLong();
            this.spartan5000 = this.getLong();
            this.spartan10000 = this.getLong();
            
        }
    }
    export class ReqGetMoneyUse extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.GET_MONEY_USE);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ResGetMoneyUse extends InPacket {
        moneyUse = 0;

        constructor(data: Uint8Array) {
            super(data);
            this.moneyUse = this.getLong();
        }
    }

    //slot
    export class ReqSubcribeHallSlot extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.SUBCRIBE_HALL_SLOT);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ReqUnSubcribeHallSlot extends OutPacket {
        constructor() {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.UNSUBCRIBE_HALL_SLOT);
            this.packHeader();
            this.updateSize();
        }
    }
    export class ResUpdateJackpotSlots extends InPacket {
        pots = "";

        constructor(data: Uint8Array) {
            super(data);
            this.pots = this.getString()
        }
    }

    // cashout class

    export class ReqCashoutCard extends OutPacket {
        constructor(telcoId: string, amount: number, quantity: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.CASHOUT_CARD);
            this.packHeader();
            
            this.putString(telcoId);
            this.putInt(amount);
            this.putInt(quantity);
            this.updateSize();
        }
    }

    export class ResCashoutCard extends InPacket {
        error = 0;
        currentMoney = 0;
        listCard = "";

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoney = this.getLong();
            this.listCard = this.getString();
        }
    }

    export class ReqCashoutBank extends OutPacket {
        constructor(bankName: string, bankNumber: string, bankActName: string, amount: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.CASHOUT_BANK);
            this.packHeader();
            
            this.putString(bankName);
            this.putString(bankNumber);
            this.putString(bankActName);
            this.putInt(amount);
            this.updateSize();
        }
    }

    export class ResCashoutBank extends InPacket {
        error = 0;
        currentMoney = 0;
        //listCard = "";

        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoney = this.getLong();
            //this.listCard = this.getString();
        }
    }

    export class ReqCashoutMomo extends OutPacket {
        constructor(phoneNumber: string,  amount: number) {
            super();
            this.initData(100);
            this.setControllerId(1);
            this.setCmdId(Code.CASHOUT_MOMO);
            this.packHeader();
            
            this.putString(phoneNumber);
            this.putInt(amount);
            this.updateSize();
        }
    }

    export class ResCashoutMomo extends InPacket {
        error = 0;
        currentMoney = 0;
        constructor(data: Uint8Array) {
            super(data);
            this.error = this.getError();
            this.currentMoney = this.getLong();
          
        }
    }

}
export default cmd;
