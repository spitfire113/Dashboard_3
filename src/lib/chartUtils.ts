export function generateMonthAxis(dataObjects: { monthStr: string }[], startDate: string, endDate: string) {
    // If "all" time or very broad range, determine bounds dynamically from actual data
    let startY = 2000;
    let startM = 1;
    let endY = 2000;
    let endM = 1;

    if (startDate === '0000-01-01' || !startDate) {
        if (dataObjects.length === 0) return { labels: [], keys: [] };

        let minStr = dataObjects[0].monthStr;
        let maxStr = dataObjects[0].monthStr;
        for (const d of dataObjects) {
            if (d.monthStr < minStr) minStr = d.monthStr;
            if (d.monthStr > maxStr) maxStr = d.monthStr;
        }

        startY = parseInt(minStr.split('-')[0], 10);
        startM = parseInt(minStr.split('-')[1], 10);
        endY = parseInt(maxStr.split('-')[0], 10);
        endM = parseInt(maxStr.split('-')[1], 10);
    } else {
        startY = parseInt(startDate.split('-')[0], 10);
        startM = parseInt(startDate.split('-')[1], 10);
        endY = parseInt(endDate.split('-')[0], 10);
        endM = parseInt(endDate.split('-')[1], 10);
    }

    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    const keys: string[] = [];
    const labels: string[] = [];

    let currY = startY;
    let currM = startM;

    // Safety limit to prevent infinite loops (max 10 years plotted continuously)
    let safety = 0;

    while ((currY < endY || (currY === endY && currM <= endM)) && safety < 120) {
        const key = `${currY}-${String(currM).padStart(2, '0')}`;
        keys.push(key);
        labels.push(`${monthNames[currM - 1]} '${String(currY).slice(2)}`);

        currM++;
        if (currM > 12) {
            currM = 1;
            currY++;
        }
        safety++;
    }

    return { labels, keys };
}
