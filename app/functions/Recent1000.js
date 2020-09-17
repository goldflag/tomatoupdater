function recent1000(stats, numEntries, currentBattles, battlesArr) {
    let margin = 1000; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentBattles - battlesArr[i];
        if (Math.abs(diff - 1000) <= margin) {
            margin = Math.abs(diff - 1000);
            properIndex = i;
        }
    }
    while (Object.keys(stats[properIndex]).length === 0) {
        properIndex--;
    }
    return properIndex;
}

module.exports = recent1000;