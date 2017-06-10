/**
 * ExcellentExport.
 * A client side Javascript export to Excel.
 *
 * @author: Jordi Burgos (jordiburgos@gmail.com)
 *
 * Based on:
 * https://gist.github.com/insin/1031969
 * http://jsfiddle.net/insin/cmewv/
 *
 * CSV: http://en.wikipedia.org/wiki/Comma-separated_values
 */

/*
 * Base64 encoder/decoder from: http://jsperf.com/base64-optimized
 */


 var getBase64Image = function (img){
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    // Firefox supports PNG and JPEG. You could check img.src to
    // guess the original format, but be aware the using "image/jpg"
    // will re-encode the image.
    var dataURL = canvas.toDataURL("image/png");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
};


var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
var fromCharCode = String.fromCharCode;
var INVALID_CHARACTER_ERR = ( function() {
        // fabricate a suitable error object
        try {
            document.createElement('$');
        } catch (error) {
            return error;
        }
    }());

// encoder
window.btoa || (window.btoa = function(string) {
    var a, b, b1, b2, b3, b4, c, i = 0, len = string.length, max = Math.max, result = '';

    while (i < len) {
        a = string.charCodeAt(i++) || 0;
        b = string.charCodeAt(i++) || 0;
        c = string.charCodeAt(i++) || 0;

        if (max(a, b, c) > 0xFF) {
            throw INVALID_CHARACTER_ERR;
        }

        b1 = (a >> 2) & 0x3F;
        b2 = ((a & 0x3) << 4) | ((b >> 4) & 0xF);
        b3 = ((b & 0xF) << 2) | ((c >> 6) & 0x3);
        b4 = c & 0x3F;

        if (!b) {
            b3 = b4 = 64;
        } else if (!c) {
            b4 = 64;
        }
        result += characters.charAt(b1) + characters.charAt(b2) + characters.charAt(b3) + characters.charAt(b4);
    }
    return result;
});

// decoder
window.atob || (window.atob = function(string) {
    string = string.replace(/=+$/, '');
    var a, b, b1, b2, b3, b4, c, i = 0, len = string.length, chars = [];

    if (len % 4 === 1)
        throw INVALID_CHARACTER_ERR;

    while (i < len) {
        b1 = characters.indexOf(string.charAt(i++));
        b2 = characters.indexOf(string.charAt(i++));
        b3 = characters.indexOf(string.charAt(i++));
        b4 = characters.indexOf(string.charAt(i++));

        a = ((b1 & 0x3F) << 2) | ((b2 >> 4) & 0x3);
        b = ((b2 & 0xF) << 4) | ((b3 >> 2) & 0xF);
        c = ((b3 & 0x3) << 6) | (b4 & 0x3F);

        chars.push(fromCharCode(a));
        b && chars.push(fromCharCode(b));
        c && chars.push(fromCharCode(c));
    }
    return chars.join('');
});

var prepareCommonVar = '';
var trhiddenCommonVar = '';
var trvisibleCommonVar = '';
var prepareTableBefore = function(){
    trvisibleCommonVar = $('#main-table tbody tr:visible');
    trhiddenCommonVar = $('#main-table tbody tr:not(:visible)');
    prepareCommonVar = $('thead tr.filters-line').is(':visible');
    if ($('body').hasClass('bulk-action-export-selected'))
    {
        $('#main-table tbody tr:not(.active-line-cb)').hide();
    }
    if (prepareCommonVar)
        $('thead tr.filters-line').hide();
};
var prepareTableAfter = function(){
    trvisibleCommonVar.show();
    trhiddenCommonVar.hide();
    if (prepareCommonVar)
        $('thead tr.filters-line').show();
};


