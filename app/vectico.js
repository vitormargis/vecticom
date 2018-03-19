var cheerio = require('cheerio');
var phantom = require('phantom');

function parseSVG({content, fillColors, strokeColors}) {
  var fillColors = fillColors
  if (typeof fillColors !== 'undefined') {
    var fillColor = fillColors.split(',')
  } else {
    var fillColor = '';
  }

  var strokeColors = strokeColors
  if (typeof strokeColors !== 'undefined') {
    var strokeColor = strokeColors.split(',')
  } else {
    var strokeColor = '';
  }

  $ = cheerio.load(content.toString());

  $('path').each(function(i){
    var path = $(this)

    var thisFillColor = fillColor[i] || fillColor[0] || '';
    var thisStrokeColor = strokeColor[i] || strokeColor[0] || '';

    // path.removeAttr('style');
    path.attr('fill', '#' + thisFillColor);
    path.attr('stroke', '#' + thisStrokeColor);
  })

  return $.html();
}

function getVector({source, name, fillColors, strokeColors}) {
  let sitepage = null;
  let phntamInstance = null;

  return phantom.create()
    .then(instance => {
        phntamInstance = instance;
        return instance.createPage();
    })
    .then(page => {
        sitepage = page;
        return page.open(source);
    })
    .then(status => {
        return sitepage.property('content');
    })
    .then(content => {
      phntamInstance.exit();
      sitepage.close().then().catch();
      console.log(content);
      return parseSVG({ content, fillColors, strokeColors })
    })
    .catch(error => {
      console.log(error);
      phntamInstance.exit();
    });
}

module.exports = {
  parseSVG: parseSVG,
  getVector: getVector
}
