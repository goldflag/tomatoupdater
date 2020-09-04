function recent60days(numEntries, currentTime, timeArr) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        if (currentTime - timeArr[i] < 93600) {
        // if (currentTime - timeArr[i] < 47520) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //60 days is is 86400 minutes long
    let margin = 86400; 
    let properIndex = 0;
    for (let i = numEntries - 1; i >= 0; --i) {
        let diff = currentTime - timeArr[i];
        if (Math.abs(diff - 86400) < margin) {
            margin = Math.abs(diff - 86400);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent60days;