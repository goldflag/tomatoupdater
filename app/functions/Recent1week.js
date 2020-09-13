function recent1week(numEntries, currentTime, timeArr) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        //if (currentTime - timeArr[i] < 47520) {
        if (currentTime - timeArr[i] < 11520) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //30 days is is 43200 minutes long
    let margin = 10080; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentTime - timeArr[i];
        if (Math.abs(diff - 10080) < margin) {
            margin = Math.abs(diff - 10080);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent1week;