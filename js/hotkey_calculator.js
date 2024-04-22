function hotkeys(startRatio, endRatio) {
    var possibleKeys = [];
    for (let a = -10; a <= 10; a++) {
        for (let b = -10; b <= 10; b++) {
            for (let c = -10; c <= 10; c++) {
                const end = startRatio* (6/5)**a * (8/7)**b * (32/31)**c;
                if (Math.floor(end) == endRatio && Math.abs(a)+Math.abs(b)+Math.abs(c) <= 10) possibleKeys.push({
                    21: a, 
                    ws: b,
                    da: c,
                    endr: Math.floor(end*10)/10
                });
            }
        }
    }
    possibleKeys.sort((a, b) => a.endr - b.endr)
    return possibleKeys
}

module.exports = hotkeys;