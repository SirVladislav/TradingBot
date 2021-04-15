const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: '<key>',
  APISECRET: '<secret>'
});

const express = require('express')
const app = express()
app.use(express.json())
app.listen(80)

app.post('/', function (req, res) {
  res.json(req.body);
console.log(req.body['text']);
    if(req.body['text'] == 'Buy'){

    }else if(req.body['text'] == 'Sell'){

    }
})



async function getInfo(){
    console.info( await binance.futuresTime() );
}
