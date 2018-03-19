const vectico = require("./vectico");
const fs = require("fs");
const http = require('http');
const cheerio = require('cheerio');
const phantom = require('phantom');

const PORT = process.env.PORT || 5000

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

http.createServer(function(req,res){
  let body = '';
  const route = (req.url.substring(req.url.length-1) !== "/") ? (req.url + '/') : req.url;
  const image = route.split('/')[1];
  const fillColors = route.split('/')[2];
  const strokeColors = route.split('/')[3];

  req.on('readable', function() {
    body += req.read();
  });

  req.on('end', function() {
    let options = {
    	json: getParameterByName('json', req.url) || 'false',
    	images: [
    		{
    			name: "node",
    			source: getParameterByName('icon', req.url) + ".svg",
          fillColors: getParameterByName('fill', req.url) || '333,666,999,CCC',
          strokeColors: getParameterByName('stroke', req.url) || '333,666,999,CCC'
    		}
    	]
    }
    if(body !== 'null') options = JSON.parse(body.slice(0, -4));

    const icons = options.images.map(image => vectico.getVector(image))

    Promise.all(icons).then(arraySVG => {
      if (route === '/favicon.ico/') return

      const jsonSVG = arraySVG.map((SVG, index) => ({
        name: options.images[index].name,
        source: options.images[index].source,
        data: SVG,
        index: index
      }));

      if (!fs.exists(options.json)){
        fs.mkdir('tmp', mkdirErr => {
          fs.writeFile(`tmp/icons.json`, JSON.stringify(jsonSVG), writeFileErr => {
            if (writeFileErr) return console.log('error');
          });

          jsonSVG.map(({ data, name, index }) => {
            fs.writeFile(`tmp/${index}.svg`, data.toString(), writeFileErr => {
              if (writeFileErr) return console.log('error');
            });
          })
        });
      }

      if(options.json === 'true') {
        res.setHeader('Content-Type', 'text/json');
        res.end(JSON.stringify(jsonSVG))
      } else {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.end(arraySVG[0])
      }
    })
  });

}).listen(PORT)
