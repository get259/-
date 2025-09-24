/**
 * 八字计算器
 * 根据公历日期计算对应的天干地支八字
 */

// 天干数组
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 地支数组
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 农历月份天数表（1900-2100年）
const LUNAR_MONTH_DAYS = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
];

// 农历年份数据（1900-2100年）
const LUNAR_YEAR_DATA = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
];

/**
 * 获取农历月份天数
 * @param {number} year 农历年份
 * @param {number} month 农历月份
 * @returns {number} 天数
 */
function getLunarMonthDays(year, month) {
    const yearData = LUNAR_YEAR_DATA[year - 1900];
    return (yearData & (0x10000 >> month)) ? 30 : 29;
}

/**
 * 判断是否为闰年
 * @param {number} year 年份
 * @returns {boolean}
 */
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * 获取农历年份的总天数
 * @param {number} year 农历年份
 * @returns {number} 总天数
 */
function getLunarYearDays(year) {
    let days = 348; // 12个月 * 29天
    const yearData = LUNAR_YEAR_DATA[year - 1900];
    
    for (let i = 0x8000; i > 0x8; i >>= 1) {
        days += (yearData & i) ? 1 : 0;
    }
    
    return days + getLeapMonthDays(year);
}

/**
 * 获取闰月天数
 * @param {number} year 农历年份
 * @returns {number} 闰月天数
 */
function getLeapMonthDays(year) {
    if (getLeapMonth(year)) {
        return getLunarMonthDays(year, getLeapMonth(year));
    }
    return 0;
}

/**
 * 获取闰月月份
 * @param {number} year 农历年份
 * @returns {number} 闰月月份，0表示无闰月
 */
function getLeapMonth(year) {
    return LUNAR_YEAR_DATA[year - 1900] & 0xf;
}

/**
 * 公历转农历
 * @param {number} year 公历年份
 * @param {number} month 公历月份
 * @param {number} day 公历日期
 * @returns {Object} 农历信息 {year, month, day, isLeap}
 */
function solarToLunar(year, month, day) {
    // 1900年1月31日为农历1900年正月初一
    const baseDate = new Date(1900, 0, 31);
    const inputDate = new Date(year, month - 1, day);
    
    let days = Math.floor((inputDate - baseDate) / (24 * 60 * 60 * 1000));
    
    let lunarYear = 1900;
    let lunarMonth = 1;
    let lunarDay = 1;
    
    // 计算农历年份
    while (days > 0) {
        const yearDays = getLunarYearDays(lunarYear);
        if (days >= yearDays) {
            days -= yearDays;
            lunarYear++;
        } else {
            break;
        }
    }
    
    // 计算农历月份
    while (days > 0) {
        const monthDays = getLunarMonthDays(lunarYear, lunarMonth);
        if (days >= monthDays) {
            days -= monthDays;
            lunarMonth++;
            if (lunarMonth > 12) {
                lunarMonth = 1;
                lunarYear++;
            }
        } else {
            break;
        }
    }
    
    lunarDay += days;
    
    return {
        year: lunarYear,
        month: lunarMonth,
        day: lunarDay,
        isLeap: false // 简化处理，不考虑闰月
    };
}

/**
 * 计算年柱
 * @param {number} year 农历年份
 * @returns {string} 年柱
 */
function getYearPillar(year) {
    const ganIndex = (year - 4) % 10;
    const zhiIndex = (year - 4) % 12;
    return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

/**
 * 计算月柱
 * @param {number} year 农历年份
 * @param {number} month 农历月份
 * @returns {string} 月柱
 */
function getMonthPillar(year, month) {
    // 月干计算公式：(年干 * 2 + 月数) % 10
    const yearGan = (year - 4) % 10;
    const ganIndex = (yearGan * 2 + month) % 10;
    
    // 月支：正月为寅，二月为卯...
    const zhiIndex = (month + 1) % 12;
    
    return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

/**
 * 计算日柱
 * @param {number} year 公历年份
 * @param {number} month 公历月份
 * @param {number} day 公历日期
 * @returns {string} 日柱
 */
function getDayPillar(year, month, day) {
    // 使用1900年1月1日为基准日（甲子日）
    const baseDate = new Date(1900, 0, 1);
    const inputDate = new Date(year, month - 1, day);
    
    const days = Math.floor((inputDate - baseDate) / (24 * 60 * 60 * 1000));
    
    const ganIndex = (days + 0) % 10; // 甲子日为第0天
    const zhiIndex = (days + 0) % 12;
    
    return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

/**
 * 计算时柱
 * @param {number} hour 时辰（0-23）
 * @param {number} year 农历年份
 * @param {number} month 农历月份
 * @param {number} day 农历日期
 * @returns {string} 时柱
 */
function getHourPillar(hour, year, month, day) {
    // 时辰对应地支
    const hourToZhi = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];
    let zhiIndex = 0;
    
    for (let i = 0; i < hourToZhi.length; i++) {
        if (hour >= hourToZhi[i] && hour < hourToZhi[i + 1]) {
            zhiIndex = i;
            break;
        }
    }
    
    // 时干计算公式：(日干 * 2 + 时辰地支) % 10
    const dayGan = (year * 365 + month * 30 + day) % 10; // 简化的日干计算
    const ganIndex = (dayGan * 2 + zhiIndex) % 10;
    
    return TIAN_GAN[ganIndex] + DI_ZHI[zhiIndex];
}

/**
 * 主函数：计算八字
 * @param {number} year 公历年份
 * @param {number} month 公历月份
 * @param {number} day 公历日期
 * @param {number} hour 时辰（0-23）
 * @returns {Object} 八字信息
 */
function calculateBazi(year, month, day, hour) {
    // 转换为农历
    const lunar = solarToLunar(year, month, day);
    
    // 计算四柱
    const yearPillar = getYearPillar(lunar.year);
    const monthPillar = getMonthPillar(lunar.year, lunar.month);
    const dayPillar = getDayPillar(year, month, day);
    const hourPillar = getHourPillar(hour, lunar.year, lunar.month, lunar.day);
    
    return {
        solarDate: {
            year: year,
            month: month,
            day: day,
            hour: hour
        },
        lunarDate: lunar,
        bazi: {
            yearPillar: yearPillar,
            monthPillar: monthPillar,
            dayPillar: dayPillar,
            hourPillar: hourPillar
        },
        fullBazi: `${yearPillar} ${monthPillar} ${dayPillar} ${hourPillar}`
    };
}

// 导出函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateBazi };
}

// 示例使用
console.log('=== 八字计算器测试 ===');
console.log('1995年5月15日10时的八字：');
console.log(calculateBazi(1995, 5, 15, 10));

console.log('\n2000年12月25日14时的八字：');
console.log(calculateBazi(2000, 12, 25, 14));
