var pageScreenX = 0;
var pageScreenY = 0;

var pageIndex = 0;
var isloading = false
var symbols = [];
var symbolsType = 0;

var crossEnable = false;
var chartWidth = 393;
var chartHeightA = 450 / 3.0;
var chartHeightB = 450 / 3.0;

var curSymbol = '';
var curPrice = 0.0;

var clickCount = 0;
var seriesType = 0 //forex:0, futures:1, stock:2
var LOG_OUTPUT = false

let timeframeEle =null;
var subChartData = { chart1: null, chart2: null };

$(function () {
    debug('width' + screen.width + ',' + screen.height);
    if (screen.width > 500) {
        chartWidth = screen.width * 0.35;
    } else {
        chartWidth = screen.width * 0.98;
    }
    chartHeightA = screen.height * 0.48;
    chartHeightB = screen.height * 0.26;
    $(".chart-body").css("width", chartWidth);

    init_touch();
    init_options();
    init_fav_list();
    reload_symbols();
});


function init_touch() {
    $(document).keydown(function (e) {
        var code = e.which;
        switch (code) {
            case 38:
                break;
            case 40:
                break;
            case 37:
                pre_symbol();
                break;
            case 39:
                next_symbol();
                break;
            default:
                return;
        }
    });
    $(".chart-container").touchInit({ preventDefault: false });
    $(".chart-container").on("touch_start", handler);
    $(".chart-container").on("touch_move", handler);
    $(".chart-container").on("touch_end", handler);
}

function handler(e) {
    if (e.originalType == 'touchstart') {
        pageScreenX = e.pageX;
        pageScreenY = e.pageY;
    } else if (e.originalType == 'touchend') {
        if (e.pageY - pageScreenY > 150 && (pageScreenX - e.pageX) < 50) {
            pre_symbol();
        } else if (pageScreenY - e.pageY > 150 && (pageScreenX - e.pageX) < 50) {
            next_symbol();
        }
    }
}

function init_options() {
    let curTimes = getTimeFrame();
    timeframeEle = $("#timeframe");
    timeframeEle.text(curTimes);

    let switchEle = $("#switch");
    switchEle.click(e => {
        swtichSubChart();
        set_load_result();
    });
}

function init_fav_list() {
    let symbolEle = $("#symbol");
    symbolEle.click(e => {
        let symbol = symbolEle.text();
        if (isFav(symbol)) {
            removeFav(symbol);
        } else {
            addFav(symbol);
        }
        show_fav_list();
    });
    show_fav_list();
}

function show_fav_list() {
    let favListEle = $('#fav_list');
    favListEle.empty();

    let favEle;
    for (let index in favList) {
        favEle = document.createElement('div');
        favEle.setAttribute('class', 'fav_item');
        favEle.innerHTML = favList[index];
        favEle.setAttribute("id", 'favEle_' + index);
        favListEle.append(favEle);

        $('#favEle_' + index).click(e => {
            let symbol = $('#favEle_' + index).text();
            pageIndex = getPageIndex(symbols, symbol);
            load_chart_item(symbol);
        });
    }
}

function reload_symbols() {
    let url = 'https://api.winfirm.com.cn/datas/symbols';
    $.ajax({
        type: 'GET',
        url: url,
        data: '',
        traditional: true,
        success: function (result) {
            let obj = eval(result);
            symbols = obj.forex;
            seriesType = 0;
            init_charts(symbols);
        }
    });
}

function init_charts(symbols) {
    debug('show_charts');
    let lastSymbol = getLastSymbol();
    if (lastSymbol) {
        pageIndex = getPageIndex(symbols, lastSymbol);
        load_chart_item(lastSymbol);
    } else {
        pageIndex = 0;
        load_chart_item(symbols[pageIndex]);
    }
}

var result = {};

function load_chart_item(symbol) {
    if (isloading) {
        return;
    }
    saveLastSymbol(symbol);

    isloading = true;
    let url = 'https://api.winfirm.com.cn/datas/klines/' + symbol.replace("#","%23");
    $.ajax({
        type: 'get',
        url: url,
        data: '',
        traditional: true,
        success: function (json) {
            isloading = false;
            result = eval(json);;
            set_load_result();
        }
    });
}

function set_load_result() {
    let datas1;
    if (getTimeFrame() == 'D1') {
        datas1 = result.D1;
    } else {
        datas1 = result.M5;
    }

    let symbol = getLastSymbol();
    updateSymbol(symbol);
    
    show_candle_chart('chart1', symbol, result.digits, result.point, datas1);
    if (getSubChart() == 'kline') {
        show_candle_chart('chart2', symbol, result.digits, result.point, datas1);
    } else {
        show_fenshi_chart('chart2', symbol, result.digits, result.point, result.datas3);
    }
}

