function recentbattles(stats, numEntries, currentBattles, battlesArr, offset) {
    let margin = offset; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentBattles - battlesArr[i];
        if (Math.abs(diff - offset) <= margin) {
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

module.exports = recentbattles;