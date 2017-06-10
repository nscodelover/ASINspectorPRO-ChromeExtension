var fbafeescalculated = false;
var messageShouldBeHidden = false;
try {
    var country = location.href.split('country=');
    country = country[1];
    if (country.length > 10) {
        country = country.split('&');
        country = country[0];
    }
} catch (err) {
    country = 'com';
}

if (country == 'uk') {
    country = 'co.uk';
}
if (!country) {
    country = 'com';
}

function startProcessingArray(newData) {

    // default qty
    for (var d=0; d<newData.length; d++) {
        if (newData[d][0] == 'UPC' || newData[d][0] == 'ASIN' || newData[d][0] == 'EAN') {
            newData[d][newData[d].length+1] = 'ORIGINAL QTY';
        }
    }

    console.log(newData);

    var allgood = false;
    if (newData[0][0] == 'UPC' || newData[0][0] == 'ASIN' || newData[0][0] == 'EAN') {
        if (newData[0][1] == 'ORIGINAL QTY') {
            if (newData[0][2] == 'ITEM DESCRIPTION') {
                allgood = true;
            }
        }
    }

    if (!allgood) {
        /**/
        var starterLine = -1;
        var columnUPC = -1;
        var columnASIN = -1;
        var columnQTY = -1;
        var columnDESC = -1;
        for (var line = 0; line < newData.length; line++) {
            for (var column = 0; column < newData[line].length; column++) {
                if (newData[line][column] == 'UPC' || newData[line][column] == 'EAN') {
                    starterLine = line;
                    columnUPC = column;
                }
                if (newData[line][column] == 'ASIN') {
                    starterLine = line;
                    columnASIN = column;
                }
                if (newData[line][column] == 'ORIGINAL QTY' && columnQTY == -1) {
                    starterLine = line;
                    columnQTY = column;
                }
                if (newData[line][column] == 'ITEM DESCRIPTION') {
                    starterLine = line;
                    columnDESC = column;
                }
            }
        }
        var tempNewData = [];
        for (var line = starterLine; line < newData.length; line++) {
            var currentLine = tempNewData.length;

            tempNewData[currentLine] = [];
            if (columnUPC >= 0) {
                tempNewData[currentLine][0] = newData[line][columnUPC];
            }
            if (columnASIN >= 0) {
                tempNewData[currentLine][0] = newData[line][columnASIN];
            }

            // default qty to 1
            if (newData[line][columnQTY]) {
                tempNewData[currentLine][1] = newData[line][columnQTY];
            } else {
                tempNewData[currentLine][1] = 1;
            }

            tempNewData[currentLine][2] = newData[line][columnDESC];
        }
        newData = tempNewData; //reformat xls
        /**/

        if (newData[0][0] == 'UPC' || newData[0][0] == 'ASIN' || newData[0][0] == 'EAN') {
            if (newData[0][1] == 'ORIGINAL QTY') {
                if (newData[0][2] == 'ITEM DESCRIPTION') {
                    allgood = true;
                }
            }
        }


        if (!allgood) {
            alert('The file you uploaded does not have the required headers: "UPC" or "EAN" or "ASIN", "ORIGINAL QTY", "ITEM DESCRIPTION", "ORIGINAL COST"');
            return;
        }
    }

    Array.prototype.remove = function(from, to) {
      var rest = this.slice((to || from) + 1 || this.length);
      this.length = from < 0 ? this.length + from : from;
      return this.push.apply(this, rest);
    };
    for (var line = 0; line < newData.length; line++) {
        newData[line].remove(5, newData[line].length);
    }

    for (var line = 0; line < newData.length; line++) {
        if ($.trim(newData[line][0]) == '') {
            newData.remove(line, newData.length);
            break;
        }
    }



    //break files into

    if (newData.length > 501) {
        if (!messageShouldBeHidden)
            alert('Your file has too many products, we will break it into smaller files');

        var indexToSplit = 501;
        var first = newData.slice(0, indexToSplit);
        var second = newData.slice(indexToSplit + 1);

        newData = first;

        //add header back to second part array
        second.unshift(newData[0]);

        var openInNewWindow = window.btoa(JSON.stringify(second));
        var newWindowUrl = windowHref+'&newpagedata='+openInNewWindow;
        window.open(newWindowUrl);
    }

    //break files into





    $('.helper').hide();
    $('#click-bulk-upc-file').hide();
    $('.wholesale-information-table').hide();
    addLoaderToColumn('.main-loading');

    $('.main-loading img').after('<div><i class="secondsleft" rel="'+(newData.length*2)+'">This should take '+(newData.length*2)+' seconds</i></div>');


    var interval = setInterval(function(){
        if ($('.secondsleft:visible').length) {
            var left = parseInt($('.secondsleft:visible').attr('rel'));
            left = left-1;
            $('.secondsleft:visible').attr('rel', left);
            $('.secondsleft:visible').text('This should take '+left+' seconds');

            if (left < 0) {
                if (left % 2 == 0) {
                    $('.secondsleft:visible').text('Just a bit longer..');
                } else {
                    $('.secondsleft:visible').text('Just a bit longer...');
                }
            }
        } else {
            clearInterval(interval);
        }
    }, 1500);



var interval1 = null;
var tempuniquekey = Math.random();
    $.post('http://asinspector.com/wholesale/wholesale_ajax.php?tempkey='+tempuniquekey+'&country='+country, {'data': JSON.stringify(newData)}, function(data){});
    // $.post('http://localhost:8888/upwork/247labs/asinspector/asinspector/backend_code/wholesale/wholesale_ajax.php?tempkey='+tempuniquekey+'&country='+country, {'data': JSON.stringify(newData)}, function(data){});

    interval1 = setInterval(function(){
        $.post('http://asinspector.com/wholesale/wholesale_ajax_get.php?tempkey='+tempuniquekey+'&country='+country, {}, function(data){
        // $.post('http://localhost:8888/upwork/247labs/asinspector/asinspector/backend_code/wholesale/wholesale.php?country='+country, {'data': JSON.stringify(newData)}, function(data){
            if (data) {
                dataws = data;

                dataws[0]['fees'] = 'FBA FEES';


                while ((!dataws[index]['H'] || !dataws[index]['E']) && (dataws[index+1]) ) {
                    index++;
                }


                getNETPayout(data[index]['H'], data[index]['E'], data[index]['D'], 'table', '.test', callbackf);
                getPrimePrice(country, index);
                clearInterval(interval1);
            }
        }, "json");
    }, 20000);

}



