function recent3days(numEntries, currentTime, timeArr) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        //if (currentTime - timeArr[i] < 47520) {
        if (currentTime - timeArr[i] < 4600) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //30 days is is 43200 minutes long
    let margin = 4320; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentTime - timeArr[i];
        if (Math.abs(diff - 4320) < margin) {
            margin = Math.abs(diff - 4320);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent3days;