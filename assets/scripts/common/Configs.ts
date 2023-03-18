import SPUtils from "./SPUtils";
import Http from "./Http";
import VersionConfig from "./VersionConfig";

namespace Configs {
    export class Login {
        static UserId: number = 0;
        static Username: string = "";
        static Password: string = "";
        static Nickname: string = "";
        static Avatar: string = "";
        static Coin: number = 0;
        static IsLogin: boolean = false;
        static AccessToken: string = "";
        static SessionKey: string = "";
        static LuckyWheel: number = 0;
        static CreateTime: string = "";
        static Birthday: string = "";
        static IpAddress: string = "";
        static VipPoint: number = 0;
        static VipPointSave: number = 0;

        static CoinFish: number = 0;
        static UserIdFish: number = 0;
        static UsernameFish: string = "";
        static PasswordFish: string = "";
        static FishConfigs: any = null;
        static BitcoinToken: string = "";

        static clear() {
            this.UserId = 0;
            this.Username = "";
            this.Password = "";
            this.Nickname = "";
            this.Avatar = "";
            this.Coin = 0;
            this.IsLogin = false;
            this.AccessToken = "";
            this.SessionKey = "";
            this.CreateTime = "";
            this.Birthday = "";
            this.IpAddress = "";
            this.VipPoint = 0;
            this.VipPointSave = 0;
            this.CoinFish = 0;
            this.UserIdFish = 0;
            this.UsernameFish = "";
            this.PasswordFish = "";
            this.BitcoinToken = "";
            SPUtils.setUserPass("");
        }

        static readonly VipPoints = [80, 800, 4500, 8600, 12000, 50000, 1000000, 2000000];
        static readonly VipPointsName = ["Đá", "Đồng", "Bạc", "Vàng", "BK1", "BK2", "KC1", "KC2", "KC3"];
        static getVipPointName(): string {
            for (let i = this.VipPoints.length - 1; i >= 0; i--) {
                if (Configs.Login.VipPoint > this.VipPoints[i]) {
                    return this.VipPointsName[i + 1];
                }
            }
            return this.VipPointsName[0];
        }
        static getVipPointNextLevel(): number {
            for (let i = this.VipPoints.length - 1; i >= 0; i--) {
                if (Configs.Login.VipPoint > this.VipPoints[i]) {
                    if (i == this.VipPoints.length - 1) {
                        return this.VipPoints[i];
                    }
                    return this.VipPoints[i + 1];
                }
            }
            return this.VipPoints[0];
        }
        static getVipPointIndex(): number {
            for (let i = this.VipPoints.length - 1; i >= 0; i--) {
                if (Configs.Login.VipPoint > this.VipPoints[i]) {
                    return i;
                }
            }
            return 0;
        }
    }

    export class App {
        