var windowHref = window.location.href;
var dataForSecondPage = [];
if (windowHref.indexOf('&newpagedata=') > 0) {
    windowHref = windowHref.split('&newpagedata=');
    var dataForSecondPage = windowHref[1];
    windowHref = windowHref[0];
    messageShouldBeHidden = true;

    dataForSecondPage = JSON.parse(window.atob(dataForSecondPage));
    $(document).ready(function(){
        startProcessingArray(dataForSecondPage);
    });
}


var dataws = [];
var index = 1;

function getPrimePrice(country, index) {
    var biggestprice = 0.00;
    var lowestprice = 99999999999.99;

    if (dataws[index]['H']) {
        $.get('http://www.amazon.'+country+'/gp/offer-listing/'+dataws[index]['H']+'/ref=olp_f_primeEligible?ie=UTF8&f_new=true&f_primeEligible=true', function(data) {
            data = $(data);
            var total = 0.00;
            var cnt = 0.00;
            data.find('.olpOffer .olpOfferPrice').each(function(){
                var tempprice = $(this).text();
                getMoneySymbol(tempprice);
                tempprice = parseFloat(getPureNumber(tempprice));
                if (tempprice > biggestprice)
                    biggestprice = tempprice;
                if (tempprice < lowestprice)
                    lowestprice = tempprice;

                total = total + tempprice;
                cnt++;
            });
            var resulttotal = total/cnt;
            if (resulttotal)
                dataws[index]['J'] = resulttotal;

            if (lowestprice && lowestprice!=99999999999.99)
                dataws[index]['K'] = lowestprice;
            if (biggestprice)
                dataws[index]['L'] = biggestprice;

        }).always(function(){
            if (index == (dataws.length-1)) {
                doFinalCalculation();
            }
        });
    }
}

