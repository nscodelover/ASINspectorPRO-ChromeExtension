jQuery(document).ready(function($){

    var closeNotFound = function(){
        localStorage['source'+storage] = '';
        localStorage['tab'+storage] = '';
        delete localStorage['source'+storage]
        delete localStorage['tab'+storage];
        // UNCOMMENT
        alert('There are no products on this page matching with products on Amazon.');
        window.close();
    }

    var semantics3 = {
      api: 'http://asinspector.com/semantics/',
      // api: 'http://localhost:8888/upwork/247labs/asinspector/asinspector/backend_code/semantics/',
      query: {
        url: function(url) {
          var data = semantics3.request({url: url}, "query_url.php");
          console.log('SEARCH URL DATA', data);
          if(data && data.results_count > 0) return data.results[0];
          return false;
        },

        search: function(title) {
            var data = semantics3.request({title: title},"query_search.php");

            console.log('SEARCH DATA', data);

            if(data && data.results_count > 0) {
              var hasUpc = data.results.filter(function(product){
                return typeof product.upc !== 'undefined';
              });

              if(hasUpc.length) return hasUpc[0];
              return data.results[0];
            }
            return false;
        },

        searchBySite: function(title) {
            var data = semantics3.request({title: title},"query_search_site.php");
            console.log('SEARCH SITE DATA', data);
            if(data && data.results_count > 0) {
              var hasUpc = data.results.filter(function(product){
                return typeof product.upc !== 'undefined';
              });

              if(hasUpc.length) return hasUpc[0];
              return data.results[0];
            }
            return false;
        },
      },

      request: function(data, path) {
          return $.ajax({
            async: false,
            method: 'GET',
            url: semantics3.api+path,
            dataType: "json",
            data: data,
            success: function(response) {
              if(response.status !== 'error') {
                  return response.results[0];
              }
              return response;
            }
          }).responseJSON;
      }
    };

    var getEbayProducts = function(html){
        storename = 'eBay';
        var ebaySearchString = 'h2[itemprop="gtin13"], .itemAttr table tr td span';

        html = $(html);

        var getEbayUPCCode = function(obj){


            var ret = false;
            obj.each(function(){
                var temp2 = $.trim($(this).text());

                if (temp2 && (temp2.length == 12 || temp2.length == 13) && IsNumeric(temp2))
                {
                    ret = temp2;
                }
            });

            return ret;
        };


        var temp1 = getEbayUPCCode(html.find(ebaySearchString));

        if (temp1)
        {
            $('.main-loader').after('<div class="counter"><b style="display:none;">1</b></div>');
            openAsinspector(temp1+' | ');
            return;
        }


        var ebayproducts = [];

        html.find('a.img.imgWr2').each(function(){
            var add = true;
            for(var x=0; x<ebayproducts.length; x++)
            {
                if (ebayproducts[x] == $(this).attr('href'))
                    add = false;
            }
            if (add && $(this).attr('href'))
                ebayproducts[ebayproducts.length] = $(this).attr('href');
        });



        if (ebayproducts.length == 0)
        {
            closeNotFound();
        }


        $('.main-loader').after('<div class="counter"><b>'+ebayproducts.length+'</b>/<b class="toload">0</b><br /><i class="matches" rel="0"></i><br /></div>');

        var currentProduct = 0;



        var getEbayUPC = function(url){

            $.get(url, function(res){
                res = $(res);

                var upc = getEbayUPCCode(res.find(ebaySearchString));
                if (upc)
                    ebayproducts[currentProduct] = upc;
                else
                    ebayproducts[currentProduct] = '';

                $('.toload').text(currentProduct+1);

                if (upc)
                {
                    var numberofMatches = $('.matches').attr('rel');
                    numberofMatches = parseInt(numberofMatches)+1;
                    $('.matches').attr('rel',numberofMatches).html('We found '+numberofMatches+' <u><b>possible</b></u> match(es)')
                }



                currentProduct++;

                if (ebayproducts[currentProduct])
                    getEbayUPC(ebayproducts[currentProduct]);
                else
                {
                    var searchString = '';
                    for(var x=0; x<ebayproducts.length; x++)
                    {
                        if (ebayproducts[x])
                            searchString = ebayproducts[x] + ' | ' + searchString;
                    }

                    openAsinspector(searchString);
                }
            }).fail(function(){
                getEbayUPC(url);
            });
        };

        getEbayUPC(ebayproducts[currentProduct]);
    };

    var openAsinspector = function(searchString){
        localStorage['source'+storage] = '';
        localStorage['tab'+storage] = '';
        delete localStorage['source'+storage]
        delete localStorage['tab'+storage];

        searchString = searchString.split(' | ');


        getProductsAPI(searchString, 0);

        //storage = setLocalStorage('','http://www.amazon.'+getCountry(activeTab)+'/s/field-keywords='+searchString);
        //location.href = chrome.extension.getURL("html/popup.html")+'?'+storage;
    };

    var finalListOfAsins = [];
    var getProductsAPI = function(prod, pos){
        var IdType = 'UPC';
        var upcsString = '';
        console.log(prod);
        for (p=pos; p<prod.length; p++)
        {
            if (p >= 10+pos)
                break;

            if (activeTab.indexOf('wayfair') != -1)
                if (p >= 1+pos)
                    break;

            if (prod[p] && prod[p] != '' && prod[p] != 'undefined')
            {
                if (prod[p].length == 13)
                    IdType = 'ISBN';

                if (prod[p].length == 13 && activeTab.indexOf('asda.com') != -1)
                    IdType = 'EAN';

                if (prod[p].length == 13 && activeTab.indexOf('argos.co.uk') != -1)
                    IdType = 'EAN';

                if (prod[p].length == 13 && activeTab.indexOf('ebay.co.uk') != -1)
                    IdType = 'EAN';

                if (prod[p].length >= 14)
                    IdType = 'string';

                if (activeTab.indexOf('pcworld.co.uk') != -1) {
                    prod[p] = $.trim(prod[p]).substr(0, 35);
                }

                upcsString = upcsString+','+prod[p];
            }
        }

        if (activeTab.indexOf('wayfair') != -1)
            pos = pos+1;
        else
            pos = pos+10;

        console.log(upcsString);

        if (IdType == 'string')
        {
            var url = invokeRequest('ItemSearch&TotalPages=1&VariationPage=1&Keywords='+upcsString.replace(/\s\s+/g, ' ').replace(/'/g, '').replace(/"/g, '')+'&SearchIndex=All', '', 'Small', getCountry(activeTab));
        }
        else
            var url = invokeRequest('ItemLookup&SearchIndex=All&IdType='+IdType,upcsString,'Small', getCountry(activeTab));

        $.get(url, function(data){
            data = $(data);
            if (activeTab.indexOf('wayfair') != -1)
            {
                finalListOfAsins[finalListOfAsins.length] = data.find('Item>ASIN').first().text();
            }
            else
            {
                data.find('Item>ASIN').each(function(){
                    finalListOfAsins[finalListOfAsins.length] = $(this).text();
                });
            }



            if (pos >= prod.length)
            {
                var cntfinalListOfAsins = finalListOfAsins.length;
                if (cntfinalListOfAsins > (prod.length-1))
                    cntfinalListOfAsins = (prod.length-1);

                var myJsonString = JSON.stringify(finalListOfAsins);
                localStorage[finalListOfAsins[0]] = 'http://amazon.'+getCountry(activeTab)+'/';

                var htmlexp = '<div class="results-wait-screen"><h2>Results:</h2>';
                htmlexp = htmlexp + '<ul><li><b>'+$('.counter>b').first().text()+'</b> product(s) identified on '+storename+'</li>';
                htmlexp = htmlexp + '<li><b>'+(prod.length-1)+'</b> had an UPC code (required to try to match on Amazon)</li>';

                htmlexp = htmlexp + '<li>from '+(prod.length-1)+' product(s) with an UPC code, <b>'+((prod.length-1)-cntfinalListOfAsins)+'</b> is(are) not registered on Amazon</li>';

                htmlexp = htmlexp + '<li><span class="bigger-result"><b>'+cntfinalListOfAsins+'</b> had an exact match on Amazon!</span></li></ul>';

                htmlexp = htmlexp + '<center><br /><br /><a href=\''+chrome.extension.getURL("html/popup.html")+'?STORE'+myJsonString+'\'>ASINspector will open in <span class="openin">30</span> seconds (<small>click here to open now</small>)</a></center><br /><br /></div>';

                $('.counter').after(htmlexp).hide();
                $('.main-loader').hide();


                setInterval(function(){
                    var openin = parseInt($('.openin').text());
                    openin--;
                    $('.openin').text(openin)
                }, 1000);

                setTimeout(function(){
                    location.href = chrome.extension.getURL("html/popup.html")+'?STORE'+myJsonString;
                }, 29000);

            }
            else
            {
                getProductsAPI(prod, pos);
            }

        }).fail(function(){
            setTimeout(function(){
                if (activeTab.indexOf('wayfair') != -1)
                    getProductsAPI(prod, pos-1);
                else
                    getProductsAPI(prod, pos-10);
            }, 3000);
        });

    };




    var getWalmartProducts = function(html){
        storename = 'walmart';
        var walmartSearchString = "meta[property='og:upc']";

        var normalhtml = html;
        html = $(html);

        var getWalmartUPCCode = function(code, html, urlProduct){

            var normalcode = code;

            code = code.split('property=og:upc content=');
            // var title = $(normalcode).find('title').html();

            if (code)
                code = code[1];
            if (code)
                code = code.split(' ');
            if (code)
                code = code[0];

            if (!code)
            {
                code = normalcode.split('property="og:upc" content="');

                if (code)
                    code = code[1];
                if (code)
                    code = code.split('"');
                if (code)
                    code = code[0];
            }

            if (code && (code.length == 12 || code.length == 13) && IsNumeric(code))
            {
                return code;
            }

            $(normalcode).find('#specGroup .name.wgrid-2wAny.marg-l-0').each(function(){
                if ($.trim($(this).text()) == 'UPC')
                {
                    var temp9 = $.trim($(this).next().text());
                    if (temp9 && IsNumeric(temp9)){

                        while (temp9.length < 12)
                            temp9 = '0'+temp9;

                        code = temp9;
                    }
                }
            });

            if (code && (code.length == 12 || code.length == 13) && IsNumeric(code))
            {
                return code;
            }


            /*
             * Search products by product page URL
             * using semantics3
             */
            var productByUrl = semantics3.query.url(urlProduct);
            if(productByUrl && productByUrl.upc) {
              return productByUrl.upc;
            }

            /*
             * Search products by it's name
             * using semantics3
             */
            //  var productByTitle = semantics3.query.search('Mainstays Twin Metal Bed, Multiple Colors');
            //  if(productByTitle && productByTitle.upc) {
            //    return productByTitle.upc;
            //  }

             return false;

        };


        var temp1 = getWalmartUPCCode(normalhtml, html);
        if (temp1)
        {
            $('.main-loader').after('<div class="counter"><b style="display:none;">1</b></div>');
            openAsinspector(temp1+' | ');
            return;
        }


        var wmproducts = [];

        html.find('#tile-container').find('div.js-tile').each(function(){
            var id = $(this).attr("data-item-id");

            var url = 'http://www.walmart.'+getCountry(activeTab) + '/ip/' + id;
            wmproducts.push(url);
        });


        if (wmproducts.length == 0)
        {
          console.log(wmproducts.length);
            //closeNotFound();
        }


        $('.main-loader').after('<div class="counter"><b>'+wmproducts.length+'</b>/<b class="toload">0</b><br /><i class="matches" rel="0"></i><br /></div>');

        var currentProduct = 0;



        var getWalmartUPC = function(url){


            $.get(url, function(res){
                var normalres = res;
                res = $(res);


                var upc = getWalmartUPCCode(normalres, "" ,url);
                if (upc)
                    wmproducts[currentProduct] = upc;
                else
                    wmproducts[currentProduct] = '';


                $('.toload').text(currentProduct+1);

                if (upc)
                {
                    var numberofMatches = $('.matches').attr('rel');
                    numberofMatches = parseInt(numberofMatches)+1;
                    $('.matches').attr('rel',numberofMatches).html('We found '+numberofMatches+' <u><b>possible</b></u> match(es)')
                }

                currentProduct++;

                if (wmproducts[currentProduct])
                    getWalmartUPC(wmproducts[currentProduct]);
                else
                {
                    var searchString = '';

                    for(var x=0; x<wmproducts.length; x++)
                    {
                        if (wmproducts[x])
                            searchString = wmproducts[x] + ' | ' + searchString;
                    }


                    openAsinspector(searchString);
                }
            }).fail(function(){
                getWalmartUPC(url);
            });
        };

        getWalmartUPC(wmproducts[currentProduct]);
    };


    var getCountry = function(activeTab){
        var country = activeTab.split('://');
        country = country[1];
        country = country.split('/');
        country = country[0];
        country = country.split('.');
        var startCountry = false;
        var temp = '';
        for(var c=0; c<country.length; c++){
            if (startCountry == true)
            {
                if (temp != '')
                    temp = temp+'.';

                temp = temp+country[c];

            }
            if ((country[c] == 'ebay' || country[c] == 'walmart' || country[c] == 'overstock' || country[c] == 'wayfair' || country[c] == 'kohls' || country[c] == 'target' || country[c] == 'toysrus' || country[c] == 'homedepot' || country[c] == 'asda' || country[c] == 'argos' || country[c] == 'pcworld') && startCountry == false)
            {
                startCountry = true;

                if (country[c] == 'asda') {
                    return 'co.uk';
                }
            }
        }

        return temp;
    };

    var hash = location.href.split('wait.html?');
    var storage = hash[1].split('#');
    storage = storage[0];
    // UNCOMMENT
    var source = localStorage['source'+storage];
    // var source = localStorage.getItem('source');
    var activeTab = localStorage['tab'+storage];
    var storename = '';

    // UNCOMMENT
    if (activeTab.indexOf('ebay') != -1)
        getEbayProducts(source);
    if (activeTab.indexOf('walmart') != -1)
        getWalmartProducts(source);

    // REMOVE
    // getWalmartProducts(source);


    var intervalVar = '';
    var links = [];
    var thirdFoundUPCs = [];
    var numberOfProductsExplored = 0;
    var whereIsUPC = [];
    var isopening = false;
    var getUPCProductPage = function(url, source, productName){
        var localdomain = getDomain(url);

        whereIsUPC['overstock'] = '.toggle-content .table.table-dotted.table-extended tbody tr>td:first-child';
        whereIsUPC['wayfair'] = 'h1.product__nova__title';
        whereIsUPC['kohls'] = 'script';
        whereIsUPC['target'] = 'meta';
        whereIsUPC['toysrus'] = 'p.upc>span.value';
        whereIsUPC['homedepot'] = '.grid_30 upc';
        whereIsUPC['asda'] = 'meta[property="og\:upc"]';
        whereIsUPC['argos'] = '.fullDetails li';
        whereIsUPC['pcworld'] = 'header.productTitle';


        var findUPC = function(source){
            var normalsource = source;
            source = $(cleanHTML(source));

            var el = source.find(whereIsUPC[localdomain]);
            var upc = '';


            if (localdomain == 'overstock')
            {
                el.each(function(){
                    if ($.trim($(this).text()) == 'UPC' || $.trim($(this).text()) == 'ISBN'){
                        upc = $.trim($(this).next().text());
                    }
                })
            }

            if (localdomain == 'wayfair')
            {
                thirdFoundUPCs[thirdFoundUPCs.length] = $.trim(el.text());
                $('.matches').attr('rel',thirdFoundUPCs.length).html('We found '+thirdFoundUPCs.length+' <u><b>possible</b></u> match(es)');
            }


            if (localdomain == 'kohls')
            {
                try {
                    var temp = normalsource.split('"skuUpcCode": "');

                    if (temp && temp[1])
                        temp = temp[1];
                    if (temp)
                        temp = temp.split('"');
                    if (temp && temp[0])
                        upc = temp[0];

                } catch (err) {}
            }

            if (localdomain == 'target' || localdomain == 'asda')
            {
                try {
                    var temp = normalsource.split('property="og:upc" content="');
                    if (temp && temp[1])
                        temp = temp[1];
                    if (temp)
                        temp = temp.split('"');
                    if (temp && temp[0])
                        upc = temp[0];
                } catch (err) {}
            }

            if (localdomain == 'argos') {
                try {
                    el.each(function(){
                        if ($(this).text().indexOf('EAN:') != -1) {
                            var tempupc1 = $(this).text().replace('EAN: ', '');
                            tempupc1 = tempupc1.split('.');
                            tempupc1 = tempupc1[0];
                            upc = tempupc1;
                        }
                    });
                } catch (err) {}
            }



            if (!upc)
                upc = el.text();


            if (localdomain == 'homedepot')
            {
                upc = upc.slice(1, upc.length);
            }

            var productByUrl = semantics3.query.url(url);
            if(productByUrl && productByUrl.upc) {
              upc = productByUrl.upc;
            }


            if(productName && productName.length && !upc){
              var productByTitle = semantics3.query.search(productName.html());
              if((productByTitle && productByTitle.upc)) {
                upc = productByTitle.upc;
              }

              if((productByTitle && productByTitle.ean)) {
                upc = (productByTitle.ean);
              }

              var productByTitleBySite = semantics3.query.searchBySite(productName.html(), localdomain+'.com');
              if(productByTitleBySite && productByTitleBySite.upc) {
                upc = (productByTitleBySite.upc);
              }

              if(productByTitleBySite && productByTitleBySite.ean) {
                upc = (productByTitleBySite.ean);
              }

            }


            if ((upc && IsNumeric(upc)) || (upc && localdomain == 'pcworld'))
            {
                thirdFoundUPCs[thirdFoundUPCs.length] = upc;
                $('.matches').attr('rel',thirdFoundUPCs.length).html('We found '+thirdFoundUPCs.length+' <u><b>possible</b></u> match(es)');
            }

        }

        if (source)
        {
            findUPC(source);
        }
        else
        {
            $.get(url, function(resultdata){
                findUPC(resultdata);
            }).always(function(){
                numberOfProductsExplored++;
                $('.toload').text(numberOfProductsExplored);
            });
        }
    };
    var getThirdStoreProducts = function (url, source){
        var oneProductPage = [];
        var linksForProducts = [];


        oneProductPage['overstock'] = '#mainContent [itemprop="name"]>h1';
        oneProductPage['wayfair'] = '.product__nova__title .title_name';
        oneProductPage['kohls'] = 'h1.title.productTitleName';
        oneProductPage['target'] = '#ProductDetailsTop h2.product-name.item [itemprop=name]';
        oneProductPage['toysrus'] = '#lTitle>h1';
        oneProductPage['homedepot'] = '.product_titleInfo h1.product_title';
        oneProductPage['asda'] = '#contentGCPDP div.product-name';
        oneProductPage['argos'] = '#pdpProduct h1.fn';
        oneProductPage['pcworld'] = '.product-page h1.page-title';

        linksForProducts['overstock'] = '.product-content .pro-thumb';
        linksForProducts['wayfair'] = '.productbox';
        linksForProducts['kohls'] = '.products_grid .prod_img_block a';
        linksForProducts['target'] = '.productClick.productTitle';
        linksForProducts['toysrus'] = '#contentright a.prodtitle';
        linksForProducts['homedepot'] = '#products .item_description';
        linksForProducts['asda'] = '#productListing .listItem .productName a.itemName';
        linksForProducts['argos'] = 'dl.product #optimiseProductURL';
        linksForProducts['pcworld'] = 'article.product .desc a.in';

        var localdomain = getDomain(url);
        var domSource = $(cleanHTML(source));

        //store name for summary screen
        storename = localdomain;


        var productName   = domSource.find(oneProductPage[localdomain]);
        var isProductPage = productName.length;


        if (isProductPage == 1)
        {

            getUPCProductPage(url, source);

            $('.main-loader').after('<div class="counter"><b style="display:none;">1</b></div>');

            if (thirdFoundUPCs[0]) {
                openAsinspector(thirdFoundUPCs[0]+' | ');
            } else {


              var productByUrl = semantics3.query.url(activeTab);
              if(productByUrl && productByUrl.upc) {
                return productByUrl.upc;
              }

              if(productName && productName.length){
                var productByTitle = semantics3.query.search(productName.html());
                if(productByTitle && productByTitle.upc) {
                  openAsinspector(productByTitle.upc+' | ');
                  return;
                }

                if((productByTitle && productByTitle.ean)) {
                  openAsinspector(productByTitle.ean+' | ');
                  return;
                }

                var productByTitleBySite = semantics3.query.searchBySite(productName.html(), localdomain+'.com');
                if(productByTitleBySite && productByTitleBySite.upc) {
                  openAsinspector(productByTitleBySite.upc+' | ');
                  return;
                }

                if(productByTitleBySite && productByTitleBySite.ean) {
                  openAsinspector(productByTitleBySite.ean+' | ');
                  return;
                } else {
                  closeNotFound();
                }
              } else {
                closeNotFound();
              }
            return;
          }
        }
        else
        {

            var el = domSource.find(linksForProducts[localdomain]);

            el.each(function(){
                links[links.length] = $(this).attr('href');

                if (activeTab.indexOf('kohls.com') != -1)
                    links[links.length-1] = 'http://www.kohls.com'+links[links.length-1];

                if (activeTab.indexOf('toysrus.com') != -1)
                    links[links.length-1] = 'http://www.toysrus.com'+links[links.length-1];

                if (activeTab.indexOf('homedepot.com') != -1)
                    links[links.length-1] = 'http://www.homedepot.com'+links[links.length-1];
            });

            if (links.length > 0)
                $('.main-loader').after('<div class="counter"><b>'+links.length+'</b>/<b class="toload">0</b><br /><i class="matches" rel="0"></i><br /></div>');
            else
            {
                closeNotFound();
                return;
            }

            for (var x = 0; x<links.length; x++){
                getUPCProductPage(links[x], null, productName);
            }


            intervalVar = setInterval(function(){
                if (!isopening)
                {
                    if (numberOfProductsExplored >= links.length){
                        isopening = true;
                        clearInterval(intervalVar);

                        thirdFoundUPCs.sort(function(a, b) {
                            return a - b;
                        });
                        console.log(thirdFoundUPCs);
                        var searchString = '';
                        for(var x=0; x<thirdFoundUPCs.length; x++)
                        {
                            if (thirdFoundUPCs[x])
                                searchString = thirdFoundUPCs[x] + ' | ' + searchString;
                        }

                        openAsinspector(searchString);
                    }
                }
            }, 1000);


        }
    };

    if (activeTab.indexOf('overstock.com') != -1 || activeTab.indexOf('wayfair.com') != -1 || activeTab.indexOf('kohls.com') != -1 || activeTab.indexOf('target.com') != -1 || activeTab.indexOf('toysrus.com') != -1 || activeTab.indexOf('homedepot.com') != -1 || activeTab.indexOf('asda.com') != -1 || activeTab.indexOf('argos.co.uk') != -1 || activeTab.indexOf('pcworld.co.uk') != -1)
        getThirdStoreProducts(activeTab, source);

});
