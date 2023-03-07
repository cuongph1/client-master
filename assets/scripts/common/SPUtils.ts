namespace common {
    export class SPUtils {
        private static encode(s: string, k: number): string {
            var enc = "";
            var str = "";
            // make sure that input is string
            str = s.toString();
            for (var i = 0; i < s.length; i++) {
                // create block
                var a = s.charCodeAt(i);
                // bitwise XOR
                var b = a ^ k;
                enc = enc + String.fromCharCode(b);
            }
            return enc;
        }

        static get(key: string, defaultValue: string = ""): string {
            var keyEncrypted = this.encode(key, 3265812).toString();
            if (typeof defaultValue === "undefined") defaultValue || null;
            var r = cc.sys.localStorage.getItem(keyEncrypted);
            if (r) {
                r = this.encode(r, 3265812).toString();
                return r;
            }
            return defaultValue;
        }

        static set(key: string, value: string) {
            value = value.toString();
            var keyEncrypted = "" + this.encode(key, 3265812);
            var valueEncrypted = "" + this.encode(value, 3265812);
            cc.sys.localStorage.setItem(keyEncrypted, valueEncrypted);
        }

        static setUserName(value: string) {
            this.set("username", value);
        }

        static getUserName(): string {
            return this.get("username");
        }

        static setUserPass(value: string) {
            this.set("userpass", value);
        }

        static getUserPass(): string {
            return this.get("userpass");
        }

        static getMusicVolumn(): number {
            return Number(this.get("music_volumn", "1"));
        }

        static setMusicVolumn(volumn: number) {
            this.set("music_volumn", volumn.toString());
        }

        static getSoundVolumn(): number {
            return Number(this.get("sound_volumn", "1"));
        }

        static setSoundVolumn(volumn: number) {
            this.set("sound_volumn", volumn.toString());
        }
    }
}
export default common.SPUtils;