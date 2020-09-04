function recentsession(numEntries, currentBattles, battlesArr) {
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentBattles - battlesArr[i];
        if (diff > 0) {
            return i;
        }
        
    }
}

module.exports = recentsession;