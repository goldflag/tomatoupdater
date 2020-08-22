function recent24hr(numEntries, currentTime, timeArr) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        if (currentTime - timeArr[i] < 1680) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //a day is 1440 minutes long
    let margin = 1440; 
    let properIndex = 0;

    for (let i = numEntries - 1; i >= 0; --i) {
        const diff = currentTime - timeArr[i];
        if (Math.abs(diff - 1440) < margin) {
            margin = Math.abs(diff - 1440);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent24hr;