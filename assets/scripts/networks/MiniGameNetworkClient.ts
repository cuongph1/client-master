import NetworkClient from "./Network.NetworkClient";
import OutPacket from "./Network.OutPacket";
import NetworkListener from "./Network.NetworkListener";
import Configs from "../common/Configs";
import InPacket from "./Network.InPacket";
import cmd from "./Network.Cmd";
import App from "../common/App";

export default class MiniGameNetworkClient extends NetworkClient {
    private static instance: MiniGameNetworkClient;

    private listeners: Array<NetworkListener> = new Array<NetworkListener>();
    private isLogin = false;
    private onLogined: () => void = null;

    private intervalPing: number = -1;

    public static getInstance(): MiniGameNetworkClient {
        if (this.instance == null) {
            this.instance = new MiniGameNetworkClient();
        }
        return this.instance;
    }

    constructor() {
        super();
        this.isUseWSS = Configs.App.USE_WSS;
    }

    public checkConnect(onLogined: () => void = null) {
        this.onLogined = onLogined;
        if (this.ws != null && this.ws.readyState == WebSocket.CONNECTING) return;
        if (!this.isConnected()) {
            App.instance.showErrLoading("Đang đăng nhập minigame");
            this.connect();
            return;
        }
        if (this.isLogin && this.onLogined != null) this.onLogined();
    }

    protected onError(ev: Event) {
        App.instance.showLoading(false);
        //App.instance.alertDialog.showMsg("Đăng nhập Minigame thất bại, vui lòng thoát app và thử lại!")
        console.log("onError minigame");
    }

     connect() {
        super.connect(Configs.App.HOST_MINIGAME.host, Configs.App.HOST_MINIGAME.port);
    }

    protected onOpen(ev: Event) {
        super.onOpen(ev);
        this.send(new cmd.SendLogin(Configs.Login.Nickname, Configs.Login.AccessToken));
        console.log("minigame connected");
        this.intervalPing = setInterval(() => this.ping(), 1);
        this.ping();
    }

    protected onMessage(ev: MessageEvent) {
        var data = new Uint8Array(ev.data);
        for (var i = 0; i < this.listeners.length; i++) {
            var listener = this.listeners[i];
            if (listener.target && listener.target instanceof Object && listener.target.node) {
                listener.callback(data);
            } else {
                this.listeners.splice(i, 1);
                i--;
            }
        }

        let inpacket = new InPacket(data);
        switch (inpacket.getCmdId()) {
            case cmd.Code.LOGIN:
                this.isLogin = true;
                if (this.onLogined != null) {
                    console.log("Logined");
                    this.onLogined();
                }
                break;
        }
    }

    public addListener(callback: (data: Uint8Array) => void, target: cc.Component) {
        this.listeners.push(new NetworkListener(target, callback));
    }

    protected onClose(ev: Event) {
        console.log("onclose minigame");
        super.onClose(ev);
    }

    public send(packet: OutPacket) {
        for (var b = new Int8Array(packet._length), c = 0; c < packet._length; c++)
            b[c] = packet._data[c];
        if (this.ws != null && this.isConnected())
            this.ws.send(b.buffer);
    }

    public sendCheck(packet: OutPacket) {
        this.checkConnect(() => {
            this.send(packet);
        });
    }
    public ping(){
        if (this.ws != null && this.ws.readyState !== WebSocket.OPEN) {
            console.log("WebSocket minigame instance wasn't ready...");
        };
    }
}
