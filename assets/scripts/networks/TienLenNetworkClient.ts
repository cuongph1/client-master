import NetworkClient from "./Network.NetworkClient";
import CardGameNetworkClient from "./CardGameNetworkClient";
import OutPacket from "./Network.OutPacket";
import NetworkListener from "./Network.NetworkListener";
import Configs from "../common/Configs";
import InPacket from "./Network.InPacket";
import cmd from "./Network.Cmd";

export default class TienLenNetworkClient extends CardGameNetworkClient {
    
    public static getInstance(): TienLenNetworkClient {
        if (this.instance == null) {
            this.instance = new TienLenNetworkClient();
        }
        return this.instance as TienLenNetworkClient;
    }

    constructor() {
        super();
    }

    _connect() {
        super.connect(Configs.App.HOST_TLMN.host, Configs.App.HOST_TLMN.port);
    }

    onOpen(ev: Event) {
        super.onOpen(ev);
        console.log("tlmn connected");
    }
}