ExcellentExport = (function() {
    var version = "1.3";
    var uri = {excel: 'data:application/vnd.ms-excel;base64,', csv: 'data:application/csv;base64,'};
    var template = {excel: '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'};
    var base64 = function(s) {
        return window.btoa(unescape(encodeURIComponent(s)));
    };
    var format = function(s, c) {
        return s.replace(/{(\w+)}/g, function(m, p) {
            return c[p];
        });
    };

    var get = function(element) {
        if (!element.nodeType) {
            return document.getElementById(element);
        }
        return element;
    };

    var fixCSVField = function(value) {
        var fixedValue = value;
        var addQuotes = (value.indexOf(',') !== -1) || (value.indexOf('\r') !== -1) || (value.indexOf('\n') !== -1);
        var replaceDoubleQuotes = (value.indexOf('"') !== -1);

        if (replaceDoubleQuotes) {
            fixedValue = fixedValue.replace(/"/g, '""');
        }
        if (addQuotes || replaceDoubleQuotes) {
            fixedValue = '"' + fixedValue + '"';
        }
        return fixedValue;
    };

    var tableToCSV = function(table) {


        var data = "";
        for (var i = 0, row; row = table.rows[i]; i++) {
            if ($(row).is(':visible'))
            {
                for (var j = 0, col; col = row.cells[j]; j++) {
                    if ($(col).is(":visible") || $(col).hasClass("tbl-Actions"))
                    {
                        var tempCol = '<div>'+col.innerHTML+'</div>';

                        if ($(col).find('.extra-info-column').length > 0)
                            tempCol = '<div>'+$(tempCol).clone().children().remove().end().text()+'</div>';

                        if ($(col).find('.smallText').length > 0)
                            tempCol = $(col).find('.fullText').html();

                        if ($(col).hasClass('tbl-Actions'))
                        {
                            if ($.trim($(col).text()) == '')
                                tempCol = $(row).find('.tbl-DetailPageURL').text();
                            else
                                tempCol = 'Link';
                        }

                        
                        data = data + (j ? ',' : '') + fixCSVField(strip_tags(tempCol, ''));
                    }
                }
                data = data + "\r\n";

            }
        }


        return data;
    };


//
    var strip_tags = function (input, allowed) {
        allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
        var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
            commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
        return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
            return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
        });
    };
//


    var ee = {
        /** @expose */
        excel: function(anchor, table, name) {

            prepareTableBefore();


            table = get(table);

            var tempTable = $(table);
            var tempTableHTML = '';
            tempTable.find('tr:visible').each(function(){
                tempTableHTML = tempTableHTML+'<tr>';

                $(this).find('td:visible,td.tbl-Actions,th:visible,th.tbl-Actions').each(function(){
/* fix to export images, in progress
                    if ($(this).hasClass('tbl-Image')) 
                    {
                        var img = $(this).find('img');
                        if (img.length > 0) 
                        {
                            if (img && img.attr('src') != '') {
                                var newimg = getBase64Image(img[0]);

                                img.attr('src', 'data:image/jpeg;base64,'+newimg);
                            }   
                        }
                    }
*/
                    var tempCol = $(this).html();

                    if ($(this).find('.smallText').length > 0)
                    {
                        tempCol = '';
                        var href = $(this).find('.fullText').closest('a').attr('href');
                        if (href)
                            tempCol = '<a href="'+href+'">';

                        tempCol = tempCol+$(this).find('.fullText')[0].outerHTML;

                        if (href)
                            tempCol = tempCol+'</a>';
                    }

                  

                    if ($(this).hasClass('tbl-Actions'))
                    {
                        if ($.trim($(tempCol).text()) == '')
                            tempCol = '<a href="'+$(this).closest('tr').find('.tbl-DetailPageURL').text()+'">'+$(this).closest('tr').find('.tbl-DetailPageURL').text()+'</a>';
                        else
                            tempCol = 'Link';
                    }
                    tempCol = tempCol.replace(/<img/g, '<span');
                    
                    /*
                    fix to export images, in progress
                    if ($(this).hasClass('tbl-Image')) {
                        tempCol = tempCol.replace(/<span/g, '<img');
                    }
                    */

                    tempTableHTML = tempTableHTML+'<td>'+tempCol+'</td>'
                });

                tempTableHTML = tempTableHTML+'</tr>';
            });
            tempTableHTML = '<table>'+tempTableHTML+'</table>';
            //table.innerHTML


            var ctx = {worksheet: name || 'Worksheet', table: strip_tags(tempTableHTML, '<th><td><tr><table><tbody><thead><a><b><img>')};
            var hrefvalue = uri.excel + base64(format(template.excel, ctx));

            csvData = new Blob([format(template.excel, ctx)], { type: 'application/vnd.ms-excel' }); //new way
            hrefvalue = URL.createObjectURL(csvData);



            anchor.href = hrefvalue;



            prepareTableAfter();

            return true;
        },
        /** @expose */
        csv: function(anchor, table) {
            prepareTableBefore();

            
            table = get(table);
            var csvData = tableToCSV(table);

            var hrefvalue = uri.csv + base64(csvData);
            anchor.href = hrefvalue;

            prepareTableAfter();

            return true;
        }
    };

    return ee;
}());
