function recent24hr(stats, numEntries, currentTime, timeArr) {
    let snapShotExists = false;
    for (let i = numEntries - 1; i >= 0; --i) {
        if (currentTime - timeArr[i] < 1680) {
            snapShotExists = true;
        }
    }
    if (!snapShotExists) return 'none';
    //a day is 1440 minutes long
    let margin = 40; 
    let properIndex = 0;

    for (let i = numEntries - 1; i >= 0; --i) {
        const diff = currentTime - timeArr[i];
        if (Math.abs(diff - 40) < margin) {
            margin = Math.abs(diff - 40);
            properIndex = i;
        }
    }
    let counter = 0;
    while (Object.keys(stats[properIndex]).length === 0) {
        console.log(counter);
        counter++;
        properIndex--;
    }
    return properIndex;
}

module.exports = recent24hr;