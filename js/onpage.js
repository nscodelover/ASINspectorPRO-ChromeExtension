var protocol = "http";
jQuery(document).ready(function($) {

  $("#ntp_breakEven").change(function(e) {
    var brc = parseFloat($(this).val());
    var price = parseFloat($("#ntp_price").val());
    var totalf = parseFloat($("#ntp_breakEven").attr("data-total-fees"));

    var intFees = parseFloat(totalf) + parseFloat(brc);
    intFees = parseFloat(intFees.format(2));
    intFees = parseFloat(getPureNumber(price)) - intFees;

    var roi = parseInt(parseFloat(intFees / brc) * 100);
    intFees = intFees.format(2);

    if (intFees < 0) {
      $("#net_payout_id").css("color","red");
    }else{
      $("#net_payout_id").css("color","green");
    }
    $("#net_payout_id").html(intFees + " &nbsp;&nbsp;" + roi + "%");
  });

  $("#ntp_price").change(function(e) {
    var brc = parseFloat($("#ntp_breakEven").val());
    var price = parseFloat($("#ntp_price").val());
    var totalf = parseFloat($("#ntp_breakEven").attr("data-total-fees"));

    var intFees = parseFloat(totalf) + parseFloat(brc);
    intFees = parseFloat(intFees.format(2));
    intFees = parseFloat(getPureNumber(price)) - intFees;

    var roi = parseInt(parseFloat(intFees / brc) * 100);
    intFees = intFees.format(2);

    if (intFees < 0) {
      $("#net_payout_id").css("color","red");
    }else{
      $("#net_payout_id").css("color","green");
    }
    $("#net_payout_id").html(intFees + " &nbsp;&nbsp;" + roi + "%");
  });

  try {
    var localTemp = localStorage['defaultPrice'];
  } catch (err) {
    if ($('.onpage-asinspector').length > 0) {
      var logo = '<h2 class="logo">' + $('.logo').html() + '</h2>';
      logo = logo + '<p>You have a problem in your chrome configuration, to fix it:</p><ul style="margin-left:-20px;"><li>Go to "Chrome\'s Settings"</li><li>Click on "Show advanced settings..."</li><li>Click on "Content settings"</li><li>In "Cookies", set it to "Allow local data to be set (recommended)".</li></ul><br /><br />';

      $('#result-net-payout').html(logo);
    }
  }

  chrome.runtime.sendMessage({
    gethaspopup: "1"
  }, function(response) {
    var country = '';
    var asin = "";
    if (response.hasPopup == "1") {
      if ($('.onpage-asinspector').length > 0) {

        var processEstimatives = function(price, salesRank) {
          $.get(protocol + "://www.amazon." + country + "/gp/customer-reviews/widgets/average-customer-review/popover/ref=dpx_acr_pop_?contextId=dpx&asin=" + asin, function(data) {
            data = $(cleanHTML(data));
            var rating = $.trim(data.find('.a-size-base.a-color-secondary').text()).split(' ');
            rating = rating[0];

            var currency = getMoneySymbol(price);
            price = getPureNumber(price);

            $('.local-SalesRank').text(salesRank);
            $('.price-price').text(price);
            $('.local-Rating').text(rating);

            if (!salesRank) {
              $('.hide-if-no-salesrank').hide();
            } else {
              localStorage["jv_one_page_price"] = price;
              localStorage["jv_one_page_rank"] = salesRank;
              fnCalcuteSalesOnePage();
            }

            setCountry(country);
            //getNETPayout(asin, price, '0.00', 'kind', 'body ', function(){});
            showFBAOnePage(asin, price, '0.00');
          }).fail(function() {
            $('body').remove();
            $(document).remove();
          });
        };

        var temp = window.location.href.split('?');
        temp = temp[1];
        temp = atob(temp);
        temp = temp.split('||');
        asin = temp[0];
        protocol = temp[2];

        country = $.trim(temp[1]);
        setCountry(country);
        getNETPayoutToken();

        var amazonUrl = invokeRequest('ItemLookup', asin, 'Large', country);
        amazonUrl = amazonUrl.replace('http', protocol);

        $.get(amazonUrl, function(data) {

          data = $(data);

          $(data).find('BrowseNode>Name').each(function(){
            cname = $(this).text();
          });

          localStorage["jv_one_page_category"] = cname;

          /*Get Dimensions product*/
          var SmallPackageDimensions = '';
          if (height = $(data).find('PackageDimensions>Height').text()) {
            SmallPackageDimensions = 'H:' + height;
          }

          if (width = $(data).find('PackageDimensions>Width').text()) {
            SmallPackageDimensions += ' W:' + width;
          }

          if (length = $(data).find('PackageDimensions>Length').text()) {
            SmallPackageDimensions += ' L:' + length;
          }

          if (weight = $(data).find('PackageDimensions>Weight').text()) {
            SmallPackageDimensions += ' WE:' + weight;
          }

          var defaultPrice = localStorage['defaultPrice'];
          if (!defaultPrice) {
            defaultPrice = 'LowestNewPrice';
          }

          var salesRank = data.find('SalesRank').first().text();

          var price = 0.00;
          if (localStorage['defaultPrice'] == 'BBPrice') {
            $.get(protocol + '://www.amazon.' + country + '/gp/cart/desktop/ajax-mini-detail.html/ref=added_item_1?ie=UTF8&asin=' + asin, function(res) {

              res = $(res);
              var bbPrice = $.trim(res.find('.a-size-medium.a-color-price.sc-price').text());

              if (!bbPrice) {
                var words = $.trim(res.text()).split(' ');
                bbPrice = words[words.length - 1];
              }

              bbPrice = bbPrice.replace(/[^\d.-]/g, '');

              if (!IsNumeric(bbPrice)) {
                $('body').remove();
                $(document).remove();
              }

              processEstimatives(bbPrice, salesRank);
            });
          } else {
            price = data.find(localStorage['defaultPrice'] + '>FormattedPrice').first().text();
            if (price == 'Too low to display') {
              price = data.find('Offers>Offer>OfferListing>Price>FormattedPrice').first().text();
            }

            processEstimatives(price, salesRank);
          }
        }).fail(function() {
          $('body').remove();
          $(document).remove();
        });
      } else {
        var temp = window.location.href;
        temp = temp.replace(/%/g, '/');

        var asin = temp.match("/([a-zA-Z0-9]{10})(?:[/?]|$)");
        asin = asin[1];
        var country = document.domain.replace('www.amazon.', '').replace('amazon.', '');
        var protocol = window.location.protocol.replace(':', '');

        var hash = btoa(asin + '||' + country + '||' + protocol);
        $('#buybox_feature_div').prepend('<iframe and seamless="seamless" scrolling="no" class="asinspector-iframe a-section a-spacing-medium" src="' + chrome.extension.getURL("html/onpage.html") + '?' + hash + '"></iframe>');
      }
    }
  });
});
