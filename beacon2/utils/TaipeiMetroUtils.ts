export class TaipeiMetroUtils {
    /**
     * 解密 Beacon 的 Major & Minor 值，得到 Beacon ID (BID)
     * @param major Beacon 的 Major 值
     * @param minor Beacon 的 Minor 值
     * @returns 解密後的 Beacon ID (0-8191)
     */
    static decryptionID(major: number, minor: number): number {
        let r0 = this.l(major, minor);
        const r1 = this.j(major, minor);
        let r2 = this.k(major, minor);
        let r3 = r0 & 7;

        switch (r3) {
            case 0:
                r2 = r2 ^ r1;
                break;
            case 1:
                r2 = r2 ^ r1;
                r2 = (~r2) & 0x3FFF; // 16383
                break;
            case 2:
                r2 = (r1 >> 2) & 0xFFF; // 4095
                r3 = (r1 << 12) & 0x3000; // 12288
                r2 = r2 | r3;
                break;
            case 3:
                r2 = (r1 << 2) & 0x3FFC; // 16380
                r3 = (r1 >> 12) & 0x3; // 3
                r2 = r2 | r3;
                break;
            case 4:
                r3 = (r1 >> 2) & 0xFFF;
                r0 = (r1 << 12) & 0x3000;
                r3 = r3 | r0;
                r2 = r2 ^ r3;
                break;
            case 5:
                r3 = (r1 >> 2) & 0xFFF;
                r0 = (r1 << 12) & 0x3000;
                r3 = r3 | r0;
                r2 = r2 ^ r3;
                r2 = (~r2) & 0x3FFF;
                break;
            case 6:
                r3 = (r1 << 2) & 0x3FFC;
                r0 = (r1 >> 12) & 0x3;
                r3 = r3 | r0;
                r2 = r2 ^ r3;
                break;
            case 7:
                r3 = (r1 << 2) & 0x3FFC;
                r0 = (r1 >> 12) & 0x3;
                r3 = r3 | r0;
                r2 = r2 ^ r3;
                r2 = (~r2) & 0x3FFF;
                break;
            default:
                r2 = -1;
                break;
        }

        return r2 & 0x1FFF; // 8191
    }

    // 輔助函數
    private static j(major: number, minor: number): number {
        return ((major & 127) << 7) | (minor & 127);
    }

    private static k(major: number, minor: number): number {
        return (major & 16256) | ((minor & 16256) >> 7);
    }

    private static l(major: number, minor: number): number {
        return (((major & 49152) >> 12) | ((minor & 49152) >> 14)) & 7;
    }
}