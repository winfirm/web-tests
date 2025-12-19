const SYMBOLS = [
    "EURUSD", "USDJPY", "GBPUSD", "AUDUSD",
    "USDCHF", "USDCAD", "GOLD", "USDCNH", "JP225Cash", "US500Cash"
];

const isMobile=()=>{
    if(window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
      return true; 
    }else{
      return false; 
    }
}

const getPSTTime=()=>{
    let d = new Date();
    //https://www.beijing-time.org/EST/
    let ts = d.getTime()-12*60*60*1000;
    d.setTime(ts);

    let tstr = alignTime(d.getHours())+':'+alignTime(d.getMinutes())+":"+alignTime(d.getSeconds());
    return tstr;
}

const alignTime=(num)=>{
    if(num<10){
        return '0'+num;
    }
    return num;
}

const dateToString = (date) => {
    if (typeof (date) == 'string' || typeof (date) == 'number') {
        return date;
    }
    const Y = date.year + '-';
    const M = date.month < 10 ? '0' + date.month + '-' : date.month + '-';
    const D = date.day > 10 ? date.day + ' ' : '0' + date.day + ' ';
    let ret = Y + M + D;
    return ret;
}

const calculateEMA = (datas, count, type) => {
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

const timestampToString=(timestamp)=> {
    const date = new Date((timestamp -12*60*60)* 1000);
    const Y = date.getFullYear() + '-';
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const D = date.getDate() + ' ';
    const h = date.getHours() + ':';
    const m = date.getMinutes()
    return M + D + h + m;
}