function show_candle_chart(chartid, symbol, digits, point, datas) {
    reset_element(chartid);

    let barspacing = 3.75;//(chartid == 'chart1' ? 4.5 : 3.5);
    let rightspace = 5;
    let cHeight = (chartid == 'chart1') ? chartHeightA : chartHeightB;
    let chart = LightweightCharts.createChart(document.getElementById(chartid), getconfig(chartWidth, cHeight, barspacing, rightspace));

    if (chartid == 'chart1') {
        subChartData.chart1 = chart;
        let candleSeries = chart.addCandlestickSeries({
            upColor: '#ef5350', downColor: '#26a69a', borderUpColor: '#ef5350',
            borderVisible: false, wickUpColor: '#ef5350', borderDownColor: '#26a69a',
            wickDownColor: '#26a69a',
            priceFormat: {
                type: 'price',
                precision: digits,
                minMove: point,
            }
        });
        candleSeries.priceScale().applyOptions({
            autoScale: true,
            scaleMargins: {
                top: 0.05,
                bottom: 0.10,
            }
        });
        candleSeries.setData(datas.datas);
        showDatasMa(datas.mas, chart, ['#0000ff', '#0000ff', '#0000ff','#0000ff','#0000ff','#0000ff'], null);

        chart.subscribeCrosshairMove(crossMoveEvent(symbol, digits, candleSeries));
        chart.subscribeClick(clickEvent());

        chart.timeScale().subscribeVisibleLogicalRangeChange(sizeChangEvent(1))
    } else {
        subChartData.chart2 = chart;
        if(!datas.macds){
        	return
        }
        let macd = datas.macds[0];
        let signal = datas.macds[1];
        let histogram = datas.macds[2];
        if(!macd || !signal || !histogram){
        	return;
        }
        let histogramSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceLineVisible: false,
            priceFormat: {
                type: 'price',
                precision: 6
            }
        });

        histogramSeries.setData(histogram);
        let priceconfig = {
            autoScale: true,
            scaleMargins: {
                top: .10,
                bottom: 0.10,
            },
        }
        showDatasMa([macd, signal], chart, ['#ffffff', '#009900'], priceconfig);
        chart.timeScale().subscribeVisibleLogicalRangeChange(sizeChangEvent(2))
    }

    //chart.timeScale().fitContent();
}

function show_fenshi_chart(chartid, symbol, digits, point, datas) {
    reset_element(chartid);

    let rightspace = 288 - datas.datas.length;
    let cHeight = chartHeightB;
    let chart = LightweightCharts.createChart(document.getElementById(chartid), getconfig(chartWidth, cHeight, 6, rightspace));

    let lineSeries = chart.addLineSeries({
        lineWidth: 0.5,
        color: '#ffffff',
        priceFormat: {
            type: 'price',
            precision: digits,
            minMove: point
        }
    });

    lineSeries.priceScale().applyOptions({
        autoScale: true,
        scaleMargins: {
            top: 0.01,
            bottom: 0.02,
        },
    });
    lineSeries.setData(datas.datas);
    showDatasMa(datas.mas, chart, ['#99ffff', '#ff0000', '#0099cc'], null);

    chart.subscribeCrosshairMove(crossMoveEvent(symbol, digits, lineSeries));
    chart.timeScale().fitContent();
}

function showDatasMa(datasma, chart, colors, priceconfig) {
    let lineSeries;
    for (let i = 0; i < datasma.length; i++) {
        lineSeries = chart.addLineSeries({
            color: colors[i],
            lineWidth: 0.5,
            priceLineVisible: false,
            lineStyle: 0,
            priceFormat: {
                type: 'price',
                precision: 6
            }
        });
        priceconfig && lineSeries.priceScale().applyOptions(priceconfig);
        lineSeries.setData(datasma[i]);
    }
}

function sizeChangEvent(fromChart) {
    let fun = (newVisibleLogicalRange) => {
        if (fromChart == 1) {
            subChartData.chart2.timeScale().setVisibleLogicalRange(newVisibleLogicalRange);
        } else {
            subChartData.chart1.timeScale().setVisibleLogicalRange(newVisibleLogicalRange);
        }
    }
    return fun;
}

function crossMoveEvent(symbol, digits, series) {
    let fun = param => {
        if (!param.point) {
            return;
        }
        const y = param.point.y;
        let price = series.coordinateToPrice(y);
        updateSymbol(symbol);
        updatePrice(price.toFixed(digits));
    }
    return fun;
}

function clickEvent() {
    let fun = param => {
        let curTimes = switchTimeFrame();
        timeframeEle&&timeframeEle.text(curTimes);
        set_load_result();
    }
    return fun;
}

