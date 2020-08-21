function recent500(numEntries, currentBattles, battlesArr) {
    let margin = 500; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentBattles - battlesArr[i];
        if (Math.abs(diff - 500) <= margin) {
            margin = Math.abs(diff - 500);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent500;