function doFinalCalculation() {
    if (fbafeescalculated) {
        var productsonfile = dataws.length-1;
        var productsnotonamazon = 0;
        var fbafees = 0.00;
        var estimatedrevenue = 0.00;
        var profitamazon = 0.00;

        var quantityonamazon = 0;
        var quantitynotonamazon = 0;

        for (var j=1; j <=productsonfile; j++) {
            var quantity = 0;
            var isOnAmazon = true;

            try {
                if (!isset(dataws[j]['H'])) {
                    productsnotonamazon++;
                    isOnAmazon = false;
                } else {
                    if (!isset(dataws[j]['E']) && !isset(dataws[j]['I']) && !isset(dataws[j]['J'])) {
                        productsnotonamazon++;
                        isOnAmazon = false;
                    }
                }
            } catch(err) {
                console.log('Number of products not on amazon: '+err);
            }

            try {
                if (isset(dataws[j]['B'])) {
                    quantity = dataws[j]['B'];
                    if (!isOnAmazon) {
                        quantitynotonamazon = quantitynotonamazon+quantity;
                    } else {
                        quantityonamazon = quantityonamazon+quantity;
                    }
                }
            } catch(err) {
                console.log('Quantity of one product: '+err);
            }

            try {
                if (isset(dataws[j]['fees'])) {
                    var localfees = getPureNumber(dataws[j]['fees']);
                    localfees = parseFloat(localfees);
                    if (IsNumeric(localfees)) {
                        fbafees = fbafees + (quantity * localfees);
                    }
                }
            } catch(err) {
                console.log('FBA fees: '+err);
            }

    //price start
            var pricebase = 0.0001;
            try {
                if (isset(dataws[j]['K'])) {
                    if (IsNumeric(dataws[j]['K'])) {
                        pricebase = dataws[j]['K'];
                    }
                }
            } catch(err) {
                console.log('Lowest Prime Price (avg): '+err);
            }
            try {
                if (isset(dataws[j]['E'])) {
                    if (IsNumeric(dataws[j]['E'])) {
                        pricebase = dataws[j]['E'];
                    }
                }
            } catch(err) {
                console.log('Price (lowest): '+err);
            }
            try {
                if (isset(dataws[j]['I'])) {
                    if (IsNumeric(dataws[j]['I'])) {
                        pricebase = dataws[j]['I'];
                    }
                }
            } catch(err) {
                console.log('Price (BB): '+err);
            }
            try {
                if (isset(dataws[j]['J'])) {
                    if (IsNumeric(dataws[j]['J'])) {
                        pricebase = dataws[j]['J'];
                    }
                }
            } catch(err) {
                console.log('Price (avg): '+err);
            }
            try {
                if (isset(dataws[j]['L'])) {
                    if (IsNumeric(dataws[j]['L'])) {
                        pricebase = dataws[j]['L'];
                    }
                }
            } catch(err) {
                console.log('Biggest Prime Price (avg): '+err);
            }

            try {
                estimatedrevenue = estimatedrevenue + (pricebase * quantity);
            } catch(err) {
                console.log('Estimated Revenue: '+err);
            }
    //price end





        }

        try {
            profitamazon = estimatedrevenue-fbafees;
        } catch(err) {
            console.log('Profit on Amazon: '+err);
        }

        var productsonamazon = productsonfile-productsnotonamazon;
        var profitoutofamazon = (estimatedrevenue*quantitynotonamazon)/quantityonamazon;

        var totalprofit = profitamazon+profitoutofamazon;


    console.log('Products on file '+productsonfile);
    console.log('Products not on file '+productsnotonamazon);
    console.log('Estimated Revenue '+estimatedrevenue);
    console.log('FBA fees '+fbafees);
    console.log('Profit on Amazon '+profitamazon);
    console.log('Profit not on Amazon '+profitoutofamazon);
    console.log('Total profit '+totalprofit);



        $('.xls-products-on-file').text(productsonfile);
        $('.xls-products-on-amazon').text(productsonfile-productsnotonamazon);

        if ((productsonfile-productsnotonamazon) <= 0) {
            $('.result table').hide();
        }

        $('.xls-estimated-revenue').text(estimatedrevenue.format(2));
        $('.xls-amazon-fba-fees').text(fbafees.format(2));
        $('.xls-profit-products-amazon-revenue').text(profitamazon.format(2));
        $('.xls-total-profit-out-amazon').text(profitoutofamazon.format(2));

        if ($('.extra-cost').val()) {
            $('.xls-total-extra-costs').text(parseFloat($('.extra-cost').val()).format(2));
            $('.xls-total-extra-costs').closest('tr').show();

            totalprofit = totalprofit - parseFloat($('.extra-cost').val());
        }
        if ($('.lot-cost').val()) {
            $('.xls-total-lost-cost').text(parseFloat($('.lot-cost').val()).format(2));
            $('.xls-total-lost-cost').closest('tr').show();

            totalprofit = totalprofit - parseFloat($('.lot-cost').val());
        }

        $('.xls-total-profit').text(totalprofit.format(2));


        $('.result').show();
        $('.idtype').text(dataws[0]['A']);
        $('.main-loading').hide();

        $('.download-result-file').click(function(){
            JSONToCSVConvertor(dataws, "Wholesale Report", false);
        });
        $('.show-result-file').click(function(){
            console.log(dataws);
            var htmltable = '<table class="inline-result-wholesale">';
            var columns = [];
            var link = [];
            for(var i=0; i<dataws.length; i++) {
                var array = $.map(dataws[i], function(value, index) {
                    return [value];
                });
                htmltable = htmltable+'<tr>';

                for(var j=0; j<array.length; j++) {
                    if (i == 0) {
                        if (array[j] == 0 || array[j] == null || array[j] == 'null') {
                            columns[j] = false;
                        } else {
                            if (array[j] == 'AMAZON LINK') {
                                link[j] = true;
                            }

                            columns[j] = true;
                            htmltable = htmltable+"<th>"+array[j]+"</th>";
                        }
                    } else {
                        if (columns[j]) {
                            if (link[j] && array[j]) {
                                array[j] = '<a target="_blank" href="'+array[j]+'">See on amazon</a>';
                            }

                            htmltable = htmltable+"<td>"+array[j]+"</td>";
                        }
                    }
                }
                htmltable = htmltable+'</tr>';
            }
            var htmltable = htmltable+'</table>';


            $.colorbox({title:'Result', html:htmltable});
            $.colorbox.resize({height:'90%', width:'90%'});

        })
    } else {
        setTimeout(function(){
            doFinalCalculation();
        }, 1000);
    }
}

