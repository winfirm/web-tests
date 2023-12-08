function calculateDiff(fromDatas, subDatas, factor, histogram) {
    let results = []
    let value = 0.0;
    let item;
    let fromLen = fromDatas.length - subDatas.length;
    for (let i = 0; i < subDatas.length; i++) {
        item = fromDatas[fromLen + i];
        value = (item.value - subDatas[i].value) * factor;
        if (histogram && (value > 0.0)) {
            results.push({ time: item.time, value: value, color: 'red' });
        } else {
            results.push({ time: item.time, value: value });
        }
    }
    return results;
}

function calculateEMA(datas, count, type) {
    const k = 2 / (count + 1);
    let result = [];
    let pema = (type == 0) ? datas[0].close : datas[0].value;
    let value = pema;
    let ema = 0.0;
    for (let i = 0, len = datas.length; i < len; i++) {
        value = (type == 0) ? datas[i].close : datas[i].value;
        ema = value * k + pema * (1 - k)
        pema = ema;
        result.push({ time: dateToString(datas[i].time), value: ema });
    }
    return result;
}

function calculateAvg(datas) {
    let sum = 0.0;
    let item;
    let price=0.0;
    for (let i = 0; i < datas.length; i++) {
        item = datas[i];
        price = item.close?item.close:item.value;
        sum += price;
    }
    return sum / datas.length;
}

function calculateSMA(datas, count) {
    let result = [];
    let value = 0.0;
    for (let i = count - 1, len = datas.length; i < len; i++) {
        value = calculateAvg(datas.slice(i - count + 1, i));
        result.push({ time: datas[i].time, value: value });
    }
    return result;
}