function getconfig(width, height, barSpacing, rightOffset) {
    return {
        width,
        height,
        localization: {
            locale: 'en-US',
            dateFormat: 'yyyy/MM/dd',
            timeFormatter: businessDayOrTimestamp => {
                if (LightweightCharts.isUTCTimestamp(businessDayOrTimestamp)) {
                    return timestampToString(businessDayOrTimestamp);
                } else {
                    return businessDayOrTimestamp;
                }
            }
        },

        rightPriceScale: {
            visible: false,
        },

        timeScale: {
            rightOffset,
            barSpacing,
            rightBarStaysOnScroll: true,
            fixLeftEdge: false,
            alignLabels: false,
            borderVisible: false,
            tickMarkFormatter: (time, tickMarkType, locale) => {
                if (LightweightCharts.isUTCTimestamp(time)) {
                    return timestampToString(time);
                } else {
                    return time;
                }
            },
        },
        layout: {
            textColor: 'rgba(220 , 220 , 255, 0.5)',
            background: { type: 'solid', color: 'black' }
        },
        grid: {
            vertLines: {
                color: 'rgba(105 , 105 , 105 , 0.2)',
            },
            horzLines: {
                color: 'rgba(105  , 105  , 105  , 0.2)',
            }
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
        }
    };
}

function reset_element(id) {
    let doc = document.getElementById(id)
    let child = doc.childNodes[0];
    if (child) {
        doc.removeChild(child)
    }
}

function updateSymbol(symbol) {
    curSymbol = symbol;
    $("#symbol").text(symbol);
}

function updatePrice(price) {
    curPrice = price;
    if (curPrice) {
        $("#price").text(price);
    }
}

function next_symbol() {
    if (isloading) {
        return;
    }

    curPrice = 0.0;
    $("#info").text("");

    let len = symbols.length
    if (pageIndex < (len - 1)) {
        pageIndex++;
    } else {
        pageIndex = 0;
    }
    symbol = symbols[pageIndex];
    load_chart_item(symbol);
}

function pre_symbol() {
    if (isloading) {
        return;
    }

    curPrice = 0.0;
    $("#info").text("");

    let len = symbols.length
    if (pageIndex > 0) {
        pageIndex--;
    } else {
        pageIndex = len - 1
    }
    symbol = symbols[pageIndex];
    load_chart_item(symbol);
}

function debug(logString) {
    if (!LOG_OUTPUT) {
        return;
    }

    console.log(logString);
}

function getPageIndex(symbols, symbol) {
    if (symbols) {
        return symbols.indexOf(symbol);
    }
    return 0;
}

function timestampToString(timestamp) {
    const date = new Date(timestamp * 1000);
    const Y = date.getFullYear() + '-';
    const M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
    const D = date.getDate() + ' ';
    const h = date.getHours() + ':';
    const m = date.getMinutes()
    return M + D + h + m;
}

function dateToString(date) {
    if (typeof (date) == 'string' || typeof (date) == 'number') {
        return date;
    }
    const Y = date.year + '-';
    const M = date.month < 10 ? '0' + date.month + '-' : date.month + '-';
    const D = date.day > 10 ? date.day + ' ' : '0' + date.day + ' ';
    let ret = Y + M + D;
    return ret;
}

var favList = []

let favlistStr = localStorage.getItem('favlist');
if (favlistStr) {
    favList = JSON.parse(favlistStr);
}

function isFav(symbol) {
    let item;
    for (let index in favList) {
        item = favList[index];
        if (item == symbol) {
            return true;
        }
    }
    return false;
}

function addFav(symbol) {
    favList.push(symbol);
    updateFavData(favList);
}

function removeFav(symbol) {
    let ret = [];
    let item;
    for (let index in favList) {
        item = favList[index];
        if (!(symbol == item)) {
            ret.push(item);
        }
    }
    favList = ret;
    updateFavData(ret);
}

function updateFavData(data) {
    Promise.resolve().then(function () {
        localStorage.setItem('favlist', JSON.stringify(data));
    });
}

function saveLastSymbol(symbol) {
    localStorage.setItem("last_symbol", symbol);
}

function getLastSymbol() {
    return localStorage.getItem("last_symbol");
}

function getTimeFrame() {
    let times = localStorage.getItem('times');
    if (!times) {
        times = 'D1';
    }
    return times;
}

function switchTimeFrame() {
    let times = getTimeFrame();
    if (times == 'D1') {
        times = 'H4';
    } else if (times == 'H4') {
        times = 'D1';
    } else {
        times = 'D1';
    }
    localStorage.setItem('times', times);
    localStorage.setItem('chart', 'kline');
    return times;
}

function getSubChart() {
    let c = localStorage.getItem('chart');
    if (!c) {
        c = 'kline';
        localStorage.setItem('chart', c);
    }
    return c;
}

function swtichSubChart() {
    let c = getSubChart();
    if (c == 'kline') {
        localStorage.setItem('chart', 'fenshi');
    } else {
        localStorage.setItem('chart', 'kline');
    }
}