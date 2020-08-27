function recent500(numEntries, currentBattles, battlesArr) {
    let margin = 100; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentBattles - battlesArr[i];
        if (Math.abs(diff - 100) <= margin) {
            margin = Math.abs(diff - 100);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent500;