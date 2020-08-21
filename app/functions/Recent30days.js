function recent30days(numEntries, currentTime, timeArr) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        if (currentTime - timeArr[i] < 47520) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //30 days is is 43200 minutes long
    let margin = 43200; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentTime - timeArr[i];
        if (Math.abs(diff - 43200) < margin) {
            margin = Math.abs(diff - 43200);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent30days;