        static HOT_UPDATE_URL = "https://demo.eloras.icu/remote-assets/";
        static SUBPACKAGE_URL = "https://demo.eloras.icu/remote-assets/";
        static DOMAIN: string = "https://demo.eloras.icu";
        static API: string = "https://iportal.eloras.icu/api";
        static MONEY_TYPE = 1;
        static LINK_DOWNLOAD = "https://eloras.icu/download";
        static LINK_EVENT = "https://eloras.icu/event";
        static LINK_SUPPORT = "https://eloras.icu";
        static USE_WSS = true;
        static LINK_GROUP = "https://www.facebook.com/groups/bao99.vip";
        static readonly HOST_MINIGAME = {
            
            host: "wmini.eloras.icu",
            port: 443
        };
        static readonly HOST_TAI_XIU_MINI2 = {
            
            host: "overunder.eloras.icu",
            port: 443
        };
        static readonly HOST_SLOT = {
           
            host: "wslot.eloras.icu",
            port: 443
        };
        static readonly HOST_TLMN = {
            
            host: "wltmn.eloras.icu",
            port: 443
        };
        static readonly HOST_SHOOT_FISH = {
            
            host: "wbanca.eloras.icu",
            port: 443
        };
        static readonly HOST_SAM = {
            host: "wsam.eloras.icu",
            
            port: 443
        };
        static readonly HOST_XOCDIA = {
            host: "localhost", //"wxocdia.eloras.icu",
            port:  2344// 443
        };
        static readonly HOST_BACAY = {
            host: "wbacay.eloras.icu",
            port: 443
        };
        static readonly HOST_BAICAO = {
            host: "wbaicao.eloras.icu",
            port: 1144
        };
        static readonly HOST_POKER = {
            host: "wpoker.eloras.icu",
            port: 443
        };
        static readonly HOST_XIDACH = {
            host: "wpoker.eloras.icu",
            port: 443
        };
        static readonly HOST_BINH = {
            host: "wpoker.eloras.icu",
            port: 443
        };
        static readonly HOST_LIENG = {
            host: "wpoker.eloras.icu",
            port: 443
        };
        static readonly SERVER_CONFIG = {
            ratioNapThe: 1,
            ratioNapMomo: 1.2,
            ratioTransfer: 0.98,
            ratioTransferDL: 1,
            listTenNhaMang: ["Viettel", "Vinaphone", "Mobifone", "Vietnamobile"],
            listIdNhaMang: [0, 1, 2, 3],
            listMenhGiaNapThe: [10000, 20000, 30000, 50000, 100000, 200000, 500000],
            ratioRutThe: 1.2
        };
        static readonly CASHOUT_CARD_CONFIG = {
            listTenNhaMang: ["Viettel", "Vinaphone", "Mobifone", "Vietnamobile", "Garena", "Vcoin", "FPT Gate", "Mobi Data"],
            listIdNhaMang: ["VTT", "VNP", "VMS", "VNM", "GAR", "VTC", "FPT", "DBM"],
            listMenhGiaNapThe: [10000, 100000, 200000, 500000],
            listQuantity: ["1", "2","3"]
        }
        static  BILLING_CONF : any;

        static getServerConfig() {
            Http.get(Configs.App.API, { "c": 130 }, (err, res) => {
                if (err == null) {
                    // console.log(res);
                    App.SERVER_CONFIG.ratioNapThe = res.ratio_nap_the;
                    App.SERVER_CONFIG.ratioTransfer = res.ratio_chuyen;
                    App.SERVER_CONFIG.ratioTransferDL = res.ratio_transfer_dl_1;
                    App.SERVER_CONFIG.ratioRutThe = res.ratio_mua_the;
                    App.BILLING_CONF = res;
                }
            });
        }

        static getPlatformName() {
            if (cc.sys.isNative && cc.sys.os == cc.sys.OS_ANDROID) return "android";
            if (cc.sys.isNative && cc.sys.os == cc.sys.OS_IOS) return "ios";
            return "web";
        }

        static getLinkFanpage() {
            switch (VersionConfig.CPName) {
                default:
                    return "https://www.facebook.com/bao99club";
            }
        }

        static getLinkTelegram() {
            switch (VersionConfig.CPName) {
                default:
                    return "cskhbao99";
            }
        }

        static getLinkTelegramGroup() {
            switch (VersionConfig.CPName) {
                default:
                    return "cskhbao99";
            }
        }

