/**
 * 六爻卦象生成器
 * 按照传统方法：每次投掷三个硬币，六次成卦
 * 正面为阳，反面为阴
 * 三个正面(3)：老阳(变)
 * 两个正面，一个反面(2)：少阴
 * 一个正面，两个反面(1)：少阳
 * 三个反面(0)：老阴(变)
 */

class LiuyaoGenerator {
    constructor() {
        // 八卦基础数据
        this.trigrams = {
            '111': { name: '乾', symbol: '☰', nature: '天' },
            '110': { name: '兑', symbol: '☱', nature: '泽' },
            '101': { name: '离', symbol: '☲', nature: '火' },
            '100': { name: '震', symbol: '☳', nature: '雷' },
            '011': { name: '巽', symbol: '☴', nature: '风' },
            '010': { name: '坎', symbol: '☵', nature: '水' },
            '001': { name: '艮', symbol: '☶', nature: '山' },
            '000': { name: '坤', symbol: '☷', nature: '地' }
        };

        // 六十四卦名称映射
        this.hexagramNames = {
            '111111': '乾为天', '111110': '天泽履', '111101': '天火同人', '111100': '天雷无妄',
            '111011': '天风姤', '111010': '天水讼', '111001': '天山遁', '111000': '天地否',
            '110111': '泽天夬', '110110': '兑为泽', '110101': '泽火革', '110100': '泽雷随',
            '110011': '泽风大过', '110010': '泽水困', '110001': '泽山咸', '110000': '泽地萃',
            '101111': '火天大有', '101110': '火泽睽', '101101': '离为火', '101100': '火雷噬嗑',
            '101011': '火风鼎', '101010': '火水未济', '101001': '火山旅', '101000': '火地晋',
            '100111': '雷天大壮', '100110': '雷泽归妹', '100101': '雷火丰', '100100': '震为雷',
            '100011': '雷风恒', '100010': '雷水解', '100001': '雷山小过', '100000': '雷地豫',
            '011111': '风天小畜', '011110': '风泽中孚', '011101': '风火家人', '011100': '风雷益',
            '011011': '巽为风', '011010': '风水涣', '011001': '风山渐', '011000': '风地观',
            '010111': '水天需', '010110': '水泽节', '010101': '水火既济', '010100': '水雷屯',
            '010011': '水风井', '010010': '坎为水', '010001': '水山蹇', '010000': '水地比',
            '001111': '山天大畜', '001110': '山泽损', '001101': '山火贲', '001100': '山雷颐',
            '001011': '山风蛊', '001010': '山水蒙', '001001': '艮为山', '001000': '山地剥',
            '000111': '地天泰', '000110': '地泽临', '000101': '地火明夷', '000100': '地雷复',
            '000011': '地风升', '000010': '地水师', '000001': '地山谦', '000000': '坤为地'
        };
    }

    /**
     * 投掷三个硬币，返回爻的性质
     * @returns {Object} { value: 数值, type: 爻类型, isChanging: 是否变爻 }
     */
    throwCoins() {
        let heads = 0;
        
        // 投掷三个硬币
        for (let i = 0; i < 3; i++) {
            if (Math.random() < 0.5) {
                heads++; // 正面
            }
        }

        // 根据正面数量确定爻的性质
        switch (heads) {
            case 3: // 三个正面：老阳(变)
                return { value: 1, type: '老阳', isChanging: true, symbol: '━━━' };
            case 2: // 两个正面：少阴
                return { value: 0, type: '少阴', isChanging: false, symbol: '━ ━' };
            case 1: // 一个正面：少阳
                return { value: 1, type: '少阳', isChanging: false, symbol: '━━━' };
            case 0: // 三个反面：老阴(变)
                return { value: 0, type: '老阴', isChanging: true, symbol: '━ ━' };
            default:
                return { value: 1, type: '少阳', isChanging: false, symbol: '━━━' };
        }
    }

