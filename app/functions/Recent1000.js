function recent1000(numEntries, currentBattles, battlesArr) {
    let margin = 25; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentBattles - battlesArr[i];
        if (Math.abs(diff - 25) <= margin) {
            margin = Math.abs(diff - 25);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent1000;