const { getSafeDate } = require(`./index.js`)

new Promise(async () => {
  const date = await getSafeDate()
  console.log(`date`, date)
})