function recentTime(stats, numEntries, currentTime, timeArr, offset) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        if (currentTime - timeArr[i] < offset*1.2) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    let margin = offset; 
    let properIndex = 0;

    for (let i = numEntries - 1; i >= 0; --i) {
        const diff = currentTime - timeArr[i];
        if (Math.abs(diff - offset) < margin) {
            margin = Math.abs(diff - offset);
            properIndex = i;
        }
    }
    let counter = 0;
    while (Object.keys(stats[properIndex]).length === 0) {
        counter++;
        properIndex--;
    }
    return properIndex;
}

module.exports = recentTime;