setInterval(function(){
    if ($('.percentualtotal:visible').text() == '100% ready') {
        fbafeescalculated = true;
        doFinalCalculation();
    }
}, 5000);



function callbackf()
{
    $('.main-loading img+div').remove();
    $('.main-loading img').after('<div><i class="percentualtotal">'+(index*100/(dataws.length-1)).format(0)+'% ready</i></div>');

    var fees = $('.testFBATablefee').text();
    dataws[index]['fees'] = getPureNumber(fees);

    if ((index+1) == (dataws.length)) {
        fbafeescalculated = true;

    } else {

        console.log('asin '+dataws[index]['H']);

        index++;

        while ((!dataws[index]['H'] || !dataws[index]['E']) && dataws[index+1])
        {
            index++;
        }

        if (!dataws[index])
        {
            console.log('final');
            callbackf();
        }
        else
        {
            if (dataws[index]['H'] && dataws[index]['E'])
            {
                getNETPayout(dataws[index]['H'], dataws[index]['E'], dataws[index]['D'], 'table', '.test', callbackf);
                getPrimePrice(country, index);
            }
            else
            {
                $('.testFBATablefee').text(' ');
                callbackf();
            }
        }
    }

}
jQuery(document).ready(function($){
    getNETPayoutToken();
    var xlsInterval = "";
    function readXLSX(e) {

        var file = e.target.files[0];
        if (!file) {
            alert('Please select a XLS/XLSX file');
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {


            var contents = '';
            var workbook = '';
            var first_sheet_name = '';

            try {
                contents = e.target.result;
                workbook = XLSX.read(contents, {type: 'binary'});
                first_sheet_name = workbook.SheetNames[0];

                var wb = workbook.Sheets[first_sheet_name];

                for (var key in wb) {
                    wb[key]['w'] = wb[key]['v'];
                    wb[key].w = wb[key].v;
                }


                data = XLSX.utils.sheet_to_csv(wb);
            } catch (err) {
                alert('File type not supported, convert your file to XLS or XLSX. \n'+ 'The file should have this headers: "UPC" or "EAN" or "ASIN", "ORIGINAL QTY", "ITEM DESCRIPTION", "ORIGINAL COST"');
                return;
            }

            var newData = data.csvToArray({ rSep:'\n' });



            startProcessingArray(newData);

        };
        reader.readAsBinaryString(file);
    }

    //Start with this
    document.getElementById('bulk-upc-file').addEventListener('change', readXLSX, false);
    $('#click-bulk-upc-file').click(function(){
        $('#bulk-upc-file').click();
    });

    $('#go-to-new-version').click(function(){
        window.open(window.location.href.replace('wholesale', 'wholesale2'));
    });



});