    /**
     * 生成完整的六爻卦象
     * @returns {Object} 包含主卦、变卦、变爻等信息
     */
    generateHexagram() {
        const lines = [];
        const changingLines = [];
        
        // 投掷六次，从下往上构建卦象（初爻到上爻）
        for (let i = 0; i < 6; i++) {
            const line = this.throwCoins();
            line.position = i + 1; // 爻位（1-6）
            line.name = this.getLineName(i + 1);
            lines.push(line);
            
            if (line.isChanging) {
                changingLines.push(i + 1);
            }
        }

        // 构建主卦的二进制表示（从下往上）
        const mainHexBinary = lines.map(line => line.value).join('');
        
        // 构建变卦的二进制表示
        const changedLines = lines.map(line => {
            if (line.isChanging) {
                return line.value === 1 ? 0 : 1; // 老阳变少阴，老阴变少阳
            }
            return line.value;
        });
        const changedHexBinary = changedLines.join('');

        // 获取上下卦
        const lowerTrigram = mainHexBinary.slice(0, 3);
        const upperTrigram = mainHexBinary.slice(3, 6);
        const changedLowerTrigram = changedHexBinary.slice(0, 3);
        const changedUpperTrigram = changedHexBinary.slice(3, 6);

        return {
            // 投掷结果
            lines: lines,
            changingLines: changingLines,
            
            // 主卦信息
            mainHexagram: {
                binary: mainHexBinary,
                name: this.hexagramNames[mainHexBinary] || '未知卦',
                upperTrigram: this.trigrams[upperTrigram],
                lowerTrigram: this.trigrams[lowerTrigram],
                symbol: this.getHexagramSymbol(lines)
            },
            
            // 变卦信息
            changedHexagram: {
                binary: changedHexBinary,
                name: this.hexagramNames[changedHexBinary] || '未知卦',
                upperTrigram: this.trigrams[changedUpperTrigram],
                lowerTrigram: this.trigrams[changedLowerTrigram],
                symbol: this.getHexagramSymbol(changedLines.map((value, index) => ({
                    value: value,
                    symbol: value === 1 ? '━━━' : '━ ━'
                })))
            },
            
            // 生成时间
            timestamp: new Date().toISOString(),
            
            // 摇卦次数统计
            summary: {
                totalChangingLines: changingLines.length,
                hasChanges: changingLines.length > 0
            }
        };
    }

    /**
     * 获取爻位名称
     * @param {number} position 爻位（1-6）
     * @returns {string} 爻位名称
     */
    getLineName(position) {
        const names = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
        return names[position - 1];
    }

    /**
     * 生成卦象的视觉表示
     * @param {Array} lines 爻线数组
     * @returns {string} 卦象符号
     */
    getHexagramSymbol(lines) {
        // 从上往下显示（传统表示法）
        return lines.slice().reverse().map(line => line.symbol).join('\n');
    }

    /**
     * 格式化输出卦象信息
     * @param {Object} hexagramData 卦象数据
     * @returns {string} 格式化的卦象信息
     */
    formatHexagram(hexagramData) {
        const { mainHexagram, changedHexagram, lines, changingLines } = hexagramData;
        
        let result = `【六爻卦象】\n\n`;
        
        // 主卦信息
        result += `主卦：${mainHexagram.name}\n`;
        result += `上卦：${mainHexagram.upperTrigram.name}${mainHexagram.upperTrigram.symbol}（${mainHexagram.upperTrigram.nature}）\n`;
        result += `下卦：${mainHexagram.lowerTrigram.name}${mainHexagram.lowerTrigram.symbol}（${mainHexagram.lowerTrigram.nature}）\n\n`;
        
        // 卦象图
        result += `卦象：\n${mainHexagram.symbol}\n\n`;
        
        // 爻线详情（从上往下显示）
        result += `爻线详情：\n`;
        for (let i = 5; i >= 0; i--) {
            const line = lines[i];
            const changing = line.isChanging ? ' (变)' : '';
            result += `${line.name}：${line.type}${changing}\n`;
        }
        
        // 变爻信息
        if (changingLines.length > 0) {
            result += `\n变爻：第${changingLines.join('、')}爻\n`;
            result += `变卦：${changedHexagram.name}\n`;
            result += `变卦上卦：${changedHexagram.upperTrigram.name}（${changedHexagram.upperTrigram.nature}）\n`;
            result += `变卦下卦：${changedHexagram.lowerTrigram.name}（${changedHexagram.lowerTrigram.nature}）\n`;
        } else {
            result += `\n无变爻，以主卦论断\n`;
        }
        
        result += `\n生成时间：${new Date(hexagramData.timestamp).toLocaleString('zh-CN')}\n`;
        
        return result;
    }
}

module.exports = {
    LiuyaoGenerator
};

