import NetworkClient from "./networks/Network.NetworkClient";
import Configs from "./common/Configs";
import OutPacket from "./networks/Network.OutPacket";
import cmd from "./networks/Network.Cmd";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TestController extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property
    text: string = 'hello';

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        for (let i = 0; i < 500; i++) {
            let connect = ()=>{
                let client = new NetworkClient();
                client.isUseWSS = true;
                client.addOnOpen(()=>{
                    this.send(client.ws, new cmd.SendLogin(Configs.Login.Nickname, Configs.Login.AccessToken));
                }, this);
                client.addOnClose(()=>{
                    setTimeout(()=>{
                        connect();
                    }, 2000);
                }, this);
                client.connect(Configs.App.HOST_MINIGAME.host, Configs.App.HOST_MINIGAME.port);
            }
            connect();
        }
    }



    public send(ws: WebSocket, packet: OutPacket) {
        for (var b = new Int8Array(packet._length), c = 0; c < packet._length; c++)
            b[c] = packet._data[c];
        ws.send(b.buffer);
    }

    // update (dt) {}
}
