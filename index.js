const express = require('express')
const app = express()
app.use(express.json())

const Binance = require('binance-api-node').default
const client = new Binance({
  apiKey:  process.env.KEY,
  apiSecret: process.env.SECKEY
})

let maxCoinPrice = -1;
let intervalObj;

app.post('/', function (req, res) {
  console.log(req.body)

  switch(req.body['action']){
    case 'info':
      GetCoinInfo()
      break;

    case 'sell':
        SellMarket()
      break;

    case 'buy':
        BuyMarket();   
      break;

    default:
      console.log("Error command!!!!!!!!!!!!!!!!!!");
  }

  res.status(200).json({
    msg: "OK"
  })

})


//////////         XRP       DOGE
async function BuyMarket(){

  let coinToBuy = "DOGEUSDT"   ///////////
  let coinPrice = await getCoinPrice(coinToBuy)
  let USDTCount = await getWalletCoinCount("USDT")
  let coinCount = Math.floor((USDTCount-0.1)/coinPrice)  //usdt count USDTCount-0.1

  if(USDTCount < 35){
    console.log("HEEEEEEEEEEEEEEEEEYYYYYY,   BALANCE LESSS  --- 35 --- USDT");
    return;
  }

  console.log(`${coinToBuy} price  ${coinPrice}`)
  console.log(`${coinToBuy} count ${coinCount}`)
  console.log(`usdt count ${USDTCount}`)
  
  console.log(
      await client.order({
      symbol: coinToBuy,
      side: 'BUY',
      quantity: coinCount,
      type: 'MARKET'
    })
  )

  await setOCO(coinToBuy, coinPrice, 0.025);

  console.log("!!!!!!!!!!!!!!!!SOVERSHENA POKUPKA!!!!!!!!!!!!!!")
  console.log(` ${USDTCount}  USDT  -->  ${coinCount} ${coinToBuy}, Market price: ${coinPrice}`)

  customSellSkriptStart(coinToBuy, coinPrice)

}

async function SellMarket(){
  let coinToSell = "DOGEUSDT" //////////////////////

    try{
      console.log(
        await client.cancelOpenOrders({
          symbol: coinToSell
        })
      )
    } catch(ex){
      console.log("ERROR TRY TO CANCEL OPEN ORDER")
    } finally {
      
      let coinCount = Math.floor(await getWalletCoinCount('DOGE'))  ///////////////////////////
      console.log(`RUNNING FINALY CONSTRUCTION ${coinCount}`)
      console.log(
        await client.order({
          symbol: coinToSell,
          side: 'SELL',
          quantity: coinCount,
          type: 'MARKET'
        })
      )
  
    let USDTCount = await getWalletCoinCount("USDT")
    let BNBCount = await getWalletCoinCount("BNB")
  
    console.log("!!!!!!!!!!!!!!!!!SOVERSHENA PRODASHA!!!!!!!!!!!!!!")
    console.log(`Curent USDT = ${USDTCount}`)
    console.log(`Curent BNB = ${BNBCount}`)
    clearInterval(intervalObj);

    }
    
}

async function customSellSkriptStart(coinCode, coinPrice){
  setPercent1 = false;
  setPercent2 = false;
  setPercent3 = false;
  setPercent5 = false;

  coinPricePercent1 = (coinPrice*1.01).toPrecision(5);
  coinPricePercent2 = (coinPrice*1.02).toPrecision(5);
  coinPricePercent3 = (coinPrice*1.03).toPrecision(5);
  coinPricePercent5 = (coinPrice*1.05).toPrecision(5);
  
  intervalObj =  setInterval( async() => {
    
    let currentCoinPrice = await getCoinPrice(coinCode);

    if(currentCoinPrice > maxCoinPrice){
      maxCoinPrice = currentCoinPrice;
      console.log(`NEW MAX PRICE : ${maxCoinPrice}`);
    }

    if( maxCoinPrice > coinPricePercent5 && !setPercent5){
      setPercent5 = true;
      await setOCO(coinCode, maxCoinPrice, 0.03);
      
    } else if( maxCoinPrice > coinPricePercent3  && !setPercent3){
      setPercent3 = true; 
      await setOCO(coinCode,  maxCoinPrice, 0.02);
      
    } else if( maxCoinPrice > coinPricePercent2 && !setPercent2){
      setPercent2 = true; 
      await setOCO(coinCode, maxCoinPrice, 0.018);
      
    } else if( maxCoinPrice > coinPricePercent1 && !setPercent1){
      setPercent1 = true; 
      await setOCO(coinCode, maxCoinPrice, 0.02);
      

    }

  }, 2000);


  maxCoinPrice = -1;
}



////////////////////////////functions/////////////////////////
async function setOCO(coinCode, coinPrice, downPercent){

  let OSO = await getOCOLimits(coinPrice, downPercent)
  console.log(OSO)
  WalletInfo = await client.accountInfo();
  coinCount = Math.floor(WalletInfo.balances.find(item=>item.asset==="DOGE").free);   ///////////////////////////////////   DOGE

  try{
      console.log(
        await client.cancelOpenOrders({
          symbol: coinCode
        })
      )
    } catch(ex){
      console.log("ERROR TRY TO CANCEL OPEN ORDER")
    } finally{
      console.log("RUNING FINALLY CONSTRUCTION")
      console.log("DOGECOUNT +++++++ TO SET OSO ", coinCount)
      await client.orderOco({
        symbol: coinCode,
        side: 'SELL',
        quantity: coinCount,    
        price: OSO.top,
        stopPrice: OSO.stop,
        stopLimitPrice: OSO.limit
    })
    console.log(`SET OSO FOR --- ${downPercent} --- percent`);
    }

}


async function GetCoinInfo(){

  WalletInfo = await client.accountInfo();
  console.log(`USDT -> ${WalletInfo.balances.find(item=>item.asset==="USDT").free}`)
  console.log(`BNB -> ${WalletInfo.balances.find(item=>item.asset==="BNB").free}`)
}

async function getCoinPrice(coin){
  let coinPrice = await client.prices({
    symbol: coin
  }) 
  return coinPrice[coin]
}

async function getWalletCoinCount(coin){
  let WalletInfo = await client.accountInfo()
  return WalletInfo.balances.find(item=>item.asset===coin).free

}

function getOCOLimits(coinPrice, downPercent=0.04, upPercent = 0.10){
  var topPrice = (parseFloat(coinPrice) + (coinPrice*upPercent)).toPrecision(5)
  var stopPrice = (coinPrice - (coinPrice*downPercent)).toPrecision(5)
  var limitPrice = (stopPrice*0.996).toPrecision(5)
  
  return {
    "top": topPrice,
    "stop": stopPrice,
    "limit": limitPrice
  }
}

app.listen(process.env.PORT)