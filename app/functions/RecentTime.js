function recent24hr(stats, numEntries, currentTime, timeArr, offset) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        if (currentTime - timeArr[i] < offset*1.3) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //a day is 1440 minutes long
    let margin = offset; 
    let properIndex = 0;

    for (let i = numEntries - 1; i >= 0; --i) {
        const diff = currentTime - timeArr[i];
        if (Math.abs(diff - offset) < margin) {
            margin = Math.abs(diff - offset);
            //console.log(i);
            properIndex = i;
        }
    }
    let counter = 0;
    while (Object.keys(stats[properIndex]).length === 0) {
        //console.log(counter);
        counter++;
        properIndex--;
    }
    return properIndex;
}

module.exports = recent24hr;