        static init() {
            switch (VersionConfig.ENV) {
                case VersionConfig.ENV_LOCAL:
                    this.USE_WSS = false;
                    this.HOT_UPDATE_URL = "http://"+VersionConfig.DOMAIN_LOCAL+"/remote-assets/";
                    this.SUBPACKAGE_URL = "http://"+VersionConfig.DOMAIN_LOCAL+"/remote-assets/";
                    this.DOMAIN = ""+VersionConfig.DOMAIN_LOCAL+"/";
                    this.API = "http://"+VersionConfig.DOMAIN_LOCAL+":8081/api";
                    this.MONEY_TYPE = 1;
                    this.LINK_DOWNLOAD = "http://"+VersionConfig.DOMAIN_LOCAL+"/landing";
                    this.LINK_EVENT = "http://"+VersionConfig.DOMAIN_LOCAL+"event";
                    this.LINK_SUPPORT = ""+VersionConfig.DOMAIN_LOCAL+"";

                    this.HOST_MINIGAME.host =""+ VersionConfig.DOMAIN_LOCAL;
                    this.HOST_MINIGAME.port = 1644;
                    this.HOST_TAI_XIU_MINI2.host = "overunder."+VersionConfig.DOMAIN_LOCAL;
                    this.HOST_SLOT.host = ""+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_SLOT.port = 1844;
                    this.HOST_TLMN.host = ""+VersionConfig.DOMAIN_LOCAL;
                    this.HOST_TLMN.port = 2144;
                    this.HOST_SAM.host = ""+VersionConfig.DOMAIN_LOCAL;
                    this.HOST_SAM.port = 1944;
                    this.HOST_XOCDIA.host = ""+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_XOCDIA.port = 2344;
                    this.HOST_BACAY.host = "wbacay."+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_BACAY.port = 443;
                    this.HOST_BAICAO.host = "wbaicao."+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_BAICAO.port = 443;
                    this.HOST_POKER.host = "wpoker."+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_POKER.port = 443;
                    this.HOST_XIDACH.host = "wxizach."+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_XIDACH.port = 443;
                    this.HOST_BINH.host = "wbinh."+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_BINH.port = 443;
                    this.HOST_LIENG.host = "wlieng."+VersionConfig.DOMAIN_LOCAL+"";
                    this.HOST_LIENG.port = 443;
                    this.HOST_SHOOT_FISH.host = "wbanca."+VersionConfig.DOMAIN_LOCAL;
                    this.HOST_SHOOT_FISH.port = 443;
                    
                    break;
                case VersionConfig.ENV_DEV:
                    this.USE_WSS = true;
                    this.HOT_UPDATE_URL = "https://"+VersionConfig.DOMAIN_DEV+"/remote-assets/";
                    this.SUBPACKAGE_URL = "https://"+VersionConfig.DOMAIN_DEV+"/remote-assets/";
                    this.DOMAIN = "https://"+VersionConfig.DOMAIN_DEV+"/";
                    this.API = "https://iportal."+VersionConfig.DOMAIN_DEV+"/api";
                    this.MONEY_TYPE = 1;
                    this.LINK_DOWNLOAD = "https://"+VersionConfig.DOMAIN_DEV+"";
                    this.LINK_EVENT = "https://"+VersionConfig.DOMAIN_DEV+"/event";
                    this.LINK_SUPPORT = "https://www.comm100.com/";

                    this.HOST_MINIGAME.host = "wmini."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_TAI_XIU_MINI2.host = "overunder."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_SLOT.host = "wslot."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_TLMN.host = "wtlmn."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_SHOOT_FISH.host = "wbanca."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_SAM.host = "wsam."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_XOCDIA.host = "wxocdia."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_BACAY.host = "wbacay."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_BAICAO.host = "wbaicao."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_POKER.host = "wpoker."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_XIDACH.host = "wxizach."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_BINH.host = "wbinh."+VersionConfig.DOMAIN_DEV+"";
                    this.HOST_LIENG.host = "wlieng."+VersionConfig.DOMAIN_DEV+"";
                    this.LINK_GROUP = "https://www.facebook.com/groups/bao99.vip";
                    console.log(VersionConfig.ENV);
                    break;
                case VersionConfig.ENV_PROD:
                    this.USE_WSS = true;
                    this.HOT_UPDATE_URL = "https://"+VersionConfig.DOMAIN_PRO+"/remote-assets/";
                    this.SUBPACKAGE_URL = "https://"+VersionConfig.DOMAIN_PRO+"/remote-assets/";
                    this.DOMAIN = "https://"+VersionConfig.DOMAIN_PRO+"/";
                    this.API = "https://iportal."+VersionConfig.DOMAIN_PRO+"/api";
                    this.MONEY_TYPE = 1;
                    this.LINK_DOWNLOAD = "https://"+VersionConfig.DOMAIN_PRO+"";
                    this.LINK_EVENT = "https://"+VersionConfig.DOMAIN_PRO+"/event";
                    this.LINK_SUPPORT = "https://www.comm100.com/";

                    this.HOST_MINIGAME.host = "wmini."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_TAI_XIU_MINI2.host = "overunder."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_SLOT.host = "wslot."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_TLMN.host = "wtlmn."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_SHOOT_FISH.host = "wbanca."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_SAM.host = "wsam."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_XOCDIA.host = "wxocdia."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_BACAY.host = "wbacay."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_BAICAO.host = "wbaicao."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_POKER.host = "wpoker."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_XIDACH.host = "wxizach."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_BINH.host = "wbinh."+VersionConfig.DOMAIN_PRO+"";
                    this.HOST_LIENG.host = "wlieng."+VersionConfig.DOMAIN_PRO+"";
                    this.LINK_GROUP = "https://www.facebook.com/groups/bao99.vip";
                    console.log(VersionConfig.ENV);
                    break;
                default:
                    this.USE_WSS = true;
                    this.HOT_UPDATE_URL = "https://demo.eloras.icu/remote-assets/";
                    this.SUBPACKAGE_URL = "https://demo.eloras.icu/remote-assets/";
                    this.DOMAIN = "https://demo.eloras.icu/";
                    this.API = "https://iportal.eloras.icu/api";
                    this.MONEY_TYPE = 1;
                    this.LINK_DOWNLOAD = "https://demo.eloras.icu/landing";
                    this.LINK_EVENT = "https://demo.eloras.icu/event";
                    this.LINK_SUPPORT = "https://eloras.icu";

                    this.HOST_MINIGAME.host = "wmini.eloras.icu";
                    this.HOST_TAI_XIU_MINI2.host = "overunder.f69.vip";
                    this.HOST_SLOT.host = "wslot.eloras.icu";
                    this.HOST_TLMN.host = "wtlmn.eloras.icu";
                    this.HOST_SHOOT_FISH.host = "wbanca.eloras.icu";
                    this.HOST_SAM.host = "wsam.eloras.icu";
                    break;
            }
        }
    }
    export class GameId {
        static readonly MiniPoker = 1;
        static readonly TaiXiu = 2;
        static readonly BauCua = 3;
        static readonly CaoThap = 4;
        static readonly Slot3x3 = 5;
        static readonly VQMM = 7;
        static readonly Sam = 8;
        static readonly BaCay = 9;
        static readonly MauBinh = 10;
        static readonly TLMN = 11;
        static readonly TaLa = 12;
        static readonly Lieng = 13;
        static readonly XiTo = 14;
        static readonly XocXoc = 15;
        static readonly BaiCao = 16;
        static readonly Poker = 17;
        static readonly Bentley = 19;
        static readonly RangeRover = 20;
        static readonly MayBach = 21;
        static readonly RollsRoyce = 22;

        static getGameName(gameId: number): string {
            switch (gameId) {
                case this.MiniPoker:
                    return "MiniPoker";
                case this.TaiXiu:
                    return "Tài xỉu";
                case this.BauCua:
                    return "Bầu cua";
                case this.CaoThap:
                    return "Cao thấp";
                case this.Slot3x3:
                    return "Slot3x3";
                case this.VQMM:
                    return "VQMM";
                case this.Sam:
                    return "Sâm";
                case this.MauBinh:
                    return "Mậu binh";
                case this.TLMN:
                    return "TLMN";
                case this.TaLa:
                    return "Tá lả";
                case this.Lieng:
                    return "Liêng";
                case this.XiTo:
                    return "Xì tố";
                case this.XocXoc:
                    return "Xóc xóc";
                case this.BaiCao:
                    return "Bài cào";
                case this.Poker:
                    return "Poker";
                case this.Bentley:
                    return "Bentley";
                case this.RangeRover:
                    return "Range Rover";
                case this.MayBach:
                    return "May Bach";
                case this.RollsRoyce:
                    return "Rolls Royce";
            }
            return "Unknow";
        }
    }
}
export default Configs;
Configs.App.init();