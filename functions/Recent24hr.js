function recent24hr(numEntries, currentTime, timeArr) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        if (currentTime - timeArr[i] < 1680) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //a week is 1440 minutes long
    let margin = 80; 
    let properIndex = 0;

    for (let i = numEntries - 1; i >= 0; --i) {
        const diff = currentTime - timeArr[i];
        if (Math.abs(diff - 80) < margin) {
            margin = Math.abs(diff - 80);
            properIndex = i;
        }
    }
    return properIndex;
}

module.exports = recent24hr;